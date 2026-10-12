import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import InfoTip from '@/components/InfoTip';

export default function TestSelectField({ label, tip, value, onChange, options, placeholder = 'Choose…' }) {
  return <div><Label className="text-xs">{label}<InfoTip text={tip || label}/></Label><Select value={value} onValueChange={onChange}><SelectTrigger className="mt-2" aria-label={label}><SelectValue placeholder={placeholder}/></SelectTrigger><SelectContent>{options.length ? options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>) : <SelectItem value="unavailable" disabled>No options yet</SelectItem>}</SelectContent></Select></div>;
}