const KEY = "retenix-settings-audit";

export function readAudit() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function recordAudit(summary) {
  const next = [{ at: new Date().toISOString(), summary }, ...readAudit()].slice(0, 8);
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* preview storage can be blocked */ }
  return next;
}
