import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Wand2, Layers, ArrowRight, ArrowLeft, Check, Loader2 } from "lucide-react";

const EMPTY_COND = { min_score: null, max_score: null, net_vs_house: "", max_risk: "", lifecycle: "", favorite_tag: "", feature_never_used: "", cash_window_free: false };

const CASE_QS = [
  {
    key: "goal", q: "What's the goal of this case?", opts: [
      { label: "Bring back churning players", val: { type: "activation", action_template: "deposit_prompt", event_trigger: "quieter_than_usual_week", name: "Come-back nudge" } },
      { label: "Reward big depositors", val: { type: "cash", action_template: "wheel", event_trigger: "large_win_this_session", name: "Big spender reward" } },
      { label: "Teach a new feature", val: { type: "education", action_template: "education_card", event_trigger: "never_used_staking", name: "Feature intro" } },
    ],
  },
  {
    key: "audience", q: "Who should see it?", opts: [
      { label: "All active players", val: {} },
      { label: "High-score players", val: { conditions: { min_score: 0.75 } } },
      { label: "At-risk players", val: { conditions: { lifecycle: "at-risk" } } },
    ],
  },
  {
    key: "channel", q: "How should it reach them?", opts: [
      { label: "On-site popup", val: { channel: "site" } },
      { label: "Telegram message", val: { channel: "telegram", action_template: "telegram_copy" } },
      { label: "WhatsApp message", val: { channel: "whatsapp", action_template: "whatsapp_copy" } },
    ],
  },
];

const SEG_QS = [
  {
    key: "who", q: "Who do you want to group?", opts: [
      { label: "Big depositors", val: { name: "Big depositors", filters: { min_score: 0.6 } } },
      { label: "Churning players", val: { name: "Churning players", filters: { lifecycle: "at-risk" } } },
      { label: "New players", val: { name: "New players", filters: { lifecycle: "new" } } },
    ],
  },
  {
    key: "behavior", q: "What behavior matters?", opts: [
      { label: "High score", val: { filters: { min_score: 0.75 } } },
      { label: "Net up vs house", val: { filters: { net_vs_house: "up" } } },
      { label: "Active this week", val: { filters: {} } },
    ],
  },
  {
    key: "deliver", q: "What should they get?", opts: [
      { label: "Cash offers", val: {} },
      { label: "Education", val: {} },
      { label: "Surveys", val: {} },
    ],
  },
];

function buildCasePayload(answers) {
  const base = {
    name: "Untitled case", type: "activation", trigger_mode: "event", event_trigger: "",
    conditions: { ...EMPTY_COND }, action_template: "deposit_prompt", channel: "site",
    status: "on", segment_ids: [], fire_log: [], caps: {}, image_uri: "",
    creatives: [], shuffle_mode: false, button_label: "", button_link: "",
  };
  for (const a of Object.values(answers)) {
    if (a.name) base.name = a.name;
    if (a.type) base.type = a.type;
    if (a.action_template) base.action_template = a.action_template;
    if (a.event_trigger) base.event_trigger = a.event_trigger;
    if (a.channel) base.channel = a.channel;
    if (a.conditions) base.conditions = { ...base.conditions, ...a.conditions };
  }
  return base;
}
function buildSegPayload(answers) {
  const base = { name: "Untitled segment", seg_key: "", filters: { min_score: null, max_score: null, net_vs_house: "", favorite: "", feature_unused: "", risk: "", lifecycle: "" }, case_ids: [], built_in: false };
  for (const a of Object.values(answers)) {
    if (a.name) base.name = a.name;
    if (a.filters) base.filters = { ...base.filters, ...a.filters };
  }
  return base;
}

export default function GuidedCreate({ onDone }) {
  const [kind, setKind] = useState(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [creating, setCreating] = useState(false);

  const qs = kind === "case" ? CASE_QS : SEG_QS;
  const reset = () => { setKind(null); setStep(0); setAnswers({}); };

  const finish = async (all) => {
    setCreating(true);
    try {
      if (kind === "case") {
        const p = buildCasePayload(all);
        await base44.entities.UseCase.create(p);
        onDone?.(`Done — created the case **${p.name}**.`);
      } else {
        const p = buildSegPayload(all);
        await base44.entities.Segment.create(p);
        onDone?.(`Done — created the segment **${p.name}**.`);
      }
      reset();
    } catch (e) {
      onDone?.(`Create failed: ${e.message}`);
    } finally {
      setCreating(false);
    }
  };

  const pick = (val) => {
    const key = qs[step].key;
    const all = { ...answers, [key]: val };
    setAnswers(all);
    if (step < qs.length - 1) setStep(step + 1);
    else finish(all);
  };

  if (creating) return <div className="flex items-center gap-2 text-xs text-muted-foreground px-1 py-3"><Loader2 className="w-3.5 h-3.5 animate-spin" /> creating…</div>;

  if (!kind) {
    return (
      <div className="px-1 py-2 space-y-2">
        <div className="text-xs text-muted-foreground">I'll ask a few quick questions to build a better one. Pick a type:</div>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setKind("case")} className="rounded-lg border border-border bg-background px-3 py-2.5 text-xs hover:border-accent/50 hover:text-accent transition flex items-center gap-2"><Wand2 className="w-3.5 h-3.5" /> New case</button>
          <button onClick={() => setKind("segment")} className="rounded-lg border border-border bg-background px-3 py-2.5 text-xs hover:border-accent/50 hover:text-accent transition flex items-center gap-2"><Layers className="w-3.5 h-3.5" /> New segment</button>
        </div>
      </div>
    );
  }

  const q = qs[step];
  return (
    <div className="px-1 py-2 space-y-3">
      <div className="flex items-center gap-2">
        <button onClick={() => (step === 0 ? setKind(null) : setStep(step - 1))} className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-3.5 h-3.5" /></button>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{kind === "case" ? "New case" : "New segment"} · question {step + 1} of {qs.length}</span>
      </div>
      <div className="text-sm font-medium">{q.q}</div>
      <div className="space-y-2">
        {q.opts.map((o, i) => (
          <button key={i} onClick={() => pick(o.val)} className="w-full flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5 text-xs hover:border-accent/50 hover:text-accent transition">
            {o.label}
            {step === qs.length - 1 ? <Check className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        ))}
      </div>
    </div>
  );
}