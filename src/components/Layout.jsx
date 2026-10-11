import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import ExecutiveLayout from "@/components/executive/ExecutiveLayout";
import { Users, Zap, Layers, Settings as SettingsIcon, Radio, Brain as BrainIcon, BarChart3, FlaskConical } from "lucide-react";


const nav = [
  { to: "/", label: "Brain", icon: BrainIcon, end: true },
  { to: "/live", label: "Live Sessions", icon: Radio },
  { to: "/players", label: "Players", icon: Users },
  { to: "/segments", label: "Segments", icon: Layers },
  { to: "/cases", label: "Cases", icon: Zap },
  { to: "/results", label: "Results", icon: BarChart3 },
  { to: "/ab-tests", label: "A/B Tests", icon: FlaskConical },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export default function Layout() {
  const { pathname } = useLocation();
  const [chatOpen, setChatOpen] = useState(false);
  const [light, setLight] = useState(() => {
    try { const s = localStorage.getItem("retenix-theme"); return s ? s === "light" : true; } catch { return true; }
  });
  useEffect(() => {
    document.documentElement.classList.toggle("light", light);
    try { localStorage.setItem("retenix-theme", light ? "light" : "dark"); } catch {}
  }, [light]);

  const pageLabel = nav.find((item) => item.to === pathname)?.label || (pathname.startsWith("/players/") ? "Player profile" : "Retenix");
  return <ExecutiveLayout nav={nav} pageLabel={pageLabel} light={light} setLight={setLight} chatOpen={chatOpen} setChatOpen={setChatOpen} />;
}