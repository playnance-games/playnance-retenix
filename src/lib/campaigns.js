import { evaluateCaseForPlayer } from "@/lib/retenixLogic";

const BLOCKED = new Set(["off", "segment", "conditions", "no_segment"]);

export function measureCase(useCase, players, segments, settings) {
  let eligible = 0;
  let firing = 0;
  let cost = 0;
  if (useCase.status !== "on") return { id: useCase.id, eligible: 0, firing: 0, cost: 0, on: false };
  for (const player of players) {
    const result = evaluateCaseForPlayer(player, useCase, settings, segments);
    if (result.wouldFire || !BLOCKED.has(result.reason)) eligible += 1;
    if (result.wouldFire) {
      firing += 1;
      cost += Number(result.gift) || 0;
    }
  }
  return { id: useCase.id, eligible, firing, cost, on: true };
}

export function measureCases(cases, players, segments, settings) {
  const rows = cases.map((useCase) => measureCase(useCase, players, segments, settings));
  return {
    rows,
    byId: Object.fromEntries(rows.map((row) => [row.id, row])),
    eligible: rows.reduce((n, row) => n + row.eligible, 0),
    firing: rows.reduce((n, row) => n + row.firing, 0),
    cost: rows.reduce((n, row) => n + row.cost, 0),
    on: rows.filter((row) => row.on).length,
  };
}
