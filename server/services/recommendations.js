import { query } from "../db.js";
import { canonicalSkill } from "../lib/skillCatalog.js";
import { attachPublicCourseRatings } from "./publicCourseRatings.js";

const RANK_ALIASES = {
  rank_01: ["associate", "tan binh", "initiate"],
  rank_02: ["senior associate", "senior", "hoc viec", "apprentice"],
  rank_03: ["assistant manager", "lead", "thanh thao", "adept"],
  rank_04: ["manager", "chuyen gia", "specialist"],
  rank_05: ["senior manager", "bac thay", "master"],
};

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function asList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (value === null || value === undefined || value === "") return [];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {}
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function rankTokens(value) {
  const normalized = normalize(value);
  if (!normalized) return [];
  const tokens = new Set([normalized]);
  Object.entries(RANK_ALIASES).forEach(([id, aliases]) => {
    const all = [id, ...aliases].map(normalize);
    if (all.includes(normalized)) all.forEach((item) => tokens.add(item));
  });
  return [...tokens];
}

function targetMatches(targets, userValues, { rank = false } = {}) {
  const targetList = asList(targets).map(normalize).filter(Boolean);
  const values = asList(userValues).flatMap((value) => rank ? rankTokens(value) : [normalize(value)]).filter(Boolean);
  if (!values.length) return false;
  if (targetList.includes("all")) return true;
  return targetList.some((target) => values.includes(target) || values.some((value) => target.includes(value) || value.includes(target)));
}

function isEnded(course) {
  if (String(course.status || "").toLowerCase() === "ended") return true;
  if (!course.session_date) return false;
  return new Date(`${String(course.session_date).slice(0, 10)}T23:59:59`).getTime() < Date.now();
}

function dateScore(course) {
  if (!course.session_date) return Number.POSITIVE_INFINITY;
  const value = new Date(`${String(course.session_date).slice(0, 10)}T00:00:00`).getTime();
  return Number.isFinite(value) ? value : Number.POSITIVE_INFINITY;
}

function ratingScore(course) {
  const rating = Number(course.rating);
  return Number.isFinite(rating) ? rating : -1;
}

function compareRatingThenDate(a, b) {
  const ratingDiff = ratingScore(b) - ratingScore(a);
  if (ratingDiff) return ratingDiff;
  const dateDiff = dateScore(a) - dateScore(b);
  if (dateDiff) return dateDiff;
  return String(a.id).localeCompare(String(b.id));
}

function compareQuiz(a, b) {
  const hrDiff = Number(Boolean(b.is_hr_recommended)) - Number(Boolean(a.is_hr_recommended));
  return hrDiff || compareRatingThenDate(a, b);
}

function targetIsExact(targets, userValues, { rank = false } = {}) {
  const targetList = asList(targets).map(normalize).filter(Boolean);
  if (!targetList.length || targetList.includes("all")) return false;
  const values = asList(userValues)
    .flatMap((value) => rank ? rankTokens(value) : [normalize(value)])
    .filter(Boolean);
  return targetList.some((target) => values.includes(target));
}

function targetIsWildcard(targets) {
  return asList(targets).some((target) => normalize(target) === "all");
}

function fitScore(course, rankValues, roleValues) {
  // Exact rank is weighted above exact role, then wildcard matches. This keeps
  // the strongest match (exact rank + exact role) first without changing the
  // existing eligibility rules.
  const rankExact = targetIsExact(course.rank_targets, rankValues, { rank: true });
  const roleExact = targetIsExact(course.role_targets, roleValues);
  const rankWildcard = targetIsWildcard(course.rank_targets);
  const roleWildcard = targetIsWildcard(course.role_targets);
  return (rankExact ? 2 : rankWildcard ? 0 : -1) + (roleExact ? 1 : roleWildcard ? 0 : -1);
}

function courseSkillKeys(course) {
  return new Set(asList(course.skill_tags).map((tag) => canonicalSkill(tag) || normalize(tag)).filter(Boolean));
}

export function selectHRRecommendedCourses(candidates, rankValues, roleValues, usedIds = new Set()) {
  const ranked = candidates
    .filter((course) => Boolean(course.is_hr_recommended))
    .filter((course) => targetMatches(course.rank_targets, rankValues, { rank: true }))
    .filter((course) => targetMatches(course.role_targets, roleValues))
    .filter((course) => !usedIds.has(String(course.id)))
    .sort((a, b) => fitScore(b, rankValues, roleValues) - fitScore(a, rankValues, roleValues) || compareRatingThenDate(a, b));

  const selected = [];
  const usedSkills = new Set();
  for (const course of ranked) {
    const skills = courseSkillKeys(course);
    if (!skills.size || ![...skills].some((skill) => !usedSkills.has(skill))) continue;
    selected.push(course);
    skills.forEach((skill) => usedSkills.add(skill));
    if (selected.length === 3) break;
  }
  return selected;
}

function eligible(course, completedIds, reservedIds) {
  return Boolean(course.is_active) &&
    !["draft", "cancelled"].includes(String(course.status || "").toLowerCase()) &&
    !isEnded(course) &&
    !completedIds.has(String(course.id)) &&
    !reservedIds.has(String(course.id));
}

export async function getRecommendationsForUser(userId) {
  const profile = await query("SELECT `rank`, `role`, team, focus_skills FROM users WHERE id = $1", [userId]);
  const user = profile.rows[0] || {};
  const coursesResult = await query(
    `SELECT c.*
     FROM courses c
     WHERE c.is_active = TRUE AND c.status <> 'draft'
     ORDER BY c.created_at DESC`,
  );
  const completedResult = await query("SELECT course_id FROM enrollments WHERE user_id = $1", [userId]);
  const reservedResult = await query(
    `SELECT r.session_id
     FROM reservations r
     WHERE r.user_id = $1 AND r.status <> 'cancelled'`,
    [userId],
  );

  const completedIds = new Set(completedResult.rows.map((row) => String(row.course_id)));
  const reservedIds = new Set(reservedResult.rows.map((row) => String(row.session_id)));
  const candidates = coursesResult.rows.filter((course) => eligible(course, completedIds, reservedIds));
  const rankValues = user.rank;
  const roleValues = [user.role, user.team];
  const skills = asList(user.focus_skills).map((skill) => String(skill).trim()).filter(Boolean).slice(0, 3);
  const usedIds = new Set();
  const quizSkillCourses = [];

  for (const skill of skills) {
    const skillKey = canonicalSkill(skill);
    if (!skillKey) continue;
    const matches = candidates
      .filter((course) => asList(course.skill_tags).some((tag) => canonicalSkill(tag) === skillKey))
      .filter((course) => targetMatches(course.rank_targets, rankValues, { rank: true }))
      .sort(compareQuiz);
    const selected = matches.find((course) => !usedIds.has(String(course.id)));
    if (selected) {
      usedIds.add(String(selected.id));
      quizSkillCourses.push(selected);
    }
  }

  const hrRecommendedCourses = selectHRRecommendedCourses(candidates, rankValues, roleValues, usedIds);

  const [quizWithRatings, hrWithRatings] = await Promise.all([
    attachPublicCourseRatings(quizSkillCourses),
    attachPublicCourseRatings(hrRecommendedCourses),
  ]);
  return {
    quiz_skill_courses: quizWithRatings,
    hr_recommended_courses: hrWithRatings,
    courses: [...quizWithRatings, ...hrWithRatings],
  };
}
