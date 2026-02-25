import { supabaseAdmin } from "./supabase-admin";

const TIER_LIMITS: Record<string, { monthly?: number; total?: number }> = {
  free: { total: 3 },
  starter: { monthly: 15 },
  annual: { monthly: 15 },
  enterprise: { monthly: Infinity },
};

export async function checkQuota(userId: string): Promise<{ ok: boolean; error?: string }> {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("tier, total_free_used, purchased_tokens")
    .eq("id", userId)
    .single();

  if (!profile) {
    return { ok: false, error: "User profile not found" };
  }

  const limit = TIER_LIMITS[profile.tier] || TIER_LIMITS.free;

  if (profile.tier === "free") {
    if (profile.total_free_used >= (limit.total ?? 3)) {
      return { ok: false, error: "Free tier limit reached. Please upgrade your plan." };
    }
  } else if (profile.tier !== "enterprise") {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];

    const { count } = await supabaseAdmin
      .from("usage_records")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("period_start", periodStart);

    const usedThisMonth = count ?? 0;
    const available = (limit.monthly ?? 15) - usedThisMonth + (profile.purchased_tokens ?? 0);

    if (available <= 0) {
      return {
        ok: false,
        error: "Monthly limit reached. Purchase more tokens or wait for your next billing cycle.",
      };
    }
  }

  return { ok: true };
}
