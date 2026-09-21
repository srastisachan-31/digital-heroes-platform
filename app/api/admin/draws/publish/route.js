import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/admin-guard";
import { calculatePool, evaluateDraw } from "@/lib/draw";
import { loadPlayers, getRolloverIn } from "@/lib/draw-data";

export async function POST(request) {
  try {
    if (!(await getAdminUser())) {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const { drawId } = await request.json();
    const admin = createAdminClient();

    const { data: draw } = await admin.from("draws").select("*").eq("id", drawId).single();
    if (!draw || draw.status !== "simulated") {
      return NextResponse.json({ error: "Please simulate the draw first." }, { status: 400 });
    }

    // Publish ke waqt ka data lekar wahi simulated numbers evaluate karo
    const { subscribers, players } = await loadPlayers(admin);
    const rolloverIn = await getRolloverIn(admin, draw.draw_month);
    const pool = calculatePool(subscribers, rolloverIn);
    const result = evaluateDraw(players, draw.winning_numbers, pool);

    // Safety: purani entries hata kar nayi likho
    await admin.from("draw_entries").delete().eq("draw_id", draw.id);
    await admin.from("winners").delete().eq("draw_id", draw.id);

    if (result.entries.length) {
      const { error } = await admin
        .from("draw_entries")
        .insert(result.entries.map((e) => ({ ...e, draw_id: draw.id })));
      if (error) throw error;
    }
    if (result.winners.length) {
      const { error } = await admin
        .from("winners")
        .insert(result.winners.map((w) => ({ ...w, draw_id: draw.id })));
      if (error) throw error;
    }

    const { error: updateError } = await admin
      .from("draws")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
        active_subscribers: subscribers.length,
        ...pool,
        rollover_in: rolloverIn,
        rollover_out: result.rollover_out,
      })
      .eq("id", draw.id);
    if (updateError) throw updateError;

    return NextResponse.json({ ok: true, summary: result.summary });
  } catch (err) {
    console.error("Publish error:", err);
    return NextResponse.json({ error: "Could not publish the draw." }, { status: 500 });
  }
}