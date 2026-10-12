import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Crown, MapPin, Megaphone, Radio, Users, Gamepad2, Wallet, TrendingUp, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LifecycleChip, RiskChip } from "@/components/tags";
import InfoTip from "@/components/InfoTip";
import { loadBossWithStats, money } from "@/lib/bosses";

const TIER_CLASS = {
  Platinum: "bg-slate-900 text-white",
  Gold: "bg-amber-100 text-amber-800",
  Silver: "bg-slate-100 text-slate-700",
};

function Stat({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="w-3.5 h-3.5 text-accent" />{label}{hint && <InfoTip text={hint} />}
      </div>
      <div className="mt-1 text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}

export default function BossCard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [boss, setBoss] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    loadBossWithStats(id).then((next) => {
      if (!active) return;
      setBoss(next);
      setLoading(false);
    });
    return () => { active = false; };
  }, [id]);

  if (loading) return <div className="p-10 text-muted-foreground">Loading…</div>;
  if (!boss) return <div className="p-10 text-muted-foreground">Boss not found.</div>;

  const initials = boss.name.split(" ").map((p) => p[0]).join("").slice(0, 2);

  return (
    <div className="ex-page flex flex-col">
      <Button variant="outline" size="sm" onClick={() => navigate("/bosses")} className="mb-4 self-start">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to bosses list
      </Button>

      <section className="lux-surface rounded-2xl border border-border bg-card p-5">
        <div className="flex items-start gap-4">
          <span className="w-16 h-16 rounded-2xl bg-accent text-accent-foreground flex items-center justify-center text-xl font-semibold shrink-0">{initials}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-heading font-semibold tracking-tight">{boss.name}</h1>
              <span className={`text-[10px] font-semibold uppercase tracking-wide rounded px-2 py-0.5 ${TIER_CLASS[boss.tier] || "bg-muted"}`}>{boss.tier}</span>
            </div>
            <div className="mt-2 flex items-center gap-3 flex-wrap text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1"><MapPin className="w-4 h-4" />{boss.region}</span>
              <span className="inline-flex items-center gap-1"><Megaphone className="w-4 h-4" />{boss.channel}</span>
              <span className="inline-flex items-center gap-1"><Crown className="w-4 h-4" />{boss.commission_pct}% commission</span>
              <span>Since {new Date(boss.joined).toLocaleDateString(undefined, { month: "short", year: "numeric" })}</span>
            </div>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-2">
          <Stat icon={Users} label="Players" value={boss.players} />
          <Stat icon={Radio} label="Live now" value={boss.inSession} />
          <Stat icon={Wallet} label="Deposits" value={money(boss.deposits)} hint="Total deposits from this boss's players (deposit count × average deposit)." />
          <Stat icon={TrendingUp} label="Commission" value={money(boss.commission)} hint={`${boss.commission_pct}% of the house's net win on this boss's players.`} />
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-5 mt-5">
        <section className="lux-surface rounded-2xl border border-border bg-card/40 p-5">
          <h2 className="text-sm font-heading font-medium tracking-wide mb-3">What their players play</h2>
          <div className="flex h-2.5 rounded-full overflow-hidden bg-muted">
            {boss.categories.map((c, i) => (
              <span key={c.key} style={{ width: `${c.pct}%`, opacity: 1 - i * 0.22 }} className="bg-accent" title={`${c.label} ${c.pct}%`} />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {boss.categories.map((c) => <span key={c.key}><span className="font-semibold">{c.pct}%</span> <span className="text-muted-foreground">{c.label} · {c.count}</span></span>)}
          </div>
          <h2 className="text-sm font-heading font-medium tracking-wide mt-6 mb-3 flex items-center gap-1.5"><Gamepad2 className="w-4 h-4 text-accent" />Top games</h2>
          {boss.topGames.length ? (
            <div className="flex flex-wrap gap-1.5">
              {boss.topGames.map((g) => <span key={g.name} className="rounded-full border border-accent/30 text-accent px-2.5 py-0.5 text-xs font-medium">{g.name} · {g.count} players</span>)}
            </div>
          ) : <span className="text-xs text-muted-foreground italic">No favorites recorded yet</span>}
        </section>

        <section className="lux-surface rounded-2xl border border-border bg-card/40 p-5">
          <h2 className="text-sm font-heading font-medium tracking-wide mb-1">Performance</h2>
          <dl className="grid grid-cols-2 gap-x-4">
            {[
              ["Avg score", `${boss.avgScore.toFixed(1)} / 10`],
              ["Avg deposit", money(boss.avgDeposit)],
              ["Sessions / week", boss.sessionsPerWeek.toFixed(1)],
              ["House net", `${boss.houseNet >= 0 ? "+" : "−"}${money(Math.abs(boss.houseNet))}`],
              ["Active", boss.active],
              ["New", boss.newPlayers],
              ["At-risk", boss.atRisk],
              ["Blocked offers", boss.blocked],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between py-2.5 border-b border-border/50">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className={`text-sm font-semibold tabular-nums ${label === "House net" ? (boss.houseNet >= 0 ? "text-emerald-600" : "text-red-600") : ""}`}>{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <section className="lux-surface rounded-2xl border border-border bg-card/40 p-5 mt-5">
        <h2 className="text-sm font-heading font-medium tracking-wide mb-3">Players this boss owns</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="py-2 pr-4 font-semibold">Player</th>
                <th className="py-2 pr-4 font-semibold">Score</th>
                <th className="py-2 pr-4 font-semibold">Lifecycle</th>
                <th className="py-2 pr-4 font-semibold">Risk</th>
                <th className="py-2 pr-4 font-semibold">Plays</th>
                <th className="py-2 font-semibold text-right">Card</th>
              </tr>
            </thead>
            <tbody>
              {boss.roster.map((player) => (
                <tr key={player.id} className="border-b border-border/60 last:border-0">
                  <td className="py-2.5 pr-4">
                    <div className="font-medium">{player.name}</div>
                    <div className="text-[11px] text-muted-foreground font-mono">{player.player_id}{player.in_session ? " · live" : ""}</div>
                  </td>
                  <td className="py-2.5 pr-4 tabular-nums font-semibold">{Number(player.score).toFixed(2)}</td>
                  <td className="py-2.5 pr-4"><LifecycleChip v={player.lifecycle} /></td>
                  <td className="py-2.5 pr-4"><RiskChip v={player.risk} /></td>
                  <td className="py-2.5 pr-4 text-xs text-muted-foreground">{player.current_game || player.favorites_stated?.[0] || "—"}</td>
                  <td className="py-2.5 text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/players/${player.id}`}>Player card <ArrowUpRight className="w-3.5 h-3.5" /></Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
