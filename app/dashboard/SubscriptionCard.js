"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PLANS } from "@/lib/plans";

function formatDate(d) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const badgeColors = {
  active: "bg-emerald-500/20 text-emerald-400",
  cancelled: "bg-amber-500/20 text-amber-400",
  lapsed: "bg-red-500/20 text-red-400",
  inactive: "bg-slate-500/20 text-slate-300",
};

export default function SubscriptionCard({ status, plan, periodEnd }) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");

  // Stripe Checkout par bhejo
  async function startCheckout(selectedPlan) {
    setError("");
    setLoading(selectedPlan);
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: selectedPlan }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      setLoading("");
      return;
    }
    window.location.href = data.url;
  }

  async function cancelSubscription() {
    if (!window.confirm("Cancel your subscription? You keep access until the period ends.")) return;
    setError("");
    setLoading("cancel");
    const res = await fetch("/api/subscription/cancel", { method: "POST" });
    const data = await res.json();
    setLoading("");
    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      return;
    }
    router.refresh();
  }

  const isPaidPeriod = status === "active" || status === "cancelled";

  return (
    <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Subscription</h2>
        <span className={`rounded-full px-3 py-1 text-sm font-medium capitalize ${badgeColors[status]}`}>
          {status}
        </span>
      </div>

      {isPaidPeriod ? (
        <>
          <p className="text-slate-300">
            Plan: <span className="capitalize">{plan}</span>
            {" · "}
            {status === "cancelled" ? "Access until " : "Renews on "}
            {formatDate(periodEnd)}
          </p>
          {status === "active" && (
            <button onClick={cancelSubscription} disabled={loading === "cancel"}
              className="rounded-lg border border-red-500/50 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 disabled:opacity-60">
              {loading === "cancel" ? "Cancelling..." : "Cancel subscription"}
            </button>
          )}
        </>
      ) : (
        <>
          <p className="text-slate-300">
            {status === "lapsed"
              ? "Your subscription has lapsed. Subscribe again to continue."
              : "Subscribe to enter scores and join the monthly prize draw."}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {Object.entries(PLANS).map(([key, p]) => (
              <button key={key} onClick={() => startCheckout(key)} disabled={loading !== ""}
                className="rounded-lg bg-emerald-500 px-4 py-3 text-left font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60">
                <span className="block">{p.label}</span>
                <span className="block text-sm font-normal">{p.display}</span>
                {loading === key && <span className="text-sm">Redirecting...</span>}
              </button>
            ))}
          </div>
        </>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}
    </section>
  );
}