import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-guard";
import CharityManager from "./CharityManager";

export default async function AdminCharitiesPage() {
  await requireAdmin();

  const supabase = await createClient();
  const { data: charities } = await supabase
    .from("charities")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-8">
      <h1 className="text-3xl font-bold">Charities</h1>
      <CharityManager initialCharities={charities ?? []} />
    </main>
  );
}