"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-emerald-400";

export default function ProfileForm({ profile, charities }) {
  const supabase = createClient();
  const router = useRouter();

  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [charityId, setCharityId] = useState(profile.charity_id ?? "");
  const [percent, setPercent] = useState(profile.charity_percent);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    const p = Number(percent);
    if (!Number.isInteger(p) || p < 10 || p > 100) {
      setError("Charity percentage must be between 10 and 100.");
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim(), charity_id: charityId || null, charity_percent: p })
      .eq("id", profile.id);
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }
    setMessage("Profile saved ✓");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-slate-800 bg-slate-900 p-5">
      <h2 className="text-xl font-semibold">Profile and charity</h2>

      <input placeholder="Full name" value={fullName}
        onChange={(e) => setFullName(e.target.value)} className={inputClass} />

      <select value={charityId} onChange={(e) => setCharityId(e.target.value)} className={inputClass}>
        <option value="">No charity selected</option>
        {charities.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      <div>
        <label className="mb-1 block text-sm text-slate-400">Charity contribution % (min 10)</label>
        <input type="number" min={10} max={100} value={percent}
          onChange={(e) => setPercent(e.target.value)} className={inputClass} />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {message && <p className="text-sm text-emerald-400">{message}</p>}

      <button type="submit" disabled={loading}
        className="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60">
        {loading ? "Saving..." : "Save profile"}
      </button>
    </form>
  );
}