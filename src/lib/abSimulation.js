export const GATES = [{ id: 'spin_wheel', label: 'Spin wheel', complete: 55 }, { id: 'slot_spin', label: 'Slot spin', complete: 50 }, { id: 'survey', label: 'Survey', complete: 40 }, { id: 'education_card', label: 'Education card', complete: 45 }, { id: 'none', label: 'No extra step', complete: 100 }];
export const EMPTY_TEST = { name: '', segment_id: '', reward_case_id: '', gate_step: 'spin_wheel', gate_group: 'b', reward_timing: 'after', split: 50, base_response_pct: 25, completion_pct: 55, uplift_pct: 18 };
export function simulateTest(form, audience) {
  const sizeA = Math.floor(audience * form.split / 100), sizes = { a: sizeA, b: audience - sizeA };
  const base = form.base_response_pct / 100, completion = form.completion_pct / 100;
  const results = Object.fromEntries(['a', 'b'].map(key => {
    const extra = form.gate_step !== 'none' && key === form.gate_group;
    const after = extra && form.reward_timing === 'after';
    const reached = sizes[key] * (after ? completion : 1);
    const rate = after ? Math.min(1, base * (1 + form.uplift_pct / 100)) : base;
    const expected = reached * rate;
    return [key, { size: sizes[key], completed: extra ? sizes[key] * completion : undefined, reached, expected_responses: expected, responses: Math.round(expected), response_rate: sizes[key] ? expected / sizes[key] : 0, rate }];
  }));
  const delta = results.a.response_rate - results.b.response_rate;
  return { results, winner: Math.abs(delta) < 0.000001 ? 'tie' : delta > 0 ? 'a' : 'b' };
}
export function testSequence(run, key) {
  const action = run.reward_case_name || 'Selected action';
  if (run.gate_step === 'none' || (run.gate_group || 'b') !== key) return `${action} directly`;
  const step = run.gate_label || GATES.find(g => g.id === run.gate_step)?.label || 'Extra step';
  return run.reward_timing === 'before' ? `${action} → ${step}` : `${step} → ${action}`;
}
export function testValidation(form, audience, running = false) {
  if (!form.name.trim() || !form.segment_id || !form.reward_case_id) return 'Add a name, segment and case.';
  if (![form.split, form.base_response_pct, form.completion_pct, form.uplift_pct].every(v => v !== '' && Number.isFinite(Number(v)))) return 'Enter a number for each assumption.';
  if (form.split < 10 || form.split > 90 || form.base_response_pct < 0 || form.base_response_pct > 100 || form.completion_pct < 0 || form.completion_pct > 100 || form.uplift_pct < 0 || form.uplift_pct > 100) return 'Split must be 10–90%; assumptions must be 0–100%.';
  if (running && (Math.floor(audience * form.split / 100) < 1 || audience - Math.floor(audience * form.split / 100) < 1)) return 'Each group needs at least one eligible player. Change the segment, case or split.';
  return '';
}