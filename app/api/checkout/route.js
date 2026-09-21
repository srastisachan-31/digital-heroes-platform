import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { PLANS } from "@/lib/plans";

export async function POST(request) {
  try {
    // 1. User verify karo
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Please log in first." }, { status: 401 });
    }

    // 2. Plan validate karo (client ki baat par bharosa nahi)
    const { plan } = await request.json();
    const selected = PLANS[plan];
    if (!selected) {
      return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
    }

    // 3. Checkout session banao (localhost aur Vercel dono par origin sahi milega)
    const origin = new URL(request.url).origin;
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: user.email,
      client_reference_id: user.id,
      metadata: { user_id: user.id, plan },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: selected.amount,
            recurring: { interval: selected.interval },
            product_data: { name: `Digital Heroes ${selected.label}` },
          },
        },
      ],
      success_url: `${origin}/api/checkout/verify?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard?checkout=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: "Could not start checkout." }, { status: 500 });
  }
}