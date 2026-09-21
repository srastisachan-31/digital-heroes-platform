import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEffectiveStatus, hasAccess } from "@/lib/subscription";
import LogoutButton from "./LogoutButton";
import ScoreManager from "./ScoreManager";
import SubscriptionCard from "./SubscriptionCard";

const banners = {
  success: { text: "Payment successful! Your subscription is now active. 🎉", color: "text-emerald-400" },
  cancelled: { text: "Checkout was cancelled. You have not been charged.", color: "text-amber-400" },
  failed: { text: "We could not confirm your payment. Please try again.", color: "text-red-400" },
};

export default async function DashboardPage({ searchParams }) {
  const params = await searchParams;
  const banner = banners[params?.checkout];

  const supabase = await createClient();

  // Server par user verify karo
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, charity_percent, charities(name)")
    .eq("id", user.id)
    .single();

  // Subscription + real-time status (har request par check hota hai)
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan, status, current_period_end")
    .eq("user_id", user.id)
    .maybeSingle();
  const status = getEffectiveStatus(subscription);
  const canUseFeatures = hasAccess(status);

  const { data: scores } = await supabase
    .from("scores")
    .select("id, score, played_on")
    .order("played_on", { ascending: false });

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="text-3xl font-bold">
          Welcome, {profile?.full_name || user.email} 👋
        </h1>

        {banner && <p className={`text-sm ${banner.color}`}>{banner.text}</p>}

        <div className="space-y-1 rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p><span className="text-slate-400">Email:</span> {user.email}</p>
          <p><span className="text-slate-400">Role:</span> {profile?.role}</p>
          <p>
            <span className="text-slate-400">Charity:</span>{" "}
            {profile?.charities?.name ?? "Not selected"} ({profile?.charity_percent}%)
          </p>
        </div>

        <SubscriptionCard
          status={status}
          plan={subscription?.plan}
          periodEnd={subscription?.current_period_end}
        />

        {/* Non-subscribers ke liye restricted access */}
        {canUseFeatures ? (
          <ScoreManager userId={user.id} initialScores={scores ?? []} />
        ) : (
          <section className="rounded-xl border border-dashed border-slate-700 bg-slate-900/50 p-5 text-center">
            <p className="text-lg font-semibold">🔒 Score entry is for subscribers</p>
            <p className="text-slate-400">
              Subscribe above to enter your scores and join the monthly draw.
            </p>
          </section>
        )}

        <LogoutButton />
      </div>
    </main>
  );
}