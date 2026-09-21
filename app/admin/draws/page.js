import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/admin-guard";
import DrawControls from "./DrawControls";

export default async function AdminDrawsPage() {
  // Sirf admin ke liye. Baaki log dashboard par wapas
  if (!(await getAdminUser())) redirect("/dashboard");

  const supabase = await createClient();
  const { data: draws } = await supabase
    .from("draws")
    .select("id, draw_month, draw_type, status, winning_numbers, pool_total, rollover_out")
    .order("draw_month", { ascending: false });

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-3xl font-bold">Admin · Draw management</h1>

        <DrawControls />

        <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-xl font-semibold">Draw history</h2>
          {(draws ?? []).length === 0 ? (
            <p className="text-slate-400">No draws yet.</p>
          ) : (
            <ul className="space-y-2">
              {draws.map((d) => (
                <li key={d.id} className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{d.draw_month.slice(0, 7)} · {d.draw_type}</span>
                    <span className="capitalize text-slate-400">{d.status}</span>
                  </div>
                  <p className="text-slate-300">
                    Numbers: {d.winning_numbers?.join(", ")} · Pool ${Number(d.pool_total).toFixed(2)}
                    {" · "}Rollover ${Number(d.rollover_out).toFixed(2)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}