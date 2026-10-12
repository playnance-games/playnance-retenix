import { loadPlayersWithStatus } from "@/lib/playerData";

// Bosses bring players to the site. Their stats are rolled up from the players they own.
export const BOSSES = [
  { id: "boss_viktor", name: "Viktor Hale", region: "Tel Aviv", tier: "Platinum", joined: "2025-11-03", commission_pct: 30, channel: "Telegram VIP group", player_ids: ["P-1001", "P-1004", "P-1006", "P-1012", "P-1016"] },
  { id: "boss_nadia", name: "Nadia Reyes", region: "Madrid", tier: "Gold", joined: "2026-01-18", commission_pct: 25, channel: "WhatsApp community", player_ids: ["P-1002", "P-1010", "P-1015", "P-1019", "P-1023"] },
  { id: "boss_marco", name: "Marco Bellini", region: "Milan", tier: "Silver", joined: "2026-06-02", commission_pct: 20, channel: "Instagram promos", player_ids: ["P-1003", "P-1007", "P-1009", "P-1013", "P-1021", "P-1024"] },
  { id: "boss_kenji", name: "Kenji Mori", region: "Tokyo", tier: "Gold", joined: "2026-03-09", commission_pct: 25, channel: "Discord server", player_ids: ["P-1005", "P-1011", "P-1017", "P-1020", "P-1022"] },
  { id: "boss_elin", name: "Elin Lindqvist", region: "Stockholm", tier: "Silver", joined: "2026-05-21", commission_pct: 20, channel: "Email newsletter", player_ids: ["P-1008", "P-1014", "P-1018", "P-1025"] },
];

export const CATEGORY_LABEL = { slots: "Slots", live: "Live casino", sports: "Sports", none: "Not set" };

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
  const players = allPlayers.filter((p) => boss.player_ids.includes(p.player_id));
  const count = players.length;
  const sum = (fn) => players.reduce((acc, p) => acc + (Number(fn(p)) || 0), 0);
  const deposits = sum((p) => (p.deposit_count || 0) * (p.avg_deposit || 0));
  const playersNet = sum((p) => p.net_amount);
  return {
    ...boss,
    players: count,
    inSession: players.filter((p) => p.in_session).length,
    active: players.filter((p) => p.lifecycle === "active").length,
    newPlayers: players.filter((p) => p.lifecycle === "new").length,
    atRisk: players.filter((p) => p.lifecycle === "at-risk").length,
    blocked: players.filter((p) => p.risk === "block_offers").length,
    avgScore: count ? sum((p) => p.score) / count : 0,
    deposits,
    avgDeposit: count ? sum((p) => p.avg_deposit) / count : 0,
    sessionsPerWeek: count ? sum((p) => p.sessions_per_week) / count : 0,
    houseNet: -playersNet,
    commission: Math.max(0, -playersNet) * (boss.commission_pct / 100),
    categories: categoryMix(players),
    topGames: topGames(players),
    roster: players,
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
