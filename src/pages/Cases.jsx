import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Lightbulb } from "lucide-react";
import Recommendations from "@/components/Recommendations";
import { Button } from "@/components/ui/button";
import FirstSegmentDialog from "@/components/segments/FirstSegmentDialog";
import CaseNewGate from "@/components/cases/CaseNewGate";
import CaseCreateDialog from "@/components/cases/CaseCreateDialog";
import CaseRegister from "@/components/executive/CaseRegister";
import CaseRegisterRow from "@/components/executive/CaseRegisterRow";
import InfoTip from "@/components/InfoTip";
import { TYPE_LABELS, CASE_TIPS } from "@/lib/caseConstants";

export { TYPE_LABELS };

export default function Cases() {
  const [cases, setCases] = useState([]);
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRecs, setShowRecs] = useState(false);
  const [firstSegOpen, setFirstSegOpen] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [forAll, setForAll] = useState(false);
  const [editCase, setEditCase] = useState(null);
  const [abRuns, setAbRuns] = useState([]);

  const load = async () => {
    const [c, s, ab] = await Promise.all([
      base44.entities.UseCase.list(),
      base44.entities.Segment.list(),
      base44.entities.ABRun.list(),
    ]);
    setCases(c); setSegments(s); setAbRuns(ab); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const toggle = async (uc) => {
    const next = await base44.entities.UseCase.update(uc.id, { status: uc.status === "on" ? "off" : "on" });
    setCases((p) => p.map((x) => (x.id === uc.id ? next : x)));
  };

  const remove = async (uc) => {
    await base44.entities.UseCase.delete(uc.id);
    setCases((p) => p.filter((x) => x.id !== uc.id));
  };

  const openNew = () => {
    if (segments.length === 0) { setGateOpen(true); return; }
    setForAll(false); setCreateOpen(true);
  };
  const createForAll = () => { setGateOpen(false); setForAll(true); setCreateOpen(true); };
  const openEdit = (uc) => { setEditCase(uc); };

  const renderCaseRow = (uc) => (
    <CaseRegisterRow key={uc.id} uc={uc} typeLabel={TYPE_LABELS[uc.type] || uc.type} typeTip={CASE_TIPS.type} hasAb={abRuns.some((r) => r.reward_case_id === uc.id)} onToggle={toggle} onEdit={openEdit} onDelete={remove} segments={segments} />
  );

  return (
    <div className="ex-cases">
      <header className="ex-heading">
        <div>
          <h1 className="text-2xl font-heading font-semibold tracking-tight">Use-case manager</h1>
          <p className="ex-description">Segment-based cases — every case starts from an event, links to a segment, then fires an action. <InfoTip text="Cases fire for every player in the assigned segment (on schedule or login). Each case shares the same object: conditions, action template, channel, optional cash formula, and an optional popup visual." /></p>
        </div>
        <div className="ex-headingactions">
          <Button className="ex-btn" size="sm" variant="outline" onClick={() => setShowRecs(true)}><Lightbulb className="w-4 h-4" /> Recommendations</Button>
          <Button className="ex-btn primary" size="sm" onClick={openNew}><Plus className="w-4 h-4" /> New case</Button>
        </div>
      </header>

      {cases.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center text-center py-16">
          <div className="lux-surface rounded-2xl border border-border bg-card/40 p-10 max-w-md flex flex-col items-center">
            <span className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center mb-3"><Plus className="w-6 h-6" /></span>
            <h2 className="text-lg font-heading font-semibold">Create your first case</h2>
            <p className="text-sm text-muted-foreground mt-1.5 mb-5 leading-relaxed">Cases are how Retenix engages players — cash gifts, education cards, surveys, and messages. Create one to get started.</p>
            <Button onClick={openNew}><Plus className="w-4 h-4" /> New case</Button>
          </div>
        </div>
      ) : (
        <CaseRegister cases={cases} renderRow={renderCaseRow} loading={loading} />
      )}

      <Recommendations open={showRecs} onOpenChange={setShowRecs} onCreated={load} />
      <FirstSegmentDialog open={firstSegOpen} onOpenChange={setFirstSegOpen} onCreated={load} />
      <CaseNewGate open={gateOpen} onOpenChange={setGateOpen} onCreateSegment={() => { setGateOpen(false); setFirstSegOpen(true); }} onCreateForAll={createForAll} />
      <CaseCreateDialog open={createOpen || !!editCase} editCase={editCase} forAll={forAll} onOpenChange={(o) => { if (!o) { setCreateOpen(false); setEditCase(null); setForAll(false); } }} onCreated={load} segments={segments} />
    </div>
  );
}