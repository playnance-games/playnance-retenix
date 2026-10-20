// Retenix product-rule engine (mock logic, display + gate evaluation)
import { derivePlayerStatus } from '@/lib/playerStatus';
import { riskLevelOf } from '@/lib/riskLevels';
export { derivePlayerStatus } from '@/lib/playerStatus';

export const LIFECYCLES = ["new", "active", "quiet", "at-risk"];
export const NET_STATES = ["up", "down", "too_thin"];
export const RISKS = ["clean", "watch", "block_offers"];
export const CATEGORIES = ["slots", "live", "sports", "none"];

export const EVENT_TRIGGERS = [
  "signed_in_no_deposit",
  "abandoned_deposit_form",
  "payment_failed",
  "same_method_failed_twice",
  "opened_favorite_game",
  "idle_at_table",
  "lost_session_fast",
  "session_much_longer",
  "large_win_this_session",
  "opened_match_no_bet",
  "sports_kickoff",
  "sports_goal",
  "sports_red_card",
  "offline_preferred_hours",
  "staking_lock_maturing",
  "quieter_than_usual_week",
  "birthday",
  "never_used_staking",
  "never_used_missions",
  "never_used_streaming",
  "never_used_tournaments",
];

export const ACTION_TEMPLATES = [
  "wheel", "slot", "deposit_prompt", "payment_methods", "birthday",
  "survey_3choice", "education_card", "telegram_copy", "whatsapp_copy",
];

export const FEATURES = ["staking", "daily mission", "tournaments", "streaming", "sports book how-it-works", "leaderboard", "G Coin"];

const riskRank = (r) => ({ clean: 0, watch: 1, block_offers: 2 }[r] ?? 0);

