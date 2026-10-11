import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import CaseMediaFields from '@/components/cases/CaseMediaFields';
import CaseCreativePreview from '@/components/cases/CaseCreativePreview';

const siteFormats = ['wheel','slot','deposit_prompt','payment_methods','birthday','survey_3choice','education_card'];
export default function CaseCreativeEditor({ editing, setEditing, setField }) {
  const site = editing.channel === 'site';
  const survey = editing.type === 'survey' || (site && editing.action_template === 'survey_3choice');
  return <section className="space-y-5 border-t border-border pt-5">
    <div><h3 className="text-lg font-semibold">Player-facing creative</h3><p className="text-xs text-muted-foreground">Configure what the player sees for this channel. The preview updates as you edit.</p></div>
    {site && <div><Label>Site format</Label><Select value={siteFormats.includes(editing.action_template) ? editing.action_template : 'deposit_prompt'} onValueChange={v=>setField('action_template',v)}><SelectTrigger className="mt-1"><SelectValue/></SelectTrigger><SelectContent>{siteFormats.map(v=><SelectItem key={v} value={v}>{['wheel','slot'].includes(v) ? `Mini game · ${v}` : v === 'survey_3choice' ? 'Survey popup' : `Popup · ${v.replace(/_/g,' ')}`}</SelectItem>)}</SelectContent></Select></div>}
    <CaseMediaFields editing={editing} setEditing={setEditing} setField={setField}/>
    <div><Label>{site ? 'Popup / game text' : `${editing.channel} message text`}</Label><Textarea rows={4} className="mt-1" placeholder={site ? 'Write the text shown inside the popup…' : 'Write the message sent to the player…'} value={(site ? editing.content_text : editing.message_text) || ''} onChange={e=>setField(site?'content_text':'message_text',e.target.value)}/></div>
    {survey && <div><Label>Survey choices</Label><div className="grid sm:grid-cols-3 gap-2 mt-2">{[0,1,2].map(i=><Input key={i} placeholder={`Choice ${i+1}`} value={editing.survey_options?.[i] || ''} onChange={e=>setField('survey_options',Array.from({length:3},(_,j)=>i===j ? e.target.value : editing.survey_options?.[j] || ''))}/>)}</div></div>}
    {site && !survey && <div className="grid sm:grid-cols-2 gap-3"><div><Label>Button label</Label><Input className="mt-1" placeholder="Claim now" value={editing.button_label || ''} onChange={e=>setField('button_label',e.target.value)}/></div><div><Label>Button link</Label><Input className="mt-1" placeholder="https://…" value={editing.button_link || ''} onChange={e=>setField('button_link',e.target.value)}/></div></div>}
    {!site && <div><Label>Message link</Label><Input className="mt-1" placeholder="https://…" value={editing.message_link || ''} onChange={e=>setField('message_link',e.target.value)}/></div>}
    <div><Label className="mb-2 block">Live preview</Label><CaseCreativePreview uc={editing}/></div>
  </section>;
}