import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { LifecycleChip, RiskChip } from "@/components/tags";
import InfoTip from "@/components/InfoTip";
import { ListShell, RowMain, ListMessage } from "@/components/executive/ListParts";
import { fmtMoney } from "@/lib/retenixLogic";
import { platformsForPlayer } from "@/lib/bosses";

const NET_LABEL = { up: "Ahead of house", down: "Down vs house", too_thin: "Thin margin" };
const NET_TONE = { up: "text-emerald-600", down: "text-red-600", too_thin: "text-amber-600" };

export default function PlayersTable({ players, loading }) {
  const navigate = useNavigate();
  const open = (player) => navigate(`/players/${player.id}`);
  return (
    <ListShell
      cols="minmax(240px,1.6fr) 110px 140px minmax(150px,.9fr) minmax(150px,1fr) 28px"
      minWidth={880}
      label="Players"
      head={[
        "Player",
        <span key="s" className="inline-flex items-center">Score<InfoTip text="Retention score out of 10. Open the player card for the breakdown." /></span>,
        <span key="n" className="inline-flex items-center">Net vs house<InfoTip text="The player's net position, not their wallet balance." /></span>,
        "Status",
        "Platforms",
        "",
      ]}
    >
      {loading ? <ListMessage>Loading players…</ListMessage> : players.length === 0 ? <ListMessage>No players match.</ListMessage> : players.map((player) => {
        const platforms = platformsForPlayer(player.player_id);
        const main = platforms.find((p) => p.primary) || platforms[0];
        const initials = player.name.split(" ").map((p) => p[0]).join("").slice(0, 2);
        return (
          <article
            key={player.id}
            className="ex-row clickable"
            role="link"
            tabIndex={0}
            aria-label={`Open ${player.name}`}
            onClick={() => open(player)}
            onKeyDown={(e) => { if (e.key === "Enter") open(player); }}
          >
            <RowMain
              icon={initials}
              title={player.name}
              badges={player.in_session && <span className="ex-badge accent inline-flex items-center gap-1"><span className="ex-livedot" />Live</span>}
              sub={`${player.player_id} · ${player.in_session && player.current_game ? `playing ${player.current_game}` : player.favorite_category || "no favorite"}`}
            />
            <div className="ex-num">
              {Number(player.score).toFixed(2)}<span className="text-xs font-normal text-muted-foreground"> / 10</span>
              <div className="ex-scorebar"><span style={{ width: `${Math.min(100, Number(player.score) * 10)}%` }} /></div>
            </div>
            <div className={`ex-num ${NET_TONE[player.net_vs_house] || ""}`}>{player.net_amount == null ? "—" : fmtMoney(player.net_amount)}<small>{NET_LABEL[player.net_vs_house] || "Not recorded"}</small></div>
            <div className="flex flex-wrap items-center gap-1.5"><LifecycleChip v={player.lifecycle} />{player.risk && player.risk !== "clean" && <RiskChip v={player.risk} />}</div>
            <div className="ex-num text-[13px]">{main ? main.boss.platform : "—"}<small>{platforms.length > 1 ? `+${platforms.length - 1} more` : main ? "only platform" : "none"}</small></div>
            <ChevronRight className="w-4 h-4 ex-chevron" />
          </article>
        );
      })}
    </ListShell>
  );
}
