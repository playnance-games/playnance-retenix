import { useState, useRef, useEffect } from "react";
import { Sparkles, Loader2, Send, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function SegmentAiChat({ editing, onChange }) {
  const [messages, setMessages] = useState([
    { role: "ai", text: "Let's define your segment. What outcome do you want from it?", options: ["Re-engage quiet players", "Reward high-value depositors", "Win back at-risk players"] },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);
  const scrollRef = useRef(null);
  const history = messages.map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.text }));

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, busy]);

  const send = async (text) => {
    if (!text.trim() || busy) return;
    setMessages((p) => [...p, { role: "user", text: text.trim() }, { role: "ai", text: "thinking…", pending: true }]);
    setInput("");
    setBusy(true);
    setError("");
    try {
      const { data } = await base44.functions.invoke("aiAssistant", {
        task: "segment_help",
        draft: { name: editing.name, filters: editing.filters },
        message: text.trim(),
        history,
      });
      const result = data.result || {};
      const filters = result.filters || {};
      if (Object.keys(filters).length) {
        onChange((p) => ({ ...p, filters: { ...(p.filters || {}), ...filters } }));
      }
      setComplete(!!result.complete);
      setMessages((p) => p.map((x) => x.pending ? { role: "ai", text: result.answer || "Done.", filters, applied: Object.keys(filters).length > 0, options: result.options || [], pending: false } : x));
    } catch (e) {
      setError(e?.response?.data?.error || e.message);
    } finally {
      setBusy(false);
    }
  };

  const preview = (v) => (typeof v === "object" ? JSON.stringify(v) : String(v));

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-2 pb-2 border-b border-border">
        <span className="w-7 h-7 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0"><Sparkles className="w-4 h-4" /></span>
        <span className="text-base font-medium">AI segment builder</span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-auto py-3 space-y-3 min-h-0">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : ""}`}>
            {m.role === "ai" && <span className="w-6 h-6 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0 mt-0.5"><Sparkles className="w-3.5 h-3.5" /></span>}
            <div className="flex flex-col gap-2 max-w-[85%]">
              <div className={`rounded-xl px-4 py-3 text-base leading-relaxed ${m.role === "user" ? "bg-accent text-accent-foreground" : m.pending ? "bg-muted/40 border border-border text-muted-foreground animate-pulse" : "bg-muted/40 border border-border"}`}>
                <p>{m.text}</p>
                {m.filters && Object.keys(m.filters).length > 0 && (
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1"><Check className="w-3.5 h-3.5 text-emerald-500" /> Applied filters</div>
                    {Object.keys(m.filters).map((k) => (
                      <div key={k} className="text-sm mb-1"><span className="font-medium text-accent">{k.replace(/_/g, " ")}:</span> <span>{preview(m.filters[k])}</span></div>
                    ))}
                  </div>
                )}
              </div>
              {m.role === "ai" && !m.pending && m.options && m.options.length > 0 && i === messages.length - 1 && (
                <div className="flex flex-wrap gap-2">
                  {m.options.map((opt, oi) => (
                    <button key={oi} onClick={() => send(opt)} disabled={busy} className="rounded-lg border border-accent/40 bg-accent/5 text-accent px-3.5 py-2 text-sm hover:bg-accent/10 disabled:opacity-40 transition">
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      {complete && (
        <div className="rounded-lg border border-accent/30 bg-accent/5 p-2.5 mb-2 text-sm flex items-center gap-1.5"><Check className="w-4 h-4 text-accent" /> All set — name your segment and save.</div>
      )}

      <div className="pt-2 border-t border-border">
        <div className="flex gap-2 items-end">
          <Textarea
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
            placeholder="Answer the question…"
            disabled={busy}
            className="text-base resize-none flex-1"
          />
          <Button type="button" size="icon" className="h-10 w-10 shrink-0" onClick={() => send(input)} disabled={busy || !input.trim()}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}