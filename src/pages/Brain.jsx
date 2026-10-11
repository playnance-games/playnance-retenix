import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { loadPlayersWithStatus } from "@/lib/playerData";
import BrainMap from "@/components/brain/BrainMap";
import "@/components/brain/brainPop.css";

export default function Brain() {
  const [data, setData] = useState({ cases: [], segments: [], players: [] });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const [cases, segments, players] = await Promise.all([
        base44.entities.UseCase.list(),
        base44.entities.Segment.list(),
        loadPlayersWithStatus(),
      ]);
      setData({ cases, segments, players });
      setLoading(false);
    })();
  }, []);
  return (
    <div className="pop-brain">
      <main className="pop-content">
        <header className="pop-head">
          <h1 className="pop-title">Retenix brain</h1>
          <p className="pop-subtitle">Players, cases and segments at a glance.</p>
        </header>
        <section className="pop-layout">
          <BrainMap {...data} loading={loading} />
        </section>
      </main>
    </div>
  );
}