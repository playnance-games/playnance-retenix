import { ListShell, ListMessage } from "@/components/executive/ListParts";

export const CASE_COLS = "minmax(240px,1.6fr) minmax(150px,.8fr) minmax(200px,1.2fr) minmax(120px,.7fr) 128px";

export default function CaseRegister({ cases, renderRow, loading }) {
  return (
    <ListShell cols={CASE_COLS} minWidth={900} label="Cases" head={["Case", "Type", "Who it targets", "Segments", { label: "Actions", right: true }]}>
      {loading ? <ListMessage>Loading cases…</ListMessage> : cases.length ? cases.map(renderRow) : <ListMessage>No cases yet.</ListMessage>}
    </ListShell>
  );
}
