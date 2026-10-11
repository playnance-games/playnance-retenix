import { useEffect } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Sun, Moon, Sparkles } from "lucide-react";
import Logo from "@/components/Logo";
import AiAssistant from "@/components/AiAssistant";
import { MODES } from "@/lib/ModeContext";
import "@/components/executive/executive.css";
import "@/components/executive/workspaceSurfaces.css";

export default function ExecutiveLayout({ nav, mode, setMode, pageLabel, light, setLight, chatOpen, setChatOpen }) {
  useEffect(() => {
    const root = document.documentElement;
    if (light) root.classList.add("light"); else root.classList.remove("light");
  }, [light]);
  return (
    <div className="executive-app" data-theme={light ? "light" : "dark"} data-mode={mode} data-assistant-open={chatOpen}>
      <aside className="ex-sidebar">
        <div className="ex-brand"><Logo className="ex-mark" /><div><div className="ex-brandname">Retenix</div><div className="ex-subbrand">{mode === "bosses" ? "Boss ops" : "Live ops"}</div></div></div>
        <div className="ex-modeswitch" role="radiogroup" aria-label="Mode">
          {MODES.map((m, i) => (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={mode === m.id}
              className={`ex-modebtn${mode === m.id ? " current" : ""}`}
              onClick={() => setMode(m.id)}
            >
              <span className="ex-modenum">{i + 1}</span>{m.label}
            </button>
          ))}
        </div>
        <nav className="ex-nav" aria-label="Main navigation">
          {nav.map((item) => <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `ex-navitem${isActive ? " active" : ""}`}><item.icon /><span>{item.label}</span></NavLink>)}
        </nav>
        <div className="ex-sidebarfoot"><button className="ex-theme" onClick={() => setLight((value) => !value)}><span className="ex-themeleft">{light ? <Sun size={15} /> : <Moon size={15} />}<span>{light ? "Light mode" : "Dark mode"}</span></span><span className="ex-toggle" /></button></div>
      </aside>
      <main className="ex-layout">
        <div className="ex-topbar"><span className="ex-crumb">{pageLabel}</span><span className="ex-topbadge"><span className="ex-live-dot" />{mode === "bosses" ? "Boss ops" : "Live ops"}</span></div>
        <div className="ex-mainbody">
          <Outlet />
          {chatOpen ? <section className="ex-workspace" aria-label="Retenix Assistant"><AiAssistant executive onCollapse={() => setChatOpen(false)} /></section> : <button className="ex-btn ex-expand" onClick={() => setChatOpen(true)} title="Expand assistant"><Sparkles size={15} />Assistant</button>}
        </div>
      </main>
    </div>
  );
}
