import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import CaseCreativeEditor from "@/components/cases/CaseCreativeEditor";
import InfoTip from "@/components/InfoTip";
import { EVENT_TRIGGERS, LIFECYCLES, NET_STATES, RISKS, CATEGORIES, FEATURES } from "@/lib/retenixLogic";
import { TYPES, TYPE_LABELS, CHANNELS, SWEETENERS, CASE_TIPS } from "@/lib/caseConstants";

export default function CaseManualEdit({ editing, setEditing, setField, setCond, segments, settings }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs flex items-center gap-1">Type <InfoTip text={CASE_TIPS.type} /></Label>
          <Select value={editing.type} onValueChange={(v) => setField("type", v)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{TYPE_LABELS[t] || t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs flex items-center gap-1">Channel <InfoTip text={CASE_TIPS.channel} /></Label>
          <Select value={editing.channel} onValueChange={(v) => setField("channel", v)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>{CHANNELS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <CaseCreativeEditor editing={editing} setEditing={setEditing} setField={setField} />

      {editing.trigger_mode === "event" && (
        <div>
          <Label className="text-xs flex items-center gap-1">Event trigger <InfoTip text={CASE_TIPS.trigger} /></Label>
          <Select value={editing.event_trigger} onValueChange={(v) => setField("event_trigger", v)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>{EVENT_TRIGGERS.map((t) => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}

      {editing.trigger_mode === "segment" && (
        <div>
          <Label className="text-xs flex items-center gap-1">Assigned segments <InfoTip text={CASE_TIPS.segments} /></Label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {segments.map((s) => {
              const checked = (editing.segment_ids || []).includes(s.id);
              return (
                <label key={s.id} className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-xs">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(ev) => setField("segment_ids", ev.target.checked ? [...(editing.segment_ids || []), s.id] : (editing.segment_ids || []).filter((x) => x !== s.id))}
                  />
                  {s.name}
                </label>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border/60 p-3">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">Conditions (all must pass) <InfoTip text={CASE_TIPS.conditions} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Min score</Label>
            <Input type="number" step="0.01" value={editing.conditions?.min_score ?? ""} onChange={(e) => setCond("min_score", e.target.value === "" ? null : Number(e.target.value))} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Max score</Label>
            <Input type="number" step="0.01" value={editing.conditions?.max_score ?? ""} onChange={(e) => setCond("max_score", e.target.value === "" ? null : Number(e.target.value))} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Net vs house</Label>
            <Select value={editing.conditions?.net_vs_house || "any"} onValueChange={(v) => setCond("net_vs_house", v === "any" ? "" : v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="any">any</SelectItem>{NET_STATES.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Max risk</Label>
            <Select value={editing.conditions?.max_risk || "any"} onValueChange={(v) => setCond("max_risk", v === "any" ? "" : v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="any">any</SelectItem>{RISKS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Lifecycle</Label>
            <Select value={editing.conditions?.lifecycle || "any"} onValueChange={(v) => setCond("lifecycle", v === "any" ? "" : v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="any">any</SelectItem>{LIFECYCLES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Favorite category</Label>
            <Select value={editing.conditions?.favorite_tag || "any"} onValueChange={(v) => setCond("favorite_tag", v === "any" ? "" : v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="any">any</SelectItem>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Feature never used</Label>
            <Select value={editing.conditions?.feature_never_used || "any"} onValueChange={(v) => setCond("feature_never_used", v === "any" ? "" : v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="any">any</SelectItem>{FEATURES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 text-xs">
              <Switch checked={!!editing.conditions?.cash_window_free} onCheckedChange={(v) => setCond("cash_window_free", v)} />
              7-day cash window free
            </label>
          </div>
        </div>
      </div>

      {editing.type === "cash" && (
        <div className="rounded-lg border border-accent/20 bg-accent/5 p-3">
          <div className="text-[11px] uppercase tracking-wider text-accent mb-3 flex items-center gap-1">Cash formula <InfoTip text={CASE_TIPS.cash} /></div>
          <label className="flex items-center gap-2 text-xs mb-3">
            <Switch checked={!!editing.cash_formula?.fixed_mode} onCheckedChange={(v) => setField("cash_formula", { ...(editing.cash_formula || {}), fixed_mode: v })} />
            Fixed amount — same bonus for every eligible player
            <InfoTip text="Use a flat cash bonus for all eligible players in this case's segment(s), instead of the per-player haircut calculation. Cash gate (net-up / risk) and the 7-day window still apply." />
          </label>
          {editing.cash_formula?.fixed_mode ? (
            <div>
              <Label className="text-xs">Fixed cash amount ($)</Label>
              <Input type="number" min="0" step="1" value={editing.cash_formula?.fixed_amount ?? ""} onChange={(e) => setField("cash_formula", { ...(editing.cash_formula || {}), fixed_amount: e.target.value === "" ? null : Number(e.target.value) })} placeholder="e.g. 10" className="mt-1" />
              <div className="text-xs text-muted-foreground mt-2">Every eligible player gets <span className="text-gold font-mono">${editing.cash_formula?.fixed_amount || 0}</span>.</div>
            </div>
          ) : (
            <>
              <div className="text-xs text-muted-foreground mb-2">min({settings?.haircut_pct ?? 20}% of net_down, 1 × avg_deposit) + lock sweetener</div>
              <Label className="text-xs flex items-center gap-1">Lock sweetener <InfoTip text={CASE_TIPS.sweetener} /></Label>
              <Select value={editing.cash_formula?.lock_sweetener || "none"} onValueChange={(v) => setField("cash_formula", { ...(editing.cash_formula || {}), lock_sweetener: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{SWEETENERS.map((s) => <SelectItem key={s} value={s}>{s === "none" ? "none" : `+${s}`}</SelectItem>)}</SelectContent>
              </Select>
            </>
          )}
        </div>
      )}
    </div>
  );
}