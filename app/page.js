import Link from "next/link";

// Homepage (route: "/") temporary hai, baad mein full landing page banayenge
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-950 text-white">
      <h1 className="text-5xl font-bold">Digital Heroes 🚀</h1>
      <p className="text-lg text-slate-300">Golf. Charity. Impact. Coming soon.</p>
      <div className="flex gap-4">
        <Link href="/signup"
          className="rounded-lg bg-emerald-500 px-5 py-2 font-semibold text-slate-950 hover:bg-emerald-400">
          Sign up
        </Link>
        <Link href="/login"
          className="rounded-lg border border-slate-600 px-5 py-2 hover:bg-slate-800">
          Log in
        </Link>
      </div>
    </main>
  );
}