import { Router, raw } from "express";
import Stripe from "stripe";
import { supabaseAdmin } from "../config/supabase.js";
import { env } from "../config/env.js";

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export const webhookRoutes = Router();

webhookRoutes.post("/stripe", raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"] as string;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    res.status(400).json({ error: "Webhook signature verification failed" });
    return;
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutComplete(event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
    }
  } catch (err) {
    console.error("Webhook processing error:", err);
  }

  res.json({ received: true });
});

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  if (!userId) return;

  if (session.metadata?.type === "token_purchase") {
    const quantity = parseInt(session.metadata.quantity || "0", 10);
    await supabaseAdmin.rpc("increment_tokens", { user_id: userId, amount: quantity });

    await supabaseAdmin.from("token_purchases").insert({
      user_id: userId,
      quantity,
      amount_paid: session.amount_total || 0,
      currency: session.currency || "eur",
      payment_provider: "stripe",
      payment_id: session.id,
      tokens_remaining: quantity,
    });
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
  const priceId = subscription.items.data[0].price.id;

  let tier = "starter";
  if (priceId.includes("annual")) tier = "annual";
  if (priceId.includes("enterprise")) tier = "enterprise";

  const sub = subscription as any;
  await supabaseAdmin
    .from("profiles")
    .update({
      tier,
      subscription_status: "active",
      subscription_start: new Date(sub.current_period_start * 1000).toISOString(),
      subscription_end: new Date(sub.current_period_end * 1000).toISOString(),
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  await supabaseAdmin.from("subscription_events").insert({
    user_id: userId,
    event_type: "created",
    provider: "stripe",
    provider_event_id: session.id,
    tier,
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!profile) return;

  const sub = subscription as any;
  await supabaseAdmin
    .from("profiles")
    .update({
      cancel_at_period_end: subscription.cancel_at_period_end,
      subscription_status: subscription.cancel_at_period_end ? "cancelling" : "active",
      subscription_end: new Date(sub.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", profile.id);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!profile) return;

  await supabaseAdmin
    .from("profiles")
    .update({
      tier: "free",
      subscription_status: "expired",
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profile.id);

  await supabaseAdmin.from("subscription_events").insert({
    user_id: profile.id,
    event_type: "expired",
    provider: "stripe",
    provider_event_id: subscription.id,
    tier: "free",
  });
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const inv = invoice as any;
  if (!inv.subscription) return;
  const customerId = invoice.customer as string;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id, tier")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!profile) return;

  const periodEnd = invoice.lines?.data?.[0]?.period?.end;
  if (periodEnd) {
    await supabaseAdmin
      .from("profiles")
      .update({
        subscription_status: "active",
        subscription_end: new Date(periodEnd * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);
  }

  await supabaseAdmin.from("subscription_events").insert({
    user_id: profile.id,
    event_type: "renewed",
    provider: "stripe",
    provider_event_id: invoice.id,
    tier: profile.tier,
  });
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!profile) return;

  await supabaseAdmin.from("subscription_events").insert({
    user_id: profile.id,
    event_type: "payment_failed",
    provider: "stripe",
    provider_event_id: invoice.id,
  });
}
