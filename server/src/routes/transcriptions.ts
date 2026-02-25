import { Router } from "express";
import { Queue } from "bullmq";
import IORedis from "ioredis";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { checkQuota } from "../middleware/quota.js";
import { supabaseAdmin } from "../config/supabase.js";
import { env } from "../config/env.js";
import { TRANSLATION_TARGETS } from "../services/languages.js";

const connection = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
const transcriptionQueue = new Queue("transcription", { connection });

export const transcriptionRoutes = Router();

transcriptionRoutes.get("/", requireAuth, async (req, res) => {
  const { userId } = (req as AuthRequest).auth;
  const { data, error } = await supabaseAdmin
    .from("transcriptions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json(data);
});

transcriptionRoutes.get("/languages", (_req, res) => {
  res.json({ targets: TRANSLATION_TARGETS });
});

transcriptionRoutes.get("/:id", requireAuth, async (req, res) => {
  const { userId } = (req as AuthRequest).auth;
  const { data, error } = await supabaseAdmin
    .from("transcriptions")
    .select("*")
    .eq("id", req.params.id)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    res.status(404).json({ error: "Transcription not found" });
    return;
  }
  res.json(data);
});

transcriptionRoutes.post(
  "/",
  requireAuth,
  checkQuota as any,
  async (req, res) => {
    const { userId } = (req as AuthRequest).auth;
    const { transcriptionId, storagePath, originalFilename, fileSize, targetLanguage } = req.body;

    if (!transcriptionId || !storagePath || !originalFilename) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const expectedPrefix = `${userId}/${transcriptionId}/`;
    if (!storagePath.startsWith(expectedPrefix)) {
      res.status(403).json({ error: "Invalid storage path" });
      return;
    }

    try {
      const { error: insertError } = await supabaseAdmin.from("transcriptions").insert({
        id: transcriptionId,
        user_id: userId,
        title: originalFilename.replace(/\.(mp3|mp4)$/i, ""),
        original_filename: originalFilename,
        file_url: storagePath,
        file_size: fileSize,
        target_language: targetLanguage || null,
        status: "pending",
      });

      if (insertError) {
        res.status(500).json({ error: "Failed to create transcription record" });
        return;
      }

      await transcriptionQueue.add("process", {
        transcriptionId,
        userId,
        filePath: storagePath,
        targetLanguage,
      });

      res.status(201).json({
        id: transcriptionId,
        status: "pending",
        message: "Transcription queued for processing",
      });
    } catch (err) {
      console.error("Upload error:", err);
      res.status(500).json({ error: "Internal server error during upload" });
    }
  }
);

transcriptionRoutes.put("/:id", requireAuth, async (req, res) => {
  const { userId } = (req as AuthRequest).auth;
  const { title, formatted_text } = req.body;

  const { data, error } = await supabaseAdmin
    .from("transcriptions")
    .update({ title, formatted_text, updated_at: new Date().toISOString() })
    .eq("id", req.params.id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json(data);
});

transcriptionRoutes.delete("/:id", requireAuth, async (req, res) => {
  const { userId } = (req as AuthRequest).auth;

  const { data: transcription } = await supabaseAdmin
    .from("transcriptions")
    .select("file_url")
    .eq("id", req.params.id)
    .eq("user_id", userId)
    .single();

  if (transcription?.file_url) {
    await supabaseAdmin.storage.from("audio-uploads").remove([transcription.file_url]);
  }

  const { error } = await supabaseAdmin
    .from("transcriptions")
    .delete()
    .eq("id", req.params.id)
    .eq("user_id", userId);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ message: "Transcription deleted" });
});
