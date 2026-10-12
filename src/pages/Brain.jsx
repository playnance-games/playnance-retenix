import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { loadPlayersWithStatus } from "@/lib/playerData";
import { loadBossesWithStats, money } from "@/lib/bosses";
import { useMode } from "@/lib/ModeContext";
import BrainMap from "@/components/brain/BrainMap";
import "@/components/brain/brainPop.css";

const BOSS_STATS = [
  { label: "Bosses", key: "bosses", to: "/bosses", icon: "players" },
  { label: "Players via bosses", key: "players", to: "/bosses", icon: "grid" },
  { label: "Boss players live now", key: "live", to: "/bosses", icon: "clock" },
  { label: "Top boss", key: "top", to: "/bosses", icon: "zap" },
  { label: "Deposits via bosses", key: "deposits", to: "/bosses", icon: "shield" },
  { label: "Commission owed", key: "commission", to: "/bosses", icon: "triangle" },
];

function bossValues(bosses) {
  const top = [...bosses].sort((a, b) => b.deposits - a.deposits)[0];
  const unique = new Map(bosses.flatMap((b) => b.roster.map((m) => [m.player.id, m.player])));
  return {
    bosses: bosses.length,
    players: unique.size,
    live: [...unique.values()].filter((p) => p.in_session).length,
    top: top ? top.name.split(" ")[0] : "—",
    deposits: money(bosses.reduce((n, b) => n + b.deposits, 0)),
    commission: money(bosses.reduce((n, b) => n + b.commission, 0)),
  };
}

export default function Brain() {
  const { mode } = useMode();
  const [data, setData] = useState({ cases: [], segments: [], players: [] });
  const [bosses, setBosses] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      if (mode === "bosses") {
        const list = await loadBossesWithStats();
        if (active) setBosses(list);
      } else {
        const [cases, segments, players] = await Promise.all([
          base44.entities.UseCase.list(),
          base44.entities.Segment.list(),
          loadPlayersWithStatus(),
        ]);
        if (active) setData({ cases, segments, players });
      }
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, [mode]);

  const bossMode = mode === "bosses";
  return (
    <div className="pop-brain">
      <main className="pop-content">
        <header className="pop-head">
          <h1 className="pop-title">{bossMode ? "Bosses brain" : "Retenix brain"}</h1>
          <p className="pop-subtitle">{bossMode ? "Bosses, the players they bring, and what those players are worth." : "Players, cases and segments at a glance."}</p>
        </header>
        <section className="pop-layout">
          {bossMode
            ? <BrainMap key="bosses" palette="bosses" stats={BOSS_STATS} values={bossValues(bosses)} loading={loading} label="Bosses overview" />
            : <BrainMap key="players" palette="players" {...data} loading={loading} />}
        </section>
      </main>
    </div>
  );
}
