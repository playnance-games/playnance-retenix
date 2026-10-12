import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Zap, Users, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import InfoTip from "@/components/InfoTip";
import { evaluateCaseForPlayer, matchSegment, fmtMoney } from "@/lib/retenixLogic";

const TYPE_LABELS = {
  cash: "Cash gift", activation: "Activation nudge", education: "Education card",
  survey: "3-choice survey", channel: "Channel copy", cashier: "Cashier (deposit/withdraw)",
  engagement: "Engagement (play more)", none: "No action",
};

export default function FireSegmentDialog({ segment, players, cases, segments, open, onOpenChange }) {
  const [settings, setSettings] = useState(null);
  const [caseId, setCaseId] = useState("");
  const [result, setResult] = useState(null);
  const [firing, setFiring] = useState(false);

  useEffect(() => {
    base44.entities.Settings.list().then((s) => setSettings(s[0] || null));
  }, []);
  useEffect(() => {
    if (open) {
      setResult(null);
      const assigned = (segment?.case_ids || []).map((id) => cases.find((c) => c.id === id)).filter(Boolean);
      setCaseId(assigned[0]?.id || cases[0]?.id || "");
    }
  }, [open, segment]);

  const matches = segment ? players.filter((p) => matchSegment(p, segment)) : [];
  const selectedCase = cases.find((c) => c.id === caseId);

  const fire = async () => {
    if (!selectedCase) return;
    setFiring(true);
    let fired = 0, skipped = 0, skippedReasons = {};
    for (const p of matches) {
      const ev = evaluateCaseForPlayer(p, selectedCase, settings || {}, segments);
      if (!ev.wouldFire) {
        skipped++;
        skippedReasons[ev.reason] = (skippedReasons[ev.reason] || 0) + 1;
        continue;
      }
      const gift = ev.gift || 0;
      const patch = { last_retenix_action: selectedCase.type === "education" ? "education" : "offer" };
      if (selectedCase.type === "cash") patch.bonus_budget_used_7d = gift;
      await base44.entities.Player.update(p.id, patch);
      await base44.entities.PlayerEvent.create({
        player_id: p.player_id,
        player_name: p.name, case_id: selectedCase.id, case_name: selectedCase.name, gift_amount: gift, source: "segment", segment_id: segment.id,
        kind: "retenix_action",
        description: `Segment fire (${segment.name}): ${selectedCase.name}${gift ? ` — ${fmtMoney(gift)} cash` : ""}`,
        timestamp: new Date().toISOString(),
      });
      fired++;
    }
    setFiring(false);
    setResult({ fired, skipped, total: matches.length, reasons: skippedReasons });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent" /> Fire to segment
          </DialogTitle>
        </DialogHeader>
        {result ? (
          <div className="space-y-3 py-2">
            <div className="rounded-lg border border-accent/25 bg-accent/5 p-4">
              <div className="flex items-center gap-2 text-accent font-medium"><Check className="w-4 h-4" /> Fired for {result.fired} player{result.fired === 1 ? "" : "s"}</div>
              {result.skipped > 0 && <div className="text-xs text-muted-foreground mt-1">{result.skipped} skipped (blocked by gates)</div>}
            </div>
            <div className="text-xs text-muted-foreground">Logged to each player's timeline. Cash cases consumed the 7-day window.</div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Segment</div>
              <div className="text-sm font-medium">{segment?.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <Users className="w-3 h-3" /> {matches.length} players match <InfoTip text="Players currently matching this segment's filters. Blocked players (net up, block_offers, or cash window used) are skipped with a reason." />
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">Case to fire <InfoTip text="Pick which case to fire for every matching player. Gates are still enforced per player." /></div>
              <Select value={caseId} onValueChange={setCaseId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {cases.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} · {TYPE_LABELS[c.type] || c.type}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        <DialogFooter>
          {result ? (
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={fire} disabled={firing || !selectedCase || matches.length === 0}>
                <Zap className="w-4 h-4 mr-1" /> {firing ? "Firing…" : `Fire to ${matches.length} player${matches.length === 1 ? "" : "s"}`}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}