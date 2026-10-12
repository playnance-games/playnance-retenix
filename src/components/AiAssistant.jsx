import { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import GuidedCreate from "@/components/GuidedCreate";
import { Sparkles, Send, MessageSquare, Wand2, Loader2, Plus, Check, ChevronsRight } from "lucide-react";

const EMPTY_COND = { min_score: null, max_score: null, net_vs_house: "", max_risk: "", lifecycle: "", favorite_tag: "", feature_never_used: "", cash_window_free: false };

function buildCase(p) {
  return {
    name: p.name || "Untitled case",
    type: p.type || "activation",
    trigger_mode: p.trigger_mode || "event",
    event_trigger: p.event_trigger || "",
    conditions: { ...EMPTY_COND },
    action_template: p.action_template || "deposit_prompt",
    channel: p.channel || "site",
    status: "on",
    segment_ids: [],
    fire_log: [],
    caps: {},
    image_uri: "",
  };
}
function buildSegment(p) {
  return {
    name: p.name || "Untitled segment",
    seg_key: "",
    filters: p.filters || { min_score: null, max_score: null, net_vs_house: "", favorite: "", feature_unused: "", risk: "", lifecycle: "" },
    case_ids: [],
    built_in: false,
  };
}

function renderText(text) {
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**")
      ? <strong key={i} className="font-semibold text-foreground">{p.slice(2, -2)}</strong>
      : <span key={i}>{p}</span>
  );
}

export default function AiAssistant({ onCollapse, executive = false }) {
  const [mode, setMode] = useState("chat");
  const [messages, setMessages] = useState([{ role: "assistant", content: "Hi — ask me anything about Retenix, or switch to Action mode to create a case or segment." }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [plan, setPlan] = useState(null);
  const [done, setDone] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight); }, [messages]);

  const send = async () => {
    if (!input.trim() || busy) return;
    const text = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setBusy(true);
    setPlan(null);
    try {
      const res = await base44.functions.invoke("aiAssistant", { task: mode, message: text });
      const data = res.data;
      if (mode === "action") {
        const r = data.result || {};
        setMessages((m) => [...m, { role: "assistant", content: r.summary || "I couldn't turn that into an action." }]);
        if (r.action && r.action !== "none" && r.payload && r.payload.name) setPlan(r);
      } else {
        setMessages((m) => [...m, { role: "assistant", content: data.answer || "…" }]);
      }
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: `Error: ${e.message}` }]);
    } finally {
      setBusy(false);
    }
  };

  const executePlan = async () => {
    if (!plan) return;
    try {
      if (plan.action === "create_case") {
        await base44.entities.UseCase.create(buildCase(plan.payload));
      } else if (plan.action === "create_segment") {
        await base44.entities.Segment.create(buildSegment(plan.payload));
      }
      setMessages((m) => [...m, { role: "assistant", content: `Done — created the ${plan.action === "create_case" ? "case" : "segment"} "${plan.payload.name}".` }]);
      setPlan(null);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: `Create failed: ${e.message}` }]);
    }
  };

  return (
    <div className={executive ? "ex-assistant" : "flex flex-col h-full bg-[#cee6e6] border-l border-accent/30"}>
      <div className={executive ? "ex-workhead" : "flex items-center gap-2 px-4 py-3 border-b border-border"}>
        {executive ? <span className="ex-spark"><Sparkles /></span> : <Sparkles className="w-4 h-4 text-accent" />}
        <span className={executive ? "ex-workname" : "text-sm font-medium"}>Retenix Assistant</span>
        {onCollapse && (
          <button onClick={onCollapse} title="Collapse" className={executive ? "ex-iconbtn ex-collapse" : "ml-auto p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 transition"}>
            <ChevronsRight className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className={executive ? "ex-modes" : "flex gap-1 px-3 py-2 border-b border-border"}>
        <button
          onClick={() => { setMode("chat"); setPlan(null); }}
          className={executive ? `ex-mode${mode === "chat" ? " current" : ""}` : `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition ${mode === "chat" ? "bg-background text-accent border border-accent/40" : "bg-background/50 text-muted-foreground hover:text-foreground"}`}
        >
          <MessageSquare className="w-3.5 h-3.5" /> Chat
        </button>
        <button
          onClick={() => { setMode("action"); setPlan(null); }}
          className={executive ? `ex-mode${mode === "action" ? " current" : ""}` : `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition ${mode === "action" ? "bg-background text-accent border border-accent/40" : "bg-background/50 text-muted-foreground hover:text-foreground"}`}
        >
          <Wand2 className="w-3.5 h-3.5" /> Action
        </button>
        <span className="ml-auto text-[10px] text-muted-foreground self-center">{mode === "chat" ? "answers questions" : "creates cases/segments"}</span>
      </div>

      <div ref={scrollRef} className={executive ? "ex-workbody" : "flex-1 overflow-auto px-3 py-3 space-y-2.5 min-h-0"}>
        {messages.map((m, i) => (
          <div key={i} className={executive ? `ex-assistmsg${m.role === "user" ? " ex-user-message" : ""}` : `flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {executive && m.role === "assistant" && <span className="ex-assistantbadge"><Sparkles /></span>}
            <div className={executive ? "ex-bubble" : "max-w-[85%] rounded-xl px-3 py-2 text-[13px] leading-relaxed bg-background border border-border"}>
              {renderText(m.content)}
            </div>
          </div>
        ))}
        {mode === "action" && <GuidedCreate onDone={(t) => setMessages((m) => [...m, { role: "assistant", content: t }])} />}
        {busy && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="w-3.5 h-3.5 animate-spin" /> thinking…</div>}
        {plan && (
          <div className="rounded-xl border border-accent/30 bg-accent/5 p-3">
            <div className="text-[10px] uppercase tracking-wider text-accent mb-1">{plan.action === "create_case" ? "New case" : "New segment"}</div>
            <div className="text-sm font-medium">{plan.payload.name}</div>
            <div className="text-[11px] text-muted-foreground mt-1">{plan.summary}</div>
            <button onClick={executePlan} className="mt-2 w-full flex items-center justify-center gap-1.5 text-xs bg-accent text-accent-foreground rounded-lg py-2 hover:opacity-90">
              <Plus className="w-3.5 h-3.5" /> Create it
            </button>
          </div>
        )}
      </div>

      <div className={executive ? "ex-composer" : "px-3 py-3 border-t border-border flex gap-2"}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={mode === "chat" ? "Ask about the system…" : "Describe a case or segment to create…"}
          className={executive ? "ex-input" : "flex-1 rounded-lg bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"}
        />
        <button onClick={send} disabled={busy || !input.trim()} aria-label="Send" className={executive ? "ex-send" : "rounded-lg bg-accent text-accent-foreground px-3 disabled:opacity-40"}>
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}