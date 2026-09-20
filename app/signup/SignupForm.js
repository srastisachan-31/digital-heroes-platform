"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none focus:border-emerald-400";

export default function SignupForm({ charities }) {
  const router = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    charityId: "",
    charityPercent: 10,
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Har input ki value state mein update karta hai
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    const percent = Number(form.charityPercent);
    if (!form.charityId) {
      setError("Please select a charity.");
      return;
    }
    if (percent < 10 || percent > 100) {
      setError("Charity contribution must be between 10% and 100%.");
      return;
    }

    setLoading(true);
    // Extra data "options.data" mein jata hai, database trigger isse profile bana deta hai
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.fullName,
          charity_id: form.charityId,
          charity_percent: percent,
        },
      },
    });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    if (data.session) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setMessage("Account created! Please verify your email, then log in.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-8"
    >
      <h1 className="text-3xl font-bold">Create your account</h1>
      <p className="text-slate-400">Play, win and give back.</p>

      <input name="fullName" placeholder="Full name" required value={form.fullName}
        onChange={handleChange} className={inputClass} />
      <input name="email" type="email" placeholder="Email" required value={form.email}
        onChange={handleChange} className={inputClass} />
      <input name="password" type="password" placeholder="Password (min 6 characters)"
        required minLength={6} value={form.password} onChange={handleChange}
        className={inputClass} />

      <select name="charityId" required value={form.charityId} onChange={handleChange}
        className={inputClass}>
        <option value="">Choose a charity to support</option>
        {charities.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      <div>
        <label className="mb-1 block text-sm text-slate-400">
          Charity contribution (% of your subscription, minimum 10)
        </label>
        <input name="charityPercent" type="number" min={10} max={100}
          value={form.charityPercent} onChange={handleChange} className={inputClass} />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {message && <p className="text-sm text-emerald-400">{message}</p>}

      <button type="submit" disabled={loading}
        className="w-full rounded-lg bg-emerald-500 py-2 font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60">
        {loading ? "Creating account..." : "Sign up"}
      </button>

      <p className="text-center text-sm text-slate-400">
        Already have an account?{" "}
        <Link href="/login" className="text-emerald-400 hover:underline">Log in</Link>
      </p>
    </form>
  );
}