// Five named risk levels. Level 1 is green, level 5 is red.
// Risk uses play and payment behavior only. The retention score is not an input,
// so the score can include risk without the two measures looping.
export const RISK_LEVELS = [
  { level: 1, word: "Low", cls: "bg-emerald-400 text-emerald-950", hint: "Seen recently and playing often.", action: "No intervention. Normal campaign eligibility." },
  { level: 2, word: "Mild", cls: "bg-lime-400 text-lime-950", hint: "A short quiet stretch or slightly thin weekly play.", action: "Light activation only." },
  { level: 3, word: "Moderate", cls: "bg-amber-400 text-amber-950", hint: "Noticeably quieter, or a weaker deposit rhythm.", action: "Put them in a re-engagement segment." },
  { level: 4, word: "High", cls: "bg-orange-500 text-white", hint: "A long gap, rare sessions, or a sharp deposit drop.", action: "Prioritize one campaign. Hold cash until someone reviews them." },
  { level: 5, word: "Severe", cls: "bg-red-600 text-white", hint: "Gone quiet, barely playing, or a payment flag is on.", action: "Operator review. No cash gift until cleared." },
];

function daysSince(date) {
  const t = Date.parse(date);
  if (!Number.isFinite(t)) return null;
  return Math.max(0, (Date.now() - t) / 864e5);
}

export function riskLevelOf(player) {
  const reasons = [];
  const missing = [];
  let pressure = 0;
  const days = daysSince(player?.last_seen);
  const sessions = Number(player?.sessions_per_week);
  const avg = Number(player?.avg_deposit);
  const last = Number(player?.last_deposit);
  const deposits = Number(player?.deposit_count);
  const failed = Number(player?.failed_deposits_24h);
  const chargebacks = Number(player?.chargebacks_30d);

  if (days == null) {
    pressure += 2;
    missing.push("last seen");
  } else if (days >= 21) {
    pressure += 2;
    reasons.push(`${Math.round(days)} days since last seen`);
  } else if (days >= 7) {
    pressure += 1;
    reasons.push(`${Math.round(days)} days since last seen`);
  } else if (days < 3) {
    pressure -= 1;
    reasons.push("Seen in the last 3 days");
  }

  if (!Number.isFinite(sessions)) {
    pressure += 1;
    missing.push("sessions per week");
  } else if (sessions < 2) {
    pressure += 1;
    reasons.push(`${sessions} session${sessions === 1 ? "" : "s"} a week`);
  } else if (sessions >= 8) {
    pressure -= 1;
    reasons.push(`${sessions} sessions a week`);
  }

  if (player?.in_session) {
    pressure -= 1;
    reasons.push("Playing right now");
  }

  if (Number.isFinite(avg) && avg > 0 && Number.isFinite(last) && Number.isFinite(deposits) && deposits >= 5) {
    if (last < avg * 0.5) {
      pressure += 1;
      reasons.push("Last deposit is under half their average");
    } else if (last >= avg * 3) {
      pressure += 1;
      reasons.push("Last deposit is at least 3× their average");
    }
  } else missing.push("deposit rhythm");

  if (Number.isFinite(failed) && failed >= 2) {
    pressure += 1;
    reasons.push(`${failed} failed deposits in 24 hours`);
  }
  if (Number.isFinite(chargebacks) && chargebacks >= 1) {
    pressure += 2;
    reasons.push(`${chargebacks} chargeback${chargebacks === 1 ? "" : "s"} in 30 days`);
  }

  const level = Math.min(5, Math.max(1, pressure + 2));
  const meta = RISK_LEVELS[level - 1];
  const confidence = missing.length >= 2 ? "limited" : "ready";
  const sentence = reasons.length ? `${meta.word}: ${reasons.slice(0, 3).join(", ")}.` : `${meta.word}: not enough recent play signals.`;
  return { ...meta, reasons, missing, confidence, sentence };
}

export function dataFreshness(players = []) {
  const times = players.map((p) => Date.parse(p.last_seen)).filter(Number.isFinite);
  if (!times.length) return { label: "No activity loaded", stale: true, note: "No player activity is loaded." };
  const latest = Math.max(...times);
  const ageDays = (Date.now() - latest) / 864e5;
  const when = new Date(latest).toLocaleString();
  return {
    label: when,
    stale: ageDays > 2,
    note: ageDays > 2
      ? `Newest player activity is ${when}. Treat risk as a snapshot, not a live feed.`
      : `Newest player activity is ${when}.`,
  };
}
