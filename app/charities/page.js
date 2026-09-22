import { createClient } from "@/lib/supabase/server";

export default async function CharitiesPage() {
  const supabase = await createClient();
  const { data: charities } = await supabase
    .from("charities")
    .select("*")
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("name");

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Our charity partners</h1>
          <p className="text-slate-400">
            Every subscriber directs at least 10% of their fee to a cause they choose.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {(charities ?? []).map((c) => (
            <div key={c.id}
              className="space-y-2 rounded-xl border border-slate-800 bg-slate-900 p-5">
              <div className="flex items-start justify-between">
                <h2 className="text-lg font-semibold">{c.name}</h2>
                {c.is_featured && (
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">
                    Featured
                  </span>
                )}
              </div>
              {c.description && <p className="text-sm text-slate-400">{c.description}</p>}
              {(c.events ?? []).map((ev, i) => (
                <p key={i} className="text-xs text-emerald-400">📅 {ev.title} · {ev.date}</p>
              ))}
            </div>
          ))}
        </div>

        {(charities ?? []).length === 0 && (
          <p className="text-slate-400">No charities listed yet.</p>
        )}
      </div>
    </main>
  );
}