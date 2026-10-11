import { Link } from "react-router-dom";
import PlayerNetPosition from "@/components/players/PlayerNetPosition";

export default function LiveSessionRow({ player }) {
  return <Link to={`/players/${player.id}`} className="grid grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_110px_minmax(0,1fr)] items-center gap-x-6 gap-y-5 px-5 py-5 border-b border-border last:border-b-0 hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring transition-colors">
    <div className="min-w-0">
      <div className="font-medium flex items-center gap-2"><span className="w-1.5 h-1.5 bg-primary rounded-full shrink-0" /><span className="truncate">{player.name}</span></div>
      <p className="mt-1 text-xs text-muted-foreground truncate pl-3.5">{player.current_game || "In session"}</p>
    </div>
    <div><span className="block xl:hidden text-[10px] text-muted-foreground mb-1">Score</span><span className="font-semibold tabular-nums">{Number(player.score).toFixed(2)}<span className="font-normal text-muted-foreground text-xs"> / 10</span></span></div>
    <div><span className="block xl:hidden text-[10px] text-muted-foreground mb-1">Balance vs house</span><PlayerNetPosition player={player} /></div>
  </Link>;
}