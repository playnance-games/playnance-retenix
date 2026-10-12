import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Radio, Wallet, Clock, Gamepad2, Tag, Globe, ArrowUpRight, Gauge, TrendingDown, TrendingUp, CalendarDays, Send, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import InfoTip from "@/components/InfoTip";
import Stat from "@/components/StatTile";
import FireCasePanel from "@/components/FireCasePanel";
import { fmtMoney, scoreBreakdown, derivePlayerStatus } from "@/lib/retenixLogic";
import { assessPlayerRisk } from "@/lib/playerStatus";
import { platformsForPlayer, playerDeposits, TIER_CLASS } from "@/lib/bosses";

const AVATAR = "https://media.base44.com/images/public/6aba0bdf07f37e4078b1455a/1e345eab9_generated_image.png";
const FEATURES = ["staking", "streaming", "missions", "tournaments", "leaderboard", "g_coin"];

const T = {
  net: "Net vs house. Up = cash disabled, education only. Down = cash eligible (subject to caps). Too_thin = margin too small for cash.",
  score: "Retention score 1.00–10.00. Fixed weights: risk 40%, high roller 40%, engagement 10%, lifetime 10%. Contributions are calibrated to the stored score.",
  totalDep: "Lifetime sum of all deposits, across every platform the player uses.",
  wagered: "Estimated total amount wagered across all sessions.",
  withdrawals: "Lifetime withdrawals.",
  bonus7d: "Total cash gifts allocated to this player during the current rolling 7-day window; not their deposits or spend.",
  window: "Used means a cash gift has already been allocated in this rolling 7-day window; another cash gift is blocked until the window resets. Free means none has been allocated yet.",
  netAmt: "Player's net position vs the house. Negative = the player is down.",
  tenure: "How long the player has been active.",
  lifetimeSess: "Total sessions all-time.",
  lastSeen: "Most recent time the player was seen.",
  lastAction: "The last Retenix action taken: offer, education, or blocked.",
  favStated: "Games the player named as favorites. Drives recommendations; if empty, the 3-choice survey fires.",
  favSeen: "Games inferred from play when no stated favorites exist.",
  features: "Features with recorded usage appear as tags. Unused features can still be targeted by cases.",
  live: "Player is playing right now. Minutes vs their average session, and session deposit vs remaining balance.",
  platforms: "Bosses own the platforms. Share is the part of this player's activity on each boss's platform; deposits and sessions are split by that share.",
};

function Panel({ icon: Icon, title, tip, children, className = "" }) {
  return (
    <section className={`lux-surface rounded-2xl border border-border bg-card/40 p-5 ${className}`}>
      <h2 className="text-sm font-heading font-medium tracking-wide mb-3 flex items-center gap-1.5">
        {Icon && <Icon className="w-4 h-4 text-accent" />}{title}{tip && <InfoTip text={tip} />}
      </h2>
      {children}
    </section>
  );
}

function Row({ label, children, tip }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-border/50 last:border-0">
      <dt className="text-xs text-muted-foreground flex items-center gap-1">{label}{tip && <InfoTip text={tip} />}</dt>
      <dd className="text-sm font-semibold tabular-nums text-right">{children}</dd>
    </div>
  );
}

