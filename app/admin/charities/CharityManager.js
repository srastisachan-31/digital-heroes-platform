"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-emerald-400";

const emptyForm = { name: "", description: "", imageUrl: "", eventsText: "", isFeatured: false, isActive: true };

// "Charity Golf Day | 2026-11-15" (har line ek event) ko JSON array mein badalta hai
function parseEvents(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title, date] = line.split("|").map((s) => s.trim());
      return { title, date: date || "" };
    });
}

function eventsToText(events) {
  return (events ?? []).map((e) => `${e.title} | ${e.date}`).join("\n");
}

export default function CharityManager({ initialCharities }) {
  const supabase = createClient();
  const [charities, setCharities] = useState(initialCharities);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function setField(name, value) {
    setForm({ ...form, [name]: value });
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
  }

  function startEdit(c) {
    setEditingId(c.id);
    setForm({
      name: c.name,
      description: c.description ?? "",
      imageUrl: c.image_url ?? "",
      eventsText: eventsToText(c.events),
      isFeatured: c.is_featured,
      isActive: c.is_active,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      image_url: form.imageUrl.trim() || null,
      events: parseEvents(form.eventsText),
      is_featured: form.isFeatured,
      is_active: form.isActive,
    };

    const query = editingId
      ? supabase.from("charities").update(payload).eq("id", editingId)
      : supabase.from("charities").insert(payload);
    const { data, error } = await query.select().single();
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }
    setCharities(
      editingId ? charities.map((c) => (c.id === editingId ? data : c)) : [data, ...charities]
    );
    resetForm();
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this charity? Users who selected it will have no charity.")) return;
    const { error } = await supabase.from("charities").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    setCharities(charities.filter((c) => c.id !== id));
    if (editingId === id) resetForm();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="text-xl font-semibold">{editingId ? "Edit charity" : "Add a charity"}</h2>

        <input required placeholder="Charity name" value={form.name}
          onChange={(e) => setField("name", e.target.value)} className={inputClass} />
        <textarea rows={3} placeholder="Description" value={form.description}
          onChange={(e) => setField("description", e.target.value)} className={inputClass} />
        <input placeholder="Image URL (optional)" value={form.imageUrl}
          onChange={(e) => setField("imageUrl", e.target.value)} className={inputClass} />
        <div>
          <textarea rows={3} placeholder={"Upcoming events, one per line:\nCharity Golf Day | 2026-11-15"}
            value={form.eventsText} onChange={(e) => setField("eventsText", e.target.value)}
            className={inputClass} />
          <p className="mt-1 text-xs text-slate-500">Format: Event title | YYYY-MM-DD</p>
        </div>

        <div className="flex flex-wrap gap-6 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.isFeatured}
              onChange={(e) => setField("isFeatured", e.target.checked)} />
            Featured on homepage
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.isActive}
              onChange={(e) => setField("isActive", e.target.checked)} />
            Active (visible to users)
          </label>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60">
            {loading ? "Saving..." : editingId ? "Update charity" : "Add charity"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm}
              className="rounded-lg border border-slate-600 px-4 py-2 hover:bg-slate-800">
              Cancel
            </button>
          )}
        </div>
      </form>

      <ul className="space-y-3">
        {charities.map((c) => (
          <li key={c.id} className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="space-y-1">
              <p className="text-lg font-semibold">
                {c.name}
                {c.is_featured && <span className="ml-2 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">Featured</span>}
                {!c.is_active && <span className="ml-2 rounded-full bg-slate-500/20 px-2 py-0.5 text-xs text-slate-300">Inactive</span>}
              </p>
              {c.description && <p className="text-sm text-slate-400">{c.description}</p>}
              {(c.events ?? []).map((ev, i) => (
                <p key={i} className="text-xs text-emerald-400">📅 {ev.title} · {ev.date}</p>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => startEdit(c)}
                className="rounded-md border border-slate-600 px-3 py-1 text-sm hover:bg-slate-800">Edit</button>
              <button onClick={() => handleDelete(c.id)}
                className="rounded-md border border-red-500/50 px-3 py-1 text-sm text-red-400 hover:bg-red-500/10">Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}