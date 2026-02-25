import { Worker } from "bullmq";
import IORedis from "ioredis";
import { writeFileSync, unlinkSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { env } from "./config/env.js";
import { supabaseAdmin } from "./config/supabase.js";
import {
  transcribeAudio,
  postProcess,
  translateTranscription,
  generateSummary,
  generateSentenceTimecodes,
} from "./services/transcription.js";
import { validateLanguage } from "./services/languages.js";

const connection = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });

const worker = new Worker(
  "transcription",
  async (job) => {
    const { transcriptionId, userId, filePath, targetLanguage } = job.data;

    try {
      await updateStatus(transcriptionId, "processing");

      const tmpDir = join(tmpdir(), "typemyaudio");
      if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });

      const { data: fileData, error: dlError } = await supabaseAdmin.storage
        .from("audio-uploads")
        .download(filePath);

      if (dlError || !fileData) {
        throw new Error("Failed to download file from storage");
      }

      const localPath = join(tmpDir, `${transcriptionId}${filePath.endsWith(".mp4") ? ".mp4" : ".mp3"}`);
      const buffer = Buffer.from(await fileData.arrayBuffer());
      writeFileSync(localPath, buffer);

      const whisperResult = await transcribeAudio(localPath);
      const detectedLang = (whisperResult as any).language;

      const validation = validateLanguage(detectedLang);
      if (!validation.supported) {
        await supabaseAdmin.from("transcriptions").update({
          status: "failed",
          error_message: validation.message,
          detected_language: detectedLang || "unknown",
        }).eq("id", transcriptionId);
        cleanup(localPath);
        return;
      }

      await supabaseAdmin.from("transcriptions").update({
        raw_text: whisperResult.text,
        detected_language: detectedLang,
        detected_language_name: validation.languageName,
        segments: (whisperResult as any).segments,
        word_count: whisperResult.text.split(/\s+/).length,
      }).eq("id", transcriptionId);

      const cleanedText = await postProcess(whisperResult.text, detectedLang, ["cleanup", "punctuation"]);
      const summary = await generateSummary(cleanedText, detectedLang);

      let translatedText: string | null = null;
      let translationLang: string | null = null;

      if (targetLanguage && targetLanguage !== detectedLang) {
        const result = await translateTranscription(cleanedText, detectedLang, targetLanguage);
        translatedText = result.text;
        translationLang = targetLanguage;
      }

      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("tier")
        .eq("id", userId)
        .single();

      let sentenceTimecodes = null;
      if (profile?.tier === "enterprise" && (whisperResult as any).words) {
        sentenceTimecodes = await generateSentenceTimecodes((whisperResult as any).words);
      }

      await supabaseAdmin.from("transcriptions").update({
        formatted_text: cleanedText,
        summary,
        translated_text: translatedText,
        translation_language: translationLang,
        sentence_timecodes: sentenceTimecodes,
        status: "completed",
        updated_at: new Date().toISOString(),
      }).eq("id", transcriptionId);

      // Track usage
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];

      if (profile?.tier === "free") {
        await supabaseAdmin.rpc("increment_free_used", { p_user_id: userId });
      }

      await supabaseAdmin.from("usage_records").insert({
        user_id: userId,
        transcription_id: transcriptionId,
        period_start: periodStart,
      });

      cleanup(localPath);
      console.log(`Transcription ${transcriptionId} completed successfully`);
    } catch (error) {
      console.error(`Transcription ${transcriptionId} failed:`, error);
      await supabaseAdmin.from("transcriptions").update({
        status: "failed",
        error_message: "An unexpected error occurred during transcription. Please try again.",
        updated_at: new Date().toISOString(),
      }).eq("id", transcriptionId);
    }
  },
  { connection, concurrency: 2 }
);

async function updateStatus(id: string, status: string) {
  await supabaseAdmin.from("transcriptions").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
}

function cleanup(path: string) {
  try {
    if (existsSync(path)) unlinkSync(path);
  } catch {
    // ignore cleanup errors
  }
}

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});

console.log("Transcription worker started");
