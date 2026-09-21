import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Admin user return karta hai, warna null (API routes ke liye)
export async function getAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return profile?.role === "admin" ? user : null;
}

// Pages ke liye: admin nahi hai to dashboard par bhej do
export async function requireAdmin() {
  const user = await getAdminUser();
  if (!user) redirect("/dashboard");
  return user;
}