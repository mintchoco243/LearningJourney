// Rank ladders are separate career systems. Keep the group on the user
// context so a shared rank label (for example Associate) is not ambiguous.
export const RANK_GROUPS = Object.freeze({
  GENERAL: "general",
  CORP_IT: "corp_it",
  TECH_GAME: "tech_game",
});

const GENERAL_RANKS = [
  "Associate",
  "Senior Associate",
  "Assistant Manager",
  "Manager",
  "Senior Manager",
  "Director",
];

const CORP_IT_RANKS = [
  "Associate",
  "Senior Associate",
  "Senior Associate I",
  "Senior Associate II",
];

const TECH_GAME_RANKS = [
  "Engineer",
  "Engineer I",
  "Engineer II",
  "Expert Engineer",
  "Senior Engineer",
  "Senior Engineer I",
  "Senior Engineer II",
  "Senior Engineer III",
  "Senior Designer I",
  "Senior Designer II",
  "Senior Product Management Associate II",
  "Senior Product Management Associate III",
];

export const RANKS_BY_GROUP = Object.freeze({
  [RANK_GROUPS.GENERAL]: Object.freeze(GENERAL_RANKS),
  [RANK_GROUPS.CORP_IT]: Object.freeze(CORP_IT_RANKS),
  [RANK_GROUPS.TECH_GAME]: Object.freeze(TECH_GAME_RANKS),
});

const TECH_GAME_RANK_SET = new Set(TECH_GAME_RANKS);

export function rankGroupForUser(user = {}) {
  const role = String(user.role || "").trim();
  const rank = String(user.rank || "").trim();

  // Corporate IT owns its own Associate/Senior Associate ladder.
  if (role === "Corporate IT") return RANK_GROUPS.CORP_IT;

  // Confirmed rule: technical-role people at Assistant Manager are on the
  // general management ladder, not the individual-contributor tech ladder.
  if (rank === "Assistant Manager") return RANK_GROUPS.GENERAL;

  if (TECH_GAME_RANK_SET.has(rank)) return RANK_GROUPS.TECH_GAME;
  return RANK_GROUPS.GENERAL;
}

export function ranksForUser(user = {}) {
  return RANKS_BY_GROUP[rankGroupForUser(user)] || RANKS_BY_GROUP[RANK_GROUPS.GENERAL];
}
