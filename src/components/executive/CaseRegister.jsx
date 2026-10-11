export default function CaseRegister({ cases, renderRow, loading }) {
  return <div className="ex-register-scroll"><section className="ex-casegrid" aria-label="Cases">
    <div className="ex-gridhead"><div>Case</div><div>Type</div><div>Actions</div></div>
    {loading ? <div className="p-6 text-sm text-muted-foreground">Loading cases…</div> : cases.length ? cases.map(renderRow) : <div className="p-6 text-sm text-muted-foreground">No cases yet.</div>}
  </section></div>;
}