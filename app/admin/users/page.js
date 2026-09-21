import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-guard";
import { getEffectiveStatus } from "@/lib/subscription";

const badgeColors = {
  active: "bg-emerald-500/20 text-emerald-400",
  cancelled: "bg-amber-500/20 text-amber-400",
  lapsed: "bg-red-500/20 text-red-400",
  inactive: "bg-slate-500/20 text-slate-300",
};

export default async function AdminUsersPage({ searchParams }) {
  await requireAdmin();
  const { q = "" } = await searchParams;
  const term = q.replace(/[,()%]/g, "").trim(); // filter string safe rakhne ke liye

  const supabase = await createClient();
  let query = supabase
    .from("profiles")
    .select("id, full_name, email, role, charity_percent, charities(name)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (term) query = query.or(`email.ilike.%${term}%,full_name.ilike.%${term}%`);
  const { data: users } = await query;

  // In users ki subscriptions
  const ids = (users ?? []).map((u) => u.id);
  const { data: subs } = ids.length
    ? await supabase
        .from("subscriptions")
        .select("user_id, status, current_period_end")
        .in("user_id", ids)
    : { data: [] };
  const subMap = Object.fromEntries((subs ?? []).map((s) => [s.user_id, s]));

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-8">
      <h1 className="text-3xl font-bold">Users</h1>

      <form className="flex gap-2">
        <input name="q" defaultValue={q} placeholder="Search by name or email"
          className="w-full max-w-sm rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none focus:border-emerald-400" />
        <button className="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-slate-950 hover:bg-emerald-400">
          Search
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
        <table className="w-full text-left text-sm">
          <thead className="text-slate-400">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Subscription</th>
              <th className="p-3">Charity</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {(users ?? []).map((u) => {
              const status = getEffectiveStatus(subMap[u.id]);
              return (
                <tr key={u.id} className="border-t border-slate-800">
                  <td className="p-3">{u.full_name || "-"}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3 capitalize">{u.role}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-2 py-0.5 capitalize ${badgeColors[status]}`}>{status}</span>
                  </td>
                  <td className="p-3">
                    {u.charities?.name ?? "-"} ({u.charity_percent}%)
                  </td>
                  <td className="p-3">
                    <Link href={`/admin/users/${u.id}`} className="text-emerald-400 hover:underline">Manage</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {(users ?? []).length === 0 && <p className="p-4 text-slate-400">No users found.</p>}
      </div>
    </main>
  );
}