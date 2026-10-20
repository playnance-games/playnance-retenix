import { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Send, Check } from "lucide-react";

const emptyCase = () => ({
  name: "", type: "cash", trigger_mode: "segment",
  conditions: { min_score: null, max_score: null, net_vs_house: "", max_risk: "", lifecycle: "", favorite_tag: "", feature_never_used: "", cash_window_free: false },
  action_template: "deposit_prompt", cash_formula: { lock_sweetener: "none", fixed_mode: false, fixed_amount: null },
  channel: "site", status: "on", segment_ids: [], fire_log: [], caps: {}, image_uri: "", creatives: [], shuffle_mode: false,
  button_label: "", button_link: "", content_text: "", message_text: "", message_link: "", survey_options: ["", "", ""],
});

export default function CaseCreateDialog({ open, onOpenChange, onCreated, segments = [], editCase = null, forAll = false }) {
  const [editing, setEditing] = useState(emptyCase());
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(false);
  const [saving, setSaving] = useState(false);
  const scrollRef = useRef(null);
  const isEdit = !!editCase?.id;

  useEffect(() => {
    if (open) {
      const base = editCase ? { ...editCase } : (forAll ? { ...emptyCase(), trigger_mode: "event", segment_ids: [] } : emptyCase());
      setEditing(base);
      setComplete(false); setInput("");
      setMessages(isEdit
        ? [{ role: "assistant", content: `Let's edit "${base.name}". What would you like to change?`, options: ["Change the target segment", "Update the message or content", "Rename the case"] }]
        : [{ role: "assistant", content: "Let's create a new case. What outcome do you want to drive?", options: ["Cash reward", "Education card", "Survey"] }]
      );
    }
  }, [open]);

  useEffect(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight); }, [messages, busy]);

  const send = async (text) => {
    if (!text.trim() || busy) return;
    const userMsg = text.trim();
    const history = messages.map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.content }));
    setMessages((m) => [...m, { role: "user", content: userMsg }, { role: "assistant", content: "thinking…", pending: true }]);
    setInput("");
    setBusy(true);
    try {
      const res = await base44.functions.invoke("aiAssistant", { task: "case_create_help", draft: editing, message: userMsg, history, forAll });
      const r = res.data.result || {};
      let nextEditing = editing;
      if (r.changes && Object.keys(r.changes).length) {
        nextEditing = { ...editing, ...r.changes };
        if (r.changes.conditions) nextEditing.conditions = { ...(editing.conditions || {}), ...r.changes.conditions };
        if (r.changes.segment_name) {
          const seg = segments.find((s) => s.name === r.changes.segment_name);
          if (seg) { nextEditing.segment_ids = [seg.id]; delete nextEditing.segment_name; }
        }
        setEditing(nextEditing);
      }
      setComplete(!!r.complete);
      setMessages((m) => m.map((x) => x.pending ? { role: "assistant", content: r.answer || "Done.", options: r.options || [], pending: false } : x));
      if (r.complete) await doSave(nextEditing);
    } catch (e) {
      setMessages((m) => m.map((x) => x.pending ? { role: "assistant", content: `Error: ${e.message}`, pending: false } : x));
    } finally {
      setBusy(false);
    }
  };

  const doSave = async (data) => {
    if (saving) return;
    setSaving(true);
    try {
      const d = { ...data };
      if (d.type !== "cash") d.cash_formula = { lock_sweetener: "none" };
      if (d.trigger_mode !== "segment") d.segment_ids = [];
      if (d.channel !== "site" && ["wheel", "slot", "deposit_prompt", "payment_methods", "birthday", "survey_3choice", "education_card"].includes(d.action_template)) d.action_template = d.channel === "whatsapp" ? "whatsapp_copy" : "telegram_copy";
      if (d.channel === "site" && ["telegram_copy", "whatsapp_copy"].includes(d.action_template)) d.action_template = "deposit_prompt";
      if (d.id) {
        await base44.entities.UseCase.update(d.id, d);
      } else {
        await base44.entities.UseCase.create(d);
      }
      onCreated?.();
      onOpenChange(false);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: `Save error: ${e.message}` }]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden bg-card border-border flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2"><Sparkles className="w-5 h-5 text-accent" /> {isEdit ? "Edit case with AI" : "Create a new case with AI"}</DialogTitle>
        </DialogHeader>
        <p className="text-base text-muted-foreground -mt-2 leading-relaxed">Answer the questions step by step. The assistant builds the case for you — no manual forms.</p>
        <div ref={scrollRef} className="h-[460px] overflow-auto space-y-4 my-3 pr-1">
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : "flex flex-col items-start gap-2"}>
              <div className={`max-w-[80%] rounded-xl px-4 py-3 text-base leading-relaxed border ${m.role === "user" ? "bg-accent text-accent-foreground border-accent" : m.pending ? "bg-muted/40 text-muted-foreground border-border animate-pulse" : "bg-muted/40 text-foreground border-border"}`}>
                {m.content}
              </div>
              {m.role === "assistant" && !m.pending && m.options && m.options.length > 0 && i === messages.length - 1 && (
                <div className="flex flex-wrap gap-2 max-w-[80%]">
                  {m.options.map((opt, oi) => (
                    <button key={oi} onClick={() => send(opt)} disabled={busy} className="rounded-lg border border-accent/40 bg-accent/5 text-accent px-3.5 py-2 text-sm hover:bg-accent/10 disabled:opacity-40 transition">
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        {complete && (
          <div className="rounded-xl border border-accent/30 bg-accent/5 p-3 mb-2 text-base flex items-center gap-2"><Check className="w-4 h-4 text-accent" /> {saving ? "Saving your case…" : "Your case is ready — saving automatically."}</div>
        )}
        <div className="flex gap-2 mb-1">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send(input)} placeholder="Answer the question…" className="flex-1 rounded-lg bg-card border border-border px-4 py-3 text-base focus:outline-none focus:ring-1 focus:ring-accent" />
          <button onClick={() => send(input)} disabled={busy || !input.trim()} className="rounded-lg bg-accent text-accent-foreground px-5 disabled:opacity-40"><Send className="w-5 h-5" /></button>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => doSave(editing)} disabled={saving || !editing.name.trim()}>{saving ? "Saving…" : isEdit ? "Save changes" : "Save case"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}