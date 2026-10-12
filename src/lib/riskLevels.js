// Five named risk levels. Level 1 is green, level 5 is red.
export const RISK_LEVELS = [
  { level: 1, word: "Low", cls: "bg-emerald-400 text-emerald-950", hint: "Playing often, with a strong score." },
  { level: 2, word: "Mild", cls: "bg-lime-400 text-lime-950", hint: "A small dip in play or score." },
  { level: 3, word: "Moderate", cls: "bg-amber-400 text-amber-950", hint: "Quieter than usual, or a middling score." },
  { level: 4, word: "High", cls: "bg-orange-500 text-white", hint: "A long gap since they last played, or a weak score." },
  { level: 5, word: "Severe", cls: "bg-red-600 text-white", hint: "Very quiet, playing rarely, and a low score." },
];

function daysSince(date) {
  const t = Date.parse(date);
  if (!Number.isFinite(t)) return null;
  return Math.max(0, (Date.now() - t) / 864e5);
}

// Rises with time away, thin weekly play, and a lower score.
export function riskLevelOf(player) {
  const days = daysSince(player?.last_seen);
  const score = Number(player?.score);
  const sessions = Number(player?.sessions_per_week);
  let pressure = 0;
  if (days == null || days >= 21) pressure += 2;
  else if (days >= 7) pressure += 1;
  if (!Number.isFinite(score)) pressure += 2;
  else if (score < 3.5) pressure += 3;
  else if (score < 5) pressure += 2;
  else if (score < 6.5) pressure += 1;
  else if (score >= 8) pressure -= 1;
  if (!Number.isFinite(sessions) || sessions < 2) pressure += 1;
  else if (sessions >= 8) pressure -= 1;
  const level = Math.min(5, Math.max(1, pressure + 2));
  return RISK_LEVELS[level - 1];
}
