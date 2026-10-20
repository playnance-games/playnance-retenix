import { Radio, Filter, Type, Send, Shield, GitBranch, Zap, AlertTriangle } from "lucide-react";
import InfoTip from "@/components/InfoTip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TYPE_LABELS } from "@/pages/Cases";

function Step({ n, icon: Icon, label, title, tone = "default", children }) {
  const tones = {
    default: "border-border bg-card/60",
    accent: "border-accent/30 bg-accent/5",
    gold: "border-amber-500/30 bg-amber-500/5",
    danger: "border-destructive/25 bg-destructive/5",
  };
  return (
    <div className={`rounded-xl border p-4 max-w-xl mx-auto w-full ${tones[tone]}`}>
      <div className="flex items-center gap-2">
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-accent text-accent-foreground text-[11px] font-bold">{n}</span>
        <Icon className="w-3.5 h-3.5 text-accent" />
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <div className="text-sm font-semibold mt-2">{title}</div>
      {children && <div className="mt-2 text-[11px] text-muted-foreground space-y-1 leading-relaxed">{children}</div>}
    </div>
  );
}

function Arrow() {
  return <div className="flex justify-center my-1"><div className="w-px h-6 bg-gradient-to-b from-accent/50 to-accent/10" /></div>;
}

const COND_LABELS = {
  min_score: "Min score",
  max_score: "Max score",
  net_vs_house: "Net vs house",
  max_risk: "Max risk",
  lifecycle: "Lifecycle",
  favorite_tag: "Favorite category",
  feature_never_used: "Never used",
  cash_window_free: "7-day window free",
};

