import { useState } from 'react';
import CaseImage from '@/components/CaseImage';

export default function CaseCreativePreview({ uc, compact = false }) {
  const site = uc.channel === 'site';
  const survey = uc.type === 'survey' || (site && uc.action_template === 'survey_3choice');
  const content = site ? uc.content_text : uc.message_text;
  const [choice, setChoice] = useState(null);
  const link = site ? uc.button_link : uc.message_link;
  const safeLink = typeof link === 'string' && (link.startsWith('/') || /^https?:\/\//i.test(link)) ? link : null;
  return <div className={`overflow-hidden rounded-xl border border-border bg-card shadow-sm ${compact ? 'w-full max-w-[240px]' : 'w-full'}`}>
    {uc.image_uri && <CaseImage uri={uc.image_uri} className={`w-full object-cover ${compact ? 'h-20' : 'h-44'}`} />}
    <div className={compact ? 'p-2.5' : 'p-5'}>
      <div className="text-[10px] uppercase tracking-wider text-accent font-semibold">{site ? (survey ? 'Survey' : ['wheel','slot'].includes(uc.action_template) ? 'Mini game' : 'Site popup') : `${uc.channel || 'Message'} message`}</div>
      <div className={`font-semibold text-foreground break-words ${compact ? 'text-xs mt-1' : 'text-lg mt-2'}`}>{uc.name || 'Case headline'}</div>
      <p className={`text-muted-foreground whitespace-pre-wrap break-words ${compact ? 'text-[10px] mt-1 line-clamp-3' : 'text-sm mt-2'}`}>{content || 'Add text to preview the player-facing creative.'}</p>
      {survey && <div className="flex flex-wrap gap-1.5 mt-2">{(uc.survey_options || []).filter(Boolean).map((v, i) => <button type="button" onClick={() => setChoice(i)} key={i} className={`rounded-md border px-2 py-1 text-[10px] ${choice === i ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-foreground'}`}>{v}</button>)}</div>}
      {site && !survey && uc.button_label && (safeLink ? <a href={safeLink} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-[11px] font-medium">{uc.button_label}</a> : <span className="mt-3 inline-flex rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-[11px] font-medium">{uc.button_label}</span>)}
      {!site && uc.message_link && (safeLink ? <a href={safeLink} target="_blank" rel="noopener noreferrer" className="mt-2 block text-xs text-accent truncate underline">{uc.message_link}</a> : <div className="mt-2 text-xs text-accent truncate">{uc.message_link}</div>)}
    </div>
  </div>;
}