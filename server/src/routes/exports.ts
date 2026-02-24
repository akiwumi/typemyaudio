import { Router } from "express";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { supabaseAdmin } from "../config/supabase.js";
import { generateTxt, generateDocx, generatePdf, generateSrt } from "../services/export.js";

export const exportRoutes = Router();

exportRoutes.post("/:id", requireAuth, async (req, res) => {
  const { userId } = (req as AuthRequest).auth;
  const { format } = req.body;

  if (!["pdf", "docx", "txt", "srt"].includes(format)) {
    res.status(400).json({ error: "Invalid format. Use: pdf, docx, txt, or srt" });
    return;
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("tier")
    .eq("id", userId)
    .single();

  const { data: transcription, error } = await supabaseAdmin
    .from("transcriptions")
    .select("*")
    .eq("id", req.params.id)
    .eq("user_id", userId)
    .single();

  if (error || !transcription) {
    res.status(404).json({ error: "Transcription not found" });
    return;
  }

  if (format === "srt" && !["annual", "enterprise"].includes(profile?.tier || "free")) {
    res.status(403).json({
      error: "SRT export is available on Annual and Enterprise plans.",
      upgrade_url: "/pricing",
    });
    return;
  }

  const includeTimecodes = profile?.tier === "enterprise" && !!transcription.sentence_timecodes;
  const options = { includeTimecodes, includeTranslation: !!transcription.translated_text };

  let buffer: Buffer;
  let contentType: string;
  let extension: string;

  switch (format) {
    case "pdf":
      buffer = await generatePdf(transcription as any, options);
      contentType = "application/pdf";
      extension = "pdf";
      break;
    case "docx":
      buffer = await generateDocx(transcription as any, options);
      contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      extension = "docx";
      break;
    case "txt":
      buffer = generateTxt(transcription as any, options);
      contentType = "text/plain";
      extension = "txt";
      break;
    case "srt":
      buffer = Buffer.from(generateSrt(transcription.segments || []), "utf-8");
      contentType = "application/x-subrip";
      extension = "srt";
      break;
    default:
      res.status(400).json({ error: "Invalid format" });
      return;
  }

  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Disposition", `attachment; filename="${transcription.title}.${extension}"`);
  res.send(buffer);
});
