import InfoTip from "@/components/InfoTip";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function TestSequenceControl({ form, setForm, gate, action }) {
  const gated = form.gate_group === "a" ? "A" : "B";
  const direct = gated === "A" ? "B" : "A";
  return (
    <div className="sm:col-span-2 rounded-lg border border-border p-4 space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs flex items-center gap-1">Group with extra step <InfoTip text="Choose which group gets the extra step; the other gets the selected action directly. Group sizes follow your configured split." /></Label>
          <Select value={form.gate_group} onValueChange={(v) => setForm({ ...form, gate_group: v })}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="a">Group A</SelectItem><SelectItem value="b">Group B</SelectItem></SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs flex items-center gap-1">Action timing <InfoTip text="For the group with the extra step, choose whether the selected case/action is presented before or after that step." /></Label>
          <Select value={form.reward_timing} disabled={gate.id === "none"} onValueChange={(v) => setForm({ ...form, reward_timing: v })}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="after">After the step</SelectItem><SelectItem value="before">Before the step</SelectItem></SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-2 text-xs">
        <div className="rounded-md bg-muted p-3">Group {direct}: {action || "Selected action"} directly</div>
        <div className="rounded-md bg-accent/5 border border-accent/20 p-3">Group {gated}: {gate.id === "none" ? (action || "Selected action") + " directly" : form.reward_timing === "before" ? `${action || "Selected action"} → ${gate.label}` : `${gate.label} → ${action || "Selected action"}`}</div>
      </div>
      <p className="text-[11px] text-muted-foreground">Sequences describe a simulation, not a live delivery flow; results use the assumptions entered below.</p>
    </div>
  );
}