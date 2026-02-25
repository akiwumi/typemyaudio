import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "./supabase-admin";

export interface AuthResult {
  userId: string;
  email: string;
}

export async function requireAuth(
  request: NextRequest
): Promise<{ auth: AuthResult } | NextResponse> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing authorization token" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  return { auth: { userId: user.id, email: user.email! } };
}
