import { NextRequest, NextResponse } from "next/server";
import { Queue } from "bullmq";
import IORedis from "ioredis";
import { requireAuth } from "@/lib/auth";
import { checkQuota } from "@/lib/quota";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { TRANSLATION_TARGETS } from "@/lib/services/languages";

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});
const transcriptionQueue = new Queue("transcription", { connection });

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult.auth;

  const { data, error } = await supabaseAdmin
    .from("transcriptions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult.auth;

  const quotaResult = await checkQuota(userId);
  if (!quotaResult.ok) {
    return NextResponse.json({ error: quotaResult.error }, { status: 403 });
  }

  const body = await request.json();
  const { transcriptionId, storagePath, originalFilename, fileSize, targetLanguage } = body;

  if (!transcriptionId || !storagePath || !originalFilename) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const expectedPrefix = `${userId}/${transcriptionId}/`;
  if (!storagePath.startsWith(expectedPrefix)) {
    return NextResponse.json({ error: "Invalid storage path" }, { status: 403 });
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
      return NextResponse.json({ error: "Failed to create transcription record" }, { status: 500 });
    }

    await transcriptionQueue.add("process", {
      transcriptionId,
      userId,
      filePath: storagePath,
      targetLanguage,
    });

    return NextResponse.json(
      {
        id: transcriptionId,
        status: "pending",
        message: "Transcription queued for processing",
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "Internal server error during upload" },
      { status: 500 }
    );
  }
}
