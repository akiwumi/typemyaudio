import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult.auth;

  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("tier, total_free_used, purchased_tokens")
    .eq("id", userId)
    .single();

  const { count } = await supabaseAdmin
    .from("usage_records")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("period_start", periodStart);

  const limits: Record<string, number> = {
    free: 3,
    starter: 15,
    annual: 15,
    enterprise: Infinity,
  };

  const tier = profile?.tier || "free";
  const used = tier === "free" ? (profile?.total_free_used ?? 0) : (count ?? 0);
  const limit = limits[tier] || 3;
  const tokens = profile?.purchased_tokens ?? 0;

  return NextResponse.json({
    tier,
    used,
    limit,
    purchased_tokens: tokens,
    remaining: Math.max(0, limit - used + tokens),
  });
}
