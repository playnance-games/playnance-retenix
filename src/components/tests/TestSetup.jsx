import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GATES } from '@/lib/abSimulation';
import TestSelectField from '@/components/tests/TestSelectField';
import TestSequenceControl from '@/components/tests/TestSequenceControl';
import TestAssumptions from '@/components/tests/TestAssumptions';
import InfoTip from '@/components/InfoTip';

export default function TestSetup({ form, setForm, cases, segments, matched, audience, draftId, busy, error, onSave, onReset }) {
  const gate = GATES.find(g=>g.id===form.gate_step)||GATES[0], action=cases.find(c=>c.id===form.reward_case_id);
  const change = (key,value)=>setForm(p=>({...p,[key]:value}));
  return <>
    <div className="flex items-center justify-between gap-4 mb-3">
      <h2 className="font-semibold">{draftId?'Edit draft':'Review the plan'}</h2>
      <Button variant="ghost" size="sm" onClick={onReset} disabled={busy}>New setup</Button>
    </div>
    <fieldset disabled className="lux-surface rounded-xl border border-border p-5 space-y-5" id="test-setup">
      <div><label htmlFor="test-name" className="text-xs">Test name</label><Input id="test-name" value={form.name} maxLength={160} onChange={e=>change('name',e.target.value)} className="mt-2 bg-muted/40" placeholder="Set via the AI chat above"/></div>
      <div className="grid sm:grid-cols-2 gap-4"><TestSelectField label="Audience segment" tip="Only matching players currently eligible for the selected case count toward the simulation." value={form.segment_id} onChange={v=>change('segment_id',v)} options={segments.map(s=>({value:s.id,label:s.name}))}/><TestSelectField label="Case / action" value={form.reward_case_id} onChange={v=>change('reward_case_id',v)} options={cases.map(c=>({value:c.id,label:`${c.name}${c.status!=='on'?' (off)':''}`}))}/></div>
      <div className="rounded-lg bg-muted p-3 text-xs"><strong>{audience}</strong> eligible / {matched} matching players · {matched-audience} excluded by current case rules{action?.status==='off'?' — selected case is off':''}.</div>
      <div className="grid sm:grid-cols-2 gap-4"><TestSelectField label="Extra step" value={form.gate_step} onChange={v=>setForm(p=>({...p,gate_step:v,completion_pct:GATES.find(g=>g.id===v).complete}))} options={GATES.map(g=>({value:g.id,label:g.label}))}/><div><label htmlFor="test-split" className="text-xs">Group A share<InfoTip text="Split the eligible audience, 10–90%. Each group must contain at least one player."/></label><div className="flex gap-2 items-center mt-2"><Input id="test-split" type="number" min={10} max={90} step={10} value={form.split} onChange={e=>change('split',e.target.value===''?'':Number(e.target.value))}/><span className="text-xs">%</span></div><p className="text-[11px] text-muted-foreground mt-1">A: {Math.floor(audience*form.split/100)} · B: {audience-Math.floor(audience*form.split/100)}</p></div></div>
      <TestSequenceControl form={form} setForm={setForm} gate={gate} action={action?.name}/><TestAssumptions form={form} setForm={setForm}/>
      {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
    </fieldset>
    <div className="flex flex-wrap gap-3 mt-4"><Button variant="outline" disabled={busy} onClick={()=>onSave('draft')}>{busy?'Saving…':'Save draft'}</Button><Button disabled={busy} onClick={()=>onSave('completed')}>{busy?'Saving…':'Run simulation'}</Button></div>
  </>;
}