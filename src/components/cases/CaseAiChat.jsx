import { useState, useRef, useEffect } from "react";
import { Sparkles, Loader2, Send, Check, Pencil, Wand2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import InfoTip from "@/components/InfoTip";

const SUGGESTIONS_EDIT = [
  "Target only players with score above 6",
  "Switch to a Telegram message",
  "Make it a cash gift with a $10 fixed bonus",
  "Change the popup text to be friendlier",
  "Add a survey to learn their favorite game",
];
const SUGGESTIONS_CREATE = [
  "A cash reward for big depositors who are net down",
  "An education card for players who never used staking",
  "A survey to learn favorite games from new players",
  "A WhatsApp nudge for players who went quiet",
];

export default function CaseAiChat({ editing, onChange, onToggleManual, manualOpen }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

  const canAi = true;
  const isNew = !editing.id;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const send = async (text) => {
    if (!text.trim() || busy || !canAi) return;
    setMessages((p) => [...p, { role: "user", text: text.trim() }]);
    setInput("");
    setBusy(true);
    setError("");
    try {
      const { data } = await base44.functions.invoke("aiAssistant", isNew ? {
        task: "case_create_help",
        draft: { name: editing.name, type: editing.type, trigger_mode: editing.trigger_mode, event_trigger: editing.event_trigger, channel: editing.channel, action_template: editing.action_template, status: editing.status, content_text: editing.content_text, message_text: editing.message_text, message_link: editing.message_link, button_label: editing.button_label, button_link: editing.button_link, survey_options: editing.survey_options, conditions: editing.conditions },
        message: text.trim(),
      } : {
        task: "edit_case",
        case_id: editing.id,
        message: text.trim(),
      });
      const result = data.result || {};
      setMessages((p) => [
        ...p,
        { role: "ai", text: result.summary || result.answer || "…", changes: result.changes || {}, applied: false, keys: Object.keys(result.changes || {}) },
      ]);
    } catch (e) {
      setError(e?.response?.data?.error || e.message);
    } finally {
      setBusy(false);
    }
  };

  const apply = (i) => {
    const m = messages[i];
    if (!m?.changes) return;
    onChange((p) => {
      const next = { ...p, ...m.changes };
      if (m.changes.conditions) next.conditions = { ...(p.conditions || {}), ...m.changes.conditions };
      return next;
    });
    setMessages((p) => p.map((x, j) => (j === i ? { ...x, applied: true } : x)));
  };

  const preview = (v) => (typeof v === "object" ? JSON.stringify(v) : String(v));

  return (
    <div className="ex-aichat">
      <div className="ex-aichathead">
        <span className="ex-spark"><Sparkles className="w-4 h-4" /></span>
        <div className="ex-workname">AI case editor</div>
        <InfoTip text="Describe a change in plain language. The AI proposes edits — review them, then apply to update the flow. Nothing is saved until you press Save." />
      </div>

      <div className="ex-aimessages" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="ex-aiempty">
            <Wand2 className="w-7 h-7" />
            <div className="ex-aiemptytitle">Talk to the editor</div>
            <p>{isNew ? "Describe the case you want to create. I'll ask follow-up questions and propose the settings — apply them to fill the flow." : 'Ask for changes like "make it a cash gift" or "target score above 6". Apply the suggestions and watch the flow update live.'}</p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`ex-aimsg ${m.role === "user" ? "ex-aiuser" : ""}`}>
            {m.role === "ai" && <span className="ex-assistantbadge"><Sparkles className="w-3.5 h-3.5" /></span>}
            <div className="ex-aibubble">
              <p>{m.text}</p>
              {m.changes && m.keys.length > 0 && (
                <div className="ex-aichanges">
                  <div className="ex-aichangeslabel">Proposed changes</div>
                  {m.keys.map((k) => (
                    <div key={k} className="ex-achange">
                      <span className="ex-akey">{k.replace(/_/g, " ")}</span>
                      <span className="ex-aval">{preview(m.changes[k])}</span>
                    </div>
                  ))}
                  {m.applied ? (
                    <span className="ex-applied"><Check className="w-3.5 h-3.5" /> Applied to flow</span>
                  ) : (
                    <Button size="sm" className="ex-applybtn" onClick={() => apply(i)}><Check className="w-3.5 h-3.5" /> Apply to flow</Button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {busy && <div className="ex-aimsg"><span className="ex-assistantbadge"><Sparkles className="w-3.5 h-3.5" /></span><div className="ex-aibubble ex-ailoading"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking…</div></div>}
        {error && <p className="ex-aierror">{error}</p>}
      </div>

      {messages.length === 0 && (
        <div className="ex-aisuggest">
          {(isNew ? SUGGESTIONS_CREATE : SUGGESTIONS_EDIT).map((s) => (
            <button key={s} type="button" className="ex-aisugbtn" onClick={() => send(s)} disabled={busy}>{s}</button>
          ))}
        </div>
      )}

      <div className="ex-aicomposer">
        <Textarea
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
          placeholder={isNew ? "Describe the case you want to create…" : "Describe a change to this case…"}
          disabled={busy}
        />
        <div className="ex-aicomposerow">
          <Button type="button" variant="outline" size="sm" onClick={onToggleManual}>
            <Pencil className="w-3.5 h-3.5" /> {manualOpen ? "Hide manual edit" : "Edit manually"}
          </Button>
          <Button type="button" className="ex-sendbtn" onClick={() => send(input)} disabled={busy || !input.trim()}>
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Send
          </Button>
        </div>
      </div>
    </div>
  );
}