import { useEffect, useState } from "react";
import { loadPlayersWithStatus } from '@/lib/playerData';
import { Radio } from "lucide-react";
import LiveSessionRow from "@/components/players/LiveSessionRow";
import InfoTip from "@/components/InfoTip";

export default function LiveBoard() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setPlayers(await loadPlayersWithStatus());
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="p-10 text-muted-foreground">Loading…</div>;

  const live = players.filter((p) => p.in_session);

  return (
    <div className="ex-page">
      <header className="mb-6 flex items-center gap-2">
        <Radio className="w-5 h-5 text-accent animate-pulse" />
        <div>
          <h1 className="text-2xl font-heading font-semibold tracking-tight">Live players</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{live.length} players in session · live play and balance vs house.<InfoTip text="Select a player to open full details. Balance vs house is the player's net position, not their remaining wallet balance. Green = player ahead of house, red = behind house." /></p>
        </div>
      </header>

      <div className="lux-surface rounded-xl border border-border overflow-hidden">
        <div className="hidden xl:grid grid-cols-[minmax(0,1.4fr)_110px_minmax(0,1fr)] gap-6 px-5 py-3 bg-muted text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
          <span>Player</span><span>Score</span><span>Balance vs house</span>
        </div>
        {live.length === 0 && <p className="p-8 text-center text-muted-foreground">No one in session.</p>}
        {live.map(player => <LiveSessionRow key={player.id} player={player} />)}
      </div>
    </div>
  );
}