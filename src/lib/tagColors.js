const MAP = {
  min_score: "border-sky-500/30 text-sky-600 dark:text-sky-400 bg-sky-500/10",
  max_score: "border-sky-500/30 text-sky-600 dark:text-sky-400 bg-sky-500/10",
  net_vs_house: "border-violet-500/30 text-violet-600 dark:text-violet-400 bg-violet-500/10",
  max_risk: "border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/10",
  risk: "border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/10",
  lifecycle: "border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10",
  favorite_tag: "border-fuchsia-500/30 text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-500/10",
  favorite: "border-fuchsia-500/30 text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-500/10",
  feature_never_used: "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
  feature_unused: "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
  cash_window_free: "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
};

export function tagClasses(key) {
  return MAP[key] || "border-border text-muted-foreground bg-muted";
}