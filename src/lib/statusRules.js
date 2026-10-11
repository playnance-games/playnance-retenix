export const LIFECYCLE_DEFAULTS = { new_max_days: 14, active_min_sessions_week: 2, active_max_last_seen_days: 3, at_risk_last_seen_days: 14, score_risk_enabled: false, at_risk_max_score: 3 };
export const RISK_DEFAULTS = { version: 2, financial_enabled: true, min_deposits: 3, min_total_deposits: 100, max_wager_ratio: 0.5, watch_withdraw_pct: 80, block_withdraw_pct: 150, play_enabled: true, watch_session_minutes: 120, block_session_minutes: 240, watch_deposit_multiple: 3, block_deposit_multiple: 5, abuse_enabled: true, watch_failed_deposits: 5, block_failed_deposits: 10, watch_chargebacks: 1, block_chargebacks: 2, block_confirmed_abuse: true };
export const riskRules = settings => ({ ...RISK_DEFAULTS, ...(settings?.risk_rules?.version === 2 ? settings.risk_rules : {}) });
export const lifecycleRules = settings => ({ ...LIFECYCLE_DEFAULTS, ...settings?.lifecycle_rules });
export const numeric = value => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));

export function validateStatusRules(settings) {
  const l = lifecycleRules(settings), r = riskRules(settings);
  for (const rules of [l, r]) for (const [key, value] of Object.entries(rules)) {
    if (typeof value !== 'boolean' && (!numeric(value) || Number(value) < 0)) return `${key.replaceAll('_', ' ')} must be a non-negative number.`;
  }
  if (l.active_max_last_seen_days >= l.at_risk_last_seen_days) return 'At-risk inactivity must be longer than the active last-seen window.';
  if (l.at_risk_max_score > 10) return 'The lifecycle score threshold cannot exceed 10.';
  for (const key of ['session_minutes', 'deposit_multiple', 'failed_deposits', 'chargebacks', 'withdraw_pct']) {
    if (r[`watch_${key}`] <= 0 || r[`block_${key}`] <= r[`watch_${key}`]) return `For ${key.replaceAll('_', ' ')}, Watch must be positive and Block must be higher than Watch.`;
  }
  return '';
}