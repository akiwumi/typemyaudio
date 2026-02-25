import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getStripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult.auth;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .single();

  if (!profile?.stripe_customer_id) {
    return NextResponse.json(
      { error: "No subscription found" },
      { status: 400 }
    );
  }

  const subscriptions = await getStripe().subscriptions.list({
    customer: profile.stripe_customer_id,
    status: "active",
  });

  if (subscriptions.data.length > 0) {
    await getStripe().subscriptions.update(subscriptions.data[0].id, {
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

  return NextResponse.json({
    message: "Subscription reactivated. It will auto-renew as normal.",
  });
}
