import useABWorkspace from '@/hooks/useABWorkspace';
import TestHistory from '@/components/tests/TestHistory';
import AbAiChat from '@/components/tests/AbAiChat';

export default function ABTests() {
  const w = useABWorkspace();
  if (!w.data) return <div className="p-10 text-muted-foreground">Loading test workspace…</div>;
  return <div className="ex-page">
    <header><h1>A/B testing</h1><p>Plan an audience split, compare modeled outcomes and manage saved simulations.</p></header>
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 mb-5 text-xs"><strong>Planning mode — no live experiments are launched.</strong> Describe the test you want in the chat below — it guides you step by step and builds the plan for you.</div>
    <AbAiChat cases={w.data.cases} segments={w.data.segments} form={w.form} setForm={w.setForm} setDraftId={w.setDraftId} onSave={w.save} busy={w.busy} />
    {w.draftId && (
      <div className="rounded-xl border border-accent/30 bg-accent/5 p-3 mb-5 flex items-center justify-between gap-3 flex-wrap">
        <span className="text-sm">Loaded draft: <strong>{w.form.name}</strong></span>
        <div className="flex gap-2">
          <button onClick={() => w.save('draft')} disabled={w.busy} className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-40">Save draft</button>
          <button onClick={() => w.save('completed')} disabled={w.busy} className="rounded-lg bg-accent text-accent-foreground px-3 py-1.5 text-sm disabled:opacity-40">Run simulation</button>
          <button onClick={() => w.reset()} disabled={w.busy} className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-40">Clear</button>
        </div>
      </div>
    )}
    {w.error && <p role="alert" className="text-sm text-destructive mb-4">{w.error}</p>}
    <TestHistory runs={w.runs} busy={w.busy} onLoad={w.load} onManage={w.manage}/>
    <p className="text-[11px] text-muted-foreground mt-3">History shows up to 1,000 latest saved comparisons; completed simulations are snapshots and do not update with later player activity.</p>
  </div>;
}