import { createClient } from "@/lib/supabase/server";
import SignupForm from "./SignupForm";

export default async function SignupPage() {
  const supabase = await createClient();

  // Charities public hain (RLS policy), isliye bina login ke bhi mil jayengi
  const { data: charities } = await supabase
    .from("charities")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <SignupForm charities={charities ?? []} />
    </main>
  );
}