import { useState } from "react";
import { Radio, Filter, Type, Send, Shield, Zap, AlertTriangle, ArrowDown, Sliders, FlaskConical, Users, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import CaseImage from "@/components/CaseImage";
import CaseVisual from "@/components/cases/CaseVisual";
import CaseAiChat from "@/components/cases/CaseAiChat";
import CaseManualEdit from "@/components/cases/CaseManualEdit";
import InfoTip from "@/components/InfoTip";
import { TYPE_LABELS, CASE_TIPS, ACTION_FORMAT_LABEL, CHANNEL_LABEL } from "@/lib/caseConstants";

const COND_LABELS = {
  min_score: "Min score", max_score: "Max score", net_vs_house: "Net vs house",
  max_risk: "Max risk", lifecycle: "Lifecycle", favorite_tag: "Favorite category",
  feature_never_used: "Never used", cash_window_free: "7-day window free",
};

function StepArrow() {
  return (
    <div className="ex-steparrow">
      <ArrowDown className="w-6 h-6" />
    </div>
  );
}

function Step({ n, icon: Icon, label, title, tone = "default", tip, children }) {
  const toneClass = { default: "", accent: "accent", gold: "gold", danger: "danger" }[tone];
  return (
    <div className={`ex-step ${toneClass}`}>
      <div className="ex-stephead">
        <span className="ex-stepnum">{n}</span>
        <span className="ex-stepicon"><Icon className="w-4 h-4" /></span>
        <span className="ex-steplabel">{label}{tip && <InfoTip text={tip} />}</span>
      </div>
      <div className="ex-steptitle">{title}</div>
      {children && <div className="ex-stepbody">{children}</div>}
    </div>
  );
}

export default function CaseFlowEditor({ editing, setEditing, segments, settings, abRuns = [], onSave, onCancel, saving, saveError }) {
  const [showManual, setShowManual] = useState(false);

  const setField = (k, v) => setEditing((p) => ({ ...p, [k]: v }));

  const isEvent = editing.trigger_mode === "event";
  const assignedSegments = (editing.segment_ids || []).map((id) => segments.find((s) => s.id === id)?.name).filter(Boolean);
  const conds = editing.conditions || {};
  const condChips = [
    conds.min_score != null && { k: "min_score", v: `≥ ${conds.min_score}` },
    conds.max_score != null && { k: "max_score", v: `≤ ${conds.max_score}` },
    conds.net_vs_house && { k: "net_vs_house", v: conds.net_vs_house },
    conds.max_risk && { k: "max_risk", v: conds.max_risk },
    conds.lifecycle && { k: "lifecycle", v: conds.lifecycle },
    conds.favorite_tag && { k: "favorite_tag", v: conds.favorite_tag },
    conds.feature_never_used && { k: "feature_never_used", v: conds.feature_never_used },
    conds.cash_window_free && { k: "cash_window_free", v: "required" },
  ].filter(Boolean);

  const isCash = editing.type === "cash";
  const cf = editing.cash_formula || {};
  const cashDesc = isCash
    ? (cf.fixed_mode && Number(cf.fixed_amount) > 0
        ? `A fixed $${cf.fixed_amount} bonus for every eligible player.`
        : `min(haircut% of net-down, 1× average deposit)${cf.lock_sweetener && cf.lock_sweetener !== "none" ? ` + ${cf.lock_sweetener} lock sweetener` : ""}`)
    : null;

  const ab = abRuns.find((r) => r.reward_case_id === editing.id);
  const site = editing.channel === "site";
  const content = site ? editing.content_text : editing.message_text;
  const actionFormat = ACTION_FORMAT_LABEL(editing.action_template);

  return (
    <section className="ex-floweditor">
      <header className="ex-flowhead">
        <div className="ex-flowtitle">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Case name</Label>
          <Input
            value={editing.name}
            onChange={(e) => setField("name", e.target.value)}
            placeholder="Case name"
            className="ex-flowname mt-1"
          />
          <div className="ex-flowmeta">
            <span className="ex-flowmetaitem"><Radio className="w-3.5 h-3.5" /> {isEvent ? `Event · ${editing.event_trigger?.replace(/_/g, " ") || "—"}` : "Segment-based"}</span>
            <span className="ex-flowmetaitem"><Type className="w-3.5 h-3.5" /> {TYPE_LABELS[editing.type] || editing.type}</span>
            <span className="ex-flowmetaitem"><Send className="w-3.5 h-3.5" /> {CHANNEL_LABEL[editing.channel] || editing.channel}</span>
          </div>
        </div>
        <div className="ex-flowactions">
          <label className="ex-flowstatus">
            <Switch checked={editing.status === "on"} onCheckedChange={(v) => setField("status", v ? "on" : "off")} />
            <span>{editing.status === "on" ? "On" : "Off"}</span>
            <InfoTip text={CASE_TIPS.status} />
          </label>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button disabled={saving || !editing.name.trim()} onClick={onSave}>
            <Zap className="w-4 h-4" /> {saving ? "Saving…" : "Save case"}
          </Button>
        </div>
      </header>

      <div className="ex-flowbody">
        <div className="ex-flowcol">
          <Step n={1} icon={isEvent ? Radio : Filter} label="Trigger" tip="Event cases fire the instant this event is logged. Segment cases fire for every player in the segment on schedule or login."
            title={isEvent ? `Event: ${editing.event_trigger?.replace(/_/g, " ") || "—"}` : "Segment-based (schedule or login)"} tone="accent">
            <div>{isEvent ? "Fires on this single live or historical event — not a schedule." : `Fires for every player in the assigned segments.`}</div>
          </Step>
          <StepArrow />

          <Step n={2} icon={Users} label="Who — segment" tip="The group of players this case targets. Assign segments and add condition filters to narrow it."
            title={assignedSegments.length ? assignedSegments.join(", ") : "No segments assigned"} tone="accent">
            <div className="ex-chips">
              {condChips.length ? condChips.map((c) => (
                <span key={c.k} className="ex-chip"><span className="ex-chipkey">{COND_LABELS[c.k]}:</span> {c.v}</span>
              )) : <span className="italic">No condition filters — matches everyone in the trigger.</span>}
            </div>
          </Step>
          <StepArrow />

          <Step n={3} icon={FlaskConical} label="A/B test" tip="Whether this case is part of an A/B test. Manage tests on the A/B Tests page."
            title={ab ? `Active: ${ab.name}` : "No A/B test running"}>
            <div>{ab ? `Split ${ab.split || 50}/${100 - (ab.split || 50)} — gate ${ab.gate_label || ab.gate_group || "—"}.` : "This case runs as-is. Set up a test on the A/B Tests page to compare variants."}</div>
          </Step>
          <StepArrow />

          <Step n={4} icon={Type} label="Action" tip="What the player sees: a message, popup, mini-game, cash gift, survey, etc."
            title={`${TYPE_LABELS[editing.type] || editing.type} · ${actionFormat}`} tone="gold">
            {cashDesc && <div>{cashDesc}</div>}
            <div className="text-[12px] text-muted-foreground mt-1">Channel: {CHANNEL_LABEL[editing.channel] || editing.channel}</div>
            <p className="mt-2 text-[13px]">{content || <span className="italic">No text added yet — add some in manual edit.</span>}</p>
          </Step>
          <StepArrow />

          <Step n={5} icon={Eye} label="How it looks" tip="A live preview of the creative the player sees.">
            <div className="ex-stepvisual">
              <div className="ex-visualbox">
                {editing.image_uri
                  ? <CaseImage uri={editing.image_uri} className="w-full h-full object-cover" />
                  : <CaseVisual uc={editing} className="w-full h-full" />}
              </div>
              <div className="ex-contentbox">
                {site && editing.button_label && (
                  <div className="ex-contentbtn">{editing.button_label}</div>
                )}
                {!site && editing.message_link && (
                  <div className="ex-contentlink">{editing.message_link}</div>
                )}
                {editing.type === "survey" && (editing.survey_options || []).filter(Boolean).length > 0 && (
                  <div className="ex-surveys">
                    {(editing.survey_options || []).filter(Boolean).map((o, i) => (
                      <span key={i} className="ex-surveyopt">{o}</span>
                    ))}
                  </div>
                )}
                {editing.image_uri && <div className="ex-visualnote">Using an uploaded image. Manage it in manual edit.</div>}
              </div>
            </div>
          </Step>

          {showManual && (
            <div className="ex-manualpanel">
              <div className="ex-manualhead">
                <span className="ex-stepnum"><Sliders className="w-3.5 h-3.5" /></span>
                <span className="ex-steplabel">Manual edit</span>
              </div>
              <CaseManualEdit editing={editing} setEditing={setEditing} setField={setField} setCond={(k, v) => setEditing((p) => ({ ...p, conditions: { ...(p.conditions || {}), [k]: v } }))} segments={segments} settings={settings} />
            </div>
          )}
        </div>

        <aside className="ex-flowai">
          <CaseAiChat editing={editing} onChange={setEditing} onToggleManual={() => setShowManual((s) => !s)} manualOpen={showManual} />
        </aside>
      </div>

      {saveError && <p role="alert" className="text-xs text-destructive mt-1">{saveError}</p>}
    </section>
  );
}