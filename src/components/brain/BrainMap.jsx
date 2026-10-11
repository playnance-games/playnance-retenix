import { Link } from "react-router-dom";
import BrainSphere from "@/components/brain/BrainSphere";
import PixelIcon from "@/components/brain/PixelIcon";

const STATS = [
  { label: "Players", key: "players", to: "/players", icon: "players" },
  { label: "In session now", key: "session", to: "/live", icon: "clock" },
  { label: "Cases on", key: "cases", to: "/cases", icon: "zap" },
  { label: "Segments", key: "segments", to: "/segments", icon: "grid" },
  { label: "At-risk", key: "atrisk", to: "/players", icon: "triangle" },
  { label: "Block offers", key: "block", to: "/players", icon: "shield" },
];

export default function BrainMap({ players = [], cases = [], segments = [], loading = false }) {
  const values = {
    players: players.length,
    session: players.filter((p) => p.in_session).length,
    cases: `${cases.filter((c) => c.status === "on").length}/${cases.length}`,
    segments: segments.length,
    atrisk: players.filter((p) => p.lifecycle === "at-risk").length,
    block: players.filter((p) => p.risk === "block_offers").length,
  };
  const left = STATS.slice(0, 3);
  const right = STATS.slice(3, 6);
  const renderSide = (items, side) => (
    <div className={`pop-map-side pop-map-side-${side}`}>
      {items.map((s) => (
        <Link key={s.label} to={s.to} className="pop-map-card" tabIndex={0}>
          <div className="pop-map-cardtop">
            <span className="pop-map-label">{s.label}</span>
            <PixelIcon name={s.icon} className="pop-map-icon" />
          </div>
          <span className="pop-map-value">{loading ? "…" : values[s.key]}</span>
        </Link>
      ))}
    </div>
  );
  return (
    <div className="pop-map" aria-label="Retenix AI brain">
      <BrainSphere />
      {renderSide(left, "left")}
      {renderSide(right, "right")}
    </div>
  );
}