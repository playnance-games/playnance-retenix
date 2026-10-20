export function recordedActivity(cases, events) {
  const linked = events.filter(e => e.case_id).map(e => ({ id: e.id, case_id: e.case_id, case_name: e.case_name, player_id: e.player_id, name: e.player_name || e.player_id, gift: Number(e.gift_amount || 0), timestamp: e.timestamp, source: e.source || 'player' }));
  const ids = new Set(linked.map(e => e.id));
  const legacy = cases.flatMap(c => (c.fire_log || []).filter(e => !ids.has(e.event_id)).map((e, i) => ({ ...e, id: e.event_id || `${c.id}-${i}`, case_id: c.id, case_name: c.name, gift: Number(e.gift || 0), source: 'legacy log' })));
  return [...linked, ...legacy].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
}
export function summarizeActivity(log) {
  const gifts = log.filter(e => e.gift > 0);
  const cost = gifts.reduce((n,e) => n + e.gift, 0);
  return { fires: log.length, players: new Set(log.map(e => e.player_id).filter(Boolean)).size, cost, average: gifts.length ? cost / gifts.length : 0 };
}
export function rankActivity(cases, activity, order) {
  const map = new Map(cases.map(c => [c.id, { id: c.id, name: c.name, type: c.type, channel: c.channel, log: [] }]));
  for (const event of activity) {
    if (!map.has(event.case_id)) map.set(event.case_id, { id: event.case_id, name: event.case_name || 'Removed case', type: 'archived', channel: 'unknown', log: [] });
    map.get(event.case_id).log.push(event);
  }
  return [...map.values()].map(row => ({ ...row, ...summarizeActivity(row.log) })).sort((a,b) => b[order] - a[order] || b.fires - a.fires || a.name.localeCompare(b.name));
}