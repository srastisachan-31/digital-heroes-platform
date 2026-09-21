import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-guard";
import WinnersManager from "./WinnersManager";

export default async function AdminWinnersPage() {
  await requireAdmin();

  const supabase = await createClient();
  // profiles(...) aur draws(...) join se winner ka naam aur draw month milta hai
  const { data: winners } = await supabase
    .from("winners")
    .select(
      "id, match_type, prize_amount, proof_url, verification_status, payment_status, created_at, profiles(full_name, email), draws(draw_month)"
    )
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-8">
      <h1 className="text-3xl font-bold">Winners</h1>
      <WinnersManager initialWinners={winners ?? []} />
    </main>
  );
}