import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Crown, ChevronRight } from "lucide-react";
import { loadBossesWithStats, money } from "@/lib/bosses";
import InfoTip from "@/components/InfoTip";
import { ListShell, RowMain, ChipList, ListMessage } from "@/components/executive/ListParts";

export default function Bosses() {
  const navigate = useNavigate();
  const [bosses, setBosses] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    loadBossesWithStats().then((list) => { setBosses(list); setLoading(false); });
  }, []);

  const open = (boss) => navigate(`/bosses/${boss.id}`);

  return (
    <div className="ex-page">
      <header className="mb-6">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-accent" />
          <h1 className="text-2xl font-heading font-semibold tracking-tight">Bosses</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{bosses.length} bosses. Each owns a platform; click a row for the full card.<InfoTip text="A player can play on several bosses' platforms; each boss counts only the player's share of activity on their platform." /></p>
      </header>
      <ListShell
        cols="minmax(240px,1.6fr) 100px 120px 120px minmax(170px,1fr) 28px"
        minWidth={860}
        label="Bosses"
        head={["Boss", "Players", "Deposits", "Commission", "Top games", ""]}
      >
        {loading ? <ListMessage>Loading bosses…</ListMessage> : bosses.map((boss) => (
          <article
            key={boss.id}
            className="ex-row clickable"
            role="link"
            tabIndex={0}
            aria-label={`Open ${boss.name}`}
            onClick={() => open(boss)}
            onKeyDown={(e) => { if (e.key === "Enter") open(boss); }}
          >
            <RowMain
              icon={boss.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
              title={boss.name}
              badges={<span className="ex-badge">{boss.tier}</span>}
              sub={`${boss.platform} · ${boss.region}`}
            />
            <div className="ex-num">{boss.players}<small className="inline-flex items-center gap-1.5">{boss.inSession > 0 && <span className="ex-livedot" />}{boss.inSession} live</small></div>
            <div className="ex-num">{money(boss.deposits)}</div>
            <div className="ex-num">{money(boss.commission)}<small>{boss.commission_pct}% rate</small></div>
            <ChipList items={boss.topGames.map((g) => g.name)} max={2} empty="none yet" />
            <ChevronRight className="w-4 h-4 ex-chevron" />
          </article>
        ))}
      </ListShell>
    </div>
  );
}
