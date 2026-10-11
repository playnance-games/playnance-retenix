import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Zap, Lock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import InfoTip from "@/components/InfoTip";
import { evaluateCaseForPlayer, fmtMoney, BLOCK_REASONS } from "@/lib/retenixLogic";

export default function FireCasePanel({ player, onFired }) {
  const [cases, setCases] = useState([]);
  const [segments, setSegments] = useState([]);
  const [settings, setSettings] = useState(null);
  const [firing, setFiring] = useState(null);

  const load = async () => {
    const [c, s, st] = await Promise.all([
      base44.entities.UseCase.list(),
      base44.entities.Segment.list(),
      base44.entities.Settings.list(),
    ]);
    setCases(c); setSegments(s); setSettings(st[0] || null);
  };
  useEffect(() => { load(); }, [player.id, player.bonus_budget_used_7d, player.last_retenix_action]);

  const evals = cases
    .filter((uc) => uc.status === "on")
    .map((uc) => ({ uc, ...evaluateCaseForPlayer(player, uc, settings || {}, segments) }));
  const eligible = evals.filter((e) => e.wouldFire);
  const blocked = evals.filter(
    (e) => !e.wouldFire && ["net_up", "block_offers", "window", "cap"].includes(e.reason)
  );

  const fire = async (e) => {
    const uc = e.uc;
    setFiring(uc.id);
    try {
      const gift = e.gift || 0;
      const patch = { last_retenix_action: uc.type === "education" ? "education" : "offer" };
      if (uc.type === "cash") patch.bonus_budget_used_7d = gift; // consume the 7-day cash window
      await base44.entities.Player.update(player.id, patch);
      const timestamp = new Date().toISOString();
      const event = await base44.entities.PlayerEvent.create({
        player_id: player.player_id,
        player_name: player.name, case_id: uc.id, case_name: uc.name, gift_amount: gift, source: "player",
        kind: "retenix_action",
        description: `Fired ${uc.name}${gift ? ` — ${fmtMoney(gift)} cash` : ""}`,
        timestamp,
      });
      const creatives = uc.creatives || [];
      let creative_uri = uc.image_uri || "";
      if (creatives.length) creative_uri = uc.shuffle_mode ? creatives[Math.floor(Math.random() * creatives.length)] : creatives[0];
      const log = (uc.fire_log || []).slice(-19);
      log.push({ event_id: event.id, player_id: player.player_id, name: player.name, gift, creative_uri, timestamp });
      await base44.entities.UseCase.update(uc.id, { fire_log: log });
      onFired && onFired();
    } finally {
      setFiring(null);
    }
  };

  return (
    <div className="lux-surface rounded-2xl border border-border bg-card/40 p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-1 h-4 rounded-full accent-bar" />
        <Zap className="w-4 h-4 text-accent" />
        <h2 className="text-sm font-heading font-medium tracking-wide">Retenix actions</h2>
        <InfoTip text="Cases that would fire for this player right now. Firing logs a Retenix action to the timeline; cash cases consume the 7-day window (one offer at a time)." />
      </div>

      {eligible.length === 0 && (
        <p className="text-sm text-muted-foreground">No case would fire right now. <InfoTip text="Adjust tags, score, or open the cash window to make cases eligible." /></p>
      )}

      <div className="space-y-2">
        {eligible.map((e) => (
          <div key={e.uc.id} className="flex items-center justify-between gap-3 rounded-xl border border-accent/25 bg-accent/5 px-4 py-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">{e.uc.name}</span>
                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-border text-muted-foreground">{e.uc.type}</span>
                {e.gift > 0 && <span className="text-[11px] text-gold font-mono">{fmtMoney(e.gift)} cash</span>}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{e.uc.action_template} · {e.uc.channel}</div>
            </div>
            <Button size="sm" disabled={firing === e.uc.id} onClick={() => fire(e)}>
              {firing === e.uc.id ? <Lock className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Zap className="w-3.5 h-3.5 mr-1" />}
              Fire
            </Button>
          </div>
        ))}
      </div>

      {blocked.length > 0 && (
        <div className="mt-4 pt-3 border-t border-border/50">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">Blocked <InfoTip text="Cases blocked by product rules for this player." /></div>
          <div className="space-y-1.5">
            {blocked.map((e) => (
              <div key={e.uc.id} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{e.uc.name}</span>
                <span className="text-destructive/80 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  {BLOCK_REASONS[e.reason] || e.reason}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}