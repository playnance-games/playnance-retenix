import { useState } from "react";

export default function HoverTip({ text, children, side = "bottom" }) {
  const [open, setOpen] = useState(false);
  const pos = side === "bottom" ? "top-full mt-1.5" : "bottom-full mb-1.5";
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {children}
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