import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Users, Zap, Radio, Layers, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { ScoreBadge, NetChip } from "@/components/tags";
import InfoTip from "@/components/InfoTip";

function SectionTitle({ children, tip }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="w-1 h-4 rounded-full accent-bar" />
      <h2 className="text-sm font-heading font-medium tracking-wide">{children}</h2>
      {tip && <InfoTip text={tip} />}
    </div>
  );
}

function Stat({ icon: Icon, label, value, to, tint, gold, tip }) {
  return (
    <Link to={to} className="block group">
      <div className="lux-surface rounded-2xl border border-border p-5 hover:border-accent/40 transition-all group-hover:-translate-y-0.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">{label}{tip && <InfoTip text={tip} />}</span>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${gold ? "icon-chip-gold" : "icon-chip"}`}>
            <Icon className={`w-4 h-4 ${gold ? "text-gold" : tint || "text-accent"}`} />
          </div>
        </div>
        <div className="mt-3 text-3xl font-heading font-semibold tracking-tight">{value}</div>
      </div>
    </Link>
  );
}

const initials = (name) => name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

export default function Dashboard() {
  const [players, setPlayers] = useState([]);
  const [cases, setCases] = useState([]);
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [p, c, s] = await Promise.all([
        base44.entities.Player.list(),
        base44.entities.UseCase.list(),
        base44.entities.Segment.list(),
      ]);
      setPlayers(p); setCases(c); setSegments(s); setLoading(false);
    })();
  }, []);

  if (loading) return <div className="p-10 text-muted-foreground">Loading…</div>;

  const live = players.filter((x) => x.in_session);
  const bands = [
    { label: "Elite 7.5+", lo: 7.5, hi: 10 },
    { label: "Core 5–7.5", lo: 5, hi: 7.49 },
    { label: "Low 1–5", lo: 1, hi: 4.99 },
  ].map((b) => ({ ...b, count: players.filter((p) => p.score >= b.lo && p.score <= b.hi).length }));

  return (
    <div className="ex-page">
      <header className="mb-8">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-7 rounded-full accent-bar" />
          <h1 className="text-3xl font-heading font-semibold tracking-tight">Dashboard</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-2 ml-4">Retenix floor · live counts and snapshot</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat icon={Users} label="Players" value={players.length} to="/players" tip="Total players tracked by Retenix." />
        <Stat icon={Radio} label="In session now" value={live.length} to="/live" tip="Players currently in a live playing session." />
        <Stat icon={Zap} label="Cases on" value={`${cases.filter((c) => c.status === "on").length}/${cases.length}`} to="/cases" gold tip="Active cases vs total. Cash cases are gated by net, risk, and the 7-day window." />
        <Stat icon={Layers} label="Segments" value={segments.length} to="/segments" tip="Player segments (built-in and custom). Cases fire for every player in a segment." />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        <Stat icon={AlertTriangle} label="At-risk" value={players.filter((p) => p.lifecycle === "at-risk").length} to="/players" tint="text-destructive" tip="Players whose lifecycle stage is at-risk (near churn)." />
        <Stat icon={AlertTriangle} label="Block offers" value={players.filter((p) => p.risk === "block_offers").length} to="/players" tint="text-destructive" tip="Players flagged block_offers — no cash, no paid surveys." />
        <Stat icon={TrendingUp} label="Net up" value={players.filter((p) => p.net_vs_house === "up").length} to="/players" tint="text-accent" tip="Players net up vs house — cash cases disabled, education only." />
        <Stat icon={TrendingDown} label="Net down" value={players.filter((p) => p.net_vs_house === "down").length} to="/players" tint="text-destructive" tip="Players net down vs house — eligible for cash cases (subject to caps)." />
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-8">
        <div className="lux-surface rounded-2xl border border-border bg-card/40 p-6">
          <SectionTitle tip="Players grouped by retention score band.">Score distribution</SectionTitle>
          <div className="space-y-4">
            {bands.map((b) => {
              const pct = players.length ? (b.count / players.length) * 100 : 0;
              return (
                <div key={b.label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">{b.label}</span>
                    <span className="font-mono text-foreground">{b.count}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-muted/60 overflow-hidden border border-border/40">
                    <div className="h-full rounded-full accent-bar" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lux-surface rounded-2xl border border-border bg-card/40 p-6">
          <div className="flex items-center justify-between mb-4">
            <SectionTitle tip="Players currently in a live session.">Live now</SectionTitle>
            <Link to="/live" className="text-xs text-accent hover:underline">View sessions →</Link>
          </div>
          <div className="space-y-2 max-h-72 overflow-auto pr-1">
            {live.length === 0 && <p className="text-sm text-muted-foreground">No one in session.</p>}
            {live.map((p) => (
              <Link key={p.id} to={`/players/${p.id}`} className="flex items-center justify-between p-2 rounded-xl hover:bg-accent/5 transition group">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg icon-chip flex items-center justify-center text-[11px] font-semibold text-accent shrink-0">{initials(p.name)}</div>
                  <div className="min-w-0">
                    <div className="text-sm truncate group-hover:text-accent transition">{p.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{p.current_game} · {p.session_minutes}m</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <ScoreBadge score={p.score} />
                  <NetChip v={p.net_vs_house} amount={p.net_amount} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}