import { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Send, Loader2, Check } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

const opener = (allowCash) => ({
  role: "assistant",
  content: allowCash
    ? "What would you like to change in the cash gift? I can adjust the haircut, the per-gift ceiling, and how many days between gifts."
    : "Score weights are fixed: Risk 40%, High roller 40%, Engagement 10%, Lifetime 10%. Cash gifts are a Players-mode setting.",
  options: allowCash ? ["Raise the haircut", "Lower the ceiling", "Change the cash window"] : [],
});

export default function SettingsAiChat({ settings, onApply, allowCash = true }) {
  const [messages, setMessages] = useState(() => [opener(allowCash)]);
  useEffect(() => { setMessages([opener(allowCash)]); }, [allowCash]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(false);
  const scrollRef = useRef(null);
  const history = messages.map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.content }));

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, busy]);

  const send = async (text) => {
    if (!text.trim() || busy) return;
    setMessages((p) => [...p, { role: "user", content: text.trim() }, { role: "assistant", content: "thinking…", pending: true }]);
    setInput("");
    setBusy(true);
    try {
      const res = await base44.functions.invoke("aiAssistant", { task: "settings_help", message: text.trim(), settings, history });
      const r = res.data.result || {};
      const suggestions = r.suggestions || {};
      if (Object.keys(suggestions).length) onApply(suggestions);
      setComplete(!!r.complete);
      setMessages((p) => p.map((x) => x.pending ? { role: "assistant", content: r.answer || "Done.", suggestions, applied: Object.keys(suggestions).length > 0, options: r.options || [], pending: false } : x));
    } catch (e) {
      setMessages((p) => p.map((x) => x.pending ? { role: "assistant", content: `Error: ${e.message}`, pending: false } : x));
    } finally {
      setBusy(false);
    }
  };

  const preview = (v) => (typeof v === "object" ? JSON.stringify(v) : String(v));

  return (
    <div className="lux-surface rounded-2xl border border-border bg-card/40 p-6 flex flex-col">
      <div className="flex items-center gap-2.5 pb-3 border-b border-border">
        <span className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0"><Sparkles className="w-5 h-5" /></span>
        <div>
          <div className="text-lg font-medium">Adjust your house settings with AI</div>
          <div className="text-sm text-muted-foreground">Tell me what you want to change — I'll apply it. Review and Save when done.</div>
        </div>
      </div>

      <div ref={scrollRef} className="h-[420px] overflow-auto py-4 space-y-4 min-h-0">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : ""}`}>
            {m.role === "assistant" && <span className="w-7 h-7 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0 mt-0.5"><Sparkles className="w-4 h-4" /></span>}
            <div className="flex flex-col gap-2 max-w-[85%]">
              <div className={`rounded-xl px-4 py-3 text-base leading-relaxed border ${m.role === "user" ? "bg-accent text-accent-foreground border-accent" : m.pending ? "bg-muted/40 text-muted-foreground border-border animate-pulse" : "bg-muted/40 text-foreground border-border"}`}>
                <p>{m.content}</p>
                {m.suggestions && Object.keys(m.suggestions).length > 0 && (
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1"><Check className="w-3.5 h-3.5 text-emerald-500" /> Applied to your settings</div>
                    {Object.keys(m.suggestions).map((k) => (
                      <div key={k} className="text-sm mb-1"><span className="font-medium text-accent">{k.replace(/_/g, " ")}:</span> <span>{preview(m.suggestions[k])}</span></div>
                    ))}
                  </div>
                )}
              </div>
              {m.role === "assistant" && !m.pending && m.options && m.options.length > 0 && i === messages.length - 1 && (
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
      </div>

      {complete && (
        <div className="rounded-lg border border-accent/30 bg-accent/5 p-2.5 mb-2 text-sm flex items-center gap-1.5"><Check className="w-4 h-4 text-accent" /> All set — review the values and hit Save.</div>
      )}

      <div className="pt-3 border-t border-border">
        <div className="flex gap-2 items-end">
          <Textarea
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
            placeholder="Tell me what you'd like to change…"
            disabled={busy}
            className="text-base resize-none flex-1"
          />
          <button onClick={() => send(input)} disabled={busy || !input.trim()} className="rounded-lg bg-accent text-accent-foreground h-11 w-11 shrink-0 flex items-center justify-center disabled:opacity-40">
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}