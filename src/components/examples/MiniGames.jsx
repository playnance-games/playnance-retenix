import { useCallback, useEffect, useRef, useState } from "react";
import { Gift, RotateCcw, Sparkles, X } from "lucide-react";
import "@/components/examples/examples.css";

export const PROMO_IMAGE = "/examples/promo-gift.jpg";

const WHEEL_PRIZES = ["$10 bonus", "25 free spins", "2× points", "$5 bonus", "50 free spins", "Try again", "$20 bonus", "Mystery gift"];
const WHEEL_COLORS = ["#e33e68", "#f59e0b", "#8b5cf6", "#10b981", "#3b82f6", "#94a3b8", "#ec4899", "#f97316"];
const CARD_PRIZES = ["$15 bonus", "30 free spins", "Better luck next time"];
const SLOT_SYMBOLS = ["🍒", "🍋", "⭐", "7", "🔔", "💎"];
const SCRATCH_PRIZES = ["$25 bonus", "40 free spins", "$10 bonus", "Free bet $5"];
const GIFT_PRIZES = ["$10 bonus", "20 free spins", "VIP day pass", "$5 bonus", "Mystery spins", "2× points"];
const GIFT_COLORS = ["#e33e68", "#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899"];

const pick = (list) => list[Math.floor(Math.random() * list.length)];

function Result({ children, tone = "win" }) {
  return <div className={`xg-result ${tone}`} role="status">{children}</div>;
}

function PlayAgain({ onClick }) {
  return <button type="button" className="xg-ghost" onClick={onClick}><RotateCcw className="w-4 h-4" /> Play again</button>;
}

function polar(deg, r) {
  const rad = (deg * Math.PI) / 180;
  return [100 + r * Math.sin(rad), 100 - r * Math.cos(rad)];
}

function WheelFace() {
  const slice = 360 / WHEEL_PRIZES.length;
  return (
    <svg viewBox="0 0 200 200" className="xg-wheelsvg" aria-hidden="true">
      {WHEEL_PRIZES.map((prize, i) => {
        const [x0, y0] = polar(i * slice, 96);
        const [x1, y1] = polar((i + 1) * slice, 96);
        const mid = i * slice + slice / 2;
        return (
          <g key={prize}>
            <path d={`M100 100 L${x0} ${y0} A96 96 0 0 1 ${x1} ${y1} Z`} fill={WHEEL_COLORS[i]} stroke="#fff" strokeWidth="1.5" />
            <text x="100" y="34" transform={`rotate(${mid} 100 100)`} textAnchor="middle" fill="#fff" fontSize="9" fontWeight="700">{prize}</text>
          </g>
        );
      })}
      <circle cx="100" cy="100" r="16" fill="#fff" stroke="#1f2937" strokeWidth="3" />
      <circle cx="100" cy="100" r="5" fill="#1f2937" />
    </svg>
  );
}

export function WheelDemo() {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [prize, setPrize] = useState(null);
  const target = useRef(null);
  const spin = () => {
    if (spinning) return;
    const index = Math.floor(Math.random() * WHEEL_PRIZES.length);
    const slice = 360 / WHEEL_PRIZES.length;
    const center = index * slice + slice / 2;
    const delta = (((360 - center - (rotation % 360)) % 360) + 360) % 360;
    target.current = index;
    setPrize(null);
    setSpinning(true);
    setRotation(rotation + 360 * 5 + delta);
  };
  return (
    <div className="xg-stage">
      <div className="xg-wheelwrap">
        <span className="xg-pointer" aria-hidden="true" />
        <div className="xg-wheel" style={{ transform: `rotate(${rotation}deg)` }} onTransitionEnd={() => { setSpinning(false); setPrize(WHEEL_PRIZES[target.current]); }}>
          <WheelFace />
        </div>
      </div>
      {prize ? <Result tone={prize === "Try again" ? "lose" : "win"}>{prize === "Try again" ? "No prize this time — spin again tomorrow." : `You won ${prize}!`}</Result> : null}
      <button type="button" className="xg-primary" onClick={spin} disabled={spinning}>{spinning ? "Spinning…" : prize ? "Spin again" : "Spin the wheel"}</button>
    </div>
  );
}

