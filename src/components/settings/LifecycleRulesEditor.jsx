import { Switch } from '@/components/ui/switch';
import RuleNumberInput from '@/components/settings/RuleNumberInput';

export default function LifecycleRulesEditor({ rules, onChange }) {
  const fields = [['new_max_days','New account window','After inactivity checks, accounts within this age are New.','days'],['active_min_sessions_week','Active: minimum weekly sessions','Both the session count and recent-activity test must pass.','/week'],['active_max_last_seen_days','Active: last seen within','Recent activity window, inclusive.','days'],['at_risk_last_seen_days','At-risk: inactive for more than','Inactivity takes priority over New and Active.','days']];
  return <section className="lux-surface border border-border rounded-xl p-5"><h2 className="text-sm font-semibold">Lifecycle — activity, not financial risk</h2><p className="text-xs text-muted-foreground mt-2 mb-3">Order: At-risk → New → Active → Quiet. Quiet covers the remaining players, so there are no gaps or overlapping day ranges.</p><div className="divide-y divide-border">{fields.map(([key,label,hint,unit]) => <RuleNumberInput key={key} label={label} hint={hint} unit={unit} value={rules[key]} onChange={v=>onChange(key,v)}/>)}</div>
    <label className="flex items-center justify-between gap-4 py-3 border-t border-border"><span className="text-xs">Also flag low-score players who are no longer recently active</span><Switch checked={rules.score_risk_enabled} onCheckedChange={v=>onChange('score_risk_enabled',v)}/></label>
    {rules.score_risk_enabled && <RuleNumberInput label="At-risk: score at or below" hint="Only applies outside the active last-seen window; a low score alone does not make a currently active player at-risk." value={rules.at_risk_max_score} max={10} step={0.5} unit="/10" onChange={v=>onChange('at_risk_max_score',v)}/>}
    <p className="mt-3 text-[11px] text-muted-foreground">A missing last-seen date preserves the existing lifecycle tag rather than guessing.</p>
  </section>;
}