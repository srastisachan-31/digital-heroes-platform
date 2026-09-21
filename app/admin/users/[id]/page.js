import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-guard";
import ScoreManager from "@/app/dashboard/ScoreManager";
import ProfileForm from "./ProfileForm";
import SubscriptionAdmin from "./SubscriptionAdmin";

export default async function AdminUserPage({ params }) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, charity_id, charity_percent")
    .eq("id", id)
    .maybeSingle();
  if (!profile) notFound();

  const [charitiesRes, subRes, scoresRes] = await Promise.all([
    supabase.from("charities").select("id, name").order("name"),
    supabase.from("subscriptions").select("plan, status, current_period_end").eq("user_id", id).maybeSingle(),
    supabase.from("scores").select("id, score, played_on").eq("user_id", id).order("played_on", { ascending: false }),
  ]);

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <Link href="/admin/users" className="text-sm text-slate-400 hover:text-white">← Back to users</Link>
      <div>
        <h1 className="text-3xl font-bold">{profile.full_name || "Unnamed user"}</h1>
        <p className="text-slate-400">{profile.email} · <span className="capitalize">{profile.role}</span></p>
      </div>

      <ProfileForm profile={profile} charities={charitiesRes.data ?? []} />
      <SubscriptionAdmin userId={profile.id} subscription={subRes.data} />
      <ScoreManager userId={profile.id} initialScores={scoresRes.data ?? []} />
    </main>
  );
}