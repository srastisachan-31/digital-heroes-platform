"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none focus:border-emerald-400";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }
    router.push("/dashboard");
    router.refresh(); // server components ko naya session dikhane ke liye
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-8"
      >
        <h1 className="text-3xl font-bold">Welcome back</h1>

        <input type="email" placeholder="Email" required value={email}
          onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        <input type="password" placeholder="Password" required value={password}
          onChange={(e) => setPassword(e.target.value)} className={inputClass} />

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button type="submit" disabled={loading}
          className="w-full rounded-lg bg-emerald-500 py-2 font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60">
          {loading ? "Logging in..." : "Log in"}
        </button>

        <p className="text-center text-sm text-slate-400">
          New here?{" "}
          <Link href="/signup" className="text-emerald-400 hover:underline">Create an account</Link>
        </p>
      </form>
    </main>
  );
}