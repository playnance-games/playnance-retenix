import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight } from "lucide-react";
import SegmentAiChat from "@/components/segments/SegmentAiChat";

const emptySeg = () => ({
  name: "",
  seg_key: "",
  filters: { min_score: null, max_score: null, net_vs_house: "", favorite: "", feature_unused: "", risk: "", lifecycle: "" },
  case_ids: [],
  built_in: false,
});

export default function FirstSegmentDialog({ open, onOpenChange, onCreated }) {
  const [editing, setEditing] = useState(emptySeg());
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);

  const reset = () => { setEditing(emptySeg()); setStep(1); setSaving(false); };

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await base44.entities.Segment.create(editing);
      reset();
      onOpenChange(false);
      onCreated?.();
    } finally {
      setSaving(false);
    }
  };

  const activeFilters = Object.entries(editing.filters || {}).filter(([, v]) => v !== null && v !== "" && v !== undefined);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden bg-card border-border flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">Build your first segment</DialogTitle>
        </DialogHeader>
        <p className="text-base text-muted-foreground -mt-2 leading-relaxed">Describe who you want to target in plain words. The AI will ask follow-ups and propose filters you can apply with one click — then review and save.</p>

        {step === 1 && (
          <>
            <div className="h-[440px] min-h-0 overflow-hidden">
              <SegmentAiChat editing={editing} onChange={setEditing} />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={() => setStep(2)} disabled={activeFilters.length === 0}>Continue <ArrowRight className="w-4 h-4" /></Button>
            </DialogFooter>
          </>
        )}

        {step === 2 && (
          <>
            <div className="flex-1 overflow-auto py-2">
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="text-sm uppercase tracking-wider text-muted-foreground mb-3 font-semibold">Review — segment definition</div>
                <div className="flex flex-wrap gap-2">
                  {activeFilters.length === 0 ? (
                    <span className="text-sm text-muted-foreground italic">No filters applied — go back and describe your audience.</span>
                  ) : activeFilters.map(([k, v]) => (
                    <span key={k} className="px-3 py-1 rounded-full text-sm border border-accent/30 text-accent bg-accent/5">{k.replace(/_/g, " ")}: {String(v)}</span>
                  ))}
                </div>
              </div>
              <div className="pt-4">
                <Label className="text-sm font-medium">Segment name</Label>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="mt-1.5 text-base" placeholder="e.g. Quiet high-value players" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setStep(1)}><ArrowLeft className="w-4 h-4" /> Back</Button>
              <Button onClick={save} disabled={saving || !editing.name.trim()}>{saving ? "Saving…" : "Save segment"}</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}