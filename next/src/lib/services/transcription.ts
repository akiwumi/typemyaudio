import OpenAI from "openai";
import fs from "fs";
import { LANGUAGE_NAMES, TRANSLATION_TARGETS } from "./languages.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function transcribeAudio(filePath: string, vocabulary?: string) {
  const response = await openai.audio.transcriptions.create({
    file: fs.createReadStream(filePath),
    model: "whisper-1",
    response_format: "verbose_json",
    timestamp_granularities: ["segment", "word"],
    prompt: vocabulary || undefined,
  });

  return response;
}

export async function postProcess(rawTranscript: string, detectedLang: string, features: string[] = ["cleanup"]) {
  const langName = LANGUAGE_NAMES[detectedLang] || detectedLang;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content: `You are a transcription assistant. The following transcript is in ${langName}. Clean up and format it IN THE SAME LANGUAGE (${langName}). Do NOT translate to English unless explicitly asked.`,
      },
      {
        role: "user",
        content: `Transcript:\n${rawTranscript}\n\nRequested: ${features.join(", ")}`,
      },
    ],
  });

  return response.choices[0].message.content || rawTranscript;
}

export async function translateTranscription(text: string, sourceLang: string, targetLang: string) {
  const sourceName = LANGUAGE_NAMES[sourceLang] || sourceLang;
  const targetName = TRANSLATION_TARGETS.find((t) => t.code === targetLang)?.name || targetLang;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content: `You are a professional translator. Translate the following ${sourceName} text to ${targetName}. Maintain the original meaning, tone, and formatting. Preserve paragraph breaks and any speaker labels. Do NOT add explanations — return ONLY the translated text.`,
      },
      { role: "user", content: text },
    ],
  });

  return {
    text: response.choices[0].message.content || text,
    sourceLang,
    targetLang,
    sourceName,
    targetName,
  };
}

export async function generateSummary(text: string, detectedLang: string) {
  const langName = LANGUAGE_NAMES[detectedLang] || detectedLang;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content: `Generate a concise summary of this ${langName} transcript. Write the summary in ${langName}. Keep it under 200 words.`,
      },
      { role: "user", content: text },
    ],
  });

  return response.choices[0].message.content;
}

export async function extractKeyPoints(text: string, detectedLang: string) {
  const langName = LANGUAGE_NAMES[detectedLang] || detectedLang;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `Extract key points, action items, and decisions from this ${langName} transcript. Return a JSON object with: { "key_points": string[], "action_items": string[], "decisions": string[] }. Write all points in ${langName}.`,
      },
      { role: "user", content: text },
    ],
  });

  return JSON.parse(response.choices[0].message.content || "{}");
}

export async function generateSentenceTimecodes(words: Array<{ word: string; start: number; end: number }>) {
  const fullText = words.map((w) => w.word).join(" ");

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a sentence boundary detector. Given a transcript, split it into individual sentences. Return a JSON object: { "sentences": string[] }. Preserve every word exactly.`,
      },
      { role: "user", content: fullText },
    ],
  });

  const parsed = JSON.parse(response.choices[0].message.content || '{"sentences":[]}');
  const sentences: string[] = parsed.sentences;

  let wordIndex = 0;
  return sentences.map((sentence) => {
    const sentenceWords = sentence.split(/\s+/);
    const startWord = words[wordIndex];
    wordIndex += sentenceWords.length;
    const endWord = words[Math.min(wordIndex - 1, words.length - 1)];

    return {
      sentence,
      start: startWord?.start ?? 0,
      end: endWord?.end ?? 0,
      start_fmt: formatTime(startWord?.start ?? 0),
      end_fmt: formatTime(endWord?.end ?? 0),
    };
  });
}

export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600).toString().padStart(2, "0");
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  const ms = Math.round((seconds % 1) * 1000).toString().padStart(3, "0");
  return `${h}:${m}:${s}.${ms}`;
}
