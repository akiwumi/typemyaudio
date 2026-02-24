import { Router } from "express";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { supabaseAdmin } from "../config/supabase.js";

export const userRoutes = Router();

userRoutes.get("/me", requireAuth, async (req, res) => {
  const { userId } = (req as AuthRequest).auth;

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  res.json(data);
});

userRoutes.put("/me", requireAuth, async (req, res) => {
  const { userId } = (req as AuthRequest).auth;
  const { full_name, avatar_url } = req.body;

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .update({ full_name, avatar_url, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json(data);
});

userRoutes.get("/usage", requireAuth, async (req, res) => {
  const { userId } = (req as AuthRequest).auth;

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

  res.json({
    tier,
    used,
    limit,
    purchased_tokens: tokens,
    remaining: Math.max(0, limit - used + tokens),
  });
});
