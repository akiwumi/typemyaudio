import { Router } from "express";
import Stripe from "stripe";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { supabaseAdmin } from "../config/supabase.js";
import { env } from "../config/env.js";

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export const paymentRoutes = Router();

paymentRoutes.post("/create-checkout", requireAuth, async (req, res) => {
  const { userId } = (req as AuthRequest).auth;
  const { priceId } = req.body;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("stripe_customer_id, tier")
    .eq("id", userId)
    .single();

  let customerId = profile?.stripe_customer_id;

  if (!customerId) {
    const { data: user } = await supabaseAdmin.auth.admin.getUserById(userId);
    const customer = await stripe.customers.create({
      email: user?.user?.email,
      metadata: { supabase_user_id: userId },
    });
    customerId = customer.id;
    await supabaseAdmin
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", userId);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${env.FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.FRONTEND_URL}/pricing`,
    metadata: { userId },
  });

  res.json({ url: session.url });
});

paymentRoutes.post("/purchase-tokens", requireAuth, async (req, res) => {
  const { userId } = (req as AuthRequest).auth;
  const { quantity } = req.body;

  if (!quantity || quantity < 1 || quantity > 100) {
    res.status(400).json({ error: "Quantity must be between 1 and 100" });
    return;
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .single();

  let customerId = profile?.stripe_customer_id;

  if (!customerId) {
    const { data: user } = await supabaseAdmin.auth.admin.getUserById(userId);
    const customer = await stripe.customers.create({
      email: user?.user?.email,
      metadata: { supabase_user_id: userId },
    });
    customerId = customer.id;
    await supabaseAdmin
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", userId);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "eur",
          unit_amount: 100,
          product_data: { name: "Transcription Token" },
        },
        quantity,
      },
    ],
    success_url: `${env.FRONTEND_URL}/dashboard`,
    cancel_url: `${env.FRONTEND_URL}/pricing`,
    metadata: { userId, type: "token_purchase", quantity: String(quantity) },
  });

  res.json({ url: session.url });
});

paymentRoutes.post("/cancel-subscription", requireAuth, async (req, res) => {
  const { userId } = (req as AuthRequest).auth;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("stripe_customer_id, subscription_end")
    .eq("id", userId)
    .single();

  if (!profile?.stripe_customer_id) {
    res.status(400).json({ error: "No active subscription found" });
    return;
  }

  const subscriptions = await stripe.subscriptions.list({
    customer: profile.stripe_customer_id,
    status: "active",
  });

  if (subscriptions.data.length > 0) {
    await stripe.subscriptions.update(subscriptions.data[0].id, {
      cancel_at_period_end: true,
    });
  }

  await supabaseAdmin
    .from("profiles")
    .update({
      subscription_status: "cancelling",
      cancel_at_period_end: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  res.json({
    message: "Subscription will cancel at the end of your current billing period.",
    active_until: profile.subscription_end,
  });
});

paymentRoutes.post("/reactivate-subscription", requireAuth, async (req, res) => {
  const { userId } = (req as AuthRequest).auth;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .single();

  if (!profile?.stripe_customer_id) {
    res.status(400).json({ error: "No subscription found" });
    return;
  }

  const subscriptions = await stripe.subscriptions.list({
    customer: profile.stripe_customer_id,
    status: "active",
  });

  if (subscriptions.data.length > 0) {
    await stripe.subscriptions.update(subscriptions.data[0].id, {
      cancel_at_period_end: false,
    });
  }

  await supabaseAdmin
    .from("profiles")
    .update({
      subscription_status: "active",
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  res.json({ message: "Subscription reactivated. It will auto-renew as normal." });
});

paymentRoutes.get("/subscription-status", requireAuth, async (req, res) => {
  const { userId } = (req as AuthRequest).auth;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("tier, subscription_status, subscription_start, subscription_end, cancel_at_period_end, total_free_used, purchased_tokens")
    .eq("id", userId)
    .single();

  if (!profile) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];

  const { count } = await supabaseAdmin
    .from("usage_records")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("period_start", periodStart);

  res.json({
    ...profile,
    usage_this_month: count ?? 0,
  });
});
