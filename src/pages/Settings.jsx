import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import SettingsAiChat from '@/components/settings/SettingsAiChat';
import { derivePlayerStatus } from '@/lib/playerStatus';
import { FIXED_SCORE_WEIGHTS, SCORE_WEIGHT_DEFS } from '@/lib/retenixLogic';
import { useMode } from "@/lib/ModeContext";
import { Save, Gift, Gauge } from "lucide-react";
import InfoTip from "@/components/InfoTip";

const DEFAULT = {
  haircut_pct: 20,
  per_gift_ceiling: "1x",
  cash_window_days: 7,
  score_weights: FIXED_SCORE_WEIGHTS,
};

const LOCKED_KEYS = ["score_weights", "lifecycle_rules", "risk_rules", "education_caps", "quiet_hours_default", "lock_sweeteners", "feature_list"];

const FT = {
  haircut: "% of the player's net-down that the cash gift is based on (before the per-gift ceiling).",
  ceiling: "Maximum cash per gift, as a multiple of the player's average deposit.",
  window: "Rolling window (days) during which only one cash gift is allowed per player.",
  weights: "Fixed split of the retention score: Risk 40%, High roller 40%, Engagement 10%, Lifetime 10%.",
};

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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    (async () => {
      const list = await base44.entities.Settings.list();
      const stored = list[0] || {};
      setS({ ...DEFAULT, ...stored, score_weights: FIXED_SCORE_WEIGHTS });
      setId(stored.id || null);
    })();
  }, []);

  if (!s) return <div className="p-10 text-muted-foreground">Loading…</div>;

  const set = (k, v) => { setS({ ...s, [k]: v }); setSaved(false); setError(''); };
  const applyPatch = (patch) => {
    setS((prev) => {
      const merged = { ...prev, score_weights: FIXED_SCORE_WEIGHTS };
      for (const [k, v] of Object.entries(patch)) {
        if (LOCKED_KEYS.includes(k)) continue;
        if (v && typeof v === "object" && !Array.isArray(v)) merged[k] = { ...(merged[k] || {}), ...v };
        else merged[k] = v;
      }
      return merged;
    });
    setSaved(false); setError('');
  };

  const validation = playersMode && (s.haircut_pct < 0 || s.haircut_pct > 100 || s.cash_window_days < 1) ? "Haircut needs to be 0–100, and the cash window at least 1 day." : "";
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
      setSaved(true);
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
          <p className="text-sm text-muted-foreground mt-2 ml-4">{playersMode ? "Cash gifts for players. Score weights are fixed." : "Score weights are fixed. Cash gifts are a Players-mode setting."}</p>
        </div>
        <Button onClick={save} disabled={saving || !!validation}><Save className="w-4 h-4 mr-1" /> {saving ? "Saving & updating tags…" : saved ? "Saved" : "Save"}</Button>
      </header>

      {(error || validation) && <p role="alert" className="mb-4 text-sm text-destructive">{error || validation}</p>}

      <section className="lux-surface rounded-2xl border border-border bg-card p-5">
        <SectionTitle tip={FT.weights}><Gauge className="w-4 h-4 text-accent" /> Score weights</SectionTitle>
        <p className="text-sm text-muted-foreground -mt-2 mb-5">Fixed. These four parts make up every player's score, and they always add up to 100%.</p>
        <div className="space-y-4">
          {SCORE_WEIGHT_DEFS.map((d) => (
            <div key={d.key} className="grid grid-cols-[minmax(0,1fr)_4rem] gap-4 items-center">
              <div>
                <div className="text-sm mb-1.5 font-medium flex items-center gap-1">{d.label} <InfoTip text={d.desc} /></div>
                <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full accent-bar" style={{ width: `${d.value}%` }} />
                </div>
              </div>
              <span className="text-right text-sm font-semibold tabular-nums">{d.value}%</span>
            </div>
          ))}
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

      <div className="mt-6"><SettingsAiChat settings={s} onApply={applyPatch} allowCash={playersMode} /></div>
    </div>
  );
}