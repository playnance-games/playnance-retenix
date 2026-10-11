import { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Send, Loader2, Check } from "lucide-react";
import { GATES } from "@/lib/abSimulation";

export default function AbAiChat({ cases, segments, form, setForm, setDraftId, onSave, busy }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Let's set up an A/B test. What would you like to name it?" },
  ]);
  const [input, setInput] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [complete, setComplete] = useState(false);
  const scrollRef = useRef(null);
  const history = messages.map((m) => ({ role: m.role, content: m.content }));

  useEffect(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight); }, [messages, aiBusy]);

  const send = async (text) => {
    if (!text.trim() || aiBusy) return;
    const userMsg = text.trim();
    setMessages((m) => [...m, { role: "user", content: userMsg }, { role: "assistant", content: "thinking…", pending: true }]);
    setInput("");
    setAiBusy(true);
    try {
      const res = await base44.functions.invoke("aiAssistant", { task: "ab_create", message: userMsg, form, history });
      const r = res.data.result || {};
      if (r.changes && Object.keys(r.changes).length) {
        const seg = r.changes.segment_name ? segments.find((s) => s.name === r.changes.segment_name) : null;
        const cas = r.changes.reward_case_name ? cases.find((c) => c.name === r.changes.reward_case_name) : null;
        setForm((p) => ({
          ...p,
          ...(r.changes.name != null ? { name: r.changes.name } : {}),
          ...(seg ? { segment_id: seg.id } : {}),
          ...(cas ? { reward_case_id: cas.id } : {}),
          ...(r.changes.gate_step ? { gate_step: r.changes.gate_step, completion_pct: GATES.find((g) => g.id === r.changes.gate_step)?.complete ?? p.completion_pct } : {}),
          ...(r.changes.gate_group ? { gate_group: r.changes.gate_group } : {}),
          ...(r.changes.reward_timing ? { reward_timing: r.changes.reward_timing } : {}),
          ...(r.changes.split != null ? { split: r.changes.split } : {}),
          ...(r.changes.base_response_pct != null ? { base_response_pct: r.changes.base_response_pct } : {}),
          ...(r.changes.completion_pct != null ? { completion_pct: r.changes.completion_pct } : {}),
          ...(r.changes.uplift_pct != null ? { uplift_pct: r.changes.uplift_pct } : {}),
        }));
        setDraftId?.(null);
      }
      setComplete(!!r.complete);
      setMessages((m) => m.map((x) => x.pending ? { role: "assistant", content: r.answer || "Done.", pending: false } : x));
    } catch (e) {
      setMessages((m) => m.map((x) => x.pending ? { role: "assistant", content: `Error: ${e.message}`, pending: false } : x));
    } finally {
      setAiBusy(false);
    }
  };

  return (
    <div className="lux-surface rounded-xl border border-border p-5 mb-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="icon-chip w-8 h-8 rounded-lg flex items-center justify-center"><Sparkles className="w-5 h-5" /></span>
        <span className="text-base font-medium">Create an A/B test with AI</span>
      </div>
      <div ref={scrollRef} className="h-[360px] overflow-auto space-y-3 mb-3 pr-1">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed border ${m.role === "user" ? "bg-accent text-accent-foreground border-accent" : m.pending ? "bg-card text-muted-foreground border-border animate-pulse" : "bg-card text-foreground border-border"}`}>
              {m.content}
            </div>
          </div>
        ))}
      </div>
      {complete && (
        <div className="rounded-xl border border-accent/30 bg-accent/5 p-3 mb-3 flex items-center justify-between gap-3 flex-wrap">
          <span className="text-sm flex items-center gap-2"><Check className="w-4 h-4 text-accent" /> Your test is ready. Run the simulation or save it as a draft.</span>
          <div className="flex gap-2">
            <button onClick={() => onSave("draft")} disabled={busy} className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-40">Save draft</button>
            <button onClick={() => onSave("completed")} disabled={busy} className="rounded-lg bg-accent text-accent-foreground px-3 py-1.5 text-sm disabled:opacity-40">Run simulation</button>
          </div>
        </div>
      )}
      <div className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send(input)} placeholder="Answer the question…" className="flex-1 rounded-lg bg-card border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent" />
        <button onClick={() => send(input)} disabled={aiBusy || !input.trim()} className="rounded-lg bg-accent text-accent-foreground px-4 disabled:opacity-40"><Send className="w-4 h-4" /></button>
      </div>
    </div>
  );
}