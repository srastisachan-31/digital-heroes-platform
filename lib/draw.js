// DRAW ENGINE: numbers generate karna, prize pool nikalna, winners evaluate karna.
// Ye pure functions hain (database se alag), isliye test karna aasaan hai.

export const POOL_SHARE = { 5: 0.4, 4: 0.35, 3: 0.25 }; // PRD ke hisaab se tier split
export const POOL_PERCENT_OF_FEE = 0.5; // Assumption: fee ka 50% prize pool mein jata hai
const MIN_NUM = 1;
const MAX_NUM = 45;

const round2 = (n) => Math.round(n * 100) / 100;
const floor2 = (n) => Math.floor(n * 100 + 1e-6) / 100;

// Yearly plan ko monthly equivalent mein badalta hai
export function monthlyFee(sub) {
  return sub.plan === "yearly" ? Number(sub.amount) / 12 : Number(sub.amount);
}

export function generateNumbers(type, players) {
  return type === "algorithmic" ? weightedNumbers(players) : randomNumbers();
}

// RANDOM: 1-45 mein se 5 alag numbers, sab barabar chance
function randomNumbers() {
  const bucket = Array.from({ length: MAX_NUM }, (_, i) => i + 1);
  const picked = [];
  while (picked.length < 5) {
    const idx = Math.floor(Math.random() * bucket.length);
    picked.push(bucket.splice(idx, 1)[0]);
  }
  return picked.sort((a, b) => a - b);
}

// ALGORITHMIC: jo score zyada players ke paas hai, uske nikalne ke chance zyada
function weightedNumbers(players) {
  const weights = {};
  for (let n = MIN_NUM; n <= MAX_NUM; n++) weights[n] = 0.1; // chhota base, taaki hamesha 5 numbers mil sakein
  players.forEach((p) => p.numbers.forEach((n) => (weights[n] += 1)));

  const picked = [];
  while (picked.length < 5) {
    const entries = Object.entries(weights).filter(([n]) => !picked.includes(Number(n)));
    const total = entries.reduce((sum, [, w]) => sum + w, 0);
    let r = Math.random() * total;
    let chosen = entries[entries.length - 1][0];
    for (const [n, w] of entries) {
      r -= w;
      if (r <= 0) {
        chosen = n;
        break;
      }
    }
    picked.push(Number(chosen));
  }
  return picked.sort((a, b) => a - b);
}

// PRIZE POOL: active subscribers ki count se auto-calculate + jackpot rollover
export function calculatePool(subscribers, rolloverIn = 0) {
  const base = subscribers.reduce((sum, s) => sum + monthlyFee(s) * POOL_PERCENT_OF_FEE, 0);
  return {
    pool_total: round2(base + rolloverIn),
    pool_5: round2(base * POOL_SHARE[5] + rolloverIn), // rollover sirf jackpot mein judta hai
    pool_4: round2(base * POOL_SHARE[4]),
    pool_3: round2(base * POOL_SHARE[3]),
  };
}

// WINNERS: match count, tier ke hisaab se equal split, jackpot rollover
export function evaluateDraw(players, winningNumbers, pool) {
  const entries = players.map((p) => ({
    user_id: p.user_id,
    numbers: p.numbers,
    match_count: winningNumbers.filter((n) => p.numbers.includes(n)).length,
  }));

  const winners = [];
  const summary = {};
  for (const tier of [5, 4, 3]) {
    const tierWinners = entries.filter((e) => e.match_count === tier);
    const tierPool = pool[`pool_${tier}`];
    const prize = tierWinners.length ? floor2(tierPool / tierWinners.length) : 0;
    summary[tier] = { winners: tierWinners.length, pool: tierPool, prize_each: prize };
    tierWinners.forEach((w) =>
      winners.push({ user_id: w.user_id, match_type: tier, prize_amount: prize })
    );
  }

  // Jackpot kisi ko nahi mila to poora pool_5 agle mahine ke liye carry forward
  const rollover_out = summary[5].winners === 0 ? pool.pool_5 : 0;
  return { entries, winners, summary, rollover_out };
}