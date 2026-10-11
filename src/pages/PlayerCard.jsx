import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Radio, Wallet, Clock, Gamepad2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import PlayerIdentity from "@/components/players/PlayerIdentity";
import InfoTip from "@/components/InfoTip";
import FireCasePanel from "@/components/FireCasePanel";
import { fmtMoney, scoreBreakdown, derivePlayerStatus } from "@/lib/retenixLogic";

const T = {
  lifecycle: "Lifecycle stage: new (just joined), active (regular), quiet (activity dropped), at-risk (near churn).",
  net: "Net vs house. Up = cash disabled, education only. Down = cash eligible (subject to caps). Too_thin = margin too small for cash.",
  risk: "Clean = no enabled, available risk signal crossed a threshold. Watch = review needed; no automatic reduction in gifts or frequency. Block offers = existing cash and survey restrictions. Missing inputs remain unevaluated.",
  score: "Retention score 1.00–10.00. Breakdown: sessions 25%, deposits 25%, wagering 20%, engagement proxy 15%, account age 15%. Contributions are calibrated to the stored score; net vs house is a separate cash gate.",
  totalDep: "Lifetime sum of all deposits.",
  wagered: "Estimated total amount wagered across all sessions.",
  withdrawals: "Lifetime withdrawals.",
  bonus7d: "Total cash gifts allocated to this player during the current rolling 7-day window; not their deposits or spend.",
  window: "Used means a cash gift has already been allocated in this rolling 7-day window; another cash gift is blocked until the window resets. Free means none has been allocated yet. This is tracked by bonus used (7d), not by deposits or withdrawals.",
  netAmt: "Player's net position vs the house.",
  tenure: "How long the player has been active on the platform.",
  lifetimeSess: "Total sessions all-time.",
  lastSeen: "Most recent time the player was seen.",
  lastAction: "The last Retenix action taken: offer, education, or blocked.",
  favStated: "Games the player named as favorites. Drives recommendations; if empty, the 3-choice survey fires.",
  favSeen: "Games inferred from play when no stated favorites exist.",
  features: "Features with recorded usage appear as tags. Unused features can still be targeted by cases.",
  live: "Player is playing right now. Minutes vs their average session, and session deposit vs remaining balance.",
};

function SectionTitle({ icon: Icon, children, tip }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="w-1 h-4 rounded-full accent-bar" />
      {Icon && <Icon className="w-4 h-4 text-accent" />}
      <h2 className="text-sm font-heading font-medium tracking-wide">{children}</h2>
      {tip && <InfoTip text={tip} />}
    </div>
  );
}