export function CardsDemo() {
  const [deck, setDeck] = useState(() => [...CARD_PRIZES].sort(() => Math.random() - 0.5));
  const [chosen, setChosen] = useState(null);
  const [revealAll, setRevealAll] = useState(false);
  useEffect(() => {
    if (chosen === null) return undefined;
    const t = setTimeout(() => setRevealAll(true), 700);
    return () => clearTimeout(t);
  }, [chosen]);
  const reset = () => { setChosen(null); setRevealAll(false); setDeck([...CARD_PRIZES].sort(() => Math.random() - 0.5)); };
  const won = chosen !== null ? deck[chosen] : null;
  return (
    <div className="xg-stage">
      <p className="xg-hint">{chosen === null ? "Pick one card to reveal your prize." : " "}</p>
      <div className="xg-cards">
        {deck.map((prize, i) => {
          const flipped = chosen === i || (revealAll && chosen !== null);
          return (
            <button key={i} type="button" className={`xg-card${flipped ? " flipped" : ""}${chosen === i ? " chosen" : ""}`} onClick={() => chosen === null && setChosen(i)} disabled={chosen !== null} aria-label={flipped ? prize : `Card ${i + 1}`}>
              <span className="xg-cardinner">
                <span className="xg-cardface xg-cardback"><Sparkles className="w-7 h-7" /></span>
                <span className="xg-cardface xg-cardfront">{prize}</span>
              </span>
            </button>
          );
        })}
      </div>
      {won && revealAll ? <Result tone={won.startsWith("Better") ? "lose" : "win"}>{won.startsWith("Better") ? "No prize on that card." : `You picked ${won}!`}</Result> : null}
      {chosen !== null && revealAll ? <PlayAgain onClick={reset} /> : null}
    </div>
  );
}

export function SlotDemo() {
  const [reels, setReels] = useState(["7", "7", "7"]);
  const [spinning, setSpinning] = useState([false, false, false]);
  const [outcome, setOutcome] = useState(null);
  const timers = useRef([]);
  const spinningRef = useRef([false, false, false]);
  useEffect(() => () => timers.current.forEach((t) => { clearTimeout(t); clearInterval(t); }), []);
  const spin = () => {
    if (spinning.some(Boolean)) return;
    setOutcome(null);
    const final = Math.random() < 0.3
      ? Array(3).fill(pick(SLOT_SYMBOLS))
      : [pick(SLOT_SYMBOLS), pick(SLOT_SYMBOLS), pick(SLOT_SYMBOLS)];
    spinningRef.current = [true, true, true];
    setSpinning([true, true, true]);
    const tick = setInterval(() => {
      setReels((r) => r.map((s, i) => (spinningRef.current[i] ? pick(SLOT_SYMBOLS) : s)));
    }, 70);
    timers.current.push(tick);
    [900, 1300, 1700].forEach((ms, i) => {
      timers.current.push(setTimeout(() => {
        spinningRef.current[i] = false;
        setSpinning((s) => s.map((v, j) => (j === i ? false : v)));
        setReels((r) => r.map((s, j) => (j === i ? final[j] : s)));
        if (i === 2) {
          clearInterval(tick);
          const unique = new Set(final).size;
          setOutcome(unique === 1 ? "jackpot" : unique === 2 ? "pair" : "none");
        }
      }, ms));
    });
  };
  return (
    <div className="xg-stage">
      <div className="xg-slot">
        <div className="xg-slottitle">MEGA SPIN</div>
        <div className="xg-reels">
          {reels.map((s, i) => <div key={i} className={`xg-reel${spinning[i] ? " spinning" : ""}`}><span>{s}</span></div>)}
        </div>
      </div>
      {outcome === "jackpot" && <Result>Jackpot! Three {reels[0]} — 100 free spins.</Result>}
      {outcome === "pair" && <Result>Two of a kind — 10 free spins.</Result>}
      {outcome === "none" && <Result tone="lose">No match. Try another spin.</Result>}
      <button type="button" className="xg-primary" onClick={spin} disabled={spinning.some(Boolean)}>{spinning.some(Boolean) ? "Spinning…" : "Spin"}</button>
    </div>
  );
}

