// Draw ke liye database se players aur rollover laata hai (admin client, sirf server par)

// Active subscribers + unke scores
export async function loadPlayers(admin) {
  const { data: subs } = await admin
    .from("subscriptions")
    .select("user_id, plan, amount")
    .in("status", ["active", "cancelled"])
    .gt("current_period_end", new Date().toISOString());

  const subscribers = subs ?? [];
  const ids = subscribers.map((s) => s.user_id);

  let scores = [];
  if (ids.length) {
    const { data } = await admin.from("scores").select("user_id, score").in("user_id", ids);
    scores = data ?? [];
  }

  // Har user ke distinct scores ka set
  const byUser = {};
  scores.forEach((s) => {
    (byUser[s.user_id] ||= new Set()).add(s.score);
  });

  // Participants: jinke kam se kam 1 score hai
  const players = subscribers
    .filter((s) => byUser[s.user_id])
    .map((s) => ({
      user_id: s.user_id,
      numbers: [...byUser[s.user_id]].sort((a, b) => a - b),
    }));

  return { subscribers, players };
}

// Pichle published draw ka unclaimed jackpot
export async function getRolloverIn(admin, drawMonth) {
  const { data } = await admin
    .from("draws")
    .select("rollover_out")
    .eq("status", "published")
    .lt("draw_month", drawMonth)
    .order("draw_month", { ascending: false })
    .limit(1)
    .maybeSingle();
  return Number(data?.rollover_out ?? 0);
}