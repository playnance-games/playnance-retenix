import { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ActivitySummary from '@/components/results/ActivitySummary';
import ActivityTable from '@/components/results/ActivityTable';
import ActivityDetail from '@/components/results/ActivityDetail';
import { recordedActivity, summarizeActivity, rankActivity } from '@/lib/activityResults';

export default function Results() {
  const [data, setData] = useState(null), [period, setPeriod] = useState('30'), [order, setOrder] = useState('fires'), [selected, setSelected] = useState(null);
  useEffect(() => { Promise.all([base44.entities.UseCase.list(), base44.entities.PlayerEvent.filter({kind:'retenix_action'}, '-timestamp', 1000)]).then(([cases, events]) => setData({cases,events})); }, []);
  const activity = useMemo(() => {
    if (!data) return [];
    const all = recordedActivity(data.cases, data.events);
    return period === 'all' ? all : all.filter(e => Date.parse(e.timestamp) >= Date.now() - Number(period)*864e5);
  }, [data, period]);
  if (!data) return <div className="p-10 text-muted-foreground">Loading recorded results…</div>;
  const rows = rankActivity(data.cases, activity, order), totals = summarizeActivity(activity);
  return <div className="ex-page">
    <header><h1>Results</h1><p>Recorded case activity and gift allocations — without simulated conversions.</p></header>
    <div className="flex flex-wrap gap-3 mb-5">
      <Select value={period} onValueChange={setPeriod}><SelectTrigger className="w-44" aria-label="Activity period"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="7">Last 7 days</SelectItem><SelectItem value="30">Last 30 days</SelectItem><SelectItem value="all">All loaded records</SelectItem></SelectContent></Select>
      <Select value={order} onValueChange={setOrder}><SelectTrigger className="w-52" aria-label="Sort case activity"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="fires">Most recorded actions</SelectItem><SelectItem value="cost">Highest gift allocations</SelectItem></SelectContent></Select>
    </div>
    <ActivitySummary totals={totals}/>
    <div className="rounded-xl border border-border bg-muted/40 p-4 mb-5 text-xs text-muted-foreground"><strong className="text-foreground">Revenue and ROI are not tracked.</strong> Gift amounts are recorded allocations, not confirmed payments. Showing up to 1,000 latest action events plus retained case logs; older unlinked timeline events cannot be attributed to a case.</div>
    <ActivityTable rows={rows} onSelect={setSelected}/><ActivityDetail row={selected} onClose={() => setSelected(null)}/>
  </div>;
}