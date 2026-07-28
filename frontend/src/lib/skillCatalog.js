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

export const SKILL_VISUALS = {
  "IT / Dev": { color: "#38BDF8", icon: "hammer" },
  "Game Dev & Game Design": { color: "#C084FC", icon: "play" },
  "People": { color: "#F87171", icon: "users" },
  "Product": { color: "#A78BFA", icon: "puzzle" },
  "Marketing & Esports": { color: "#F472B6", icon: "trending-up" },
  "Creative": { color: "#FB7185", icon: "sparkles" },
  "Data / BA": { color: "#0EA5E9", icon: "bar-chart-2" },
  "Management": { color: "#F59E0B", icon: "user-check" },
  "Communication": { color: "#2DD4BF", icon: "message-circle" },
  "Problem Solving": { color: "#34D399", icon: "target" },
  "Language": { color: "#60A5FA", icon: "compass" },
  "AI Adoption": { color: "#FBBF24", icon: "cpu" },
  "Other": { color: "#94A3B8", icon: "layers" },
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
  "communication collaboration": "Communication",
  "communication and collaboration": "Communication",
  "general soft skills": "Communication",
  "soft skills": "Communication",
  strategy: "Product",
  planning: "Product",
  "planning and strategy": "Product",
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
