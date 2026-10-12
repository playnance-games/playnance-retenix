import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Crown, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loadBossesWithStats, money, TIER_CLASS } from "@/lib/bosses";
import InfoTip from "@/components/InfoTip";

export default function Bosses() {
  const navigate = useNavigate();
  const [bosses, setBosses] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    loadBossesWithStats().then((list) => { setBosses(list); setLoading(false); });
  }, []);

  return (
    <div className="ex-page">
      <header className="mb-6">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-accent" />
          <h1 className="text-2xl font-heading font-semibold tracking-tight">Bosses</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">Bosses own the platforms players play on. Open a row for the full card.<InfoTip text="A player can play on several bosses' platforms; each boss counts only the player's share of activity on their platform. House net is what the house is up on those players. Commission is the boss's share of that net win." /></p>
      </header>
      <div className="ex-register-scroll">
        <section className="ex-casegrid ex-bossgrid" aria-label="Bosses">
          <div className="ex-gridhead">
            <div>Boss</div><div>Players</div><div>Live</div><div>Deposits</div><div>Commission</div><div>Top games</div><div>Actions</div>
          </div>
          {loading ? <div className="p-6 text-sm text-muted-foreground">Loading bosses…</div> : bosses.map((boss) => (
            <article
              key={boss.id}
              className="ex-caserow"
              role="link"
              tabIndex={0}
              onClick={() => navigate(`/bosses/${boss.id}`)}
              onKeyDown={(e) => { if (e.key === "Enter") navigate(`/bosses/${boss.id}`); }}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="ex-casename">{boss.name}</span>
                  <span className={`text-[10px] font-semibold uppercase tracking-wide rounded px-2 py-0.5 ${TIER_CLASS[boss.tier] || "bg-muted"}`}>{boss.tier}</span>
                </div>
                <div className="ex-subline"><span className="font-medium text-foreground">{boss.platform}</span> · {boss.region} · {boss.channel}</div>
              </div>
              <div className="text-sm font-semibold tabular-nums">{boss.players}</div>
              <div className="text-sm font-semibold tabular-nums">{boss.inSession}</div>
              <div className="text-sm font-semibold tabular-nums">{money(boss.deposits)}</div>
              <div className="text-sm font-semibold tabular-nums">{money(boss.commission)}</div>
              <div className="flex flex-wrap gap-1.5 min-w-0">
                {boss.topGames.length
                  ? boss.topGames.map((g) => <span key={g.name} className="rounded-full border border-accent/30 text-accent px-2 py-0.5 text-[11px] font-medium">{g.name}</span>)
                  : <span className="text-[11px] text-muted-foreground italic">none yet</span>}
              </div>
              <div className="ex-rowtools">
                <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/bosses/${boss.id}`); }} aria-label={`Open ${boss.name}`}>
                  Open card <ArrowUpRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
