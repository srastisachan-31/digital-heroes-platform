import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "./LogoutButton";

export default async function DashboardPage() {
  const supabase = await createClient();

  // Server par user verify karo (proxy ke baad doosri suraksha layer)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Profile + chuni hui charity. RLS ki wajah se sirf apni hi row milegi
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, charity_percent, charities(name)")
    .eq("id", user.id)
    .single();

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="text-3xl font-bold">
          Welcome, {profile?.full_name || user.email} 👋
        </h1>

        <div className="space-y-1 rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p><span className="text-slate-400">Email:</span> {user.email}</p>
          <p><span className="text-slate-400">Role:</span> {profile?.role}</p>
          <p>
            <span className="text-slate-400">Charity:</span>{" "}
            {profile?.charities?.name ?? "Not selected"} ({profile?.charity_percent}%)
          </p>
        </div>

        <LogoutButton />
      </div>
    </main>
  );
}