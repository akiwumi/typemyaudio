import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult.auth;
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("transcriptions")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Transcription not found" }, { status: 404 });
  }
  return NextResponse.json(data);
}

const MAX_TITLE = 500;
const MAX_FORMATTED_TEXT = 1_000_000; // ~1MB

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult.auth;
  const { id } = await params;
  const body = await request.json();
  const { title, formatted_text } = body;

  const updates: { title?: string; formatted_text?: string; updated_at: string } = {
    updated_at: new Date().toISOString(),
  };

  if (title !== undefined) {
    updates.title =
      typeof title === "string"
        ? title.trim().slice(0, MAX_TITLE) || "Untitled"
        : "Untitled";
  }

  if (formatted_text !== undefined) {
    updates.formatted_text =
      typeof formatted_text === "string"
        ? formatted_text.slice(0, MAX_FORMATTED_TEXT)
        : null;
  }

  const { data, error } = await supabaseAdmin
    .from("transcriptions")
    .update(updates)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult.auth;
  const { id } = await params;

  const { data: transcription } = await supabaseAdmin
    .from("transcriptions")
    .select("file_url")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (transcription?.file_url) {
    await supabaseAdmin.storage.from("audio-uploads").remove([transcription.file_url]);
  }

  const { error } = await supabaseAdmin
    .from("transcriptions")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ message: "Transcription deleted" });
}
