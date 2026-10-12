import { riskRules, lifecycleRules, numeric } from '@/lib/statusRules';

export function assessPlayerRisk(player, settings = {}) {
  const r = riskRules(settings), reasons = [], missing = [];
  const check = (label, value, watch, block) => {
    if (value >= block) reasons.push({ level: 'block_offers', label });
    else if (value >= watch) reasons.push({ level: 'watch', label });
  };
  if (r.financial_enabled) {
    if (['total_deposits', 'withdrawals', 'total_wagered', 'deposit_count'].every(k => numeric(player[k]))) {
      const deposits = Number(player.total_deposits);
      if (deposits > 0 && deposits >= r.min_total_deposits && player.deposit_count >= r.min_deposits && player.total_wagered / deposits <= r.max_wager_ratio) check('High withdrawals with low lifetime wagering', player.withdrawals / deposits * 100, r.watch_withdraw_pct, r.block_withdraw_pct);
    } else missing.push('Financial totals');
  }
  if (r.play_enabled) {
    if (player.in_session) {
      if (numeric(player.session_minutes)) check('Long current session', Number(player.session_minutes), r.watch_session_minutes, r.block_session_minutes);
      else missing.push('Current session duration');
    }
    if (numeric(player.last_deposit) && numeric(player.avg_deposit) && Number(player.avg_deposit) > 0 && numeric(player.deposit_count)) {
      if (player.deposit_count >= r.min_deposits) check('Last deposit substantially above average', player.last_deposit / player.avg_deposit, r.watch_deposit_multiple, r.block_deposit_multiple);
    } else missing.push('Deposit size baseline');
  }
  if (r.abuse_enabled) {
    for (const [field, label, watch, block] of [['failed_deposits_24h', 'Repeated failed deposits (24h)', r.watch_failed_deposits, r.block_failed_deposits], ['chargebacks_30d', 'Recorded chargebacks (30d)', r.watch_chargebacks, r.block_chargebacks]]) {
      if (numeric(player[field])) check(label, Number(player[field]), watch, block); else missing.push(label);
    }
    if (player.confirmed_account_abuse === true) reasons.push({ level: r.block_confirmed_abuse ? 'block_offers' : 'watch', label: 'Account abuse confirmed by review' });
    else if (player.confirmed_account_abuse !== false) missing.push('Account-abuse review');
  }
  const risk = reasons.some(r => r.level === 'block_offers') ? 'block_offers' : reasons.length ? 'watch' : 'clean';
  return { risk, reasons, missing };
}

export function derivePlayerStatus(player, settings = {}) {
  const l = lifecycleRules(settings);
  const daysSince = date => date && Number.isFinite(Date.parse(date)) ? Math.max(0, (Date.now() - Date.parse(date)) / 864e5) : null;
  const seen = daysSince(player.last_seen), age = daysSince(player.first_seen);
  let lifecycle = player.lifecycle || 'quiet';
  if (seen !== null) {
    if (seen > l.at_risk_last_seen_days || (l.score_risk_enabled && seen > l.active_max_last_seen_days && numeric(player.score) && player.score <= l.at_risk_max_score)) lifecycle = 'at-risk';
    else if (age !== null && age <= l.new_max_days) lifecycle = 'new';
    else if (seen <= l.active_max_last_seen_days && numeric(player.sessions_per_week) && player.sessions_per_week >= l.active_min_sessions_week) lifecycle = 'active';
    else lifecycle = 'quiet';
  }
  const net_vs_house = numeric(player.net_amount) ? Number(player.net_amount) > 0 ? 'up' : Number(player.net_amount) < -50 ? 'down' : 'too_thin' : player.net_vs_house || 'too_thin';
  return { lifecycle, net_vs_house, risk: assessPlayerRisk(player, settings).risk };
}