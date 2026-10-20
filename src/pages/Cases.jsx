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
import { TYPE_LABELS, TYPE_TIPS } from "@/lib/caseConstants";
import { loadPlayersWithStatus } from "@/lib/playerData";
import { measureCases } from "@/lib/campaigns";
import { fmtMoney } from "@/lib/retenixLogic";
import { dataFreshness } from "@/lib/riskLevels";

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
  const [players, setPlayers] = useState([]);
  const [settings, setSettings] = useState({});

  const load = async () => {
    const [c, s, ab, roster, stored] = await Promise.all([
      base44.entities.UseCase.list(),
      base44.entities.Segment.list(),
      base44.entities.ABRun.list(),
      loadPlayersWithStatus(),
      base44.entities.Settings.list(),
    ]);
    setCases(c); setSegments(s); setAbRuns(ab); setPlayers(roster); setSettings({ daily_cash_budget: 500, ...(stored[0] || {}) }); setLoading(false);
  };
  useEffect(() => { load(); }, []);

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

  const measured = measureCases(cases, players, segments, settings);
  const fresh = dataFreshness(players);
  const budget = Number(settings.daily_cash_budget) || 0;
  const renderCaseRow = (uc) => (
    <CaseRegisterRow key={uc.id} uc={uc} typeLabel={TYPE_LABELS[uc.type] || uc.type} typeTip={TYPE_TIPS[uc.type] || TYPE_LABELS[uc.type] || uc.type} hasAb={abRuns.some((r) => r.reward_case_id === uc.id)} onEdit={openEdit} onDelete={remove} segments={segments} />
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

      <section className="lux-surface rounded-2xl border border-border bg-card p-4 mb-5">
        <h2 className="text-sm font-semibold">What would fire on the current roster</h2>
        <p className="mt-1 text-xs text-muted-foreground">{fresh.note} These counts are eligibility on today's loaded players, not recorded sends.</p>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <span><strong>{measured.on}</strong> cases on</span>
          <span><strong>{measured.firing}</strong> would-fire matches</span>
          <span><strong>{fmtMoney(measured.cost)}</strong> estimated gifts</span>
          <span><strong>{fmtMoney(budget)}</strong> daily cash cap</span>
        </div>
        {budget > 0 && measured.cost > budget && <p className="mt-2 text-xs text-red-600">Estimated gifts are over the daily cash cap. Hold the extra cash cases or raise the cap in Settings.</p>}
      </section>

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