export const SKILL_OPTIONS = [
  "Product",
  "Marketing",
  "Planning & Strategy",
  "Problem Solving and Decision Making",
  "Task Management",
  "Communication and Collaboration",
  "Analysis",
  "Creativity",
  "Game Understanding",
  "Team and Talent Management",
  "AI Adoption",
];

const aliases = {
  product: "Product",
  marketing: "Marketing",
  strategy: "Planning & Strategy",
  planning: "Planning & Strategy",
  "planning and strategy": "Planning & Strategy",
  "problem solving": "Problem Solving and Decision Making",
  "problem solving and decision making": "Problem Solving and Decision Making",
  "task management": "Task Management",
  operations: "Task Management",
  ops: "Task Management",
  "ops excellence": "Task Management",
  "operations excellence": "Task Management",
  "sops processes": "Task Management",
  "sops and processes": "Task Management",
  communication: "Communication and Collaboration",
  "communication and collaboration": "Communication and Collaboration",
  "communication collaboration": "Communication and Collaboration",
  "general soft skills": "Communication and Collaboration",
  "soft skills": "Communication and Collaboration",
  data: "Analysis",
  analytics: "Analysis",
  analysis: "Analysis",
  creativity: "Creativity",
  foundations: "Game Understanding",
  onboarding: "Game Understanding",
  "culture and values": "Game Understanding",
  "game understanding": "Game Understanding",
  "game dev": "Game Understanding",
  "game design": "Game Understanding",
  esports: "Game Understanding",
  leadership: "Team and Talent Management",
  managing: "Team and Talent Management",
  mentoring: "Team and Talent Management",
  management: "Team and Talent Management",
  "team and talent management": "Team and Talent Management",
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
