"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const inputClass =
  "rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none focus:border-emerald-400";

// Date ko readable banata hai (T00:00:00 se timezone ka date-shift nahi hota)
function formatDate(d) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ScoreManager({ userId, initialScores }) {
  const supabase = createClient();
  const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD (local date)

  const [scores, setScores] = useState(initialScores);
  const [score, setScore] = useState("");
  const [playedOn, setPlayedOn] = useState(today);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Database se latest scores dobara laao (most recent pehle)
  async function loadScores() {
    const { data } = await supabase
      .from("scores")
      .select("id, score, played_on")
      .order("played_on", { ascending: false });
    setScores(data ?? []);
  }

  function resetForm() {
    setScore("");
    setPlayedOn(today);
    setEditingId(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const value = Number(score);
    if (!Number.isInteger(value) || value < 1 || value > 45) {
      setError("Score must be a whole number between 1 and 45.");
      return;
    }

    // Edge case: 5 scores hain aur nayi date sabse purani date se bhi purani hai,
    // to wo turant replace ho jayegi, isliye pehle hi rok do
    if (!editingId && scores.length >= 5) {
      const oldest = scores[scores.length - 1].played_on;
      if (playedOn < oldest) {
        setError("This date is older than your latest 5 scores, so it can't be added.");
        return;
      }
    }

    setLoading(true);
    let result;
    if (editingId) {
      result = await supabase
        .from("scores")
        .update({ score: value, played_on: playedOn })
        .eq("id", editingId);
    } else {
      // 5 se zyada hone par database trigger sabse purana score khud delete kar deta hai
      result = await supabase
        .from("scores")
        .insert({ user_id: userId, score: value, played_on: playedOn });
    }
    setLoading(false);

    if (result.error) {
      // 23505 = unique violation (ek date par ek hi score allowed hai)
      setError(
        result.error.code === "23505"
          ? "You already have a score for this date. Edit or delete it instead."
          : result.error.message
      );
      return;
    }

    resetForm();
    await loadScores();
  }

  function startEdit(s) {
    setEditingId(s.id);
    setScore(String(s.score));
    setPlayedOn(s.played_on);
    setError("");
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this score?")) return;
    const { error } = await supabase.from("scores").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    if (editingId === id) resetForm();
    await loadScores();
  }

  return (
    <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Your golf scores</h2>
        <span className="text-sm text-slate-400">{scores.length} of 5 scores</span>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-wrap gap-3">
        <input type="number" min={1} max={45} required placeholder="Score (1-45)"
          value={score} onChange={(e) => setScore(e.target.value)}
          className={inputClass + " w-40"} />
        <input type="date" required max={today} value={playedOn}
          onChange={(e) => setPlayedOn(e.target.value)} className={inputClass} />
        <button type="submit" disabled={loading}
          className="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60">
          {editingId ? "Update score" : "Add score"}
        </button>
        {editingId && (
          <button type="button" onClick={resetForm}
            className="rounded-lg border border-slate-600 px-4 py-2 hover:bg-slate-800">
            Cancel
          </button>
        )}
      </form>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {scores.length === 0 ? (
        <p className="text-slate-400">No scores yet. Add your latest Stableford score above.</p>
      ) : (
        <ul className="space-y-2">
          {scores.map((s) => (
            <li key={s.id}
              className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 px-4 py-3">
              <div>
                <span className="text-2xl font-bold text-emerald-400">{s.score}</span>
                <span className="ml-3 text-slate-400">{formatDate(s.played_on)}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEdit(s)}
                  className="rounded-md border border-slate-600 px-3 py-1 text-sm hover:bg-slate-800">
                  Edit
                </button>
                <button onClick={() => handleDelete(s.id)}
                  className="rounded-md border border-red-500/50 px-3 py-1 text-sm text-red-400 hover:bg-red-500/10">
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-slate-500">
        Only your latest 5 scores are kept. A new score replaces the oldest one automatically.
      </p>
    </section>
  );
}