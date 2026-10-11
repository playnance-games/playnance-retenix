import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import LifecycleRulesEditor from '@/components/settings/LifecycleRulesEditor';
import RiskRulesEditor from '@/components/settings/RiskRulesEditor';
import StatusRulePreview from '@/components/settings/StatusRulePreview';
import SettingsAiChat from '@/components/settings/SettingsAiChat';
import { LIFECYCLE_DEFAULTS, RISK_DEFAULTS, riskRules, lifecycleRules, validateStatusRules } from '@/lib/statusRules';
import { derivePlayerStatus } from '@/lib/playerStatus';
import { Save, ChevronDown } from "lucide-react";
import InfoTip from "@/components/InfoTip";

const DEFAULT = {
  haircut_pct: 20,
  per_gift_ceiling: "1x",
  cash_window_days: 7,
  lock_sweeteners: { day: 10, week: 20, month: 30 },
  education_caps: { per_session: 1, per_week: 2 },
  quiet_hours_default: { start: "02:00", end: "07:00" },
  feature_list: ["staking", "daily mission", "tournaments", "streaming", "sports book how-it-works", "leaderboard", "G Coin"],
  score_weights: { sessions: 25, deposits: 25, wagering: 20, engagement: 15, age: 15 },
  lifecycle_rules: LIFECYCLE_DEFAULTS,
  risk_rules: RISK_DEFAULTS,
};

const FT = {
  haircut: "% of the player's net-down that the cash gift is based on (before the per-gift ceiling).",
  ceiling: "Maximum cash per gift — typically 1 × the player's average deposit.",
  window: "Rolling window (days) during which only one cash gift is allowed per player.",
  sweeteners: "Extra bonus % added to a cash gift when the player accepts a staking lock.",
  edCaps: "Limits on education cards: per single session and per rolling week.",
  quiet: "Default quiet window — suppress non-urgent cases during these hours.",
  weights: "House-defined blend of five signals. Read-only at the dashboard level — net vs house is excluded as a separate cash gate.",
  lifecycleDefs: "The thresholds that move a player between lifecycle stages (new, active, quiet, at-risk), evaluated from sessions/week, last-seen, and score.",
  riskDefs: "The thresholds that set a player's risk level (clean, watch, block_offers), evaluated from net vs house, withdrawal-to-deposit ratio, and failed deposits.",
};

const SCORE_WEIGHT_DEFS = [
  { key: "sessions", label: "Sessions & duration", value: 25, desc: "Session count, frequency and time-in-game per week." },
  { key: "deposits", label: "Deposits & withdrawals", value: 25, desc: "Deposit rhythm, average size and withdrawal-to-deposit ratio." },
  { key: "wagering", label: "Wagering levels", value: 20, desc: "Total wagered and average bet size relative to deposits." },
  { key: "engagement", label: "Cases engagement", value: 15, desc: "How the player responds to fired Retenix cases (accept vs ignore)." },
  { key: "age", label: "Age of account", value: 15, desc: "Tenure since first seen — established accounts score higher." },
];

function SectionTitle({ children, tip }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="w-1 h-4 rounded-full accent-bar" />
      <h2 className="text-sm font-heading font-medium tracking-wide">{children}</h2>
      {tip && <InfoTip text={tip} />}
    </div>
  );
}

