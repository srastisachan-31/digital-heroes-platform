import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/admin-guard";
import { generateNumbers, calculatePool, evaluateDraw } from "@/lib/draw";
import { loadPlayers, getRolloverIn } from "@/lib/draw-data";

export async function POST(request) {
  try {
    if (!(await getAdminUser())) {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const { month, type } = await request.json(); // month = "2026-09"
    if (!/^\d{4}-\d{2}$/.test(month ?? "") || !["random", "algorithmic"].includes(type)) {
      return NextResponse.json({ error: "Invalid month or draw type." }, { status: 400 });
    }
    const drawMonth = `${month}-01`;

    const admin = createAdminClient();

    // Published draw dobara simulate nahi ho sakta
    const { data: existing } = await admin
      .from("draws")
      .select("status")
      .eq("draw_month", drawMonth)
      .maybeSingle();
    if (existing?.status === "published") {
      return NextResponse.json({ error: "This month's draw is already published." }, { status: 400 });
    }

    const { subscribers, players } = await loadPlayers(admin);
    const rolloverIn = await getRolloverIn(admin, drawMonth);

    const winningNumbers = generateNumbers(type, players);
    const pool = calculatePool(subscribers, rolloverIn);
    const result = evaluateDraw(players, winningNumbers, pool);

    // Draw ko "simulated" status ke saath save karo (entries/winners publish par banenge)
    const { data: draw, error } = await admin
      .from("draws")
      .upsert(
        {
          draw_month: drawMonth,
          draw_type: type,
          status: "simulated",
          winning_numbers: winningNumbers,
          active_subscribers: subscribers.length,
          ...pool,
          rollover_in: rolloverIn,
          rollover_out: result.rollover_out,
        },
        { onConflict: "draw_month" }
      )
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({ draw, summary: result.summary, participants: players.length });
  } catch (err) {
    console.error("Simulate error:", err);
    return NextResponse.json({ error: "Could not run the simulation." }, { status: 500 });
  }
}