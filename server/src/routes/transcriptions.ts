import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { Queue } from "bullmq";
import IORedis from "ioredis";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { checkQuota } from "../middleware/quota.js";
import { upload } from "../middleware/upload.js";
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
  upload.single("file"),
  async (req, res) => {
    const { userId } = (req as AuthRequest).auth;
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const targetLanguage = req.body.targetLanguage || null;
    const transcriptionId = uuidv4();
    const storagePath = `${userId}/${transcriptionId}/${file.originalname}`;

    try {
      const { error: uploadError } = await supabaseAdmin.storage
        .from("audio-uploads")
        .upload(storagePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (uploadError) {
        res.status(500).json({ error: "Failed to upload file to storage" });
        return;
      }

      const { error: insertError } = await supabaseAdmin.from("transcriptions").insert({
        id: transcriptionId,
        user_id: userId,
        title: file.originalname.replace(/\.(mp3|mp4)$/i, ""),
        original_filename: file.originalname,
        file_url: storagePath,
        file_size: file.size,
        target_language: targetLanguage,
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
