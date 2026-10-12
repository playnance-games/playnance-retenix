import { useId } from 'react';
import { Input } from '@/components/ui/input';
import InfoTip from '@/components/InfoTip';

export default function RuleNumberInput({ label, hint, value, onChange, unit, min = 0, max, step = 1, disabled = false }) {
  const id = useId();
  return <div className="flex items-center justify-between gap-4 py-3"><div className="min-w-0"><label htmlFor={id} className="text-xs font-medium">{label}<InfoTip text={hint || label}/></label>{hint && <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>}</div><div className="flex items-center gap-2 shrink-0"><Input id={id} type="number" min={min} max={max} step={step} disabled={disabled} value={value ?? ''} onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))} className="w-20 text-right"/><span className="text-[11px] text-muted-foreground w-10">{unit}</span></div></div>;
}