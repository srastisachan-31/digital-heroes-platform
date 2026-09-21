"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const money = (n) => `$${Number(n).toFixed(2)}`;
const inputClass =
  "rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-emerald-400";

export default function DrawControls() {
  const router = useRouter();
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [type, setType] = useState("random");
  const [result, setResult] = useState(null);
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");

  async function post(url, body) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Something went wrong.");
    return data;
  }

  async function simulate() {
    setError("");
    setPublished(false);
    setLoading("simulate");
    try {
      setResult(await post("/api/admin/draws/simulate", { month, type }));
    } catch (e) {
      setError(e.message);
    }
    setLoading("");
  }

  async function publish() {
    if (!window.confirm("Publish this draw? Winners will be created and this cannot be undone.")) return;
    setError("");
    setLoading("publish");
    try {
      await post("/api/admin/draws/publish", { drawId: result.draw.id });
      setPublished(true);
      router.refresh(); // history list update
    } catch (e) {
      setError(e.message);
    }
    setLoading("");
  }

  return (
    <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-5">
      <h2 className="text-xl font-semibold">Run a monthly draw</h2>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-sm text-slate-400">Month</label>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-400">Draw logic</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className={inputClass}>
            <option value="random">Random (standard lottery)</option>
            <option value="algorithmic">Algorithmic (weighted by score frequency)</option>
          </select>
        </div>
        <button onClick={simulate} disabled={loading !== ""}
          className="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60">
          {loading === "simulate" ? "Simulating..." : "Run simulation"}
        </button>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {result && (
        <div className="space-y-4 rounded-lg border border-slate-800 bg-slate-950 p-4">
          <h3 className="font-semibold">
            {published ? "✅ Published result" : "Simulation result (not published yet)"}
          </h3>

          <div className="flex gap-2">
            {result.draw.winning_numbers.map((n) => (
              <span key={n}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 font-bold text-slate-950">
                {n}
              </span>
            ))}
          </div>

          <p className="text-sm text-slate-400">
            Active subscribers: {result.draw.active_subscribers} · Participants: {result.participants}
            {" · "}Total pool: {money(result.draw.pool_total)} (rollover in: {money(result.draw.rollover_in)})
          </p>

          <table className="w-full text-left text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="py-1">Match</th>
                <th>Winners</th>
                <th>Tier pool</th>
                <th>Prize each</th>
              </tr>
            </thead>
            <tbody>
              {[5, 4, 3].map((tier) => (
                <tr key={tier} className="border-t border-slate-800">
                  <td className="py-2">{tier}-number{tier === 5 ? " (jackpot)" : ""}</td>
                  <td>{result.summary[tier].winners}</td>
                  <td>{money(result.summary[tier].pool)}</td>
                  <td>{money(result.summary[tier].prize_each)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="text-sm text-amber-400">
            Jackpot rollover to next month: {money(result.draw.rollover_out)}
          </p>

          {!published && (
            <button onClick={publish} disabled={loading !== ""}
              className="rounded-lg bg-amber-500 px-4 py-2 font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-60">
              {loading === "publish" ? "Publishing..." : "Publish results"}
            </button>
          )}
        </div>
      )}
    </section>
  );
}