export default function CaseConditionTags({ conditions = {} }) {
  const c = conditions;
  const labels = [
    c.min_score != null && `Score ≥ ${c.min_score}`,
    c.max_score != null && `Score ≤ ${c.max_score}`,
    c.net_vs_house && `net ${c.net_vs_house}`,
    c.max_risk && `risk ≤ ${c.max_risk}`,
    c.lifecycle,
    c.favorite_tag && `fav ${c.favorite_tag}`,
    c.feature_never_used && `never ${c.feature_never_used}`,
    c.cash_window_free && "window free",
  ].filter(Boolean);
  return labels.length ? <div className="ex-tags">{labels.map((label, i) => <span className="ex-tag" key={i}>{label}</span>)}</div> : null;
}