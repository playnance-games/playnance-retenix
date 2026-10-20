import { fmtMoney } from "@/lib/retenixLogic";

export default function PlayerNetPosition({ player }) {
  const label = { up: "Profit vs house", down: "Lose vs house", too_thin: "Thin margin" }[player.net_vs_house] || "Not recorded";
  const color =
    player.net_vs_house === "up" ? "text-emerald-600"
    : player.net_vs_house === "down" ? "text-red-600"
    : "text-amber-600";
  const dot =
    player.net_vs_house === "up" ? "bg-emerald-500"
    : player.net_vs_house === "down" ? "bg-red-500"
    : "bg-amber-500";
  return <div className="flex items-center gap-2">
    <span className={`w-2.5 h-2.5 rounded-full shrink-0 border-2 border-black ${dot}`} />
    <div>
      <div className={`font-bold tabular-nums ${color}`}>{player.net_amount == null ? "—" : fmtMoney(player.net_amount)}</div>
      <div className="mt-0.5 text-[11px] text-muted-foreground font-semibold">{label}</div>
    </div>
  </div>;
}