export function fmtMoney(n) {
  if (n == null) return "$0";
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

// Cash formula: min(haircut% of net_down, 1 x avg_deposit) + optional lock sweetener
export function computeCashGift(player, settings, lockSweetener = "none") {
  const haircut = (settings.haircut_pct ?? 20) / 100;
  const netDown = player.net_vs_house === "down" ? Math.abs(player.net_amount || 0) : 0;
  const base = Math.min(haircut * netDown, player.avg_deposit || 0);
  let sweetener = 0;
  if (lockSweetener === "day") sweetener = base * 0.10;
  else if (lockSweetener === "week") sweetener = base * 0.20;
  else if (lockSweetener === "month") sweetener = base * 0.30;
  return Math.round((base + sweetener) * 100) / 100;
}

export function cashGate(player) {
  if (player.net_vs_house === "up") return { pass: false, reason: "net_up" };
  if (player.risk === "block_offers") return { pass: false, reason: "block_offers" };
  return { pass: true };
}

export function cashWindowFree(player) {
  return (player.bonus_budget_used_7d || 0) === 0;
}

export function matchConditions(player, useCase, settings) {
  const c = useCase.conditions || {};
  if (c.min_score != null && player.score < c.min_score) return false;
  if (c.max_score != null && player.score > c.max_score) return false;
  if (c.net_vs_house && player.net_vs_house !== c.net_vs_house) return false;
  if (c.max_risk && riskRank(player.risk) > riskRank(c.max_risk)) return false;
  if (c.lifecycle && player.lifecycle !== c.lifecycle) return false;
  if (c.favorite_tag && player.favorite_category !== c.favorite_tag) return false;
  if (c.feature_never_used && player.feature_flags?.[c.feature_never_used]) return false;
  if (c.cash_window_free && !cashWindowFree(player)) return false;
  return true;
}

export function matchSegment(player, segment) {
  const f = segment.filters || {};
  if (f.min_score != null && player.score < f.min_score) return false;
  if (f.max_score != null && player.score > f.max_score) return false;
  if (f.net_vs_house && player.net_vs_house !== f.net_vs_house) return false;
  if (f.favorite && player.favorite_category !== f.favorite) return false;
  if (f.feature_unused && player.feature_flags?.[f.feature_unused]) return false;
  if (f.risk && player.risk !== f.risk) return false;
  if (f.lifecycle && player.lifecycle !== f.lifecycle) return false;
  return true;
}

// Evaluate a single case against a player (event cases use conditions; segment cases use assigned segments)
export function evaluateCaseForPlayer(player, useCase, settings, segments = []) {
  player = { ...player, ...derivePlayerStatus(player, settings) };
  if (useCase.status !== "on") return { wouldFire: false, reason: "off" };
  if (useCase.trigger_mode === "segment") {
    const segs = (useCase.segment_ids || []).map((id) => segments.find((s) => s.id === id || s.seg_key === id)).filter(Boolean);
    if (!segs.length) return { wouldFire: false, reason: "no_segment" };
    if (!segs.some((s) => matchSegment(player, s))) return { wouldFire: false, reason: "segment" };
  } else {
    if (!matchConditions(player, useCase, settings)) return { wouldFire: false, reason: "conditions" };
  }
  if (useCase.type === "cash") {
    const g = cashGate(player);
    if (!g.pass) return { wouldFire: false, reason: g.reason };
    if (!cashWindowFree(player)) return { wouldFire: false, reason: "window" };
    const cf = useCase.cash_formula || {};
    const gift = cf.fixed_mode && Number(cf.fixed_amount) > 0
      ? Number(cf.fixed_amount)
      : computeCashGift(player, settings, cf.lock_sweetener);
    return { wouldFire: true, gift };
  }
  if (useCase.type === "survey" && player.risk === "block_offers") return { wouldFire: false, reason: "block_offers" };
  return { wouldFire: true, gift: 0 };
}

// For the live board: best case that would fire for a player
export function bestCaseForPlayer(player, cases, settings, segments) {
  const on = cases.filter((c) => c.status === "on");
  for (const uc of on) {
    const r = evaluateCaseForPlayer(player, uc, settings, segments);
    if (r.wouldFire) return { case: uc, ...r };
  }
  // find first blocked reason
  for (const uc of on) {
    const r = evaluateCaseForPlayer(player, uc, settings, segments);
    if (!r.wouldFire && r.reason !== "conditions" && r.reason !== "segment" && r.reason !== "no_segment" && r.reason !== "off") {
      return { case: uc, ...r };
    }
  }
  return { case: null, wouldFire: false, reason: "none" };
}


export const FIXED_SCORE_WEIGHTS = { risk: 40, high_roller: 40, engagement: 10, lifetime: 10 };

export const SCORE_WEIGHT_DEFS = [
  { key: "risk", label: "Risk", value: 40, desc: "Behavior only: time away, weekly play, and deposit rhythm. The score is not fed back into risk. Lower risk scores higher." },
  { key: "high_roller", label: "High roller", value: 40, desc: "Average deposit size. Larger deposits score higher." },
  { key: "engagement", label: "Engagement", value: 10, desc: "How often they play, from sessions per week." },
  { key: "lifetime", label: "Lifetime", value: 10, desc: "How established the account is, from lifetime deposit count." },
];

export const SCORE_LABELS = {
  risk: "Risk",
  high_roller: "High roller",
  engagement: "Engagement",
  lifetime: "Lifetime",
  presence: "Presence & sessions",
  sessions: "Presence & sessions",
  deposit_rhythm: "Deposit rhythm",
  deposits: "Deposit rhythm",
  tenure: "Account tenure",
  age: "Account tenure",
  preference: "Preference declaration",
  response: "Response & engagement",
  wagering: "Wagering levels",
};

const SIGNALS = {
  risk: {
    calc: (p) => (6 - riskLevelOf(p).level) * 2,
    input: (p) => `${riskLevelOf(p).word} (level ${riskLevelOf(p).level} of 5) → ${(6 - riskLevelOf(p).level) * 2}/10`,
  },
  high_roller: {
    calc: (p) => Math.min(10, ((Number(p.avg_deposit) || 0) / 140) * 10),
    input: (p) => `$${Number(p.avg_deposit) || 0} average deposit ÷ $140 × 10`,
  },
  lifetime: {
    calc: (p) => Math.min(10, ((Number(p.deposit_count) || 0) / 25) * 10),
    input: (p) => `${Number(p.deposit_count) || 0} lifetime deposits ÷ 25 × 10`,
  },
  presence: {
    calc: (p) => Math.min(10, ((p.sessions_per_week || 0) / 5) * 10),
    input: (p) => `${p.sessions_per_week || 0} sessions/week ÷ 5 × 10`,
  },
  sessions: {
    calc: (p) => Math.min(10, ((p.sessions_per_week || 0) / 5) * 10),
    input: (p) => `${p.sessions_per_week || 0} sessions/week ÷ 5 × 10`,
  },
  deposit_rhythm: {
    calc: (p, ctx) => Math.max(0, Math.min(10, (ctx.deposits / 20) * 10 - (ctx.withdrawals / ctx.totalDep) * 5)),
    input: (p, ctx) => `${ctx.deposits} deposits ÷ 20 × 10 − (${ctx.withdrawals} withdrawals ÷ ${ctx.totalDep} deposits value) × 5`,
  },
  deposits: {
    calc: (p, ctx) => Math.max(0, Math.min(10, (ctx.deposits / 20) * 10 - (ctx.withdrawals / ctx.totalDep) * 5)),
    input: (p, ctx) => `${ctx.deposits} deposits ÷ 20 × 10 − (${ctx.withdrawals} withdrawals ÷ ${ctx.totalDep} deposits value) × 5`,
  },
  tenure: {
    calc: (p, ctx) => Math.min(10, (ctx.tenureDays / 365) * 10),
    input: (p, ctx) => `${Math.round(ctx.tenureDays)} account days ÷ 365 × 10`,
  },
  age: {
    calc: (p, ctx) => Math.min(10, (ctx.tenureDays / 365) * 10),
    input: (p, ctx) => `${Math.round(ctx.tenureDays)} account days ÷ 365 × 10`,
  },
  preference: {
    calc: (p) => Math.min(10, ((p.favorites_stated || []).length / 3) * 10),
    input: (p) => `${(p.favorites_stated || []).length} stated favorites ÷ 3 × 10`,
  },
  response: {
    calc: (p) => Math.min(10, 3 + (((p.player_id || "x").split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % 70) / 10),
    input: () => "Illustrative account-ID proxy (no response data)",
  },
  engagement: {
    calc: (p) => Math.min(10, ((Number(p.sessions_per_week) || 0) / 8) * 10),
    input: (p) => `${Number(p.sessions_per_week) || 0} sessions/week ÷ 8 × 10`,
  },
  wagering: {
    calc: (p, ctx) => Math.min(10, (ctx.wagered / (ctx.totalDep * 4 || 1)) * 10),
    input: (p, ctx) => `${ctx.wagered} wagered ÷ (${ctx.totalDep} deposits value × 4) × 10`,
  },
};

// Derive a per-signal breakdown that sums to the player's retention score.
export function scoreBreakdown(player) {
  const w = FIXED_SCORE_WEIGHTS;
  const ctx = {
    tenureDays: player.first_seen ? Math.max(1, (Date.now() - new Date(player.first_seen).getTime()) / 864e5) : 1,
    deposits: player.deposit_count || 0,
    totalDep: player.total_deposits || player.deposit_count || 1,
    withdrawals: player.withdrawals || 0,
    wagered: player.total_wagered || 0,
  };
  const keys = Object.keys(w);
  const raw = {};
  keys.forEach((k) => { raw[k] = SIGNALS[k] ? SIGNALS[k].calc(player, ctx) : 0; });
  const weightedSum = keys.reduce((a, k) => a + (raw[k] ?? 0) * (w[k] / 100), 0) || 1;
  const scale = (player.score ?? weightedSum) / weightedSum;
  return keys.map((k) => {
    const sig = SIGNALS[k];
    return {
      key: k,
      label: SCORE_LABELS[k] || k.replace(/_/g, " "),
      weight: w[k],
      raw: Math.round((raw[k] ?? 0) * 10000) / 10000,
      input: sig ? sig.input(player, ctx) : "Signal input not available",
      scale,
      contribution: (raw[k] ?? 0) * (w[k] / 100) * scale,
    };
  });
}

export const BLOCK_REASONS = {
  net_up: "Net vs house is up — cash disabled",
  block_offers: "Risk is block_offers",
  window: "7-day cash window used",
  cap: "Cap reached",
  off: "Case is off",
  conditions: "Conditions not met",
  segment: "Not in segment",
  no_segment: "No segment assigned",
  none: "No case matched",
};