// Renders a visual example for a case based on its action template.
// Used as a thumbnail in the case table and full-size in the preview dialog.
import { Gift, CreditCard, Cake, GraduationCap, MessageCircle, Send, Sparkles, DollarSign } from "lucide-react";

const SEGMENTS = ["#22d3ee", "#f59e0b", "#a78bfa", "#34d399", "#f472b6", "#60a5fa"];

function Wheel() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" aria-label="Prize wheel">
      <circle cx="50" cy="50" r="46" fill="none" stroke="hsl(var(--border))" strokeWidth="2" />
      {SEGMENTS.map((c, i) => {
        const a0 = (i / SEGMENTS.length) * 360;
        const a1 = ((i + 1) / SEGMENTS.length) * 360;
        const p = (deg, r) => [50 + r * Math.cos((deg - 90) * Math.PI / 180), 50 + r * Math.sin((deg - 90) * Math.PI / 180)];
        const [x0, y0] = p(a0, 46), [x1, y1] = p(a1, 46), [xc, yc] = p((a0 + a1) / 2, 46);
        return <path key={i} d={`M50 50 L${x0} ${y0} A46 46 0 0 1 ${x1} ${y1} Z`} fill={c} fillOpacity="0.82" stroke="hsl(var(--card))" strokeWidth="1" />;
      })}
      <circle cx="50" cy="50" r="7" fill="hsl(var(--card))" stroke="hsl(var(--accent))" strokeWidth="2" />
      <path d="M50 4 L44 16 L56 16 Z" fill="hsl(var(--accent))" />
      <g style={{ transformOrigin: "50px 50px", animation: "rxWheel 12s linear infinite" }}>
        {SEGMENTS.map((_, i) => {
          const mid = ((i + 0.5) / SEGMENTS.length) * 360;
          const [x, y] = [50 + 30 * Math.cos((mid - 90) * Math.PI / 180), 50 + 30 * Math.sin((mid - 90) * Math.PI / 180)];
          return <text key={i} x={x} y={y} fill="white" fontSize="6" fontWeight="700" textAnchor="middle" dominantBaseline="middle">{["$", "★", "♥", "♦", "♣", "♠"][i]}</text>;
        })}
      </g>
    </svg>
  );
}

function Slot() {
  const reels = [["7", "★", "♦"], ["♣", "7", "★"], ["♦", "♣", "7"]];
  return (
    <div className="w-full h-full rounded-lg bg-gradient-to-b from-[#1a2740] to-[#0f1830] p-2 flex flex-col gap-1.5 border border-amber-500/30">
      <div className="text-center text-[8px] font-bold tracking-widest text-amber-400">MEGA WIN</div>
      <div className="grid grid-cols-3 gap-1 flex-1">
        {reels.map((reel, i) => (
          <div key={i} className="rounded bg-black/60 border border-white/10 flex items-center justify-center overflow-hidden">
            <div style={{ animation: `rxReel ${1.6 + i * 0.4}s ease-out infinite` }} className="text-white font-bold text-center">
              {reel.concat(reel).map((s, j) => <div key={j} className="h-full flex items-center justify-center" style={{ height: "100%" }}>{s}</div>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Survey({ options = [] }) {
  const opts = options.filter(Boolean).slice(0, 3);
  const labels = opts.length ? opts : ["Slots", "Live casino", "Sports"];
  return (
    <div className="w-full h-full flex flex-col justify-center gap-2 p-2">
      <div className="text-[10px] font-semibold text-accent">Pick your favorite</div>
      {labels.map((l, i) => (
        <div key={i} className="rounded-md border border-border bg-card px-2 py-1.5 text-[11px] text-center text-foreground">{l}</div>
      ))}
    </div>
  );
}

function EducationCard() {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center gap-2 p-2 text-center">
      <div className="w-9 h-9 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center"><GraduationCap className="w-5 h-5 text-accent" /></div>
      <div className="text-[11px] font-semibold">Learn the feature</div>
      <div className="text-[9px] text-muted-foreground">Tap to see how it works</div>
    </div>
  );
}

function DepositPrompt() {
  return (
    <div className="w-full h-full flex flex-col justify-center gap-2 p-2">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold"><DollarSign className="w-4 h-4 text-gold" /> Add funds to play</div>
      <div className="text-[9px] text-muted-foreground">Continue your session with a quick top-up.</div>
      <div className="rounded-md bg-primary text-primary-foreground text-[10px] font-medium px-2 py-1.5 text-center w-fit">Deposit now</div>
    </div>
  );
}

function PaymentMethods() {
  return (
    <div className="w-full h-full flex flex-col justify-center gap-1.5 p-2">
      <div className="text-[10px] font-semibold flex items-center gap-1"><CreditCard className="w-3.5 h-3.5 text-accent" /> Choose a method</div>
      {["Visa", "Mastercard", "Crypto"].map((m) => (
        <div key={m} className="rounded border border-border bg-card px-2 py-1 text-[10px] text-center">{m}</div>
      ))}
    </div>
  );
}

function Birthday() {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center gap-1.5 p-2 text-center">
      <Cake className="w-8 h-8 text-pink-400" />
      <div className="text-[11px] font-semibold">Happy birthday!</div>
      <div className="text-[9px] text-muted-foreground">A gift is waiting for you</div>
    </div>
  );
}

function MessageBubble({ channel }) {
  const isTelegram = channel === "telegram";
  return (
    <div className="w-full h-full flex flex-col justify-center gap-1.5 p-2">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold" style={{ color: isTelegram ? "#38a3d6" : "#25d366" }}>
        {isTelegram ? <Send className="w-3.5 h-3.5" /> : <MessageCircle className="w-3.5 h-3.5" />} {isTelegram ? "Telegram" : "WhatsApp"}
      </div>
      <div className="rounded-xl rounded-tl-none bg-card border border-border px-2 py-1.5 text-[9px] text-foreground">Your reward is ready 🎁 Tap to claim.</div>
    </div>
  );
}

const VISUALS = {
  wheel: Wheel,
  slot: Slot,
  survey_3choice: Survey,
  education_card: EducationCard,
  deposit_prompt: DepositPrompt,
  payment_methods: PaymentMethods,
  birthday: Birthday,
  telegram_copy: MessageBubble,
  whatsapp_copy: MessageBubble,
};

export default function CaseVisual({ uc, className = "" }) {
  const template = uc?.action_template || "";
  const Visual = VISUALS[template];
  return <div className={`relative overflow-hidden rounded-lg border border-border bg-gradient-to-b from-card to-muted/40 ${className}`}>
    {Visual ? <Visual options={uc?.survey_options} channel={uc?.channel} /> : (
      <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 p-2 text-center">
        <Sparkles className="w-6 h-6 text-accent" />
        <div className="text-[10px] font-medium text-muted-foreground">{template ? template.replace(/_/g, " ") : "Case"}</div>
      </div>
    )}
  </div>;
}