export function CaseFlow({ uc, segments = [] }) {
  const isEvent = uc.trigger_mode === "event";
  const assignedSegments = (uc.segment_ids || [])
    .map((id) => segments.find((s) => s.id === id)?.name).filter(Boolean);
  const conds = uc.conditions || {};
  const condChips = [
    conds.min_score != null && { k: "min_score", v: `≥ ${conds.min_score}` },
    conds.max_score != null && { k: "max_score", v: `≤ ${conds.max_score}` },
    conds.net_vs_house && { k: "net_vs_house", v: conds.net_vs_house },
    conds.max_risk && { k: "max_risk", v: conds.max_risk },
    conds.lifecycle && { k: "lifecycle", v: conds.lifecycle },
    conds.favorite_tag && { k: "favorite_tag", v: conds.favorite_tag },
    conds.feature_never_used && { k: "feature_never_used", v: conds.feature_never_used },
    conds.cash_window_free && { k: "cash_window_free", v: "required" },
  ].filter(Boolean);

  const isCash = uc.type === "cash";
  const cf = uc.cash_formula || {};
  const cashDesc = isCash
    ? (cf.fixed_mode && Number(cf.fixed_amount) > 0
        ? `A fixed $${cf.fixed_amount} bonus for every eligible player.`
        : `min(haircut% of net-down, 1× average deposit)${cf.lock_sweetener && cf.lock_sweetener !== "none" ? ` + ${cf.lock_sweetener} lock sweetener` : ""}`)
    : null;

  const gates = [];
  if (isEvent) gates.push({ icon: Radio, title: "Event match", desc: "Fires only when this exact event is logged for the player — never on a schedule." });
  if (!isEvent) gates.push({ icon: Filter, title: "Segment membership", desc: `Player must be in one of: ${assignedSegments.length ? assignedSegments.join(", ") : "no segments assigned"}.` });
  gates.push({ icon: Filter, title: "Conditions", desc: condChips.length ? "Every condition filter below must pass." : "No condition filters — matches anyone in the trigger." });
  if (isCash) {
    gates.push({ icon: AlertTriangle, title: "Cash gate", desc: "Player must be net-down vs the house and not flagged block_offers — no cash goes to net-up or blocked players." });
    gates.push({ icon: AlertTriangle, title: "7-day cash window", desc: "One cash gift per player per rolling 7 days. If a gift was already given this week, this case is blocked." });
  }
  if (uc.type === "survey") gates.push({ icon: AlertTriangle, title: "Risk gate", desc: "block_offers players receive no surveys." });

  return (
    <div className="flex flex-col items-stretch py-1">
      <Step n={1} icon={Radio} label="Trigger" title={isEvent ? `Event · ${uc.event_trigger?.replace(/_/g, " ") || "—"}` : "Segment-based"} tone="accent">
        {isEvent
          ? <div>The case fires the instant this event is logged for a player — a single live or historical moment, not a schedule.</div>
          : <div>The case fires for every player in the assigned segments, evaluated on schedule or login.<div className="mt-1">Segments: {assignedSegments.length ? assignedSegments.join(", ") : "no segments assigned"}</div></div>}
      </Step>
      <Arrow />
      <Step n={2} icon={Filter} label="Conditions" title={condChips.length ? `${condChips.length} filters — all must pass` : "no conditions (matches anyone)"}>
        <div className="flex flex-wrap gap-1.5">
          {condChips.length ? condChips.map((c) => (
            <span key={c.k} className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/60">
              <span className="text-foreground/70">{COND_LABELS[c.k]}:</span> {c.v}
            </span>
          )) : <span className="italic">matches every player in the trigger</span>}
        </div>
      </Step>
      <Arrow />
      <Step n={3} icon={Type} label="Action" title={`${TYPE_LABELS[uc.type] || uc.type} · ${uc.action_template?.replace(/_/g, " ") || "—"}`} tone="gold">
        {cashDesc && <div>{cashDesc}</div>}
        {uc.type === "cashier" && <div>Nudges the player to deposit or to reduce withdrawals.</div>}
        {uc.type === "engagement" && <div>Drives more play sessions.</div>}
        {uc.type === "activation" && <div>A soft nudge or offer to re-engage.</div>}
        {uc.type === "education" && <div>A feature explainer card.</div>}
        {uc.type === "survey" && <div>Three-choice favorite picker.</div>}
      </Step>
      <Arrow />
      <Step n={4} icon={Send} label="Channel" title={uc.channel} >
        <div>Where the creative is delivered to the player.</div>
      </Step>
      <Arrow />
      <Step n={5} icon={Shield} label="Per-player gates" title={`${gates.length} gate${gates.length === 1 ? "" : "s"} checked before firing`} tone="accent">
        <div className="space-y-2">
          {gates.map((g, i) => (
            <div key={i} className="flex items-start gap-2">
              <g.icon className="w-3.5 h-3.5 mt-0.5 text-accent shrink-0" />
              <div>
                <div className="text-foreground/80 text-[11px] font-medium">{g.title}</div>
                <div>{g.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </Step>
      <Arrow />
      <Step n={6} icon={Zap} label="Outcome" title={uc.status === "on" ? "Fires to the player" : "Paused (off)"} tone={uc.status === "on" ? "accent" : "danger"}>
        <div>{uc.status === "on" ? "Every gate passed — the creative is shown and a Retenix action is logged on the player timeline." : "The case is off and will not fire for anyone. Turn it on from the table to activate it."}</div>
        {isCash && <div>Cash cases consume the 7-day window on fire.</div>}
      </Step>
    </div>
  );
}

export default function CaseFlowDialog({ uc, segments, open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[88vh] overflow-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-accent" /> Flow: {uc?.name}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-1">
            How a case fires, step by step. <InfoTip text="A case flows trigger → conditions → action → channel, then Retenix checks per-player gates (segment, conditions, cash gate, 7-day window, risk) before firing. Pass every gate → fire. Fail any gate → the case is blocked for that player (shown under Blocked on the player card)." />
          </DialogDescription>
        </DialogHeader>
        {uc && <CaseFlow uc={uc} segments={segments} />}
      </DialogContent>
    </Dialog>
  );
}