import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Layers, Users } from "lucide-react";

export default function CaseNewGate({ open, onOpenChange, onCreateSegment, onCreateForAll }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle>Create a new case</DialogTitle>
          <DialogDescription>You don't have any segments yet. Cases target a group of players — choose how to proceed.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-1">
          <button onClick={onCreateSegment} className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-4 text-left hover:border-accent/50 hover:bg-accent/5 transition">
            <span className="w-9 h-9 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0"><Layers className="w-5 h-5" /></span>
            <span>
              <span className="block text-sm font-medium">Create a segment first</span>
              <span className="block text-xs text-muted-foreground mt-0.5">Define who to target, then build the case for them.</span>
            </span>
          </button>
          <button onClick={onCreateForAll} className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-4 text-left hover:border-accent/50 hover:bg-accent/5 transition">
            <span className="w-9 h-9 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0"><Users className="w-5 h-5" /></span>
            <span>
              <span className="block text-sm font-medium">Create a case for all users</span>
              <span className="block text-xs text-muted-foreground mt-0.5">No segment needed — fires for everyone on the trigger event.</span>
            </span>
          </button>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}