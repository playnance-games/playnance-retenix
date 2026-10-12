import { useState } from "react";
import { Pencil, Eye, Trash2, FlaskConical, Gift, Zap, GraduationCap, ListChecks, Send, CreditCard, Gamepad2, CircleSlash } from "lucide-react";
import CaseViewDialog from "@/components/cases/CaseViewDialog";
import InfoTip from "@/components/InfoTip";
import { conditionLabels } from "@/components/executive/CaseConditionTags";
import { RowMain, ChipList } from "@/components/executive/ListParts";
import { ACTION_FORMAT_LABEL, CHANNEL_LABEL } from "@/lib/caseConstants";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";

const TYPE_ICON = { cash: Gift, activation: Zap, education: GraduationCap, survey: ListChecks, channel: Send, cashier: CreditCard, engagement: Gamepad2, none: CircleSlash };

export default function CaseRegisterRow({ uc, typeLabel, typeTip, hasAb, onEdit, onDelete, segments = [] }) {
  const [preview, setPreview] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const Icon = TYPE_ICON[uc.type] || Zap;
  const segmentNames = (uc.segment_ids || []).map((id) => segments.find((s) => s.id === id)?.name).filter(Boolean);
  const sub = [CHANNEL_LABEL[uc.channel] || uc.channel, uc.action_template && ACTION_FORMAT_LABEL(uc.action_template)].filter(Boolean).join(" · ");
  return (
    <article className="ex-row">
      <RowMain
        icon={<Icon />}
        iconMuted={uc.status !== "on"}
        title={uc.name}
        badges={hasAb && <span className="ex-badge accent inline-flex items-center gap-1" title="Part of an A/B test"><FlaskConical className="w-3 h-3" />A/B</span>}
        sub={sub}
      />
      <div><span className={`ex-typepill${uc.type === "cash" ? " cash" : ""} inline-flex items-center gap-1`}>{typeLabel}<InfoTip text={typeTip} /></span></div>
      <ChipList items={conditionLabels(uc.conditions)} empty="All players" />
      <div className="ex-num">{segmentNames.length || "—"}<small className="truncate" title={segmentNames.join(", ")}>{segmentNames.length ? segmentNames[0] + (segmentNames.length > 1 ? ` +${segmentNames.length - 1}` : "") : "no segment"}</small></div>
      <div className="ex-rowactions">
        <button className="ex-iconbtn" onClick={() => setPreview(true)} title="View case" aria-label={`View ${uc.name}`}><Eye /></button>
        <button className="ex-iconbtn" onClick={() => onEdit(uc)} title="Edit case" aria-label={`Edit ${uc.name}`}><Pencil /></button>
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