export function ScratchDemo() {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [prize, setPrize] = useState(() => pick(SCRATCH_PRIZES));
  const [revealed, setRevealed] = useState(false);
  const [round, setRound] = useState(0);

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    const grad = ctx.createLinearGradient(0, 0, rect.width, rect.height);
    grad.addColorStop(0, "#cbd5e1");
    grad.addColorStop(0.5, "#e2e8f0");
    grad.addColorStop(1, "#94a3b8");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = "#475569";
    ctx.font = "600 16px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Scratch here", rect.width / 2, rect.height / 2);
  }, []);

  useEffect(() => { paint(); }, [paint, round]);

  const scratch = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || revealed) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(e.clientX - rect.left, e.clientY - rect.top, 20, 0, Math.PI * 2);
    ctx.fill();
  };

  const checkCleared = () => {
    const canvas = canvasRef.current;
    if (!canvas || revealed) return;
    const { data } = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height);
    let clear = 0;
    let total = 0;
    for (let i = 3; i < data.length; i += 4 * 24) { total += 1; if (data[i] === 0) clear += 1; }
    if (total && clear / total > 0.45) setRevealed(true);
  };

  const reset = () => { setRevealed(false); setPrize(pick(SCRATCH_PRIZES)); setRound((r) => r + 1); };

  return (
    <div className="xg-stage">
      <p className="xg-hint">Drag across the card to scratch it off.</p>
      <div className="xg-scratch">
        <div className="xg-scratchprize"><Gift className="w-7 h-7" /><span>{prize}</span></div>
        <canvas
          ref={canvasRef}
          className={`xg-scratchcanvas${revealed ? " done" : ""}`}
          onPointerDown={(e) => { drawing.current = true; e.currentTarget.setPointerCapture(e.pointerId); scratch(e); }}
          onPointerMove={(e) => { if (drawing.current) scratch(e); }}
          onPointerUp={() => { drawing.current = false; checkCleared(); }}
          onPointerLeave={() => { if (drawing.current) { drawing.current = false; checkCleared(); } }}
          aria-label="Scratch card"
        />
      </div>
      {revealed ? <><Result>You revealed {prize}!</Result><PlayAgain onClick={reset} /></> : null}
    </div>
  );
}

