export const TRAINER_TYPE_OPTIONS = [
  { id: "internal", label: "Internal Garena VN" },
  { id: "regional", label: "Regional" },
  { id: "external", label: "External" },
];

const TRAINER_TYPE_ALIASES = new Map([
  ["internal", "internal"],
  ["internal garena vn", "internal"],
  ["garena vn", "internal"],
  ["regional", "regional"],
  ["external", "external"],
]);

export function normalizeTrainerType(value) {
  const key = String(value || "").trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
  return TRAINER_TYPE_ALIASES.get(key) || "internal";
}

export function trainerTypeLabel(value) {
  const id = normalizeTrainerType(value);
  return TRAINER_TYPE_OPTIONS.find((option) => option.id === id)?.label || TRAINER_TYPE_OPTIONS[0].label;
}

export function courseTrainerType(course) {
  return normalizeTrainerType(course?.trainer_type || course?.course_source);
}