function Row({ label, children, tip }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/50">
      <span className="text-[12px] text-muted-foreground flex items-center gap-1">
        {label}{tip && <InfoTip text={tip} />}
      </span>
      <span className="text-sm">{children}</span>
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
  const breakdown = scoreBreakdown(player, settings);

  return (
    <div className="ex-page ex-player-profile flex flex-col">
      <Button variant="outline" size="sm" onClick={() => navigate("/players")} className="mb-4">
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

      <div className="grid md:grid-cols-3 gap-5">
        <PlayerIdentity player={player} tips={T} settings={settings} />

        {/* Middle: lifetime & activity (swapped with favorites) */}
        <div className="lux-surface rounded-2xl border border-border bg-card/40 p-5">
          <SectionTitle icon={Clock} tip="Tenure and session activity over the player's lifetime.">Lifetime & activity</SectionTitle>
          <Row label="First seen (tenure)" tip={T.tenure}>{tenure(player.first_seen)}</Row>
          <Row label="Lifetime sessions" tip={T.lifetimeSess}>{player.lifetime_sessions ?? "—"}</Row>
          <Row label="Sessions / week">{player.sessions_per_week}</Row>
          <Row label="Avg session">{player.avg_session_minutes}m</Row>
          <Row label="Last seen" tip={T.lastSeen}>{new Date(player.last_seen).toLocaleString()}</Row>
          <Row label="Last Retenix action" tip={T.lastAction}>
            {player.last_retenix_action ? (
              <span className={`text-[11px] px-2 py-0.5 rounded-full border ${
                player.last_retenix_action === "blocked" ? "border-destructive/30 text-destructive" :
                player.last_retenix_action === "education" ? "border-sky-500/30 text-sky-300" :
                "border-accent/30 text-accent"
              }`}>{player.last_retenix_action}</span>
            ) : <span className="text-[11px] text-muted-foreground">—</span>}
          </Row>
        </div>

        {/* Right: money (expanded) */}
        <div className="lux-surface rounded-2xl border border-border bg-card/40 p-5">
          <SectionTitle icon={Wallet} tip="Lifetime money: deposits, withdrawals, wagered, and the 7-day cash window.">Money</SectionTitle>
          <Row label="Total deposits" tip={T.totalDep}>{fmtMoney(player.total_deposits)}</Row>
          <Row label="Deposit count">{player.deposit_count}</Row>
          <Row label="Average deposit">{fmtMoney(player.avg_deposit)}</Row>
          <Row label="Last deposit">{fmtMoney(player.last_deposit)}</Row>
          <Row label="Withdrawals" tip={T.withdrawals}>{fmtMoney(player.withdrawals)}</Row>
          <Row label="Total wagered" tip={T.wagered}>{fmtMoney(player.total_wagered)}</Row>
          <Row label="Bonus used (7d)" tip={T.bonus7d}>
            <span className="text-foreground font-medium">{fmtMoney(player.bonus_budget_used_7d)}</span>
          </Row>
          <Row label="Cash window" tip={T.window}>
            <span className="text-foreground font-medium">{player.bonus_budget_used_7d > 0 ? "Used" : "Free"}</span>
          </Row>
          <Row label="Net vs house $" tip={T.netAmt}>
            <span className={player.net_vs_house === "up" ? "text-accent" : player.net_vs_house === "down" ? "text-destructive" : "text-muted-foreground"}>
              {fmtMoney(player.net_amount)}
            </span>
          </Row>
        </div>
      </div>

      <div className="lux-surface rounded-2xl border border-border bg-card/40 p-5 mt-5 order-last">
        <SectionTitle tip={T.score}>How this score was calculated</SectionTitle>
        <p className="text-xs text-muted-foreground mb-4">
          <span className="text-foreground font-medium">{Number(player.score).toFixed(2)}</span> / 10.00 = sum of (raw signal / 10 × weight × 10 × calibration factor). These estimated signals are calibrated to the stored score, not independently measured as a live score. Engagement is an illustrative proxy, not measured case responses. Net vs house is a separate cash gate.
        </p>
        <div className="space-y-3.5 max-w-2xl">
          {breakdown.map((c) => (
            <div key={c.key}>
              <div className="flex justify-between items-center text-xs mb-1.5 gap-3">
                <span className="text-muted-foreground min-w-0">
                  <span className="text-foreground font-medium">{c.label}</span>
                  <span className="block text-[10px] opacity-75 mt-0.5">Input: {c.input} → {c.raw.toFixed(4)}/10 × {c.weight}% × {c.scale.toFixed(4)} calibration = +{c.contribution.toFixed(2)}</span>
                </span>
                <span className="flex items-center gap-1.5 shrink-0">
                  <span className="font-mono text-[11px] text-muted-foreground">raw</span>
                  <span className="font-mono text-foreground font-semibold rounded-lg bg-muted/60 border border-border px-2 py-1">{c.raw.toFixed(2)} / 10</span>
                  <span className="font-mono text-[11px] text-muted-foreground">weight</span>
                  <span className="font-mono text-foreground font-semibold rounded-lg bg-muted/60 border border-border px-2 py-1">{c.weight}%</span>
                  <span className="font-mono text-[11px] text-muted-foreground">→</span>
                  <span className="font-mono text-foreground font-semibold rounded-lg bg-accent/10 border border-accent/20 px-2 py-1">+{c.contribution.toFixed(2)}</span>
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                <div className="h-full rounded-full accent-bar" style={{ width: `${(c.raw / 10) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-border/50 flex justify-between text-xs max-w-2xl">
          <span className="text-muted-foreground">Total retention score</span>
          <span className="font-mono font-semibold">{breakdown.reduce((a, c) => a + c.contribution, 0).toFixed(2)} / 10.00</span>
        </div>
      </div>

      {/* Second row: favorites + features (swapped with lifetime) + timeline */}
      <div className="grid md:grid-cols-3 gap-5 mt-5">
        <div className="lux-surface rounded-2xl border border-border bg-card/40 p-5">
          <SectionTitle icon={Gamepad2} tip={T.favStated}>Favorites</SectionTitle>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">Stated <InfoTip text={T.favStated} /></div>
          <div className="flex flex-wrap gap-1.5 mt-1 mb-3">
            {(player.favorites_stated || []).length ? (player.favorites_stated || []).map((g) => (
              <span key={g} className="inline-flex items-center rounded-md bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent border border-accent/25">{g}</span>
            )) : <span className="text-[11px] text-muted-foreground italic">none — survey eligible</span>}
          </div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">Seen <InfoTip text={T.favSeen} /></div>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {(player.favorites_seen || []).map((g) => (
              <span key={g} className="inline-flex items-center rounded-md bg-muted px-3 py-1.5 text-xs text-muted-foreground border border-border">{g}</span>
            ))}
          </div>

          <div className="mt-6">
            <SectionTitle icon={Tag} tip={T.features}>Features used</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {["staking", "streaming", "missions", "tournaments", "leaderboard", "g_coin"].filter(feat => ff[feat]).map(feat => (
                <span key={feat} className="rounded-md border border-primary/20 bg-primary/10 text-primary px-3 py-1.5 text-xs capitalize">{feat.replace("_", " ")}</span>
              ))}
              {!["staking", "streaming", "missions", "tournaments", "leaderboard", "g_coin"].some(feat => ff[feat]) && <span className="text-xs text-muted-foreground">No feature usage recorded.</span>}
            </div>
          </div>
        </div>

        <div className="md:col-span-2 lux-surface rounded-2xl border border-border bg-card/40 p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1 h-4 rounded-full bg-muted-foreground/40" />
            <h2 className="text-sm font-heading font-medium tracking-wide text-muted-foreground">Timeline</h2>
          </div>
          <div className="space-y-3 max-h-[320px] overflow-auto pr-2">
            {events.length === 0 && <p className="text-sm text-muted-foreground">No events yet.</p>}
            {events.map((e) => (
              <div key={e.id} className="flex gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${e.kind === "retenix_action" ? "bg-foreground/70" : "bg-muted-foreground/50"}`} />
                <div className="flex-1">
                  <div className="text-sm">{e.description}</div>
                  <div className="text-[11px] text-muted-foreground">{new Date(e.timestamp).toLocaleString()}</div>
                </div>
                <span className={`text-[10px] uppercase tracking-wider ${e.kind === "retenix_action" ? "text-foreground/70" : "text-muted-foreground"}`}>{e.kind}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="order-last"><FireCasePanel player={player} onFired={load} /></div>
    </div>
  );
}