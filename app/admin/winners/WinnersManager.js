"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const money = (n) => `$${Number(n).toFixed(2)}`;

const badge = {
  pending: "bg-slate-500/20 text-slate-300",
  approved: "bg-emerald-500/20 text-emerald-400",
  rejected: "bg-red-500/20 text-red-400",
  paid: "bg-emerald-500/20 text-emerald-400",
};

const filters = [
  { key: "all", label: "All" },
  { key: "review", label: "Needs review" },
  { key: "approved", label: "Approved, unpaid" },
  { key: "paid", label: "Paid" },
];

export default function WinnersManager({ initialWinners }) {
  const supabase = createClient();
  const [winners, setWinners] = useState(initialWinners);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");

  async function update(id, changes) {
    setError("");
    const { error } = await supabase.from("winners").update(changes).eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    setWinners(winners.map((w) => (w.id === id ? { ...w, ...changes } : w)));
  }

  const shown = winners.filter((w) => {
    if (filter === "review") return w.verification_status === "pending";
    if (filter === "approved")
      return w.verification_status === "approved" && w.payment_status === "pending";
    if (filter === "paid") return w.payment_status === "paid";
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`rounded-full border px-4 py-1 text-sm ${
              filter === f.key
                ? "border-emerald-400 bg-emerald-500/10 text-emerald-400"
                : "border-slate-700 text-slate-300 hover:bg-slate-800"
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {shown.length === 0 ? (
        <p className="text-slate-400">No winners in this view.</p>
      ) : (
        <ul className="space-y-3">
          {shown.map((w) => (
            <li key={w.id} className="space-y-3 rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{w.profiles?.full_name || "Unnamed"}</p>
                  <p className="text-sm text-slate-400">{w.profiles?.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-emerald-400">{money(w.prize_amount)}</p>
                  <p className="text-sm text-slate-400">
                    {w.match_type}-number match · {w.draws?.draw_month?.slice(0, 7)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className={`rounded-full px-3 py-1 capitalize ${badge[w.verification_status]}`}>
                  Verification: {w.verification_status}
                </span>
                <span className={`rounded-full px-3 py-1 capitalize ${badge[w.payment_status]}`}>
                  Payment: {w.payment_status}
                </span>
                {w.proof_url ? (
                  <a href={w.proof_url} target="_blank" rel="noreferrer"
                    className="text-emerald-400 underline">View proof</a>
                ) : (
                  <span className="text-slate-500">No proof uploaded yet</span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {w.verification_status !== "approved" && (
                  <button onClick={() => update(w.id, { verification_status: "approved" })}
                    disabled={!w.proof_url}
                    title={!w.proof_url ? "Proof required before approval" : ""}
                    className="rounded-md bg-emerald-500 px-3 py-1 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-40">
                    Approve
                  </button>
                )}
                {w.verification_status !== "rejected" && (
                  <button onClick={() => update(w.id, { verification_status: "rejected" })}
                    className="rounded-md border border-red-500/50 px-3 py-1 text-sm text-red-400 hover:bg-red-500/10">
                    Reject
                  </button>
                )}
                {w.verification_status === "approved" && w.payment_status === "pending" && (
                  <button onClick={() => update(w.id, { payment_status: "paid" })}
                    className="rounded-md bg-amber-500 px-3 py-1 text-sm font-semibold text-slate-950 hover:bg-amber-400">
                    Mark as paid
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}