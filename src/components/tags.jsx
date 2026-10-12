import { RISK_LEVELS } from "@/lib/riskLevels";

const CHIP = "px-2 py-0.5 rounded-full text-[11px] border-2 border-black font-bold";

export function ScoreBadge({ score }) {
  const color = score >= 7.5 ? "text-emerald-600" : score >= 5 ? "text-foreground" : "text-red-600";
  return <span className={`font-mono font-semibold ${color}`}>{Number(score).toFixed(2)}</span>;
}

const LIFECYCLE_TITLE = {
  new: "New — signed up recently, little activity yet.",
  active: "Active — depositing and playing regularly.",
  quiet: "Quiet — activity dropped below their usual rhythm.",
  "at-risk": "At-risk — near churn, intervene carefully.",
};

export function LifecycleChip({ v }) {
  const map = {
    new: "bg-sky-400 text-black",
    active: "bg-emerald-400 text-black",
    quiet: "bg-slate-300 text-black",
    "at-risk": "bg-red-400 text-black",
  };
  return <span title={LIFECYCLE_TITLE[v]} className={`${CHIP} ${map[v] || ""}`}>{v}</span>;
}

const NET_TITLE = {
  up: "Net up — cash cases disabled, education and games only.",
  down: "Net down — eligible for cash cases (subject to caps).",
  too_thin: "Too thin — margin too small for cash; favor activation/education.",
};

export function NetChip({ v, amount }) {
  const map = {
    up: "bg-emerald-400 text-black",
    down: "bg-red-400 text-black",
    too_thin: "bg-amber-400 text-black",
  };
  return (
    <span title={NET_TITLE[v]} className={`${CHIP} ${map[v] || ""}`}>
      {v}{amount != null ? ` · $${Math.abs(amount).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : ""}
    </span>
  );
}

export function RiskChip({ level }) {
  const meta = RISK_LEVELS.find((r) => r.level === Number(level)) || RISK_LEVELS[0];
  return (
    <span title={`${meta.word} — level ${meta.level} of 5. ${meta.hint}`} className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.cls}`}>
      {meta.word}
    </span>
  );
}

export function FavChips({ stated = [], seen = [] }) {
  const out = [];
  stated.slice(0, 3).forEach((g) => out.push({ g, inferred: false }));
  seen.slice(0, 3 - out.length).forEach((g) => {
    if (!stated.includes(g)) out.push({ g, inferred: true });
  });
  if (!out.length) return <span className="text-[11px] text-muted-foreground italic">no favorites</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {out.map((f, i) => (
        <span key={i} className={`px-1.5 py-0.5 rounded text-[11px] border-2 border-black font-bold ${f.inferred ? "bg-slate-200 text-black border-dashed" : "bg-sky-400 text-black"}`}>
          {f.g}{f.inferred ? "·" : ""}
        </span>
      ))}
    </div>
  );
}