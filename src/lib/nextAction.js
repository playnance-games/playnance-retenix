import { riskLevelOf } from "@/lib/riskLevels";
import { cashWindowFree, computeCashGift, fmtMoney } from "@/lib/retenixLogic";

export function nextBestAction(player, settings = {}) {
  const risk = riskLevelOf(player);
  const gift = computeCashGift(player, settings);
  const noFavorites = !(player.favorites_stated || []).length;

  if (risk.level >= 5) {
    return {
      title: "Review before any cash gift",
      why: risk.sentence,
      expected: risk.action,
      tone: "text-red-600",
    };
  }
  if (player.net_vs_house === "up") {
    return {
      title: "Send education, not cash",
      why: "The player is ahead of the house, so a cash gift stays off.",
      expected: "Keeps the offer useful without paying a player who is already up.",
      tone: "text-foreground",
    };
  }
  if (noFavorites) {
    return {
      title: "Ask the 3-choice survey",
      why: "No stated favorite, so a game recommendation would be a guess.",
      expected: "One reply unlocks a relevant game nudge.",
      tone: "text-foreground",
    };
  }
  if (risk.level >= 4) {
    return {
      title: "Queue one re-engagement case",
      why: risk.sentence,
      expected: risk.action,
      tone: "text-orange-600",
    };
  }
  if (player.net_vs_house === "down" && cashWindowFree(player)) {
    return {
      title: `Offer a ${fmtMoney(gift)} cash gift`,
      why: "They are down versus the house, the 7-day window is free, and risk is not High or Severe.",
      expected: "A capped gift toward the next deposit.",
      tone: "text-emerald-700",
    };
  }
  if (player.in_session) {
    return {
      title: "Leave them playing",
      why: `In a live session${player.current_game ? ` on ${player.current_game}` : ""}.`,
      expected: "No interruption while the session is open.",
      tone: "text-foreground",
    };
  }
  return {
    title: "Send a light activation nudge",
    why: risk.sentence,
    expected: risk.action,
    tone: "text-foreground",
  };
}
