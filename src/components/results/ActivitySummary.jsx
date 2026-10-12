import InfoTip from '@/components/InfoTip';
import { fmtMoney } from '@/lib/retenixLogic';

export default function ActivitySummary({ totals }) {
  const stats = [['Recorded actions', totals.fires, 'Recorded fires, not confirmed message deliveries.'], ['Players reached in logs', totals.players, 'Distinct player IDs in the selected activity records; delivery is not verified.'], ['Gift allocations', fmtMoney(totals.cost), 'Sum of recorded gift amounts, not confirmed payouts.'], ['Average gift', fmtMoney(totals.average), 'Average across actions with a positive gift allocation.']];
  return <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-5">{stats.map(([label, value, tip]) => <div key={label} className="lux-surface rounded-xl border border-border p-5"><div className="text-xs text-muted-foreground">{label}<InfoTip text={tip}/></div><div className="text-2xl font-semibold tabular-nums mt-3">{value}</div></div>)}</div>;
}