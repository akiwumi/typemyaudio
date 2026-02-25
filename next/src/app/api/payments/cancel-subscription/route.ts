import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getStripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult.auth;

  const { data } = await supabaseAdmin
    .from("profiles")
    .select("stripe_customer_id, subscription_end")
    .eq("id", userId)
    .single();

  const profile = data as { stripe_customer_id?: string; subscription_end?: string } | null;
  if (!profile?.stripe_customer_id) {
    return NextResponse.json(
      { error: "No active subscription found" },
      { status: 400 }
    );
  }

  const subscriptions = await getStripe().subscriptions.list({
    customer: profile.stripe_customer_id,
    status: "active",
  });

  if (subscriptions.data.length > 0) {
    await getStripe().subscriptions.update(subscriptions.data[0].id, {
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

  return NextResponse.json({
    message: "Subscription will cancel at the end of your current billing period.",
    active_until: profile.subscription_end,
  });
}
