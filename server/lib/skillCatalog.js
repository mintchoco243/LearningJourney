export const SKILL_OPTIONS = [
  "IT / Dev",
  "Game Dev & Game Design",
  "People",
  "Product",
  "Marketing & Esports",
  "Creative",
  "Data / BA",
  "Management",
  "Communication",
  "Problem Solving",
  "Language",
  "AI Adoption",
  "Other",
];

const aliases = {
  "it dev": "IT / Dev",
  "game dev": "Game Dev & Game Design",
  "game design": "Game Dev & Game Design",
  "game understanding": "Game Dev & Game Design",
  foundations: "Game Dev & Game Design",
  product: "Product",
  marketing: "Marketing & Esports",
  esports: "Marketing & Esports",
  creativity: "Creative",
  data: "Data / BA",
  analytics: "Data / BA",
  analysis: "Data / BA",
  leadership: "Management",
  managing: "Management",
  mentoring: "Management",
  "team and talent management": "Management",
  "task management": "Management",
  operations: "Management",
  ops: "Management",
  "ops excellence": "Management",
  "operations excellence": "Management",
  "sops processes": "Management",
  "sops and processes": "Management",
  communication: "Communication",
  "communication and collaboration": "Communication",
  "communication collaboration": "Communication",
  "general soft skills": "Communication",
  "soft skills": "Communication",
  strategy: "Product",
  planning: "Product",
  "planning and strategy": "Product",
  ai: "AI Adoption",
  "ai adoption": "AI Adoption",
};

export function skillKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function canonicalSkill(value) {
  const key = skillKey(value);
  return aliases[key] || SKILL_OPTIONS.find((option) => skillKey(option) === key) || "";
}

export function canonicalizeFocusSkills(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(canonicalSkill).filter(Boolean))];
}
