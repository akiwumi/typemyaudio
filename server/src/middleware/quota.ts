import type { Response, NextFunction } from "express";
import type { AuthRequest } from "./auth.js";
import { supabaseAdmin } from "../config/supabase.js";

const TIER_LIMITS: Record<string, { monthly?: number; total?: number }> = {
  free: { total: 3 },
  starter: { monthly: 15 },
  annual: { monthly: 15 },
  enterprise: { monthly: Infinity },
};

export const checkQuota = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { userId } = req.auth;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("tier, total_free_used, purchased_tokens")
    .eq("id", userId)
    .single();

  if (!profile) {
    res.status(404).json({ error: "User profile not found" });
    return;
  }

  const limit = TIER_LIMITS[profile.tier] || TIER_LIMITS.free;

  if (profile.tier === "free") {
    if (profile.total_free_used >= (limit.total ?? 3)) {
      res.status(403).json({ error: "Free tier limit reached. Please upgrade your plan." });
      return;
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
      res.status(403).json({
        error: "Monthly limit reached. Purchase more tokens or wait for your next billing cycle.",
      });
      return;
    }
  }

  next();
};
