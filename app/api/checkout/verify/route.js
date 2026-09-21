import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const sessionId = searchParams.get("session_id");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login`);
  if (!sessionId) return NextResponse.redirect(`${origin}/dashboard`);

  try {
    // Stripe se session fetch karo (URL par bharosa nahi)
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    // Security: session isi user ka ho aur payment complete ho
    if (session.client_reference_id !== user.id || session.payment_status !== "paid") {
      return NextResponse.redirect(`${origin}/dashboard?checkout=failed`);
    }

    const sub = session.subscription;
    // Naye Stripe versions mein period end subscription item ke andar hota hai
    const periodEnd = sub.items?.data?.[0]?.current_period_end ?? sub.current_period_end;

    // Admin client se likho (users ko subscriptions table mein likhne ki permission nahi)
    const admin = createAdminClient();
    const { error } = await admin.from("subscriptions").upsert(
      {
        user_id: user.id,
        plan: session.metadata?.plan,
        status: "active",
        amount: session.amount_total / 100,
        current_period_end: new Date(periodEnd * 1000).toISOString(),
        stripe_customer_id: session.customer,
        stripe_subscription_id: sub.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
    if (error) throw error;

    return NextResponse.redirect(`${origin}/dashboard?checkout=success`);
  } catch (err) {
    console.error("Checkout verify error:", err);
    return NextResponse.redirect(`${origin}/dashboard?checkout=failed`);
  }
}