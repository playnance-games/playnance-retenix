import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CaseImage from "@/components/CaseImage";
import CaseVisual from "@/components/cases/CaseVisual";
import CaseConditionTags from "@/components/executive/CaseConditionTags";
import { Filter, Users, Type, Eye, ArrowDown, Send, ImageIcon, ChevronRight } from "lucide-react";
import { TYPE_LABELS, ACTION_FORMAT_LABEL, CHANNEL_LABEL } from "@/lib/caseConstants";

export default function CaseViewDialog({ uc, segments = [], open, onOpenChange }) {
  const [visualOpen, setVisualOpen] = useState(false);
  if (!uc) return null;
  const assignedSegments = (uc.segment_ids || []).map((id) => segments.find((s) => s.id === id)?.name).filter(Boolean);
  const site = uc.channel === "site";
  const content = site ? uc.content_text : uc.message_text;
  const arrow = <div className="flex justify-center"><ArrowDown className="w-5 h-5 text-muted-foreground" /></div>;
  const card = (icon, label, children) => (
    <div className="rounded-xl border border-border p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">{icon}<span>{label}</span></div>
      {children}
    </div>
  );
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[88vh] overflow-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-lg flex items-center gap-2"><Eye className="w-5 h-5 text-accent" /> {uc.name} — case flow</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {card(<Filter className="w-4 h-4 text-accent" />, "Trigger", <>
            <div className="text-base font-medium mt-1">Segment-based</div>
            <div className="text-sm text-muted-foreground">Fires for every player in the assigned segments on schedule or login.</div>
          </>)}
          {arrow}
          {card(<Users className="w-4 h-4 text-accent" />, "Target audience", <>
            <div className="text-base font-medium mt-1">{assignedSegments.length ? assignedSegments.join(", ") : "No segments assigned"}</div>
            <div className="mt-2"><CaseConditionTags conditions={uc.conditions} /></div>
          </>)}
          {arrow}
          {card(<Type className="w-4 h-4 text-accent" />, "Action", <>
            <div className="text-base font-medium mt-1">{TYPE_LABELS[uc.type] || uc.type} · {ACTION_FORMAT_LABEL(uc.action_template)}</div>
            <div className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5"><Send className="w-3.5 h-3.5" /> {CHANNEL_LABEL[uc.channel] || uc.channel}</div>
            {content && <p className="mt-2 text-sm leading-relaxed">{content}</p>}
            {uc.button_label && <div className="mt-2 inline-flex rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium">{uc.button_label}</div>}
            {uc.type === "survey" && (uc.survey_options || []).filter(Boolean).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">{(uc.survey_options || []).filter(Boolean).map((o, i) => <span key={i} className="rounded-md border border-border px-2.5 py-1 text-xs">{o}</span>)}</div>
            )}
          </>)}
          {arrow}
          <button
            type="button"
            onClick={() => setVisualOpen(true)}
            className="w-full text-left rounded-xl border border-border p-4 transition hover:border-accent hover:bg-accent/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><ImageIcon className="w-4 h-4 text-accent" /><span>Visual</span></div>
            <div className="mt-1 flex items-center justify-between gap-3">
              <span className="text-base font-medium">View the visual the player sees</span>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-accent">Open <ChevronRight className="w-4 h-4" /></span>
            </div>
          </button>
        </div>
      </DialogContent>
      <Dialog open={visualOpen} onOpenChange={setVisualOpen}>
        <DialogContent className="max-w-xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2"><ImageIcon className="w-5 h-5 text-accent" /> {uc.name} — visual</DialogTitle>
          </DialogHeader>
          <div className="rounded-xl overflow-hidden border border-border">
            {uc.image_uri ? <CaseImage uri={uc.image_uri} className="w-full h-80 object-cover" /> : <CaseVisual uc={uc} className="h-80 w-full" />}
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}