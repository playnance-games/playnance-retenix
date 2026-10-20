// Shared mock results model — deterministic, derived from each case's fire log.

export function hashStr(s) {
  let h = 0;
  const str = String(s || "");
  for (let i = 0; i < str.length; i++) h = (Math.imul(h, 31) + str.charCodeAt(i)) >>> 0;
  return h;
}

// deterministic mock response rate between 18% and 56%
export function rateFor(key) {
  return 0.18 + (hashStr(key) % 380) / 1000;
}

export function fireConverted(entry, rate) {
  return hashStr((entry.player_id || "") + (entry.timestamp || "")) % 1000 < rate * 1000;
}

export function caseResults(uc) {
  const log = uc.fire_log || [];
  const rate = rateFor(uc.name + (uc.id || ""));
  const conv = log.filter((e) => fireConverted(e, rate)).length;
  return { log, rate, conv, fires: log.length, score: conv };
}