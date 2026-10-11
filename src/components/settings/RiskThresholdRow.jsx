import { Input } from '@/components/ui/input';
import InfoTip from '@/components/InfoTip';

export default function RiskThresholdRow({ label, hint, unit, field, rules, onChange, disabled }) {
  return <div className="grid grid-cols-[minmax(0,1fr)_80px_80px] gap-3 items-center py-3 border-t border-border"><div><p className="text-xs font-medium">{label}<InfoTip text={hint}/></p><p className="text-[11px] text-muted-foreground mt-1">{unit} · at or above threshold</p></div>{['watch', 'block'].map(level => <Input key={level} type="number" min={0.01} step="any" aria-label={`${label}: ${level} threshold`} disabled={disabled} value={rules[`${level}_${field}`]} onChange={e => onChange(`${level}_${field}`, e.target.value === '' ? '' : Number(e.target.value))} className="text-right"/>)}</div>;
}