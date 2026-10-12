import InfoTip from "@/components/InfoTip";

export default function StatTile({ icon: Icon, label, value, hint, tone = "" }) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {Icon && <Icon className="w-3.5 h-3.5 text-accent" />}{label}{hint && <InfoTip text={hint} />}
      </div>
      <div className={`mt-1 text-lg font-semibold tabular-nums ${tone}`}>{value}</div>
    </div>
  );
}
