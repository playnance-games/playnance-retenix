import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { loadPlayersWithStatus } from '@/lib/playerData';
import { Plus, Layers, Zap, Lightbulb, Trash2, Pencil } from "lucide-react";
import { ListShell, RowMain, ChipList, ListMessage } from "@/components/executive/ListParts";
import { filterLabels } from "@/components/executive/CaseConditionTags";
import FireSegmentDialog from "@/components/FireSegmentDialog";
import Recommendations from "@/components/Recommendations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { matchSegment } from "@/lib/retenixLogic";
import InfoTip from "@/components/InfoTip";
import SegmentAiChat from "@/components/segments/SegmentAiChat";
import FirstSegmentDialog from "@/components/segments/FirstSegmentDialog";
const emptySeg = () => ({
  name: "",
  seg_key: "",
  filters: { min_score: null, max_score: null, net_vs_house: "", favorite: "", feature_unused: "", risk: "", lifecycle: "" },
  case_ids: [],
  built_in: false,
});

export default function Segments() {
  const [segments, setSegments] = useState([]);
  const [players, setPlayers] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [fireSeg, setFireSeg] = useState(null);
  const [showRecs, setShowRecs] = useState(false);
  const [delSeg, setDelSeg] = useState(null);
  const [firstSegOpen, setFirstSegOpen] = useState(false);

  const remove = async () => {
    if (!delSeg) return;
    await base44.entities.Segment.delete(delSeg.id);
    setSegments((p) => p.filter((x) => x.id !== delSeg.id));
    setDelSeg(null);
  };

  const load = async () => {
    const [s, p, c] = await Promise.all([
      base44.entities.Segment.list(),
      loadPlayersWithStatus(),
      base44.entities.UseCase.list(),
    ]);
    setSegments(s); setPlayers(p); setCases(c); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    const data = { ...editing };
    if (editing.id) {
      const next = await base44.entities.Segment.update(editing.id, data);
      setSegments((p) => p.map((x) => (x.id === editing.id ? next : x)));
    } else {
      const created = await base44.entities.Segment.create(data);
      setSegments((p) => [...p, created]);
    }
    setOpen(false); setEditing(null);
  };

  const setFilter = (k, v) => setEditing((p) => ({ ...p, filters: { ...p.filters, [k]: v } }));

  const count = (seg) => players.filter((p) => matchSegment(p, seg)).length;

  return (
    <div className="ex-page">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-semibold tracking-tight">Segments</h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">Built-in and custom segments. Assign cases to each. <InfoTip text="Segments group players by filters. Cases assigned to a segment fire for every player in it (on schedule or login), not on a single live event. Use Fire to push a promotion to everyone in a segment at once." /></p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowRecs(true)}><Lightbulb className="w-4 h-4 mr-1" /> Recommendations</Button>
          <Button size="sm" onClick={() => setFirstSegOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> New segment
          </Button>
        </div>
      </header>

      {segments.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center text-center py-16">
          <div className="lux-surface rounded-2xl border border-border bg-card/40 p-10 max-w-md flex flex-col items-center">
            <span className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center mb-3"><Layers className="w-6 h-6" /></span>
            <h2 className="text-lg font-heading font-semibold">Create your first segment</h2>
            <p className="text-sm text-muted-foreground mt-1.5 mb-5 leading-relaxed">Segments group players by filters so you can target them with cases. Use the AI to describe who you want to reach.</p>
            <Button onClick={() => setFirstSegOpen(true)}><Plus className="w-4 h-4" /> New segment</Button>
          </div>
        </div>
      ) : (
      <ListShell
        cols="minmax(240px,1.6fr) 110px minmax(200px,1.3fr) minmax(130px,.8fr) 168px"
        minWidth={920}
        label="Segments"
        head={["Segment", "Players", "Who's in it", "Cases", { label: "Actions", right: true }]}
      >
        {loading ? <ListMessage>Loading segments…</ListMessage> : segments.map((s) => {
          const assigned = (s.case_ids || []).map((id) => cases.find((c) => c.id === id)).filter(Boolean);
          const filters = filterLabels(s.filters);
          const matched = count(s);
          return (
            <article key={s.id} className="ex-row">
              <RowMain
                icon={<Layers />}
                title={s.name}
                badges={s.built_in && <span className="ex-badge">Built-in</span>}
                sub={`${filters.length ? `${filters.length} ${filters.length === 1 ? "filter" : "filters"}` : "No filters"} · ${assigned.filter((c) => c.status === "on").length} live ${assigned.filter((c) => c.status === "on").length === 1 ? "case" : "cases"}`}
              />
              <div className="ex-num">{matched}<small>{players.length ? `${Math.round((matched / players.length) * 100)}% of players` : "players"}</small></div>
              <ChipList items={filters} empty="Everyone" />
              <div className="ex-num">{assigned.length || "—"}<small className="truncate" title={assigned.map((c) => c.name).join(", ")}>{assigned.length ? assigned[0].name + (assigned.length > 1 ? ` +${assigned.length - 1}` : "") : "no cases"}</small></div>
              <div className="ex-rowactions">
                <Button size="sm" onClick={() => setFireSeg(s)}><Zap className="w-3.5 h-3.5 mr-1" /> Fire</Button>
                <button className="ex-iconbtn" onClick={() => { setEditing({ ...s }); setOpen(true); }} title="Edit segment" aria-label={`Edit ${s.name}`}><Pencil /></button>
                {s.built_in
                  ? <span className="w-[34px]" aria-hidden="true" />
                  : <button className="ex-iconbtn" onClick={() => setDelSeg(s)} title="Delete segment" aria-label={`Delete ${s.name}`}><Trash2 /></button>}
              </div>
            </article>
          );
        })}
      </ListShell>
      )}

      {editing && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden bg-card border-border flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-xl">{editing.id ? "Edit segment with AI" : "New segment"}</DialogTitle>
            </DialogHeader>
            <p className="text-base text-muted-foreground -mt-2">Describe who you want to reach — the assistant builds the filters for you. No manual forms.</p>
            <div className="h-[440px] flex-1 min-h-0 py-3">
              <SegmentAiChat editing={editing} onChange={setEditing} />
            </div>
            <div className="border-t border-border pt-3">
              <Label className="text-sm">Segment name</Label>
              <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="mt-1" placeholder="Name this segment" />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save} disabled={!editing.name.trim()}>Save segment</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Recommendations open={showRecs} onOpenChange={setShowRecs} onCreated={load} />

      <AlertDialog open={!!delSeg} onOpenChange={(o) => { if (!o) setDelSeg(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete segment?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete "{delSeg?.name}". This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={remove}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <FireSegmentDialog
        segment={fireSeg}
        players={players}
        cases={cases}
        segments={segments}
        open={!!fireSeg}
        onOpenChange={(o) => { if (!o) setFireSeg(null); }}
      />
      <FirstSegmentDialog open={firstSegOpen} onOpenChange={setFirstSegOpen} onCreated={load} />
    </div>
  );
}