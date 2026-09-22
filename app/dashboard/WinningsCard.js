"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const money = (n) => `$${Number(n).toFixed(2)}`;

const badge = {
  pending: "bg-slate-500/20 text-slate-300",
  approved: "bg-emerald-500/20 text-emerald-400",
  rejected: "bg-red-500/20 text-red-400",
};

export default function WinningsCard({ winnings }) {
  const supabase = createClient();
  const router = useRouter();
  const [uploadingId, setUploadingId] = useState(null);
  const [error, setError] = useState("");

  async function handleUpload(winnerId, userId, file) {
    if (!file) return;
    setError("");
    setUploadingId(winnerId);

    // Path: userId/winnerId.png (RLS policy user_id folder check karti hai)
    const ext = file.name.split(".").pop();
    const path = `${userId}/${winnerId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("winner-proofs")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setError(uploadError.message);
      setUploadingId(null);
      return;
    }

    const { data } = supabase.storage.from("winner-proofs").getPublicUrl(path);

    // proof_url update (trigger sirf ise allow karta hai, baaki columns lock hain)
    const { error: dbError } = await supabase
      .from("winners")
      .update({ proof_url: data.publicUrl })
      .eq("id", winnerId);

    setUploadingId(null);
    if (dbError) {
      setError(dbError.message);
      return;
    }
    router.refresh();
  }

  if (winnings.length === 0) return null;

  return (
    <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-900 p-5">
      <h2 className="text-xl font-semibold">🏆 Your winnings</h2>
      <ul className="space-y-3">
        {winnings.map((w) => (
          <li key={w.id} className="space-y-2 rounded-lg border border-slate-800 bg-slate-950 p-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-emerald-400">{money(w.prize_amount)}</span>
              <span className="text-sm text-slate-400">{w.match_type}-number match</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className={`rounded-full px-2 py-0.5 capitalize ${badge[w.verification_status]}`}>
                {w.verification_status}
              </span>
              <span className="text-slate-400 capitalize">Payment: {w.payment_status}</span>
            </div>

            {w.verification_status === "pending" && (
              <div>
                <label className="cursor-pointer text-sm text-emerald-400 underline">
                  {uploadingId === w.id ? "Uploading..." : w.proof_url ? "Replace proof" : "Upload score proof"}
                  <input type="file" accept="image/*" className="hidden"
                    disabled={uploadingId === w.id}
                    onChange={(e) => handleUpload(w.id, w.user_id, e.target.files[0])} />
                </label>
              </div>
            )}
            {w.proof_url && (
              <a href={w.proof_url} target="_blank" rel="noreferrer"
                className="block text-xs text-slate-400 underline">View uploaded proof</a>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}