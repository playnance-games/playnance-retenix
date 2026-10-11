import { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Lightbulb, Loader2, TrendingUp, Pause, FlaskConical, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { caseResults } from "@/lib/results";

const CLASSIC_CASES = [
  { name: "Welcome Bonus Wheel", type: "activation", trigger_mode: "event", event_trigger: "first_deposit", action_template: "wheel", channel: "site", content_text: "Spin the wheel to claim your welcome bonus!", button_label: "Spin now", button_link: "/bonus" },
  { name: "Daily Spin Slot", type: "engagement", trigger_mode: "segment", event_trigger: "", action_template: "slot", channel: "site", content_text: "Your daily free spin is waiting.", button_label: "Play", button_link: "/slots" },
  { name: "Deposit Boost Prompt", type: "cashier", trigger_mode: "event", event_trigger: "failed_deposit", action_template: "deposit_prompt", channel: "site", content_text: "Your deposit didn't go through. Try again for a bonus on top.", button_label: "Retry deposit", button_link: "/cashier" },
  { name: "Birthday Gift", type: "cash", trigger_mode: "event", event_trigger: "birthday", action_template: "birthday", channel: "email", message_text: "Happy birthday! Here's a special cash gift to celebrate.", message_link: "/claim" },
  { name: "Reactivation Survey", type: "survey", trigger_mode: "segment", event_trigger: "", action_template: "survey_3choice", channel: "email", message_text: "We miss you. Tell us why you've been away and get a reward.", survey_options: ["Too busy", "Found another site", "Nothing to play"] },
  { name: "Payment Methods Update", type: "cashier", trigger_mode: "event", event_trigger: "withdrawal_requested", action_template: "payment_methods", channel: "site", content_text: "Update your payment methods for faster withdrawals.", button_label: "Update now", button_link: "/cashier" },
  { name: "Telegram Channel Onboarding", type: "channel", trigger_mode: "segment", event_trigger: "", action_template: "telegram_copy", channel: "telegram", message_text: "Join our Telegram channel for exclusive promos and drops.", message_link: "https://t.me/playnance" },
  { name: "WhatsApp Re-engagement", type: "channel", trigger_mode: "segment", event_trigger: "", action_template: "whatsapp_copy", channel: "whatsapp", message_text: "We've got a bonus waiting for you. Tap to claim.", message_link: "/claim" },
  { name: "New Game Education", type: "education", trigger_mode: "event", event_trigger: "new_game_launch", action_template: "education_card", channel: "site", content_text: "A new game just launched. Learn how to play in 60 seconds.", button_label: "Learn more", button_link: "/games/new" },
  { name: "Cashback Offer", type: "cash", trigger_mode: "segment", event_trigger: "", action_template: "deposit_prompt", channel: "email", message_text: "You're eligible for cashback this week. Deposit to unlock it.", message_link: "/cashier" },
];

export default function Recommendations({ open, onOpenChange, onCreated }) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState({});

  const load = async () => {
    const c = await base44.entities.UseCase.list();
    setCases(c);
    setLoading(false);
  };
  useEffect(() => { if (open) load(); }, [open]);

  const ranked = useMemo(
    () => cases.map((c) => ({ uc: c, ...caseResults(c) })).sort((a, b) => b.score - a.score),
    [cases]
  );

  const top = ranked.filter((r) => r.fires > 0).slice(0, 3);
  const low = ranked.filter((r) => r.fires >= 3 && r.rate < 0.3).slice(0, 3);
  const untested = ranked.filter((r) => r.fires === 0).slice(0, 3);

  const scale = async (r) => {
    setBusy((b) => ({ ...b, [r.uc.id + "s"]: true }));
    try {
      const copy = { ...r.uc, name: r.uc.name + " (copy)", status: "on", fire_log: [] };
      delete copy.id;
      await base44.entities.UseCase.create(copy);
      onCreated?.();
      load();
    } finally {
      setBusy((b) => ({ ...b, [r.uc.id + "s"]: false }));
    }
  };
  const pause = async (r) => {
    setBusy((b) => ({ ...b, [r.uc.id + "p"]: true }));
    try {
      await base44.entities.UseCase.update(r.uc.id, { status: "off" });
      onCreated?.();
      load();
    } finally {
      setBusy((b) => ({ ...b, [r.uc.id + "p"]: false }));
    }
  };

  const existingNames = useMemo(() => new Set(cases.map((c) => c.name)), [cases]);
  const addClassic = async (c) => {
    setBusy((b) => ({ ...b, ["cl-" + c.name]: true }));
    try {
      await base44.entities.UseCase.create({
        ...c,
        status: "on",
        segment_ids: [],
        fire_log: [],
        caps: {},
        image_uri: "",
        conditions: { min_score: null, max_score: null, net_vs_house: "", max_risk: "", lifecycle: "", favorite_tag: "", feature_never_used: "", cash_window_free: false },
      });
      onCreated?.();
      load();
    } finally {
      setBusy((b) => ({ ...b, ["cl-" + c.name]: false }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[92vw] max-w-5xl max-h-[85vh] overflow-auto bg-card border border-border shadow-2xl rounded-2xl p-0">
        <DialogHeader className="px-6 py-5 border-b border-border bg-card">
          <DialogTitle className="flex items-center gap-2"><Lightbulb className="w-4 h-4 text-accent" /> Recommendations</DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">Data-driven suggestions based on case results, plus classic starter cases you can add in one click.</p>
        </DialogHeader>
        <div className="p-5">
        {loading ? (
          <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin" /> Analyzing results…</div>
        ) : (
          <div className="space-y-5">
            <Section icon={Plus} title="Classic starter cases (add in one click)" empty="">
              {CLASSIC_CASES.filter((c) => !existingNames.has(c.name)).slice(0, 10).map((c) => (
                <Row key={c.name} title={c.name} sub={`${c.type} · ${c.trigger_mode} · ${c.channel}`}
                  action={<button onClick={() => addClassic(c)} disabled={busy["cl-" + c.name]} className="shrink-0 flex items-center gap-1 text-xs bg-accent text-accent-foreground rounded-lg px-2.5 py-1.5 disabled:opacity-50"><Plus className="w-3.5 h-3.5" /> Add</button>} />
              ))}
              {CLASSIC_CASES.every((c) => existingNames.has(c.name)) && <div className="text-xs text-foreground/50 italic">All classic starter cases are already in your register.</div>}
            </Section>
            <Section icon={TrendingUp} title="Scale these (top converters)" empty="No fired cases yet — fire a case from a player card to gather results.">
              {top.map((r) => (
                <Row key={r.uc.id} title={r.uc.name} sub={`${r.conv} conversions · ${(r.rate * 100).toFixed(0)}% response · ${r.fires} fires`}
                  action={<button onClick={() => scale(r)} disabled={busy[r.uc.id + "s"]} className="shrink-0 flex items-center gap-1 text-xs bg-accent text-accent-foreground rounded-lg px-2.5 py-1.5 disabled:opacity-50"><Plus className="w-3.5 h-3.5" /> Duplicate</button>} />
              ))}
            </Section>
            <Section icon={Pause} title="Tune these (low response)" empty="No underperformers detected.">
              {low.map((r) => (
                <Row key={r.uc.id} title={r.uc.name} sub={`${(r.rate * 100).toFixed(0)}% response across ${r.fires} fires`}
                  action={<button onClick={() => pause(r)} disabled={busy[r.uc.id + "p"]} className="shrink-0 flex items-center gap-1 text-xs border border-border rounded-lg px-2.5 py-1.5 hover:border-destructive/50 hover:text-destructive disabled:opacity-50"><Pause className="w-3.5 h-3.5" /> Pause</button>} />
              ))}
            </Section>
            <Section icon={FlaskConical} title="Test these (no data yet)" empty="Every case has been fired at least once.">
              {untested.map((r) => (
                <Row key={r.uc.id} title={r.uc.name} sub="Not fired yet — fire it from a player card to gather results."
                  action={<span className="text-[10px] font-semibold uppercase tracking-wide rounded bg-accent/10 text-accent px-2 py-0.5">needs data</span>} />
              ))}
            </Section>
          </div>
        )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Section({ icon: Icon, title, children, empty }) {
  const has = Array.isArray(children) && children.length > 0;
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-foreground/70 mb-2 flex items-center gap-1"><Icon className="w-3.5 h-3.5 text-accent" /> {title}</div>
      <div className="space-y-2">
        {has ? children : <div className="text-xs text-foreground/50 italic">{empty}</div>}
      </div>
    </div>
  );
}

function Row({ title, sub, action }) {
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground truncate">{title}</div>
        <div className="text-[11px] text-foreground/60 mt-0.5">{sub}</div>
      </div>
      {action}
    </div>
  );
}