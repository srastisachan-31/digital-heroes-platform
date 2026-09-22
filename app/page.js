import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: featured } = await supabase
    .from("charities")
    .select("name, description")
    .eq("is_featured", true)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Hero */}
      <section className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 py-24 text-center">
        <span className="rounded-full border border-emerald-500/40 px-4 py-1 text-sm text-emerald-400">
          Play. Win. Give back.
        </span>
        <h1 className="text-5xl font-bold sm:text-6xl">
          Your golf score can change someone&apos;s life.
        </h1>
        <p className="max-w-xl text-lg text-slate-300">
          Subscribe, log your Stableford scores, and enter the monthly prize draw —
          while a share of every subscription goes straight to a charity you choose.
        </p>
        <div className="flex gap-4">
          <Link href="/signup"
            className="rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-slate-950 hover:bg-emerald-400">
            Get started
          </Link>
          <Link href="/login"
            className="rounded-lg border border-slate-600 px-6 py-3 hover:bg-slate-800">
            Log in
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-4xl px-4 py-16">
        <h2 className="mb-8 text-center text-2xl font-bold">How it works</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { step: "1", title: "Subscribe", text: "Choose a monthly or yearly plan and pick a charity to support." },
            { step: "2", title: "Log your scores", text: "Enter your latest 5 Stableford scores after every round." },
            { step: "3", title: "Win and give", text: "Match numbers in the monthly draw and a share of the pool goes to your charity." },
          ].map((s) => (
            <div key={s.step} className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 font-bold text-slate-950">
                {s.step}
              </div>
              <h3 className="mb-1 font-semibold">{s.title}</h3>
              <p className="text-sm text-slate-400">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Charity spotlight */}
      {featured && (
        <section className="mx-auto max-w-3xl px-4 py-16">
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
            <span className="text-sm text-emerald-400">Featured charity</span>
            <h2 className="mt-1 text-2xl font-bold">{featured.name}</h2>
            <p className="mt-2 text-slate-300">{featured.description}</p>
            <Link href="/charities" className="mt-4 inline-block text-emerald-400 underline">
              See all charities →
            </Link>
          </div>
        </section>
      )}

      <footer className="border-t border-slate-800 py-8 text-center text-sm text-slate-500">
        Digital Heroes · Golf performance meets charitable impact.
      </footer>
    </main>
  );
}