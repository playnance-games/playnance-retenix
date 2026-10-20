import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

const TYPE_ENUM = ["cash", "activation", "education", "survey", "channel", "cashier", "engagement", "none"];
const TRIGGER_ENUM = ["event", "segment"];
const ACTION_ENUM = ["wheel", "slot", "deposit_prompt", "payment_methods", "birthday", "survey_3choice", "education_card", "telegram_copy", "whatsapp_copy"];
const CHANNEL_ENUM = ["site", "telegram", "whatsapp", "email"];

function compactSnapshot(cases, segments, players, settings) {
  return {
    caseCount: cases.length,
    cases: (cases || []).map((c) => ({
      name: c.name, type: c.type, trigger_mode: c.trigger_mode,
      event_trigger: c.event_trigger, action_template: c.action_template,
      channel: c.channel, status: c.status, segment_ids: c.segment_ids, conditions: c.conditions,
    })),
    segments: (segments || []).map((s) => ({
      name: s.name, seg_key: s.seg_key, filters: s.filters, case_ids: s.case_ids, built_in: s.built_in,
    })),
    playerCount: players.length,
    playerSample: (players || []).slice(0, 8).map((p) => ({
      name: p.name, score: p.score, lifecycle: p.lifecycle, net_vs_house: p.net_vs_house,
      risk: p.risk, favorite_category: p.favorite_category, sessions_per_week: p.sessions_per_week,
    })),
    settings: {
      haircut_pct: settings.haircut_pct, cash_window_days: settings.cash_window_days,
      score_weights: settings.score_weights,
    },
  };
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const task = String(body.task || "chat");
    const message = String(body.message || "");
    if (message.length > 1200) return Response.json({ error: "Message too long (max 1200 chars)" }, { status: 400 });

    const [cases, segments, players, settingsList] = await Promise.all([
      base44.entities.UseCase.list(),
      base44.entities.Segment.list(),
      base44.entities.Player.list("-score", 60),
      base44.entities.Settings.list(),
    ]);
    const settings = settingsList[0] || {};
    const snapshot = compactSnapshot(cases, segments, players, settings);
    const snapJson = JSON.stringify(snapshot).slice(0, 8000);

    if (task === "recommend") {
      const prompt = `You are the Retenix engagement strategist for an online casino (Playnance). Given the current configuration snapshot, recommend NEW cases and segments that are MISSING and would improve retention. Avoid duplicating existing ones. For each suggested case pick valid enums. Suggest 3-5 cases and 2-4 segments.\nSnapshot: ${snapJson}`;
      const schema = {
        type: "object",
        properties: {
          suggested_cases: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                type: { type: "string", enum: TYPE_ENUM },
                trigger_mode: { type: "string", enum: TRIGGER_ENUM },
                event_trigger: { type: "string" },
                action_template: { type: "string", enum: ACTION_ENUM },
                channel: { type: "string", enum: CHANNEL_ENUM },
                rationale: { type: "string" },
              },
              required: ["name", "type", "trigger_mode", "rationale"],
            },
          },
          suggested_segments: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                filters: { type: "object" },
                rationale: { type: "string" },
              },
              required: ["name", "rationale"],
            },
          },
        },
        required: ["suggested_cases", "suggested_segments"],
      };
      const res = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
      return Response.json({ task: "recommend", result: res });
    }

    if (task === "edit_case") {
      const caseId = String(body.case_id || "");
      if (!caseId || caseId.length > 100 || !message.trim()) return Response.json({ error: "Select a case and describe the changes." }, { status: 400 });
      const current = await base44.entities.UseCase.get(caseId);
      if (!current) return Response.json({ error: "Case not found." }, { status: 404 });
      const schema = { type: "object", properties: {
        summary: { type: "string" }, changes: { type: "object", properties: {
          name: { type: "string" }, type: { type: "string", enum: TYPE_ENUM },
          trigger_mode: { type: "string", enum: TRIGGER_ENUM }, event_trigger: { type: "string" },
          channel: { type: "string", enum: CHANNEL_ENUM }, action_template: { type: "string", enum: ACTION_ENUM },
          status: { type: "string", enum: ["on", "off"] },
          content_text: { type: "string" }, message_text: { type: "string" }, message_link: { type: "string" },
          button_label: { type: "string" }, button_link: { type: "string" },
          survey_options: { type: "array", items: { type: "string" } },
          conditions: { type: "object", properties: {
            min_score: { type: "number" }, max_score: { type: "number" }, net_vs_house: { type: "string", enum: ["", "up", "down", "too_thin"] },
            max_risk: { type: "string", enum: ["", "clean", "watch", "block_offers"] },
            lifecycle: { type: "string", enum: ["", "new", "active", "quiet", "at-risk"] },
            favorite_tag: { type: "string", enum: ["", "slots", "live", "sports", "none"] },
            feature_never_used: { type: "string" }, cash_window_free: { type: "boolean" },
          } },
        } },
      } };
      const prompt = `You edit ONE existing Retenix case. Return ONLY requested changes, never create a new case or modify player records. Keep all other fields unchanged. Editable keys: name,type,trigger_mode,event_trigger,channel,action_template,status,content_text,message_text,message_link,button_label,button_link,survey_options (up to 3 choices),conditions (only changed keys). For a site popup use content_text and button_label/button_link; for telegram/whatsapp/email use message_text/message_link; for a survey use survey_options. Never invent an image URL. Enums: type ${TYPE_ENUM.join(", ")}; trigger_mode ${TRIGGER_ENUM.join(", ")}; action_template ${ACTION_ENUM.join(", ")}; channel ${CHANNEL_ENUM.join(", ")}. Summarize the proposal in one sentence.\nCurrent case: ${JSON.stringify({name:current.name,type:current.type,trigger_mode:current.trigger_mode,event_trigger:current.event_trigger,channel:current.channel,action_template:current.action_template,status:current.status,content_text:current.content_text,message_text:current.message_text,message_link:current.message_link,button_label:current.button_label,button_link:current.button_link,survey_options:current.survey_options,conditions:current.conditions}).slice(0,4000)}\nUser request: ${message}`;
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
      const allowed = Object.keys(schema.properties.changes.properties);
      const blank = value => value === '' || (Array.isArray(value) && value.length === 0);
      const changes = Object.fromEntries(Object.entries(result.changes || {}).filter(([key, value]) => allowed.includes(key) && value !== null && value !== undefined && key !== 'conditions' && !(current[key] == null && blank(value)) && JSON.stringify(value) !== JSON.stringify(current[key])));
      if (result.changes?.conditions) {
        const cond = Object.fromEntries(Object.entries(result.changes.conditions).filter(([key, value]) => key in schema.properties.changes.properties.conditions.properties && value !== null && !(current.conditions?.[key] == null && (blank(value) || value === 0 || value === false)) && JSON.stringify(value) !== JSON.stringify(current.conditions?.[key])));
        if (Object.keys(cond).length) changes.conditions = cond;
      }
      if (changes.survey_options) changes.survey_options = changes.survey_options.slice(0,3).map(v => String(v).slice(0,120));
      return Response.json({ task: "edit_case", result: { summary: result.summary || "Review these changes before saving.", changes } });
    }

    if (task === "action") {
      const prompt = `You are Retenix's action agent. Convert the user's request into ONE creation action — either a new case or a new segment — using the valid enums. Only propose a creation if the user clearly asks to create/add one; otherwise action="none". Return a short summary too.\nValid type enums: ${TYPE_ENUM.join(", ")}; action_template: ${ACTION_ENUM.join(", ")}; channel: ${CHANNEL_ENUM.join(", ")}. For create_case payload include name,type,trigger_mode,event_trigger,action_template,channel. For create_segment payload include name and filters object (keys: min_score,max_score,net_vs_house,favorite,feature_unused,risk,lifecycle with "" or null for unused).\nSnapshot: ${snapJson}\nUser request: ${message}`;
      const schema = {
        type: "object",
        properties: {
          action: { type: "string", enum: ["create_case", "create_segment", "none"] },
          summary: { type: "string" },
          payload: {
            type: "object",
            properties: {
              name: { type: "string" },
              type: { type: "string", enum: TYPE_ENUM },
              trigger_mode: { type: "string", enum: TRIGGER_ENUM },
              event_trigger: { type: "string" },
              action_template: { type: "string", enum: ACTION_ENUM },
              channel: { type: "string", enum: CHANNEL_ENUM },
              filters: { type: "object" },
            },
          },
        },
        required: ["action", "summary", "payload"],
      };
      const res = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
      return Response.json({ task: "action", result: res });
    }

    if (task === "ab_create") {
      const segNames = (segments || []).map((s) => s.name);
      const caseNames = (cases || []).map((c) => c.name);
      const form = body.form || {};
      const history = Array.isArray(body.history) ? body.history.slice(-10) : [];
      const cur = {
        name: form.name || "",
        segment_name: form.segment_id ? ((segments || []).find((s) => s.id === form.segment_id) || {}).name || "" : "",
        reward_case_name: form.reward_case_id ? ((cases || []).find((c) => c.id === form.reward_case_id) || {}).name || "" : "",
        gate_step: form.gate_step || "",
        gate_group: form.gate_group || "",
        reward_timing: form.reward_timing || "",
        split: form.split ?? "",
        base_response_pct: form.base_response_pct ?? "",
        completion_pct: form.completion_pct ?? "",
        uplift_pct: form.uplift_pct ?? "",
      };
      const prompt = `You are Retenix's A/B test planner. Guide the user through creating a test ONE step at a time. Ask exactly ONE question, then wait for the answer. Follow this order and only advance once the current step is answered:\n1. Test name\n2. Audience segment (pick from available segments)\n3. Reward case (pick from available cases)\n4. Extra step (gate): spin_wheel, slot_spin, survey, education_card, or none\n5. Which group gets the extra step: a or b\n6. Reward timing: before or after the step\n7. Split: group A share (10-90)\n8. Assumptions: base_response_pct, completion_pct, uplift_pct (all 0-100)\n\nLook at the current form. Find the FIRST field still empty/missing. Ask the user for THAT field only. When the user answers, put the value in "changes" (use exact segment/case names). If the answer is unclear, ask again. When ALL fields are filled, return a one-sentence summary in "answer" and set "complete": true. Always return "answer" (your message) and "changes" (only fields you are setting now, or empty object).\n\nAvailable segments: ${JSON.stringify(segNames)}\nAvailable cases: ${JSON.stringify(caseNames)}\nGate steps: spin_wheel (complete~55), slot_spin (50), survey (40), education_card (45), none (100).\nCurrent form: ${JSON.stringify(cur)}\nConversation so far: ${JSON.stringify(history)}\nUser: ${message}`;
      const schema = {
        type: "object",
        properties: {
          answer: { type: "string" },
          changes: { type: "object", properties: {
            name: { type: "string" },
            segment_name: { type: "string" },
            reward_case_name: { type: "string" },
            gate_step: { type: "string", enum: ["spin_wheel", "slot_spin", "survey", "education_card", "none"] },
            gate_group: { type: "string", enum: ["a", "b"] },
            reward_timing: { type: "string", enum: ["before", "after"] },
            split: { type: "number" },
            base_response_pct: { type: "number" },
            completion_pct: { type: "number" },
            uplift_pct: { type: "number" },
          } },
          complete: { type: "boolean" },
        },
        required: ["answer", "changes", "complete"],
      };
      const res = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
      return Response.json({ task: "ab_create", result: { answer: res.answer || "What would you like to name this test?", changes: res.changes || {}, complete: !!res.complete } });
    }

    if (task === "settings_help") {
      const currentSettings = body.settings || {};
      const history = Array.isArray(body.history) ? body.history.slice(-12) : [];
      const prompt = `You are Retenix's settings assistant for an online casino (Playnance). The user can change ANY house setting through you in plain language. Your job: understand what they want to change, decide concrete values, and apply them.\n\nYou can modify these settings:\n- Cash policy: haircut_pct (number 5-50), per_gift_ceiling ("1x"|"2x"|"3x"|"4x"|"5x"), cash_window_days (number 1-30)\n- lock_sweeteners: {day,week,month} numbers 0-50\n- education_caps: {per_session,per_week} numbers 0-10\n- quiet_hours_default: {start:"HH:MM",end:"HH:MM"}\n- lifecycle_rules (how lifecycle stages are defined): new_max_days, active_min_sessions_week, active_max_last_seen_days, at_risk_last_seen_days, score_risk_enabled (bool), at_risk_max_score (0-10)\n- risk_rules (how risk levels are defined): min_deposits, min_total_deposits, max_wager_ratio, watch_withdraw_pct, block_withdraw_pct, watch_session_minutes, block_session_minutes, watch_deposit_multiple, block_deposit_multiple, watch_failed_deposits, block_failed_deposits, watch_chargebacks, block_chargebacks, block_confirmed_abuse (bool), financial_enabled (bool), play_enabled (bool), abuse_enabled (bool)\n- score_weights: {sessions,deposits,wagering,engagement,age} — if changed, all five must still sum to 100\n\nCRITICAL — "changed_keys": In the "changed_keys" array, list ONLY the top-level setting keys you are actually changing this turn (one of: haircut_pct, per_gift_ceiling, cash_window_days, lock_sweeteners, education_caps, quiet_hours_default, lifecycle_rules, risk_rules, score_weights). Keys NOT in changed_keys will be ignored. If you are only asking a question and not changing anything, return changed_keys: [].\n\nCRITICAL — "suggestions": Fill the values for the keys you listed in changed_keys. For nested objects, include the sub-keys you are changing (you may also echo current sub-values for context — only the ones that differ will be applied). Do NOT fill keys you are not changing. Example: user says "make at-risk 10 days" → changed_keys: ["lifecycle_rules"], suggestions: {"lifecycle_rules":{"at_risk_last_seen_days":10}}. Example: user says "cash more generous" → changed_keys: ["haircut_pct","per_gift_ceiling","cash_window_days"], suggestions: {"haircut_pct":35,"per_gift_ceiling":"4x","cash_window_days":3}.\n\nOther rules:\n- If the user hasn't said what to change, ask what they'd like to adjust (changed_keys: [], suggestions: {}).\n- For risk thresholds, block must be higher than watch. For lifecycle, at_risk_last_seen_days must be greater than active_max_last_seen_days.\n- Confirm in one sentence what you changed. Keep answers under 70 words.\n- After every reply, provide exactly 3 short clickable option strings in "options" suggesting sensible next changes.\n- Set "complete": true only when the user explicitly says they're done.\n\nCurrent settings: ${JSON.stringify(currentSettings).slice(0, 4000)}\nConversation so far: ${JSON.stringify(history)}\nUser: ${message}`;
      const schema = {
        type: "object",
        properties: {
          answer: { type: "string" },
          options: { type: "array", items: { type: "string" }, maxItems: 3 },
          changed_keys: { type: "array", items: { type: "string", enum: ["haircut_pct", "per_gift_ceiling", "cash_window_days", "lock_sweeteners", "education_caps", "quiet_hours_default", "lifecycle_rules", "risk_rules", "score_weights"] } },
          suggestions: { type: "object", properties: {
            haircut_pct: { type: "number" }, per_gift_ceiling: { type: "string" }, cash_window_days: { type: "number" },
            lock_sweeteners: { type: "object", properties: { day: { type: "number" }, week: { type: "number" }, month: { type: "number" } } },
            education_caps: { type: "object", properties: { per_session: { type: "number" }, per_week: { type: "number" } } },
            quiet_hours_default: { type: "object", properties: { start: { type: "string" }, end: { type: "string" } } },
            lifecycle_rules: { type: "object", properties: {
              new_max_days: { type: "number" }, active_min_sessions_week: { type: "number" },
              active_max_last_seen_days: { type: "number" }, at_risk_last_seen_days: { type: "number" },
              score_risk_enabled: { type: "boolean" }, at_risk_max_score: { type: "number" },
            } },
            risk_rules: { type: "object", properties: {
              financial_enabled: { type: "boolean" }, min_deposits: { type: "number" }, min_total_deposits: { type: "number" },
              max_wager_ratio: { type: "number" }, watch_withdraw_pct: { type: "number" }, block_withdraw_pct: { type: "number" },
              play_enabled: { type: "boolean" }, watch_session_minutes: { type: "number" }, block_session_minutes: { type: "number" },
              watch_deposit_multiple: { type: "number" }, block_deposit_multiple: { type: "number" },
              abuse_enabled: { type: "boolean" }, watch_failed_deposits: { type: "number" }, block_failed_deposits: { type: "number" },
              watch_chargebacks: { type: "number" }, block_chargebacks: { type: "number" }, block_confirmed_abuse: { type: "boolean" },
            } },
            score_weights: { type: "object", properties: { sessions: { type: "number" }, deposits: { type: "number" }, wagering: { type: "number" }, engagement: { type: "number" }, age: { type: "number" } } },
          } },
          complete: { type: "boolean" },
        },
        required: ["answer", "options", "changed_keys", "suggestions", "complete"],
      };
      const res = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
      const changedKeys = new Set(Array.isArray(res.changed_keys) ? res.changed_keys : []);
      const rawSug = (res.suggestions && typeof res.suggestions === "object") ? res.suggestions : {};
      const suggestions = Object.fromEntries(Object.entries(rawSug).filter(([k, v]) => changedKeys.has(k) && v !== null && v !== undefined && v !== "" && !(typeof v === "object" && Object.keys(v).length === 0)));
      const options = Array.isArray(res.options) ? res.options.slice(0, 3).map(o => String(o).slice(0, 80)) : [];
      return Response.json({ task: "settings_help", result: { answer: res.answer || "What would you like to change?", options, suggestions, complete: !!res.complete } });
    }

    if (task === "segment_help") {
      const draft = body.draft || {};
      const history = Array.isArray(body.history) ? body.history.slice(-12) : [];
      const prompt = `You are Retenix's segment creation assistant for an online casino (Playnance). Guide the user through defining a player segment ONE step at a time. Ask exactly ONE question, then wait. Follow this order:\n1. Goal — what outcome they want from this segment\n2. Lifecycle — new, active, quiet, or at-risk\n3. Risk — clean, watch, or block_offers\n4. Net vs house — up, down, or too_thin\n5. Score range — min and/or max (0-10)\n6. Favorite category — slots, live, sports, or none\n7. Feature unused — staking, streaming, missions, tournaments, leaderboard, g_coin (or skip)\n\nLook at the current draft filters. Find the FIRST thing still missing. Ask for THAT only. When the user answers, put values in "filters" (only keys you are setting). When the key dimensions are covered, set "complete": true and tell the user to name the segment and save.\n\nCRITICAL: After every reply, provide exactly 3 short option strings in "options" that the user can click to answer the current question. Make them concrete (e.g., lifecycle states, risk levels, or example answers). The user can also type freely. Keep your answer under 60 words.\n\nFilter keys: min_score (number 0-10), max_score (number 0-10), net_vs_house ("up"|"down"|"too_thin"), risk ("clean"|"watch"|"block_offers"), lifecycle ("new"|"active"|"quiet"|"at-risk"), favorite ("slots"|"live"|"sports"|"none"), feature_unused ("staking"|"streaming"|"missions"|"tournaments"|"leaderboard"|"g_coin").\nCurrent draft: ${JSON.stringify({ name: draft.name, filters: draft.filters }).slice(0, 2000)}\nConversation so far: ${JSON.stringify(history)}\nUser: ${message}`;
      const schema = {
        type: "object",
        properties: {
          answer: { type: "string" },
          options: { type: "array", items: { type: "string" }, maxItems: 3 },
          filters: { type: "object", properties: {
            min_score: { type: "number" }, max_score: { type: "number" },
            net_vs_house: { type: "string", enum: ["", "up", "down", "too_thin"] },
            risk: { type: "string", enum: ["", "clean", "watch", "block_offers"] },
            lifecycle: { type: "string", enum: ["", "new", "active", "quiet", "at-risk"] },
            favorite: { type: "string", enum: ["", "slots", "live", "sports", "none"] },
            feature_unused: { type: "string" },
          } },
          complete: { type: "boolean" },
        },
        required: ["answer", "options", "filters", "complete"],
      };
      const res = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
      const filters = (res.filters && typeof res.filters === "object") ? Object.fromEntries(Object.entries(res.filters).filter(([, v]) => v !== null && v !== undefined && v !== "")) : {};
      const options = Array.isArray(res.options) ? res.options.slice(0, 3).map(o => String(o).slice(0, 80)) : [];
      return Response.json({ task: "segment_help", result: { answer: res.answer || "Let's define your segment.", options, filters, complete: !!res.complete } });
    }

    if (task === "case_create_help") {
      const draft = body.draft || {};
      const history = Array.isArray(body.history) ? body.history.slice(-12) : [];
      const segNames = (segments || []).map((s) => s.name);
      const forAll = !!body.forAll;
      const schema = { type: "object", properties: {
        answer: { type: "string" },
        options: { type: "array", items: { type: "string" }, maxItems: 3 },
        changes: { type: "object", properties: {
          name: { type: "string" }, type: { type: "string", enum: TYPE_ENUM },
          trigger_mode: { type: "string", enum: TRIGGER_ENUM }, segment_name: { type: "string" },
          channel: { type: "string", enum: CHANNEL_ENUM }, action_template: { type: "string", enum: ACTION_ENUM },
          status: { type: "string", enum: ["on", "off"] },
          content_text: { type: "string" }, message_text: { type: "string" }, message_link: { type: "string" },
          button_label: { type: "string" }, button_link: { type: "string" },
          survey_options: { type: "array", items: { type: "string" } },
          conditions: { type: "object", properties: {
            min_score: { type: "number" }, max_score: { type: "number" }, net_vs_house: { type: "string", enum: ["", "up", "down", "too_thin"] },
            max_risk: { type: "string", enum: ["", "clean", "watch", "block_offers"] },
            lifecycle: { type: "string", enum: ["", "new", "active", "quiet", "at-risk"] },
            favorite_tag: { type: "string", enum: ["", "slots", "live", "sports", "none"] },
            feature_never_used: { type: "string" }, cash_window_free: { type: "boolean" },
          } },
        } },
        complete: { type: "boolean" },
      }, required: ["answer", "options", "changes", "complete"] };
      const segmentStep = forAll
        ? `2. Audience — already decided: this case applies to ALL users (trigger_mode "event", no segment). Do NOT ask about segments or mention segments. Skip straight to channel.`
        : `2. Segment — which existing segment to target (pick from available segments by exact name). If no segments exist, say "There are no segments yet — let's create one first" and set options to ["Create a segment first", "Apply to all users", "Skip for now"].`;
      const triggerRule = forAll ? `Always set trigger_mode to "event" and never set segment_name.` : `Always set trigger_mode to "segment".`;
      const completeRule = forAll ? `When ALL key parts are filled (type, action_template, content/message, and name), set "complete": true` : `When ALL key parts are filled (type, segment_name, action_template, content/message, and name), set "complete": true`;
      const prompt = `You are Retenix's case creation assistant for an online casino (Playnance). Guide the user through creating a new engagement case ONE step at a time.\n\nAsk exactly ONE question, then wait. Follow this order:\n1. Goal — what outcome? sets type (${TYPE_ENUM.join(", ")})\n${segmentStep}\n3. Channel — ${CHANNEL_ENUM.join(", ")}\n4. Action & creative — action_template (${ACTION_ENUM.join(", ")}); for site use content_text + button_label/button_link; for telegram/whatsapp/email use message_text/message_link; for survey use survey_options (up to 3)\n5. Name — a short case name\n\nLook at the current draft. Find the FIRST thing still missing. Ask for THAT only. When the user answers, put values in "changes" (only keys you are setting). ${triggerRule} ${completeRule} and return a one-sentence summary.\n\nCRITICAL: After every reply, provide exactly 3 short option strings in "options" that the user can click to answer the current question. Make them concrete (e.g., type names, segment names, or example answers). The user can also type freely. Keep your answer under 60 words.\n\nAvailable segments: ${JSON.stringify(segNames)}\nEnums: type ${TYPE_ENUM.join(", ")}; action_template ${ACTION_ENUM.join(", ")}; channel ${CHANNEL_ENUM.join(", ")}.\nCurrent draft: ${JSON.stringify({ name: draft.name, type: draft.type, trigger_mode: draft.trigger_mode, segment_name: draft.segment_name, channel: draft.channel, action_template: draft.action_template, status: draft.status, content_text: draft.content_text, message_text: draft.message_text, message_link: draft.message_link, button_label: draft.button_label, button_link: draft.button_link, survey_options: draft.survey_options, conditions: draft.conditions }).slice(0, 3000)}\nConversation so far: ${JSON.stringify(history)}\nUser: ${message}`;
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
      const allowed = Object.keys(schema.properties.changes.properties);
      const blank = value => value === '' || (Array.isArray(value) && value.length === 0);
      const changes = Object.fromEntries(Object.entries(result.changes || {}).filter(([key, value]) => allowed.includes(key) && value !== null && value !== undefined && key !== 'conditions' && !(draft[key] == null && blank(value)) && JSON.stringify(value) !== JSON.stringify(draft[key])));
      if (result.changes?.conditions) {
        const cond = Object.fromEntries(Object.entries(result.changes.conditions).filter(([key, value]) => key in schema.properties.changes.properties.conditions.properties && value !== null && !(draft.conditions?.[key] == null && (blank(value) || value === 0 || value === false)) && JSON.stringify(value) !== JSON.stringify(draft.conditions?.[key])));
        if (Object.keys(cond).length) changes.conditions = cond;
      }
      if (changes.survey_options) changes.survey_options = changes.survey_options.slice(0,3).map(v => String(v).slice(0,120));
      const options = Array.isArray(result.options) ? result.options.slice(0, 3).map(o => String(o).slice(0, 80)) : [];
      return Response.json({ task: "case_create_help", result: { answer: result.answer || "Let's define your case.", options, changes, complete: !!result.complete } });
    }

    const prompt = `You are the Retenix assistant, an internal ops helper for Playnance's player engagement system. Answer the user's question clearly and concisely using ONLY the provided snapshot. Retenix has: Players (with score, lifecycle, net vs house, risk), Segments (player filters + assigned cases), Cases (event or segment triggered; types: cash, activation, education, survey, channel, cashier, engagement, none; cash is gated by net-down + a 7-day window + risk). Keep answers under 140 words.\nSnapshot: ${snapJson}\nUser question: ${message}`;
    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt });
    return Response.json({ task: "chat", answer: typeof res === "string" ? res : JSON.stringify(res) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}