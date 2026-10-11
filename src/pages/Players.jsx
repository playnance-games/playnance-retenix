import { useEffect, useMemo, useState } from "react";
import { loadPlayersWithStatus } from '@/lib/playerData';
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PlayersTable from "@/components/players/PlayersTable";
import InfoTip from "@/components/InfoTip";

const SCORE_BANDS = [
  { v: "any", label: "Any score" },
  { v: "7.5-10", label: "Elite 7.5–10" },
  { v: "5-7.49", label: "Core 5–7.49" },
  { v: "1-4.99", label: "Low 1–4.99" },
];
const NETS = [
  { v: "any", label: "Net: any" },
  { v: "up", label: "Up" },
  { v: "down", label: "Down" },
  { v: "too_thin", label: "Too thin" },
];
const RISKS = [
  { v: "any", label: "Risk: any" },
  { v: "clean", label: "Clean" },
  { v: "watch", label: "Watch" },
  { v: "block_offers", label: "Block offers" },
];
const LIFECYCLES = [
  { v: "any", label: "Lifecycle: any" },
  { v: "new", label: "New" },
  { v: "active", label: "Active" },
  { v: "quiet", label: "Quiet" },
  { v: "at-risk", label: "At-risk" },
];
const FAVCATS = [
  { v: "any", label: "Category: any" },
  { v: "slots", label: "Slots" },
  { v: "live", label: "Live" },
  { v: "sports", label: "Sports" },
  { v: "none", label: "None" },
];
const LASTSEEN = [
  { v: "all", label: "Last seen: any" },
  { v: "24h", label: "Last 24h" },
  { v: "7d", label: "Last 7 days" },
  { v: "30d", label: "Last 30 days" },
];

function Filter({ value, onChange, options }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[150px] h-9 text-xs"><SelectValue /></SelectTrigger>
      <SelectContent>
        {options.map((o) => <SelectItem key={o.v} value={o.v}>{o.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

export default function Players() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [f, setF] = useState({ score: "any", net: "any", risk: "any", lifecycle: "any", favcat: "any", lastseen: "all" });

  useEffect(() => {
    (async () => {
      setPlayers(await loadPlayersWithStatus());
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    let list = [...players];
    if (q) {
      const s = q.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(s) || p.player_id.toLowerCase().includes(s));
    }
    if (f.score && f.score !== "any") {
      const [lo, hi] = f.score.split("-").map(Number);
      list = list.filter((p) => p.score >= lo && p.score <= hi);
    }
    if (f.net && f.net !== "any") list = list.filter((p) => p.net_vs_house === f.net);
    if (f.risk && f.risk !== "any") list = list.filter((p) => p.risk === f.risk);
    if (f.lifecycle && f.lifecycle !== "any") list = list.filter((p) => p.lifecycle === f.lifecycle);
    if (f.favcat && f.favcat !== "any") list = list.filter((p) => p.favorite_category === f.favcat);
    if (f.lastseen !== "all") {
      const now = Date.now();
      const ms = { "24h": 864e5, "7d": 6048e5, "30d": 2592e6 }[f.lastseen];
      list = list.filter((p) => now - new Date(p.last_seen).getTime() <= ms);
    }
    return list.sort((a, b) => b.score - a.score);
  }, [players, q, f]);

  return (
    <div className="ex-page">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-semibold tracking-tight">Players</h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">{filtered.length} of {players.length} players <InfoTip text="Filter by score band, net vs house, risk, lifecycle, favorite category, and last seen. Click a row to open the player card." /></p>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or player ID…"
            className="pl-9 w-64 h-9"
          />
        </div>
        <Filter value={f.score} onChange={(v) => setF({ ...f, score: v })} options={SCORE_BANDS} />
        <Filter value={f.net} onChange={(v) => setF({ ...f, net: v })} options={NETS} />
        <Filter value={f.risk} onChange={(v) => setF({ ...f, risk: v })} options={RISKS} />
        <Filter value={f.lifecycle} onChange={(v) => setF({ ...f, lifecycle: v })} options={LIFECYCLES} />
        <Filter value={f.favcat} onChange={(v) => setF({ ...f, favcat: v })} options={FAVCATS} />
        <Filter value={f.lastseen} onChange={(v) => setF({ ...f, lastseen: v })} options={LASTSEEN} />
      </div>

      <PlayersTable players={filtered} loading={loading} />
    </div>
  );
}