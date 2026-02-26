import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult.auth;

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }
  return NextResponse.json(data);
}

const MAX_FULL_NAME = 200;
const MAX_AVATAR_URL = 2048;
function isValidAvatarUrl(url: string): boolean {
  if (typeof url !== "string" || url.length > MAX_AVATAR_URL) return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname;
    return (
      host === "avatars.githubusercontent.com" ||
      host === "lh3.googleusercontent.com" ||
      host.endsWith(".supabase.co") ||
      host.endsWith(".supabase.in")
    );
  } catch {
    return false;
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult.auth;
  const body = await request.json();
  let { full_name, avatar_url } = body;

  const updates: { full_name?: string; avatar_url?: string; updated_at: string } = {
    updated_at: new Date().toISOString(),
  };

  if (full_name !== undefined) {
    const sanitized =
      typeof full_name === "string"
        ? full_name.trim().slice(0, MAX_FULL_NAME)
        : "";
    updates.full_name = sanitized || null;
  }

  if (avatar_url !== undefined) {
    if (avatar_url === null || avatar_url === "") {
      updates.avatar_url = null;
    } else if (!isValidAvatarUrl(avatar_url)) {
      return NextResponse.json(
        { error: "Invalid avatar URL. Use HTTPS from allowed providers." },
        { status: 400 }
      );
    } else {
      updates.avatar_url = avatar_url;
    }
  }

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
