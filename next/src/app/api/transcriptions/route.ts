import { NextRequest, NextResponse } from "next/server";
import { Queue } from "bullmq";
import IORedis from "ioredis";
import { requireAuth } from "@/lib/auth";
import { checkQuota } from "@/lib/quota";
import { supabaseAdmin } from "@/lib/supabase-admin";

let _queue: Queue | null = null;

function getTranscriptionQueue(): Queue | null {
  if (!process.env.REDIS_URL) return null;
  if (_queue) return _queue;
  const connection = new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    ...(process.env.REDIS_URL.startsWith("rediss://") && { tls: {} }),
  });
  _queue = new Queue("transcription", { connection });
  return _queue;
}

function corsHeaders(request?: NextRequest) {
  const origin = request?.headers.get("origin");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const allowedOrigin =
    origin &&
    (origin === appUrl || /^https?:\/\/localhost(:\d+)?$/.test(origin) || /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin))
      ? origin
      : appUrl || "http://localhost:3000";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request),
  });
}

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
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders(request) });
  }
  return NextResponse.json(data, { headers: corsHeaders(request) });
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult.auth;

  const quotaResult = await checkQuota(userId);
  if (!quotaResult.ok) {
    return NextResponse.json({ error: quotaResult.error }, { status: 403, headers: corsHeaders(request) });
  }

  const body = await request.json();
  const { transcriptionId, storagePath, originalFilename, fileSize, targetLanguage } = body;

  if (!transcriptionId || !storagePath || !originalFilename) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400, headers: corsHeaders(request) });
  }

  const expectedPrefix = `${userId}/${transcriptionId}/`;
  if (!storagePath.startsWith(expectedPrefix)) {
    return NextResponse.json({ error: "Invalid storage path" }, { status: 403, headers: corsHeaders(request) });
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
      return NextResponse.json(
        { error: "Failed to create transcription record" },
        { status: 500, headers: corsHeaders(request) }
      );
    }

    const transcriptionQueue = getTranscriptionQueue();
    if (!transcriptionQueue) {
      return NextResponse.json(
        {
          error:
            "Transcription service is not configured. Please add REDIS_URL (e.g. Upstash Redis) to enable audio processing.",
        },
        { status: 503, headers: corsHeaders(request) }
      );
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
      { status: 201, headers: corsHeaders(request) }
    );
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "Internal server error during upload" },
      { status: 500, headers: corsHeaders(request) }
    );
  }
}