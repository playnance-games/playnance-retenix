import { createContext, useContext, useEffect, useState } from "react";

export const MODES = [
  { id: "players", label: "Players" },
  { id: "bosses", label: "Bosses" },
];

const STORAGE_KEY = "retenix-mode";
const ModeContext = createContext(null);

function readMode() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return MODES.some((m) => m.id === saved) ? saved : "players";
  } catch {
    return "players";
  }
}

export function ModeProvider({ children }) {
  const [mode, setMode] = useState(readMode);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, mode); } catch {}
    document.documentElement.dataset.mode = mode;
  }, [mode]);
  return <ModeContext.Provider value={{ mode, setMode }}>{children}</ModeContext.Provider>;
}

export function useMode() {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error("useMode must be used within a ModeProvider");
  return ctx;
}
