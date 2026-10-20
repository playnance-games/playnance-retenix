import { riskLevelOf, dataFreshness } from "@/lib/riskLevels";
import { nextBestAction } from "@/lib/nextAction";

export function workQueue(players, cases, settings = {}) {
  const items = [];
  const fresh = dataFreshness(players);
  if (fresh.stale) {
    items.push({ title: "Player activity is stale", detail: fresh.note, to: "/players" });
  }
  const severe = players.filter((p) => riskLevelOf(p).level >= 5);
  const high = players.filter((p) => riskLevelOf(p).level === 4);
  if (severe.length) {
    items.push({
      title: `${severe.length} player${severe.length === 1 ? "" : "s"} need review before cash`,
      detail: severe.slice(0, 3).map((p) => p.name).join(", "),
      to: `/players/${severe[0].id}`,
    });
  }
  if (high.length) {
    items.push({
      title: `${high.length} high-risk player${high.length === 1 ? "" : "s"} for one campaign`,
      detail: high.slice(0, 3).map((p) => p.name).join(", "),
      to: `/players/${high[0].id}`,
    });
  }
  const gifts = players.filter((p) => nextBestAction(p, settings).title.startsWith("Offer a"));
  if (gifts.length) {
    items.push({
      title: `${gifts.length} cash gift${gifts.length === 1 ? "" : "s"} ready`,
      detail: gifts.slice(0, 3).map((p) => p.name).join(", "),
      to: `/players/${gifts[0].id}`,
    });
  }
  const off = cases.filter((c) => c.status !== "on");
  if (off.length) {
    items.push({ title: `${off.length} case${off.length === 1 ? "" : "s"} switched off`, detail: off.slice(0, 2).map((c) => c.name).join(", "), to: "/cases" });
  }
  const budget = Number(settings.daily_cash_budget);
  if (Number.isFinite(budget) && budget > 0) {
    items.push({ title: `Daily cash budget is $${Math.round(budget).toLocaleString()}`, detail: "Cases that would fire today are checked against this cap.", to: "/settings" });
  }
  return items.slice(0, 6);
}
