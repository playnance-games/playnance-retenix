import { useEffect, useState } from "react";
import { Crown, MapPin, Radio, Users, Gamepad2, Wallet, TrendingUp, Megaphone } from "lucide-react";
import { loadBossesWithStats, money } from "@/lib/bosses";
import InfoTip from "@/components/InfoTip";

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

function BossCard({ boss }) {
  const initials = boss.name.split(" ").map((p) => p[0]).join("").slice(0, 2);
  return (
    <article className="lux-surface rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
      <header className="flex items-start gap-3">
        <span className="w-11 h-11 rounded-xl bg-accent text-accent-foreground flex items-center justify-center font-semibold shrink-0">{initials}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-semibold text-base">{boss.name}</h2>
            <span className={`text-[10px] font-semibold uppercase tracking-wide rounded px-2 py-0.5 ${TIER_CLASS[boss.tier] || "bg-muted"}`}>{boss.tier}</span>
          </div>
          <div className="mt-1 flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{boss.region}</span>
            <span className="inline-flex items-center gap-1"><Megaphone className="w-3.5 h-3.5" />{boss.channel}</span>
            <span>Since {new Date(boss.joined).toLocaleDateString(undefined, { month: "short", year: "numeric" })}</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat icon={Users} label="Players" value={boss.players} />
        <Stat icon={Radio} label="Live now" value={boss.inSession} />
        <Stat icon={Wallet} label="Deposits" value={money(boss.deposits)} hint="Total deposits from this boss's players (deposit count × average deposit)." />
        <Stat icon={TrendingUp} label="Commission" value={money(boss.commission)} hint={`${boss.commission_pct}% of the house's net win on this boss's players.`} />
      </div>

      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">What their players play</div>
        <div className="flex h-2.5 rounded-full overflow-hidden bg-muted">
          {boss.categories.map((c, i) => (
            <span key={c.key} style={{ width: `${c.pct}%`, opacity: 1 - i * 0.22 }} className="bg-accent" title={`${c.label} ${c.pct}%`} />
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {boss.categories.map((c) => <span key={c.key}><span className="font-semibold">{c.pct}%</span> <span className="text-muted-foreground">{c.label}</span></span>)}
        </div>
      </div>

      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5"><Gamepad2 className="w-3.5 h-3.5 text-accent" />Top games</div>
        {boss.topGames.length ? (
          <div className="flex flex-wrap gap-1.5">
            {boss.topGames.map((g) => <span key={g.name} className="rounded-full border border-accent/30 text-accent px-2.5 py-0.5 text-xs font-medium">{g.name} · {g.count}</span>)}
          </div>
        ) : <span className="text-xs text-muted-foreground italic">No favorites recorded yet</span>}
      </div>

      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-xs border-t border-border pt-3">
        <div><dt className="text-muted-foreground">Avg score</dt><dd className="font-semibold tabular-nums">{boss.avgScore.toFixed(1)} / 10</dd></div>
        <div><dt className="text-muted-foreground">Avg deposit</dt><dd className="font-semibold tabular-nums">{money(boss.avgDeposit)}</dd></div>
        <div><dt className="text-muted-foreground">Sessions / week</dt><dd className="font-semibold tabular-nums">{boss.sessionsPerWeek.toFixed(1)}</dd></div>
        <div><dt className="text-muted-foreground">House net</dt><dd className={`font-semibold tabular-nums ${boss.houseNet >= 0 ? "text-emerald-600" : "text-red-600"}`}>{boss.houseNet >= 0 ? "+" : "−"}{money(Math.abs(boss.houseNet))}</dd></div>
        <div><dt className="text-muted-foreground">Active</dt><dd className="font-semibold tabular-nums">{boss.active}</dd></div>
        <div><dt className="text-muted-foreground">New</dt><dd className="font-semibold tabular-nums">{boss.newPlayers}</dd></div>
        <div><dt className="text-muted-foreground">At-risk</dt><dd className="font-semibold tabular-nums">{boss.atRisk}</dd></div>
        <div><dt className="text-muted-foreground">Blocked offers</dt><dd className="font-semibold tabular-nums">{boss.blocked}</dd></div>
      </dl>
    </article>
  );
}

export default function Bosses() {
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
        <p className="text-sm text-muted-foreground mt-1">Each boss brings players to the site. Stats roll up from the players they own.<InfoTip text="House net is what the house is up on this boss's players. Commission is the boss's share of that net win." /></p>
      </header>
      {loading ? <p className="text-sm text-muted-foreground">Loading bosses…</p> : (
        <div className="grid xl:grid-cols-2 gap-4">
          {bosses.map((b) => <BossCard key={b.id} boss={b} />)}
        </div>
      )}
    </div>
  );
}
