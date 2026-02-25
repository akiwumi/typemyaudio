import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult.auth;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("tier, subscription_status, subscription_start, subscription_end, cancel_at_period_end, total_free_used, purchased_tokens")
    .eq("id", userId)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];

  const { count } = await supabaseAdmin
    .from("usage_records")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("period_start", periodStart);

  return NextResponse.json({
    ...profile,
    usage_this_month: count ?? 0,
  });
}
