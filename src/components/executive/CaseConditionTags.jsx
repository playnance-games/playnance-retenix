export function conditionLabels(conditions = {}) {
  const c = conditions || {};
  return [
    c.min_score != null && `Score ≥ ${c.min_score}`,
    c.max_score != null && `Score ≤ ${c.max_score}`,
    c.net_vs_house && `Net ${c.net_vs_house.replace("_", " ")}`,
    c.max_risk && `Risk ≤ ${c.max_risk.replace("_", " ")}`,
    c.lifecycle && `Lifecycle ${c.lifecycle}`,
    c.favorite_tag && `Likes ${c.favorite_tag}`,
    c.feature_never_used && `Never used ${c.feature_never_used}`,
    c.cash_window_free && "Cash window free",
  ].filter(Boolean);
}

export function filterLabels(filters = {}) {
  const f = filters || {};
  return [
    f.min_score != null && `Score ≥ ${f.min_score}`,
    f.max_score != null && `Score ≤ ${f.max_score}`,
    f.net_vs_house && `Net ${f.net_vs_house.replace("_", " ")}`,
    f.risk && `Risk ${f.risk.replace("_", " ")}`,
    f.lifecycle && `Lifecycle ${f.lifecycle}`,
    f.favorite && `Likes ${f.favorite}`,
    f.feature_unused && `Never used ${f.feature_unused}`,
  ].filter(Boolean);
}

export default function CaseConditionTags({ conditions = {} }) {
  const labels = conditionLabels(conditions);
  return labels.length ? <div className="ex-tags">{labels.map((label, i) => <span className="ex-tag" key={i}>{label}</span>)}</div> : null;
}
