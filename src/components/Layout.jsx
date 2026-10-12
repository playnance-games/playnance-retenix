import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ExecutiveLayout from "@/components/executive/ExecutiveLayout";
import { useMode } from "@/lib/ModeContext";
import { Users, Zap, Layers, Settings as SettingsIcon, Radio, Brain as BrainIcon, BarChart3, FlaskConical, Gamepad2, Crown } from "lucide-react";

const PLAYER_NAV = [
  { to: "/", label: "Brain", icon: BrainIcon, end: true },
  { to: "/live", label: "Live Players", icon: Radio },
  { to: "/players", label: "Players", icon: Users },
  { to: "/segments", label: "Segments", icon: Layers },
  { to: "/cases", label: "Cases", icon: Zap },
  { to: "/results", label: "Results", icon: BarChart3 },
  { to: "/ab-tests", label: "A/B Tests", icon: FlaskConical },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
  { to: "/examples", label: "Examples", icon: Gamepad2 },
];

const BOSS_NAV = [
  { to: "/", label: "Brain", icon: BrainIcon, end: true },
  { to: "/bosses", label: "Bosses", icon: Crown },
  { to: "/segments", label: "Segments", icon: Layers },
  { to: "/cases", label: "Cases", icon: Zap },
  { to: "/results", label: "Results", icon: BarChart3 },
  { to: "/ab-tests", label: "A/B Tests", icon: FlaskConical },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
  { to: "/examples", label: "Examples", icon: Gamepad2 },
];

export default function Layout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { mode, setMode } = useMode();
  const [chatOpen, setChatOpen] = useState(false);
  const [light, setLight] = useState(() => {
    try { const s = localStorage.getItem("retenix-theme"); return s ? s === "light" : true; } catch { return true; }
  });
  useEffect(() => {
    document.documentElement.classList.toggle("light", light);
    try { localStorage.setItem("retenix-theme", light ? "light" : "dark"); } catch {}
  }, [light]);

  useEffect(() => {
    const playerPage = pathname.startsWith("/players") || pathname.startsWith("/live");
    if (playerPage && mode !== "players") setMode("players");
    if (pathname.startsWith("/bosses") && mode !== "bosses") setMode("bosses");
  }, [pathname, mode, setMode]);

  const nav = mode === "bosses" ? BOSS_NAV : PLAYER_NAV;
  const changeMode = (next) => {
    if (next === mode) return;
    setMode(next);
    const allowed = (next === "bosses" ? BOSS_NAV : PLAYER_NAV).some((item) => item.to !== "/" && pathname.startsWith(item.to));
    if (!allowed) navigate("/");
  };

  const pageLabel = nav.find((item) => item.to === pathname)?.label
    || (pathname.startsWith("/players/") ? "Player profile" : pathname.startsWith("/bosses/") ? "Boss card" : "Retenix");
  return <ExecutiveLayout nav={nav} mode={mode} setMode={changeMode} pageLabel={pageLabel} light={light} setLight={setLight} chatOpen={chatOpen} setChatOpen={setChatOpen} />;
}
