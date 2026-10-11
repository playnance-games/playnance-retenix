import { useState } from "react";
import { Pencil, Eye, Trash2, FlaskConical } from "lucide-react";
import CaseViewDialog from "@/components/cases/CaseViewDialog";
import { Switch } from "@/components/ui/switch";
import InfoTip from "@/components/InfoTip";
import CaseConditionTags from "@/components/executive/CaseConditionTags";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";

export default function CaseRegisterRow({ uc, typeLabel, typeTip, hasAb, onToggle, onEdit, onDelete, segments = [] }) {
  const [preview, setPreview] = useState(false);
  const [confirming, setConfirming] = useState(false);
  return (
    <article className="ex-caserow">
      <div className="ex-caseidentity">
        <div><div className="ex-casename">{uc.name}</div><CaseConditionTags conditions={uc.conditions} /></div>
      </div>
      <div className="flex items-center gap-1.5">
        <span className={`ex-typepill${uc.type === "cash" ? " cash" : ""} inline-flex items-center gap-1`}>{typeLabel}<InfoTip text={typeTip} /></span>
        {hasAb && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide rounded bg-accent/10 text-accent px-2 py-0.5" title="Part of an A/B test">
            <FlaskConical className="w-3 h-3" /> A/B
          </span>
        )}
      </div>
      <div className="ex-rowtools">
        <label className="ex-status">
          <Switch className="ex-switch" checked={uc.status === "on"} onCheckedChange={() => onToggle(uc)} aria-label={`Enable ${uc.name}`} />
          <span className="ex-statuslabel">{uc.status === "on" ? "on" : "off"}</span>
        </label>
      </div>
      <div className="ex-rowtools ex-actions relative">
        <button className="ex-iconbtn" onClick={() => onEdit(uc)} title="Edit case" aria-label={`Edit ${uc.name}`}><Pencil /></button>
        <button className="ex-iconbtn" onClick={() => setPreview(true)} title="View case" aria-label={`View ${uc.name}`}><Eye /></button>
        <button className="ex-iconbtn" onClick={() => setConfirming(true)} title="Delete case" aria-label={`Delete ${uc.name}`}><Trash2 /></button>
      </div>
      <CaseViewDialog uc={uc} segments={segments} open={preview} onOpenChange={setPreview} />
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete case?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete "{uc.name}". This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { onDelete(uc); setConfirming(false); }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  );
}