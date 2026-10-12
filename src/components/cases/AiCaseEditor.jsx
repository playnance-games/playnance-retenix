import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export default function AiCaseEditor({ editing, onApply, onManual }) {
  const [message, setMessage] = useState('');
  const [suggestion, setSuggestion] = useState(null);
  const [selected, setSelected] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const propose = async () => {
    if (!message.trim() || busy) return;
    setBusy(true); setError(''); setSuggestion(null); setSelected({});
    try {
      const { data } = await base44.functions.invoke('aiAssistant', {task:'edit_case', case_id:editing.id, message:message.trim()});
      setSuggestion(data.result);
    } catch(e) { setError(e?.response?.data?.error || e.message); }
    finally { setBusy(false); }
  };
  return <div className="space-y-4 rounded-xl border border-accent/30 bg-accent/5 p-5">
    <div><h3 className="text-lg font-semibold flex items-center gap-2"><Sparkles className="w-5 h-5 text-accent"/> Edit with AI</h3><p className="text-xs text-muted-foreground mt-1">Describe what to change. Review the proposal before applying it; nothing is saved until you save the case.</p></div>
    <Textarea value={message} onChange={e=>setMessage(e.target.value)} rows={3} placeholder="e.g. Change the popup copy and button, and target players with a score above 6" />
    <div className="flex flex-wrap gap-2"><Button type="button" onClick={propose} disabled={busy || !message.trim()}>{busy ? <Loader2 className="animate-spin"/> : <Sparkles/>}{busy ? ' Preparing…' : 'Suggest changes'}</Button><Button type="button" variant="outline" onClick={onManual}>Edit manually instead</Button></div>
    {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    {suggestion && <div className="rounded-lg border border-border bg-card p-4 space-y-3"><div className="text-sm font-medium">Proposed changes</div><p className="text-xs text-muted-foreground">{suggestion.summary}</p><p className="text-xs text-muted-foreground">Select only the changes you want to apply.</p><div className="text-xs space-y-2">{Object.entries(suggestion.changes || {}).map(([key,value])=><label key={key} className="flex items-start gap-2 rounded-lg border border-border p-2 cursor-pointer"><input type="checkbox" className="mt-0.5" checked={!!selected[key]} onChange={e=>setSelected(p=>({...p,[key]:e.target.checked}))}/><span className="break-all"><strong>{key.replace(/_/g,' ')}:</strong> {typeof value === 'object' ? JSON.stringify(value) : String(value)}</span></label>)}</div><div className="flex flex-wrap gap-2"><Button type="button" disabled={!Object.values(selected).some(Boolean)} onClick={()=>onApply(Object.fromEntries(Object.entries(suggestion.changes || {}).filter(([key])=>selected[key])))}>Apply selected & review</Button><Button type="button" variant="outline" onClick={()=>setSuggestion(null)}>Discard</Button></div></div>}
  </div>;
}