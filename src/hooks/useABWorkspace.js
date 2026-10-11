import { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { matchSegment, evaluateCaseForPlayer } from '@/lib/retenixLogic';
import { derivePlayerStatus } from '@/lib/playerStatus';
import { EMPTY_TEST, GATES, simulateTest, testValidation } from '@/lib/abSimulation';

export default function useABWorkspace() {
  const [data,setData]=useState(null),[runs,setRuns]=useState([]),[form,setForm]=useState({...EMPTY_TEST}),[draftId,setDraftId]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
  useEffect(()=>{Promise.all([base44.entities.UseCase.list(),base44.entities.Segment.list(),base44.entities.Player.list(),base44.entities.Settings.list(),base44.entities.ABRun.list('-created_date',1000)]).then(([cases,segments,players,settings,r])=>{const st=settings[0]||{};setData({cases,segments,players:players.map(p=>({...p,...derivePlayerStatus(p,st)})),settings:st});setRuns(r);});},[]);
  const audience=useMemo(()=>{
    if(!data)return {matched:0,eligible:0};
    const segment=data.segments.find(s=>s.id===form.segment_id),reward=data.cases.find(c=>c.id===form.reward_case_id);
    const matches=segment?data.players.filter(p=>matchSegment(p,segment)):[];
    return {matched:matches.length,eligible:reward?matches.filter(p=>evaluateCaseForPlayer(p,reward,data.settings,data.segments).wouldFire).length:0};
  },[data,form.segment_id,form.reward_case_id]);
  const reset=()=>{setForm({...EMPTY_TEST});setDraftId(null);setError('');};
  const save=async status=>{
    const validation=testValidation(form,audience.eligible,status==='completed');
    if(validation){setError(validation);return;}
    setBusy(true);setError('');
    try {
      const reward=data.cases.find(c=>c.id===form.reward_case_id),segment=data.segments.find(s=>s.id===form.segment_id),gate=GATES.find(g=>g.id===form.gate_step);
      if(!reward||!segment||!gate)throw new Error('Choose an existing segment, case and step.');
      const result=status==='completed'?simulateTest(form,audience.eligible):{results:{},winner:''};
      const payload={name:form.name.trim(),segment_id:segment.id,segment_name:segment.name,reward_case_id:reward.id,reward_case_name:reward.name,gate_step:gate.id,gate_label:gate.label,gate_group:form.gate_group,reward_timing:form.reward_timing,split:Number(form.split),audience:audience.eligible,matched_audience:audience.matched,status,mode:'simulation',model_version:2,metric_label:'Expected responses',assumptions:{base_response_pct:Number(form.base_response_pct),completion_pct:Number(form.completion_pct),uplift_pct:Number(form.uplift_pct)},...result};
      const saved=draftId?await base44.entities.ABRun.update(draftId,payload):await base44.entities.ABRun.create(payload);
      setRuns(old=>[saved,...old.filter(r=>r.id!==saved.id)]);setDraftId(status==='draft'?saved.id:null);
      if(status==='completed')setForm(p=>({...p,name:''}));
    }catch(e){setError(e.message||'Could not save this comparison.');}finally{setBusy(false);}
  };
  const load=(r,copy)=>{setForm({...EMPTY_TEST,name:copy?`${r.name} (copy)`:r.name,segment_id:r.segment_id||'',reward_case_id:r.reward_case_id||'',gate_step:r.gate_step||'none',gate_group:r.gate_group||'b',reward_timing:r.reward_timing||'after',split:r.split||50,...r.assumptions});setDraftId(copy?null:r.id);setError('');document.getElementById('test-setup')?.scrollIntoView({behavior:'smooth',block:'start'});};
  const manage=async(r,action)=>{
    if(action==='delete'&&!window.confirm(`Delete “${r.name}”? This removes the saved comparison.`))return;
    setBusy(true);setError('');
    try{if(action==='delete'){await base44.entities.ABRun.delete(r.id);setRuns(old=>old.filter(x=>x.id!==r.id));if(draftId===r.id)reset();}else{const patch=action==='archive'?{status:'archived',archived_from:r.status||'completed'}:{status:r.archived_from||'completed'};const next=await base44.entities.ABRun.update(r.id,patch);setRuns(old=>old.map(x=>x.id===r.id?next:x));if(draftId===r.id)reset();}}catch(e){setError(e.message||'Could not update this comparison.');}finally{setBusy(false);}
  };
  return {data,runs,form,setForm,draftId,busy,error,save,load,manage,reset,audience};
}