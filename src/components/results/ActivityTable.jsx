import { Button } from '@/components/ui/button';
import { fmtMoney } from '@/lib/retenixLogic';

export default function ActivityTable({ rows, onSelect }) {
  return <div className="lux-surface rounded-xl border border-border overflow-x-auto"><table className="w-full min-w-[640px] text-sm"><thead><tr className="text-left"><th className="p-4">Case</th><th className="p-4">Actions</th><th className="p-4">Players</th><th className="p-4">Gift allocations</th><th className="p-4">Activity</th></tr></thead><tbody>
    {rows.map(row => <tr key={row.id} className="border-t border-border"><td className="p-4"><p className="font-medium">{row.name}</p><p className="text-xs text-muted-foreground mt-1 capitalize">{row.type} · {row.channel}</p></td><td className="p-4 tabular-nums">{row.fires}</td><td className="p-4 tabular-nums">{row.players}</td><td className="p-4 tabular-nums font-medium">{fmtMoney(row.cost)}</td><td className="p-4"><Button variant="outline" size="sm" onClick={() => onSelect(row)}>View log</Button></td></tr>)}
    {!rows.length && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No cases or recorded activity yet.</td></tr>}
  </tbody></table></div>;
}