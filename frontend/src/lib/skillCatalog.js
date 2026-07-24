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

export const SKILL_VISUALS = {
  "Product": { color: "#A78BFA", icon: "puzzle" },
  "Marketing": { color: "#F472B6", icon: "trending-up" },
  "Planning & Strategy": { color: "#60A5FA", icon: "compass" },
  "Problem Solving and Decision Making": { color: "#F59E0B", icon: "target" },
  "Task Management": { color: "#34D399", icon: "check-circle" },
  "Communication and Collaboration": { color: "#2DD4BF", icon: "users" },
  "Analysis": { color: "#38BDF8", icon: "bar-chart-2" },
  "Creativity": { color: "#FB7185", icon: "sparkles" },
  "Game Understanding": { color: "#C084FC", icon: "play" },
  "Team and Talent Management": { color: "#F87171", icon: "user-check" },
  "AI Adoption": { color: "#FBBF24", icon: "cpu" },
};

const LEGACY_SKILL_VISUALS = {
  foundations: { color: "#818CF8", icon: "book-open", label: "Nền tảng" },
  data: { color: "#38BDF8", icon: "bar-chart-2", label: "Dữ liệu" },
  analytics: { color: "#38BDF8", icon: "bar-chart-2", label: "Phân tích" },
  communication: { color: "#2DD4BF", icon: "users", label: "Giao tiếp" },
  facilitation: { color: "#2DD4BF", icon: "presentation", label: "Đào tạo" },
  product: { color: "#A78BFA", icon: "puzzle", label: "Sản phẩm" },
  strategy: { color: "#60A5FA", icon: "compass", label: "Chiến lược" },
  ai: { color: "#FBBF24", icon: "cpu", label: "AI" },
  leadership: { color: "#F87171", icon: "user-check", label: "Lãnh đạo" },
  mentoring: { color: "#F87171", icon: "user-check", label: "Dẫn dắt" },
  ops_excellence: { color: "#34D399", icon: "check-circle", label: "Vận hành" },
  all: { color: "#60A5FA", icon: "layers", label: "Đa kỹ năng" },
};

const FALLBACK_SKILL_VISUALS = [
  { color: "#22D3EE", icon: "sparkles" },
  { color: "#A78BFA", icon: "puzzle" },
  { color: "#F472B6", icon: "trending-up" },
  { color: "#34D399", icon: "check-circle" },
  { color: "#FBBF24", icon: "target" },
];

const aliases = {
  product: "Product",
  marketing: "Marketing",
  strategy: "Planning & Strategy",
  planning: "Planning & Strategy",
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

const keyOf = (value) => String(value || "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/&/g, " and ")
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

export function skillLabel(value) {
  const key = keyOf(value);
  if (aliases[key]) return aliases[key];
  return SKILL_OPTIONS.find((option) => keyOf(option) === key) || String(value || "").trim();
}

export function getSkillVisual(value) {
  const label = skillLabel(value);
  const standard = SKILL_VISUALS[label];
  if (standard) return { ...standard, label };
  const key = keyOf(value);
  if (LEGACY_SKILL_VISUALS[key]) return LEGACY_SKILL_VISUALS[key];
  const hash = [...key].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return { ...FALLBACK_SKILL_VISUALS[hash % FALLBACK_SKILL_VISUALS.length], label };
}

export function getSkillOptionsFromCourses(courses, fallback = SKILL_OPTIONS) {
  const discovered = [...new Set((courses || []).flatMap((course) => course.skill_tags || []).map(skillLabel).filter(Boolean))];
  return discovered.length ? SKILL_OPTIONS.filter((option) => discovered.includes(option)) : [...fallback];
}

export function courseHasSkill(course, selected) {
  const wanted = new Set((selected || []).map(skillLabel));
  return (course?.skill_tags || []).some((tag) => wanted.has(skillLabel(tag)));
}
