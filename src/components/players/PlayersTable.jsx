import { Link, useNavigate } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LifecycleChip } from "@/components/tags";
import InfoTip from "@/components/InfoTip";
import PlayerNetPosition from "@/components/players/PlayerNetPosition";

export default function PlayersTable({ players, loading }) {
  const navigate = useNavigate();
  return <div className="lux-surface rounded-xl border border-border overflow-x-auto">
    <table className="w-full min-w-[660px] text-sm">
      <thead><tr className="text-left border-b border-border">
        <th className="px-5 py-3">Player</th>
        <th className="px-5 py-3">Score<InfoTip text="Retention score out of 10. Open full details for the breakdown." /></th>
        <th className="px-5 py-3">Balance vs house<InfoTip text="The player's net position, not their remaining wallet balance." /></th>
        <th className="px-5 py-3">Lifecycle</th>
        <th className="px-5 py-3 text-right">Details<InfoTip text="Open the player's complete profile, activity and available cases." /></th>
      </tr></thead>
      <tbody>
        {loading ? <tr><td colSpan={5} className="px-5 py-10 text-muted-foreground">Loading players…</td></tr> : players.map(player => <tr key={player.id} onClick={() => navigate(`/players/${player.id}`)} className="border-b border-border cursor-pointer">
          <td className="px-5"><div className="font-medium">{player.name}</div><p className="text-[11px] text-muted-foreground mt-1 font-mono">{player.player_id}</p></td>
          <td className="px-5"><span className="font-semibold tabular-nums">{Number(player.score).toFixed(2)}</span><span className="text-xs text-muted-foreground"> / 10</span></td>
          <td className="px-5"><PlayerNetPosition player={player} /></td>
          <td className="px-5"><LifecycleChip v={player.lifecycle} /></td>
          <td className="px-5 text-right"><Button asChild variant="outline" size="sm"><Link to={`/players/${player.id}`} onClick={e => e.stopPropagation()} aria-label={`Full details for ${player.name}`}>Full details<ArrowUpRight className="w-3.5 h-3.5" /></Link></Button></td>
        </tr>)}
        {!loading && !players.length && <tr><td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">No players match.</td></tr>}
      </tbody>
    </table>
  </div>;
}