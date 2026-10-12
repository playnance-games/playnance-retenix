import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { fmtMoney } from '@/lib/retenixLogic';

export default function ActivityDetail({ row, onClose }) {
  return <Dialog open={!!row} onOpenChange={open => !open && onClose()}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>{row?.name} — recorded activity</DialogTitle><DialogDescription>Actions and gift allocations in the selected period. Delivery, conversions and revenue are not tracked.</DialogDescription></DialogHeader>
    <div className="flex flex-wrap gap-5 text-sm"><span>{row?.fires} actions</span><span>{row?.players} players</span><strong>{fmtMoney(row?.cost)} allocated</strong></div>
    <div className="max-h-[55vh] overflow-y-auto divide-y divide-border">{row?.log.map(e => <div key={e.id} className="py-3 flex items-start justify-between gap-4"><div><div className="text-sm font-medium">{e.name || e.player_id || 'Unknown player'}</div><div className="text-xs text-muted-foreground mt-1">{e.timestamp && Number.isFinite(Date.parse(e.timestamp)) ? new Date(e.timestamp).toLocaleString() : 'Date unavailable'} · {e.source}</div></div><span className="text-sm tabular-nums">{e.gift > 0 ? fmtMoney(e.gift) : 'No gift'}</span></div>)}{!row?.log.length && <p className="py-8 text-center text-muted-foreground">No recorded actions in this period.</p>}</div>
  </DialogContent></Dialog>;
}