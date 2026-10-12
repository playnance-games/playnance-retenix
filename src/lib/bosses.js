import { loadPlayersWithStatus } from "@/lib/playerData";

// Bosses own platforms; players play on one or more bosses' platforms.
// `player_ids` are players whose main platform belongs to the boss.
export const BOSSES = [
  { id: "boss_viktor", name: "Viktor Hale", platform: "SpinVault", region: "Tel Aviv", tier: "Platinum", joined: "2025-11-03", commission_pct: 30, channel: "Telegram VIP group", player_ids: ["P-1001", "P-1004", "P-1006", "P-1012", "P-1016"] },
  { id: "boss_nadia", name: "Nadia Reyes", platform: "Fortuna Club", region: "Madrid", tier: "Gold", joined: "2026-01-18", commission_pct: 25, channel: "WhatsApp community", player_ids: ["P-1002", "P-1010", "P-1015", "P-1019", "P-1023"] },
  { id: "boss_marco", name: "Marco Bellini", platform: "Bella Bet", region: "Milan", tier: "Silver", joined: "2026-06-02", commission_pct: 20, channel: "Instagram promos", player_ids: ["P-1003", "P-1007", "P-1009", "P-1013", "P-1021", "P-1024"] },
  { id: "boss_kenji", name: "Kenji Mori", platform: "Sakura Spins", region: "Tokyo", tier: "Gold", joined: "2026-03-09", commission_pct: 25, channel: "Discord server", player_ids: ["P-1005", "P-1011", "P-1017", "P-1020", "P-1022"] },
  { id: "boss_elin", name: "Elin Lindqvist", platform: "Nordic Jackpot", region: "Stockholm", tier: "Silver", joined: "2026-05-21", commission_pct: 20, channel: "Email newsletter", player_ids: ["P-1008", "P-1014", "P-1018", "P-1025"] },
];

// Extra platforms a player also plays on, with the share of their activity there.
const SECONDARY_PLATFORMS = {
  "P-1001": [["boss_nadia", 0.3]],
  "P-1002": [["boss_viktor", 0.4]],
  "P-1004": [["boss_kenji", 0.25]],
  "P-1007": [["boss_elin", 0.35]],
  "P-1010": [["boss_marco", 0.2]],
  "P-1012": [["boss_nadia", 0.3], ["boss_kenji", 0.2]],
  "P-1015": [["boss_viktor", 0.45]],
  "P-1017": [["boss_elin", 0.3]],
  "P-1020": [["boss_viktor", 0.25]],
  "P-1022": [["boss_marco", 0.4]],
  "P-1025": [["boss_kenji", 0.3]],
};

export const TIER_CLASS = {
  Platinum: "bg-slate-900 text-white",
  Gold: "bg-amber-100 text-amber-800",
  Silver: "bg-slate-100 text-slate-700",
};

export const CATEGORY_LABEL = { slots: "Slots", live: "Live casino", sports: "Sports", none: "Not set" };

export const playerDeposits = (p) => Number(p.total_deposits) || (p.deposit_count || 0) * (p.avg_deposit || 0);

export function platformsForPlayer(playerId) {
  const main = BOSSES.find((b) => b.player_ids.includes(playerId));
  const extra = (SECONDARY_PLATFORMS[playerId] || []).map(([id, share]) => ({ boss: BOSSES.find((b) => b.id === id), share, primary: false }));
  const extraShare = extra.reduce((n, e) => n + e.share, 0);
  return [...(main ? [{ boss: main, share: 1 - extraShare, primary: true }] : []), ...extra].filter((m) => m.boss);
}

function membersOf(boss, allPlayers) {
  return allPlayers
    .map((player) => ({ player, link: platformsForPlayer(player.player_id).find((m) => m.boss.id === boss.id) }))
    .filter((m) => m.link)
    .map(({ player, link }) => ({ player, share: link.share, primary: link.primary }));
}

function topGames(players, limit = 3) {
  const counts = new Map();
  for (const p of players) {
    for (const g of new Set([...(p.favorites_stated || []), ...(p.favorites_seen || [])])) {
      counts.set(g, (counts.get(g) || 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit).map(([name, count]) => ({ name, count }));
}

function categoryMix(players) {
  const total = players.length || 1;
  const counts = { slots: 0, live: 0, sports: 0, none: 0 };
  for (const p of players) counts[p.favorite_category in counts ? p.favorite_category : "none"] += 1;
  return Object.entries(counts)
    .filter(([, n]) => n > 0)
    .map(([key, n]) => ({ key, label: CATEGORY_LABEL[key], count: n, pct: Math.round((n / total) * 100) }))
    .sort((a, b) => b.count - a.count);
}

export function buildBossStats(boss, allPlayers) {
  const members = membersOf(boss, allPlayers);
  const players = members.map((m) => m.player);
  const count = members.length;
  const weighted = (fn) => members.reduce((acc, m) => acc + (Number(fn(m.player)) || 0) * m.share, 0);
  const avg = (fn) => (count ? players.reduce((acc, p) => acc + (Number(fn(p)) || 0), 0) / count : 0);
  const playersNet = weighted((p) => p.net_amount);
  return {
    ...boss,
    players: count,
    mainPlayers: members.filter((m) => m.primary).length,
    inSession: players.filter((p) => p.in_session).length,
    active: players.filter((p) => p.lifecycle === "active").length,
    newPlayers: players.filter((p) => p.lifecycle === "new").length,
    atRisk: players.filter((p) => p.lifecycle === "at-risk").length,
    blocked: players.filter((p) => p.risk === "block_offers").length,
    avgScore: avg((p) => p.score),
    deposits: weighted(playerDeposits),
    avgDeposit: avg((p) => p.avg_deposit),
    sessionsPerWeek: count ? weighted((p) => p.sessions_per_week) / count : 0,
    houseNet: -playersNet,
    commission: Math.max(0, -playersNet) * (boss.commission_pct / 100),
    categories: categoryMix(players),
    topGames: topGames(players),
    roster: members,
  };
}

export async function loadBossWithStats(id) {
  const players = await loadPlayersWithStatus();
  const boss = BOSSES.find((b) => b.id === id);
  return boss ? buildBossStats(boss, players) : null;
}

export async function loadBossesWithStats() {
  const players = await loadPlayersWithStatus();
  return BOSSES.map((boss) => buildBossStats(boss, players));
}

export function money(n) {
  return `$${Math.round(Number(n) || 0).toLocaleString()}`;
}