export default function Settings() {
  const [s, setS] = useState(null);
  const [id, setId] = useState(null);
  const [saved, setSaved] = useState(false);
  const [players, setPlayers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    (async () => {
      const [list, p] = await Promise.all([base44.entities.Settings.list(), base44.entities.Player.list('-created_date', 1000)]);
      const stored = list[0] || {};
      setS({ ...DEFAULT, ...stored, lifecycle_rules: lifecycleRules(stored), risk_rules: riskRules(stored) });
      setId(stored.id || null); setPlayers(p);
    })();
  }, []);

  if (!s) return <div className="p-10 text-muted-foreground">Loading…</div>;

  const lr = s.lifecycle_rules || {};
  const rr = s.risk_rules || {};
  const set = (k, v) => { setS({ ...s, [k]: v }); setSaved(false); setError(''); };
  const setNested = (group, k, v) => { setS({ ...s, [group]: { ...s[group], [k]: v } }); setSaved(false); setError(''); };
  const applyPatch = (patch) => {
    setS((prev) => {
      const merged = { ...prev };
      for (const [k, v] of Object.entries(patch)) {
        if (v && typeof v === "object" && !Array.isArray(v)) merged[k] = { ...(merged[k] || {}), ...v };
        else merged[k] = v;
      }
      return merged;
    });
    setSaved(false); setError('');
  };

  const totalWeight = SCORE_WEIGHT_DEFS.reduce((a, d) => a + (s.score_weights?.[d.key] ?? d.value), 0);

  const validation = validateStatusRules(s);
  const save = async () => {
    if (validation) { setError(validation); return; }
    setSaving(true); setError('');
    try {
      const next = id ? await base44.entities.Settings.update(id, s) : await base44.entities.Settings.create(s);
      setS(next); setId(next.id);
      const current = await base44.entities.Player.list('-created_date', 1000);
      const updated = current.map(p => ({ ...p, ...derivePlayerStatus(p, next) }));
      const patches = updated.filter((p, i) => ['risk','lifecycle','net_vs_house'].some(key => p[key] !== current[i][key])).map(p => ({id:p.id,risk:p.risk,lifecycle:p.lifecycle,net_vs_house:p.net_vs_house}));
      for (let i=0;i<patches.length;i+=500) await base44.entities.Player.bulkUpdate(patches.slice(i,i+500));
      setPlayers(updated); setSaved(true);
    } catch (e) { setError(e.message || 'Could not finish saving settings and refreshing player tags. Please retry.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="ex-page">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-7 rounded-full accent-bar" />
            <h1 className="text-3xl font-heading font-semibold tracking-tight">Settings</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-2 ml-4">House defaults for Retenix.</p>
        </div>
        <Button onClick={save} disabled={saving || !!validation}><Save className="w-4 h-4 mr-1" /> {saving ? "Saving & updating tags…" : saved ? "Saved" : "Save"}</Button>
      </header>

      {(error || validation) && <p role="alert" className="mb-4 text-sm text-destructive">{error || validation}</p>}
      <SettingsAiChat settings={s} onApply={applyPatch} />
      <div className="flex items-center mt-4">
        <button onClick={() => setShowSettings((v) => !v)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition">
          <ChevronDown className={`w-4 h-4 transition-transform ${showSettings ? "rotate-180" : ""}`} /> {showSettings ? "Hide current values" : "Show current values"}
        </button>
      </div>
      {showSettings && (
      <fieldset disabled className="grid md:grid-cols-2 gap-5 mt-4">
        <div className="lux-surface rounded-2xl border border-border bg-card/40 p-5">
          <SectionTitle tip={FT.haircut}>Cash</SectionTitle>
          <div className="space-y-3">
            <div>
              <Label className="text-xs flex items-center gap-1">Haircut % (of net down) <InfoTip text={FT.haircut} /></Label>
              <Input type="number" value={s.haircut_pct} onChange={(e) => set("haircut_pct", Number(e.target.value))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1">Per-gift ceiling <InfoTip text={FT.ceiling} /></Label>
              <Select value={s.per_gift_ceiling} onValueChange={(v) => set("per_gift_ceiling", v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Pick ceiling" /></SelectTrigger>
                <SelectContent>
                  {["1x", "2x", "3x", "4x", "5x"].map((o) => (
                    <SelectItem key={o} value={o}>{o} avg deposit</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1">Cash window (days) <InfoTip text={FT.window} /></Label>
              <Input type="number" value={s.cash_window_days} onChange={(e) => set("cash_window_days", Number(e.target.value))} className="mt-1" />
            </div>
          </div>
        </div>

        <div className="lux-surface rounded-2xl border border-border bg-card/40 p-5">
          <SectionTitle tip={FT.sweeteners}>Lock sweeteners (%)</SectionTitle>
          <div className="grid grid-cols-3 gap-3">
            {["day", "week", "month"].map((k) => (
              <div key={k}>
                <Label className="text-xs capitalize flex items-center gap-1">{k} <InfoTip text={FT.sweeteners} /></Label>
                <Input type="number" value={s.lock_sweeteners?.[k] ?? 0} onChange={(e) => setNested("lock_sweeteners", k, Number(e.target.value))} className="mt-1" />
              </div>
            ))}
          </div>
          <div className="mt-5">
            <SectionTitle tip={FT.edCaps}>Education caps</SectionTitle>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs flex items-center gap-1">Per session <InfoTip text={FT.edCaps} /></Label>
              <Input type="number" value={s.education_caps?.per_session ?? 1} onChange={(e) => setNested("education_caps", "per_session", Number(e.target.value))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1">Per week <InfoTip text={FT.edCaps} /></Label>
              <Input type="number" value={s.education_caps?.per_week ?? 2} onChange={(e) => setNested("education_caps", "per_week", Number(e.target.value))} className="mt-1" />
            </div>
          </div>
        </div>

        <div className="lux-surface rounded-2xl border border-border bg-card/40 p-5">
          <SectionTitle tip={FT.quiet}>Quiet hours default</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs flex items-center gap-1">Start <InfoTip text={FT.quiet} /></Label>
              <Input type="time" value={s.quiet_hours_default?.start ?? ""} onChange={(e) => setNested("quiet_hours_default", "start", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1">End <InfoTip text={FT.quiet} /></Label>
              <Input type="time" value={s.quiet_hours_default?.end ?? ""} onChange={(e) => setNested("quiet_hours_default", "end", e.target.value)} className="mt-1" />
            </div>
          </div>
          <div className="mt-5">
            <SectionTitle>Education feature list</SectionTitle>
            <div className="flex flex-wrap gap-1.5">
              {(s.feature_list || []).map((f) => (
                <span key={f} className="px-2 py-0.5 rounded-full text-[11px] border border-accent/25 text-accent">{f}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="lux-surface rounded-2xl border border-border bg-card/40 p-5">
          <SectionTitle tip={FT.weights}>Score weights</SectionTitle>
          <p className="text-xs text-muted-foreground mb-4">House-defined blend of five signals. Read-only — change at the engine level.</p>
          <div className="space-y-4">
            {SCORE_WEIGHT_DEFS.map((d) => {
              const v = s.score_weights?.[d.key] ?? d.value;
              return (
                <div key={d.key}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-foreground font-medium flex items-center gap-1">{d.label} <InfoTip text={d.desc} /></span>
                    <span className="font-mono text-muted-foreground">{v}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                    <div className="h-full rounded-full accent-bar" style={{ width: `${v}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-4 pt-3 border-t border-border/50">
            <span>Total</span>
            <span className="font-mono text-accent">{totalWeight}%</span>
          </div>
        </div>

        <div className="md:col-span-2 space-y-5">
          <LifecycleRulesEditor rules={lr} onChange={(k,v)=>setNested('lifecycle_rules',k,v)}/>
          <RiskRulesEditor rules={rr} players={players} onChange={(k,v)=>setNested('risk_rules',k,v)}/>
          {!validation && <StatusRulePreview players={players} settings={s}/>}
          <p className="text-[11px] text-muted-foreground">Preview and tag refresh cover up to 1,000 current players. Thresholds are starting review defaults, not a diagnosis or an abuse determination.</p>
        </div>
      </fieldset>
      )}
    </div>
  );
}