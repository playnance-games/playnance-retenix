export const TYPES = ["cash", "activation", "education", "survey", "channel", "cashier", "engagement", "none"];

export const TYPE_LABELS = {
  cash: "Cash gift",
  activation: "Activation nudge",
  education: "Education card",
  survey: "3-choice survey",
  channel: "Channel copy",
  cashier: "Cashier (deposit/withdraw)",
  engagement: "Engagement (play more)",
  none: "No action",
};

export const TYPE_TIPS = {
  cash: "Cash gift — bonus money credited to the player. Only fires when the player is net down and their cash window is free.",
  activation: "Activation nudge — an offer or prompt that gets the player to take a next step, like opening a game or finishing a deposit.",
  education: "Education card — explains a feature the player hasn't used yet, such as staking or missions.",
  survey: "3-choice survey — asks the player to pick one of three options so Retenix learns their preference.",
  channel: "Channel copy — a message sent off-site (Telegram, WhatsApp, or email) with no on-site popup.",
  cashier: "Cashier — a deposit or withdraw nudge shown around the cashier flow.",
  engagement: "Engagement — encourages more play in the current session, without a cash gift.",
  none: "No action — the case is tracked but shows nothing to the player.",
};

export const CHANNELS = ["site", "telegram", "whatsapp", "email"];

export const SWEETENERS = ["none", "day", "week", "month"];

export const CASE_TIPS = {
  eventTab: "Fires on a single live or historical event — e.g. abandoned deposit, payment failed, kickoff.",
  segTab: "Trigger = player is in a segment, evaluated on schedule or login — not a single live event.",
  type: "Cash gift = bonus money (cash-gated). Activation = nudge/offer. Education = feature card. Survey = 3-choice. Channel = copy only. Cashier = deposit/withdraw nudges. Engagement = drive more play. None = no action.",
  channel: "Where the case is delivered to the player.",
  action: "The creative format shown to the player.",
  trigger: "The event that fires this case.",
  segments: "Assign one or more segments. The case fires for players in any of them.",
  conditions: "All selected conditions must pass for the case to fire (except where marked optional).",
  cash: "min(haircut% of net_down, 1 × avg_deposit) + optional lock sweetener. Never attach 'deposit again for more' after a cash gift.",
  sweetener: "Bonus added if the player accepts a staking lock: +10% day, +20% week, +30% month.",
  visual: "Upload a preview image of the popup/creative shown to the player.",
  status: "Off cases never fire. One offer at a time per player.",
};

export const ACTION_FORMAT_LABEL = (template) => {
  if (!template) return "—";
  if (["wheel", "slot"].includes(template)) return `Mini game · ${template}`;
  if (template === "survey_3choice") return "Survey popup";
  if (template === "education_card") return "Education popup";
  if (["telegram_copy", "whatsapp_copy"].includes(template)) return "Message";
  return `Popup · ${template.replace(/_/g, " ")}`;
};

export const CHANNEL_LABEL = {
  site: "On-site popup",
  telegram: "Telegram message",
  whatsapp: "WhatsApp message",
  email: "Email message",
};