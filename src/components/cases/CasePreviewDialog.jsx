import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CaseImage from "@/components/CaseImage";
import CaseVisual from "@/components/cases/CaseVisual";
import InfoTip from "@/components/InfoTip";
import { TYPE_LABELS } from "@/pages/Cases";

export default function CasePreviewDialog({ uc, open, onOpenChange }) {
  if (!uc) return null;
  const isGame = ["wheel", "slot"].includes(uc.action_template);
  const pill = "inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-semibold bg-accent/10 text-accent border border-accent/20 capitalize";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[88vh] overflow-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="w-1 h-4 rounded-full accent-bar" />
            {uc.name} — creative preview
            <InfoTip text="This is what the player sees when the case fires. An uploaded image replaces the generated visual; text, button and survey options come from the case creative editor." />
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          <span className={pill}>{TYPE_LABELS[uc.type] || uc.type}</span>
          <span className={pill}>{uc.channel}</span>
          {uc.action_template && <span className={pill}>{uc.action_template.replace(/_/g, " ")}</span>}
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
            {uc.image_uri ? "Uploaded visual" : "Generated example visual"}
          </div>
          {uc.image_uri
            ? <div className="rounded-xl overflow-hidden border border-border"><CaseImage uri={uc.image_uri} className="w-full h-64 object-cover" /></div>
            : <CaseVisual uc={uc} className="h-64 w-full" />}
        </div>

        <p className="text-[11px] text-foreground/60">
          {isGame ? "Interactive mini-game shown to the player." : "Auto-generated visual — upload a creative in the editor to replace it."}
        </p>

        {uc.button_label && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Button</span>
            <span className="inline-flex rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium">{uc.button_label}</span>
            {uc.button_link && <span className="text-[11px] text-muted-foreground break-all">{uc.button_link}</span>}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}