const tenure = (first) => {
  if (!first) return "—";
  const days = Math.max(1, Math.round((Date.now() - new Date(first).getTime()) / 864e5));
  if (days < 30) return `${days}d`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${(days / 365).toFixed(1)}y`;
};

function PlatformsPanel({ player }) {
  const platforms = platformsForPlayer(player.player_id);
  const deposits = playerDeposits(player);
  return (
    <Panel icon={Globe} title={`Plays on ${platforms.length} ${platforms.length === 1 ? "platform" : "platforms"}`} tip={T.platforms} className="mt-5">
      {platforms.length === 0 ? <p className="text-sm text-muted-foreground">Not linked to any boss's platform.</p> : (
        <div className="divide-y divide-border/60">
          {platforms.map(({ boss, share, primary }) => (
            <div key={boss.id} className="py-3 first:pt-0 last:pb-0 grid gap-3 items-center md:grid-cols-[minmax(0,1.4fr)_minmax(140px,1fr)_110px_110px_auto]">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0"><Crown className="w-5 h-5" /></span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{boss.platform}</span>
                    {primary && <span className="text-[10px] font-semibold uppercase tracking-wide rounded px-2 py-0.5 bg-accent text-accent-foreground">Main</span>}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                    Boss {boss.name}
                    <span className={`text-[10px] font-semibold uppercase tracking-wide rounded px-1.5 py-0.5 ${TIER_CLASS[boss.tier] || "bg-muted"}`}>{boss.tier}</span>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] text-muted-foreground mb-1"><span>Share of play</span><span className="font-semibold text-foreground">{Math.round(share * 100)}%</span></div>
                <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full accent-bar" style={{ width: `${share * 100}%` }} /></div>
              </div>
              <div className="text-xs"><div className="text-muted-foreground">Deposits here</div><div className="font-semibold tabular-nums text-sm">{fmtMoney(deposits * share)}</div></div>
              <div className="text-xs"><div className="text-muted-foreground">Sessions / wk</div><div className="font-semibold tabular-nums text-sm">{((player.sessions_per_week || 0) * share).toFixed(1)}</div></div>
              <Button asChild variant="outline" size="sm" className="justify-self-start md:justify-self-end">
                <Link to={`/bosses/${boss.id}`}>Boss card <ArrowUpRight className="w-3.5 h-3.5" /></Link>
              </Button>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

export default function PlayerCard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [player, setPlayer] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);

  const load = async () => {
    const [p, slist] = await Promise.all([base44.entities.Player.get(id), base44.entities.Settings.list()]);
    if (!p) { setLoading(false); return; }
    const st = slist[0] || {};
    const derived = derivePlayerStatus(p, st);
    const changes = Object.fromEntries(Object.entries(derived).filter(([key, value]) => p[key] !== value));
    const current = Object.keys(changes).length ? await base44.entities.Player.update(id, changes) : p;
    setPlayer(current);
    setSettings(st);
    setEvents(await base44.entities.PlayerEvent.filter({ player_id: p.player_id }, "-timestamp", 50));
    setLoading(false);
  };
  useEffect(() => { load(); }, [id]);

  if (loading) return <div className="p-10 text-muted-foreground">Loading…</div>;
  if (!player) return <div className="p-10 text-muted-foreground">Player not found.</div>;

  const ff = player.feature_flags || {};
  const channels = player.channels || {};
  const breakdown = scoreBreakdown(player, settings);
  const assessment = assessPlayerRisk(player, settings);
  const usedFeatures = FEATURES.filter((f) => ff[f]);
  const netTone = player.net_amount < 0 ? "text-red-600" : player.net_amount > 0 ? "text-emerald-600" : "";

  return (
    <div className="ex-page ex-player-profile flex flex-col">
      <Button variant="outline" size="sm" onClick={() => navigate("/players")} className="mb-4 self-start">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to players list
      </Button>

      {player.in_session && (
        <div className="mb-5 lux-surface rounded-2xl border border-accent/30 bg-accent/5 p-4 flex items-center gap-3">
          <Radio className="w-4 h-4 text-accent animate-pulse shrink-0" />
          <div className="text-sm">
            <span className="text-accent font-medium">Live session</span>
            <span className="text-muted-foreground"> · playing </span>
            <span className="font-medium">{player.current_game}</span>
            <span className="text-muted-foreground"> · {player.session_minutes}m vs avg {player.avg_session_minutes}m</span>
            <span className="text-muted-foreground"> · session deposit {fmtMoney(player.session_deposit)} · balance {fmtMoney(player.remaining_balance)}</span>
            <span className="ml-2"><InfoTip text={T.live} /></span>
          </div>
        </div>
      )}

      <section className="lux-surface rounded-2xl border border-border bg-card p-5">
        <div className="flex items-start gap-4">
          <Image src={AVATAR} alt={`Avatar for ${player.name}`} className="w-16 h-16 rounded-2xl shrink-0 overflow-hidden" />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-heading font-semibold tracking-tight">{player.name}</h1>
            <div className="mt-2 flex items-center gap-3 flex-wrap text-sm text-muted-foreground">
              <span className="font-mono text-xs">{player.player_id}</span>
              <span className="inline-flex items-center gap-1"><Gamepad2 className="w-4 h-4" />{player.favorite_category || "no category"}</span>
              <span className="inline-flex items-center gap-1"><Globe className="w-4 h-4" />{platformsForPlayer(player.player_id).map((m) => m.boss.platform).join(", ") || "no platform"}</span>
              <span className="inline-flex items-center gap-1"><CalendarDays className="w-4 h-4" />Last seen {new Date(player.last_seen).toLocaleDateString()}</span>
            </div>
            {!!assessment.reasons.length && <p className="mt-2 text-xs font-medium">{assessment.reasons.map((r) => r.label).join("; ")}</p>}
            {!!assessment.missing.length && <p className="mt-1 text-[11px] text-muted-foreground">Incomplete risk data<InfoTip text={`Not evaluated: ${assessment.missing.join(", ")}. The level uses the signals that are available.`} /></p>}
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-2">
          <Stat icon={Gauge} label="Score" value={`${Number(player.score).toFixed(2)} / 10`} hint={T.score} />
          <Stat icon={Wallet} label="Total deposits" value={fmtMoney(playerDeposits(player))} hint={T.totalDep} />
          <Stat icon={player.net_amount < 0 ? TrendingDown : TrendingUp} label="Net vs house" value={fmtMoney(player.net_amount)} hint={T.netAmt} tone={netTone} />
          <Stat icon={Clock} label="Sessions / week" value={player.sessions_per_week ?? "—"} />
        </div>
      </section>

      <PlatformsPanel player={player} />

      <div className="grid lg:grid-cols-2 gap-5 mt-5">
        <Panel icon={Clock} title="Lifetime & activity" tip="Tenure and session activity over the player's lifetime.">
          <dl>
            <Row label="First seen (tenure)" tip={T.tenure}>{tenure(player.first_seen)}</Row>
            <Row label="Lifetime sessions" tip={T.lifetimeSess}>{player.lifetime_sessions ?? "—"}</Row>
            <Row label="Sessions / week">{player.sessions_per_week}</Row>
            <Row label="Avg session">{player.avg_session_minutes}m</Row>
            <Row label="Last seen" tip={T.lastSeen}>{new Date(player.last_seen).toLocaleString()}</Row>
            <Row label="Last Retenix action" tip={T.lastAction}>
              {player.last_retenix_action ? (
                <span className={`text-[11px] px-2 py-0.5 rounded-full border ${player.last_retenix_action === "blocked" ? "border-destructive/30 text-destructive" : "border-accent/30 text-accent"}`}>{player.last_retenix_action}</span>
              ) : "—"}
            </Row>
          </dl>
        </Panel>

        <Panel icon={Wallet} title="Money" tip="Lifetime money: deposits, withdrawals, wagered, and the 7-day cash window.">
          <dl>
            <Row label="Deposit count">{player.deposit_count}</Row>
            <Row label="Average deposit">{fmtMoney(player.avg_deposit)}</Row>
            <Row label="Last deposit">{fmtMoney(player.last_deposit)}</Row>
            <Row label="Withdrawals" tip={T.withdrawals}>{fmtMoney(player.withdrawals)}</Row>
            <Row label="Total wagered" tip={T.wagered}>{fmtMoney(player.total_wagered)}</Row>
            <Row label="Bonus used (7d)" tip={T.bonus7d}>{fmtMoney(player.bonus_budget_used_7d)}</Row>
            <Row label="Cash window" tip={T.window}>{player.bonus_budget_used_7d > 0 ? "Used" : "Free"}</Row>
          </dl>
        </Panel>
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mt-5">
        <Panel icon={Gamepad2} title="What they play" tip={T.favStated}>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">Stated favorites</div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {(player.favorites_stated || []).length
              ? player.favorites_stated.map((g) => <span key={g} className="rounded-full border border-accent/30 text-accent px-2.5 py-0.5 text-xs font-medium">{g}</span>)
              : <span className="text-xs text-muted-foreground italic">none — survey eligible</span>}
          </div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">Seen in play<InfoTip text={T.favSeen} /></div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {(player.favorites_seen || []).length
              ? player.favorites_seen.map((g) => <span key={g} className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">{g}</span>)
              : <span className="text-xs text-muted-foreground italic">nothing recorded</span>}
          </div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1"><Tag className="w-3.5 h-3.5" />Features used<InfoTip text={T.features} /></div>
          <div className="flex flex-wrap gap-1.5">
            {usedFeatures.length
              ? usedFeatures.map((f) => <span key={f} className="rounded-full border border-primary/20 bg-primary/10 text-primary px-2.5 py-0.5 text-xs capitalize">{f.replace("_", " ")}</span>)
              : <span className="text-xs text-muted-foreground italic">No feature usage recorded.</span>}
          </div>
        </Panel>

        <Panel icon={Send} title="Channels" tip="Connected delivery channels. Unavailable channels are not connected.">
          <dl>
            {["site", "telegram", "whatsapp", "email"].map((channel) => (
              <Row key={channel} label={<span className="capitalize">{channel}</span>}>
                <span className={channels[channel] ? "text-emerald-600" : "text-muted-foreground font-normal"}>{channels[channel] ? "Connected" : "Unavailable"}</span>
              </Row>
            ))}
          </dl>
        </Panel>
      </div>

      <Panel title="How this score was calculated" tip={T.score} className="mt-5">
        <p className="text-xs text-muted-foreground mb-4">
          <span className="text-foreground font-medium">{Number(player.score).toFixed(2)}</span> / 10.00 = sum of (raw signal / 10 × weight × 10 × calibration factor). These estimated signals are calibrated to the stored score, not independently measured. Net vs house is a separate cash gate.
        </p>
        <div className="space-y-3.5 max-w-3xl">
          {breakdown.map((c) => (
            <div key={c.key}>
              <div className="flex justify-between items-center text-xs mb-1.5 gap-3">
                <span className="min-w-0">
                  <span className="text-foreground font-medium">{c.label}</span>
                  <span className="block text-[10px] text-muted-foreground mt-0.5">Input: {c.input} → {c.raw.toFixed(2)}/10 × {c.weight}%</span>
                </span>
                <span className="font-mono text-foreground font-semibold rounded-lg bg-accent/10 border border-accent/20 px-2 py-1 shrink-0">+{c.contribution.toFixed(2)}</span>
              </div>
              <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                <div className="h-full rounded-full accent-bar" style={{ width: `${(c.raw / 10) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-border/50 flex justify-between text-xs max-w-3xl">
          <span className="text-muted-foreground">Total retention score</span>
          <span className="font-mono font-semibold">{breakdown.reduce((a, c) => a + c.contribution, 0).toFixed(2)} / 10.00</span>
        </div>
      </Panel>

      <Panel title="Timeline" className="mt-5">
        <div className="space-y-3 max-h-[320px] overflow-auto pr-2">
          {events.length === 0 && <p className="text-sm text-muted-foreground">No events yet.</p>}
          {events.map((e) => (
            <div key={e.id} className="flex gap-3">
              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${e.kind === "retenix_action" ? "bg-accent" : "bg-muted-foreground/50"}`} />
              <div className="flex-1">
                <div className="text-sm">{e.description}</div>
                <div className="text-[11px] text-muted-foreground">{new Date(e.timestamp).toLocaleString()}</div>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{e.kind}</span>
            </div>
          ))}
        </div>
      </Panel>

      <div className="mt-5"><FireCasePanel player={player} onFired={load} /></div>
    </div>
  );
}
