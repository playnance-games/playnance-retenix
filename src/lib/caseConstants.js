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