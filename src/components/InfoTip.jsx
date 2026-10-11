import { useState } from "react";

export default function InfoTip({ text, className = "", side = "bottom" }) {
  const [open, setOpen] = useState(false);
  const pos = side === "bottom" ? "top-6" : "bottom-6";
  return (
    <span
      className={`relative inline-flex align-middle ml-1.5 ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen((o) => !o); }}
    >
      <span className="w-4 h-4 rounded-full border border-muted-foreground/50 text-muted-foreground hover:text-accent hover:border-accent/70 hover:bg-accent/10 cursor-help flex items-center justify-center text-[10px] font-bold leading-none select-none transition">
        !
      </span>
      {open && (
        <span
          className={`absolute z-[200] left-1/2 -translate-x-1/2 ${pos} w-max max-w-[16rem] rounded-lg border border-accent/30 bg-popover text-popover-foreground text-[11px] leading-relaxed px-3 py-2 shadow-2xl pointer-events-none whitespace-normal`}
        >
          {text}
        </span>
      )}
    </span>
  );
}