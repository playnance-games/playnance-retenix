import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import LifecycleRulesEditor from '@/components/settings/LifecycleRulesEditor';
import RiskRulesEditor from '@/components/settings/RiskRulesEditor';
import SettingsAiChat from '@/components/settings/SettingsAiChat';
import { LIFECYCLE_DEFAULTS, RISK_DEFAULTS, riskRules, lifecycleRules, validateStatusRules } from '@/lib/statusRules';
import { derivePlayerStatus } from '@/lib/playerStatus';
import { useMode } from "@/lib/ModeContext";
import { Save, Gift, Gauge } from "lucide-react";
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
  ceiling: "Maximum cash per gift, as a multiple of the player's average deposit.",
  window: "Rolling window (days) during which only one cash gift is allowed per player.",
  edCaps: "Limits on education cards: per single session and per rolling week.",
  weights: "How the five signals combine into the retention score. They must add up to 100%. Net vs house is not a score signal — it only decides whether a cash gift can fire.",
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
      <h2 className="text-sm font-heading font-medium tracking-wide flex items-center gap-1.5">{children}</h2>
      {tip && <InfoTip text={tip} />}
    </div>
  );
}

export default function Settings() {
  const { mode } = useMode();
  const playersMode = mode !== "bosses";
  const [s, setS] = useState(null);
  const [id, setId] = useState(null);
  const [saved, setSaved] = useState(false);
  const [players, setPlayers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
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
  const weightError = totalWeight === 100 ? "" : `Score weights add up to ${totalWeight}%. They need to total 100%.`;

  const validation = validateStatusRules(s) || weightError;
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
          <p className="text-sm text-muted-foreground mt-2 ml-4">{playersMode ? "Cash gifts for players, and the score weights that rank them." : "Score weights for the players on your platforms. Cash gifts are a Players-mode setting."}</p>
        </div>
        <Button onClick={save} disabled={saving || !!validation}><Save className="w-4 h-4 mr-1" /> {saving ? "Saving & updating tags…" : saved ? "Saved" : "Save"}</Button>
      </header>

      {(error || validation) && <p role="alert" className="mb-4 text-sm text-destructive">{error || validation}</p>}

      <section className="lux-surface rounded-2xl border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <SectionTitle tip={FT.weights}><Gauge className="w-4 h-4 text-accent" /> Score weights</SectionTitle>
          <span className={`text-sm font-semibold tabular-nums ${totalWeight === 100 ? "text-emerald-600" : "text-destructive"}`}>{totalWeight}% / 100%</span>
        </div>
        <p className="text-sm text-muted-foreground -mt-2 mb-5">These five signals make up every player's retention score. Change a weight and the others have to keep the total at 100%.</p>
        <div className="space-y-4">
          {SCORE_WEIGHT_DEFS.map((d) => {
            const v = s.score_weights?.[d.key] ?? d.value;
            return (
              <div key={d.key} className="grid grid-cols-[minmax(0,1fr)_7.5rem] gap-4 items-center">
                <div>
                  <div className="text-sm mb-1.5">
                    <span className="font-medium flex items-center gap-1">{d.label} <InfoTip text={d.desc} /></span>
                  </div>
                  <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full accent-bar transition-all" style={{ width: `${Math.max(0, Math.min(v, 100))}%` }} />
                  </div>
                </div>
                <label className="flex items-center gap-1.5">
                  <Input type="number" min="0" max="100" value={v} aria-label={`${d.label} weight percent`} onChange={(e) => setNested("score_weights", d.key, Number(e.target.value))} className="text-right font-semibold tabular-nums" />
                  <span className="text-xs text-muted-foreground">%</span>
                </label>
              </div>
            );
          })}
        </div>
      </section>

      {playersMode ? (
        <section className="lux-surface rounded-2xl border border-border bg-card p-5 mt-5">
          <SectionTitle tip={FT.haircut}><Gift className="w-4 h-4 text-accent" /> Cash gift</SectionTitle>
          <p className="text-sm text-muted-foreground -mt-2 mb-4">A cash gift is min(haircut% of how far the player is down, ceiling × their average deposit). One gift per player per window. Bosses don't give cash gifts.</p>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs flex items-center gap-1">Haircut % of net down <InfoTip text={FT.haircut} /></Label>
              <Input type="number" min="0" max="100" value={s.haircut_pct} onChange={(e) => set("haircut_pct", Number(e.target.value))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1">Per-gift ceiling <InfoTip text={FT.ceiling} /></Label>
              <Select value={s.per_gift_ceiling} onValueChange={(v) => set("per_gift_ceiling", v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Pick ceiling" /></SelectTrigger>
                <SelectContent>
                  {["1x", "2x", "3x", "4x", "5x"].map((o) => (
                    <SelectItem key={o} value={o}>{o} average deposit</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1">One gift per <InfoTip text={FT.window} /></Label>
              <div className="relative mt-1">
                <Input type="number" min="1" value={s.cash_window_days} onChange={(e) => set("cash_window_days", Number(e.target.value))} className="pr-12" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">days</span>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <p className="mt-5 text-sm text-muted-foreground rounded-xl border border-dashed border-border px-4 py-3">Cash gifts belong to Players mode. A boss's platform doesn't pay them.</p>
      )}

      <details className="mt-6 group">
        <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">More house rules — education, lifecycle, risk</summary>
        <div className="grid lg:grid-cols-2 gap-5 mt-4">
          <div className="lux-surface rounded-2xl border border-border bg-card/40 p-5">
            <SectionTitle tip={FT.edCaps}>Education caps</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Per session</Label>
                <Input type="number" value={s.education_caps?.per_session ?? 1} onChange={(e) => setNested("education_caps", "per_session", Number(e.target.value))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Per week</Label>
                <Input type="number" value={s.education_caps?.per_week ?? 2} onChange={(e) => setNested("education_caps", "per_week", Number(e.target.value))} className="mt-1" />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {(s.feature_list || []).map((f) => (
                <span key={f} className="px-2 py-0.5 rounded-full text-[11px] border border-accent/25 text-accent">{f}</span>
              ))}
            </div>
          </div>
          <div className="lg:col-span-2 space-y-5">
            <LifecycleRulesEditor rules={lr} onChange={(k, v) => setNested("lifecycle_rules", k, v)} />
            <RiskRulesEditor rules={rr} players={players} onChange={(k, v) => setNested("risk_rules", k, v)} />
          </div>
        </div>
      </details>

      <div className="mt-6"><SettingsAiChat settings={s} onApply={applyPatch} allowCash={playersMode} /></div>
    </div>
  );
}