function useCountdown(seconds) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    const t = setInterval(() => setLeft((s) => (s > 0 ? s - 1 : seconds)), 1000);
    return () => clearInterval(t);
  }, [seconds]);
  const h = String(Math.floor(left / 3600)).padStart(2, "0");
  const m = String(Math.floor((left % 3600) / 60)).padStart(2, "0");
  const s = String(left % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export function BannerDemo() {
  const [claimed, setClaimed] = useState(false);
  const [closed, setClosed] = useState(false);
  const clock = useCountdown(2 * 3600 + 14 * 60 + 9);
  if (closed) {
    return (
      <div className="xg-stage">
        <p className="xg-hint">The player dismissed the banner.</p>
        <PlayAgain onClick={() => { setClosed(false); setClaimed(false); }} />
      </div>
    );
  }
  return (
    <div className="xg-stage">
      <div className="xg-banner" style={{ backgroundImage: `url(${PROMO_IMAGE})` }}>
        <button type="button" className="xg-bannerclose" onClick={() => setClosed(true)} aria-label="Dismiss banner"><X className="w-4 h-4" /></button>
        <div className="xg-bannercopy">
          <span className="xg-bannertag">Weekend reload</span>
          <h3>50% up to $100</h3>
          <p>Deposit before Sunday midnight and we&apos;ll top up half of it.</p>
          <div className="xg-bannerrow">
            <button type="button" className="xg-primary" onClick={() => setClaimed(true)} disabled={claimed}>{claimed ? "Claimed ✓" : "Claim bonus"}</button>
            <span className="xg-timer">Ends in {clock}</span>
          </div>
        </div>
      </div>
      {claimed ? <Result>Bonus added — it unlocks with your next deposit.</Result> : null}
    </div>
  );
}

export function GiftMachineDemo() {
  const [phase, setPhase] = useState("idle");
  const [chosen, setChosen] = useState(null);
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const pull = () => {
    if (phase !== "idle") return;
    const index = Math.floor(Math.random() * GIFT_PRIZES.length);
    setChosen(index);
    setPhase("shaking");
    timers.current.push(setTimeout(() => setPhase("dropping"), 900));
    timers.current.push(setTimeout(() => setPhase("open"), 1700));
  };
  const reset = () => { setPhase("idle"); setChosen(null); };
  return (
    <div className="xg-stage">
      <div className="xg-machine">
        <div className="xg-machinetop">GIFT MACHINE</div>
        <div className={`xg-glass${phase === "shaking" ? " shaking" : ""}`}>
          {GIFT_PRIZES.map((_, i) => (
            <span key={i} className={`xg-box${chosen === i && phase !== "idle" && phase !== "shaking" ? " dropped" : ""}`} style={{ "--box": GIFT_COLORS[i] }}>
              <Gift className="w-6 h-6" />
            </span>
          ))}
        </div>
        <div className="xg-tray">
          {phase === "open" && chosen !== null
            ? <span className="xg-trayprize" style={{ "--box": GIFT_COLORS[chosen] }}><Gift className="w-5 h-5" /> {GIFT_PRIZES[chosen]}</span>
            : <span className="xg-trayempty">{phase === "idle" ? "Your gift drops here" : "…"}</span>}
        </div>
      </div>
      {phase === "open" ? <><Result>The machine dropped {GIFT_PRIZES[chosen]}!</Result><PlayAgain onClick={reset} /></> : (
        <button type="button" className="xg-primary" onClick={pull} disabled={phase !== "idle"}>{phase === "idle" ? "Pull the lever" : "Dropping…"}</button>
      )}
    </div>
  );
}

function WheelThumb() {
  return <div className="xg-thumbwheel"><WheelFace /></div>;
}

function CardsThumb() {
  return <div className="xg-thumbcards">{[0, 1, 2].map((i) => <span key={i}><Sparkles className="w-4 h-4" /></span>)}</div>;
}

function SlotThumb() {
  return <div className="xg-slot xg-slotmini"><div className="xg-slottitle">MEGA SPIN</div><div className="xg-reels">{["7", "⭐", "7"].map((s, i) => <div key={i} className="xg-reel"><span>{s}</span></div>)}</div></div>;
}

function ScratchThumb() {
  return <div className="xg-thumbscratch"><span>Scratch here</span></div>;
}

function BannerThumb() {
  return <div className="xg-thumbbanner" style={{ backgroundImage: `url(${PROMO_IMAGE})` }}><span>50% up to $100</span></div>;
}

function GiftThumb() {
  return <div className="xg-thumbgift">{GIFT_COLORS.slice(0, 6).map((c) => <span key={c} style={{ "--box": c }}><Gift className="w-4 h-4" /></span>)}</div>;
}

export const MINI_GAMES = [
  { id: "wheel", title: "Spinning wheel", blurb: "Spin for one of eight prizes.", Thumb: WheelThumb, Demo: WheelDemo },
  { id: "cards", title: "3 cards selection", blurb: "Pick one of three face-down cards.", Thumb: CardsThumb, Demo: CardsDemo },
  { id: "slot", title: "Slot", blurb: "Three reels — match symbols to win.", Thumb: SlotThumb, Demo: SlotDemo },
  { id: "scratch", title: "Scratch card", blurb: "Scratch off the foil to reveal a prize.", Thumb: ScratchThumb, Demo: ScratchDemo },
  { id: "banner", title: "Regular banner", blurb: "A promo banner with a claim button.", Thumb: BannerThumb, Demo: BannerDemo },
  { id: "gift", title: "Gift machine", blurb: "Pull the lever and a gift drops out.", Thumb: GiftThumb, Demo: GiftMachineDemo },
];
