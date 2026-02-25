import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getStripe } from "@/lib/stripe";
const FRONTEND_URL = process.env.NEXT_PUBLIC_APP_URL || "";

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult.auth;

  const body = await request.json();
  const { quantity } = body;

  if (!quantity || quantity < 1 || quantity > 100) {
    return NextResponse.json(
      { error: "Quantity must be between 1 and 100" },
      { status: 400 }
    );
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("stripe_customer_id")
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
    success_url: `${FRONTEND_URL}/dashboard`,
    cancel_url: `${FRONTEND_URL}/pricing`,
    metadata: { userId, type: "token_purchase", quantity: String(quantity) },
  });

  return NextResponse.json({ url: session.url });
}
