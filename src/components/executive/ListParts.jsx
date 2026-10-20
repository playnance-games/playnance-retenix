export function ListShell({ cols, minWidth = 760, head, label, children }) {
  return (
    <div className="ex-list">
      <section className="ex-listinner" style={{ "--cols": cols, "--min": `${minWidth}px` }} aria-label={label}>
        <div className="ex-listhead">{head.map((h, i) => <div key={i} className={h.right ? "text-right" : ""}>{h.label ?? h}</div>)}</div>
        {children}
      </section>
    </div>
  );
}

export function RowMain({ icon, iconMuted = false, title, badges, sub }) {
  return (
    <div className="ex-rowmain">
      <span className={`ex-rowicon${iconMuted ? " muted" : ""}`}>{icon}</span>
      <div className="ex-rowtext">
        <div className="ex-rowtitle"><span>{title}</span>{badges}</div>
        {sub && <div className="ex-rowsub">{sub}</div>}
      </div>
    </div>
  );
}

export function ChipList({ items, max = 3, empty = "none" }) {
  if (!items.length) return <span className="ex-none">{empty}</span>;
  const shown = items.slice(0, max);
  const rest = items.slice(max);
  return (
    <div className="ex-chips2">
      {shown.map((item, i) => <span key={i} className="ex-chip2" title={item}>{item}</span>)}
      {rest.length > 0 && <span className="ex-chip2 more" title={rest.join(", ")}>+{rest.length}</span>}
    </div>
  );
}

export function ListMessage({ children }) {
  return <div className="p-6 text-sm text-muted-foreground">{children}</div>;
}
