const DAY_MS = 24 * 60 * 60 * 1000;
const formatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit",
});

export function vietnamDateKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = Object.fromEntries(formatter.formatToParts(date).map(({ type, value: part }) => [type, part]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function nextNineAmDelay(now = new Date()) {
  const [year, month, day] = vietnamDateKey(now).split("-").map(Number);
  const nineAmUtc = Date.UTC(year, month - 1, day, 2); // Vietnam is UTC+7.
  return (nineAmUtc > now.getTime() ? nineAmUtc : nineAmUtc + DAY_MS) - now.getTime();
}

export function hasPassedNineAm(now = new Date()) {
  const [year, month, day] = vietnamDateKey(now).split("-").map(Number);
  return now.getTime() >= Date.UTC(year, month - 1, day, 2);
}

export function wasCheckedToday(lastCheck, now = new Date()) {
  return Boolean(lastCheck) && vietnamDateKey(lastCheck) === vietnamDateKey(now);
}
