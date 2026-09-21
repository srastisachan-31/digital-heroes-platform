import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-guard";
import { getEffectiveStatus, hasAccess } from "@/lib/subscription";
import { monthlyFee, POOL_PERCENT_OF_FEE } from "@/lib/draw";

const money = (n) => `$${Number(n || 0).toFixed(2)}`;

function Stat({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="text-2xl font-bold text-emerald-400">{value}</p>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export default async function AdminOverviewPage() {
  await requireAdmin();
  const supabase = await createClient();

  // Saara data ek saath laao (admin RLS policies se sab rows milti hain)
  const [usersRes, subsRes, profilesRes, charitiesRes, drawsRes, winnersRes, donationsRes] =
    await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("subscriptions").select("user_id, plan, amount, status, current_period_end"),
      supabase.from("profiles").select("id, charity_id, charity_percent"),
      supabase.from("charities").select("id, name"),
      supabase.from("draws").select("status, pool_total, rollover_in"),
      supabase.from("winners").select("prize_amount, verification_status, payment_status"),
      supabase.from("donations").select("charity_id, amount"),
    ]);

  // Active subscribers (status + period end dono dekhkar)
  const activeSubs = (subsRes.data ?? []).filter((s) => hasAccess(getEffectiveStatus(s)));
  const mrr = activeSubs.reduce((sum, s) => sum + monthlyFee(s), 0);

  // Charity-wise contribution (estimate): monthly fee x user ka charity %
  const profileMap = Object.fromEntries((profilesRes.data ?? []).map((p) => [p.id, p]));
  const byCharity = {};
  (charitiesRes.data ?? []).forEach((c) => {
    byCharity[c.id] = { name: c.name, supporters: 0, monthly: 0, donations: 0 };
  });
  activeSubs.forEach((s) => {
    const p = profileMap[s.user_id];
    if (p?.charity_id && byCharity[p.charity_id]) {
      byCharity[p.charity_id].supporters += 1;
      byCharity[p.charity_id].monthly += (monthlyFee(s) * p.charity_percent) / 100;
    }
  });
  (donationsRes.data ?? []).forEach((d) => {
    if (byCharity[d.charity_id]) byCharity[d.charity_id].donations += Number(d.amount);
  });
  const charityRows = Object.values(byCharity);
  const totalCharityMonthly = charityRows.reduce((sum, c) => sum + c.monthly, 0);

  // Draw statistics
  const publishedDraws = (drawsRes.data ?? []).filter((d) => d.status === "published");
  // Rollover minus karte hain, taaki jackpot double count na ho (sirf naya paisa)
  const totalFreshPool = publishedDraws.reduce(
    (sum, d) => sum + Number(d.pool_total) - Number(d.rollover_in),
    0
  );
  const winners = winnersRes.data ?? [];
  const totalAwarded = winners.reduce((sum, w) => sum + Number(w.prize_amount), 0);
  const totalPaid = winners
    .filter((w) => w.payment_status === "paid")
    .reduce((sum, w) => sum + Number(w.prize_amount), 0);
  const pendingReview = winners.filter((w) => w.verification_status === "pending").length;

  return (
    <main className="mx-auto max-w-5xl space-y-8 p-8">
      <h1 className="text-3xl font-bold">Overview</h1>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Users and revenue</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Total users" value={usersRes.count ?? 0} />
          <Stat label="Active subscribers" value={activeSubs.length} />
          <Stat label="Monthly revenue" value={money(mrr)} hint="Yearly plans counted as fee / 12" />
          <Stat label="Monthly prize pool"
            value={money(mrr * POOL_PERCENT_OF_FEE)}
            hint={`${POOL_PERCENT_OF_FEE * 100}% of monthly revenue`} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Draw statistics</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Published draws" value={publishedDraws.length} />
          <Stat label="Total prize pool" value={money(totalFreshPool)} hint="Across published draws" />
          <Stat label="Total winners" value={winners.length} hint={`${pendingReview} awaiting review`} />
          <Stat label="Prizes awarded" value={money(totalAwarded)} hint={`${money(totalPaid)} paid out`} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Charity contributions</h2>
        <p className="text-sm text-slate-400">
          Estimated monthly contribution = active subscribers' monthly fee x their chosen charity %.
          Total: <span className="text-emerald-400">{money(totalCharityMonthly)}</span> / month
        </p>
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
          <table className="w-full text-left text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="p-3">Charity</th>
                <th className="p-3">Supporters</th>
                <th className="p-3">Monthly (est.)</th>
                <th className="p-3">Independent donations</th>
              </tr>
            </thead>
            <tbody>
              {charityRows.map((c) => (
                <tr key={c.name} className="border-t border-slate-800">
                  <td className="p-3">{c.name}</td>
                  <td className="p-3">{c.supporters}</td>
                  <td className="p-3">{money(c.monthly)}</td>
                  <td className="p-3">{money(c.donations)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}