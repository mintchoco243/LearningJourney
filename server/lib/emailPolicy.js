export function isAllowedGarenaEmail(email) {
  if (typeof email !== "string") return false;
  const normalized = email.trim().toLowerCase();
  const match = normalized.match(/^([^@]+)@garena\.vn$/);
  if (!match) return false;
  return !/(?:_ctv|_ext)$/.test(match[1]);
}
