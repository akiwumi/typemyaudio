import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getStripe } from "@/lib/stripe";

const FRONTEND_URL = process.env.NEXT_PUBLIC_APP_URL || "";

const ALLOWED_PRICE_IDS = (
  process.env.STRIPE_PRICE_IDS || "price_starter_monthly,price_annual"
)
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult.auth;

  const body = await request.json();
  const { priceId } = body;

  if (!priceId || typeof priceId !== "string") {
    return NextResponse.json({ error: "Missing priceId" }, { status: 400 });
  }

  if (!ALLOWED_PRICE_IDS.includes(priceId)) {
    return NextResponse.json(
      { error: "Invalid price. Add your Stripe price IDs to STRIPE_PRICE_IDS." },
      { status: 400 }
    );
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("stripe_customer_id, tier")
    .eq("id", userId)
    .single();

  let customerId = profile?.stripe_customer_id;

  if (!customerId) {
    const { data: user } = await supabaseAdmin.auth.admin.getUserById(userId);
    const customer = await getStripe().customers.create({
      email: user?.user?.email,
      metadata: { supabase_user_id: userId },
    });
    customerId = customer.id;
    await supabaseAdmin
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", userId);
  }

  const session = await getStripe().checkout.sessions.create({
    customer: customerId!,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${FRONTEND_URL}/pricing`,
    metadata: { userId },
  });

  return NextResponse.json({ url: session.url });
}
