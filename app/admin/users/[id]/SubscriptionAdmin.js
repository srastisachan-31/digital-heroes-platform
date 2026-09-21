"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PLANS } from "@/lib/plans";

const inputClass =
  "rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-emerald-400";

// n din baad ki date (YYYY-MM-DD)
const dateInDays = (n) => new Date(Date.now() + n * 86400000).toLocaleDateString("en-CA");

export default function SubscriptionAdmin({ userId, subscription }) {
  const supabase = createClient();
  const router = useRouter();

  const [plan, setPlan] = useState(subscription?.plan ?? "monthly");
  const [status, setStatus] = useState(subscription?.status ?? "inactive");
  const [periodEnd, setPeriodEnd] = useState(
    subscription?.current_period_end ? subscription.current_period_end.slice(0, 10) : ""
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Testing/support ke liye shortcut: 30 din ke liye active
  function activate30() {
    setStatus("active");
    setPeriodEnd(dateInDays(30));
  }

  async function handleSave() {
    setError("");
    setMessage("");
    setLoading(true);

    const { error } = await supabase.from("subscriptions").upsert(
      {
        user_id: userId,
        plan,
        status,
        amount: PLANS[plan].amount / 100, // cents se dollars
        current_period_end: periodEnd ? new Date(periodEnd + "T23:59:59").toISOString() : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }
    setMessage("Subscription updated ✓");
    router.refresh();
  }

  return (
    <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-900 p-5">
      <h2 className="text-xl font-semibold">Subscription (manual override)</h2>
      <p className="text-sm text-slate-400">
        Stripe remains the source of truth for payments. Use this for support cases.
      </p>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-sm text-slate-400">Plan</label>
          <select value={plan} onChange={(e) => setPlan(e.target.value)} className={inputClass}>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-400">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
            <option value="active">Active</option>
            <option value="cancelled">Cancelled</option>
            <option value="lapsed">Lapsed</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-400">Period ends on</label>
          <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)}
            className={inputClass} />
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {message && <p className="text-sm text-emerald-400">{message}</p>}

      <div className="flex gap-3">
        <button onClick={handleSave} disabled={loading}
          className="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60">
          {loading ? "Saving..." : "Save subscription"}
        </button>
        <button onClick={activate30} type="button"
          className="rounded-lg border border-slate-600 px-4 py-2 hover:bg-slate-800">
          Set active for 30 days
        </button>
      </div>
    </section>
  );
}