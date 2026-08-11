import { query } from "../db.js";
import { canonicalSkill } from "../lib/skillCatalog.js";
import { attachPublicCourseRatings } from "./publicCourseRatings.js";

const RANK_ALIASES = {
  rank_01: ["associate", "tan binh", "initiate"],
  rank_02: ["senior associate", "hoc viec", "apprentice"],
  rank_03: ["assistant manager", "lead", "thanh thao", "adept"],
  rank_04: ["manager", "chuyen gia", "specialist"],
  rank_05: ["senior manager", "bac thay", "master"],
};

const MAX_RECOMMENDATIONS = 6;
const LOW_PRIORITY_SKILLS = new Set(["language", "other", "others"]);

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
  if (rank) {
    const targetTokens = new Set(targetList.flatMap(rankTokens));
    return values.some((value) => targetTokens.has(value));
  }
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

function rankFitScore(course, rankValues) {
  const rankExact = targetIsExact(course.rank_targets, rankValues, { rank: true });
  const rankWildcard = targetIsWildcard(course.rank_targets);
  return rankExact ? 2 : rankWildcard ? 0 : -1;
}

function compareQuiz(a, b, rankValues) {
  const rankDiff = rankFitScore(b, rankValues) - rankFitScore(a, rankValues);
  if (rankDiff) return rankDiff;
  const skillDiff = skillPriorityScore(b) - skillPriorityScore(a);
  if (skillDiff) return skillDiff;
  const hrDiff = Number(Boolean(b.is_hr_recommended)) - Number(Boolean(a.is_hr_recommended));
  return hrDiff || compareRatingThenDate(a, b);
}

function targetIsExact(targets, userValues, { rank = false } = {}) {
  const targetList = asList(targets).map(normalize).filter(Boolean);
  if (!targetList.length || targetList.includes("all")) return false;
  const values = asList(userValues)
    .flatMap((value) => rank ? rankTokens(value) : [normalize(value)])
    .filter(Boolean);
  if (rank) {
    const targetTokens = new Set(targetList.flatMap(rankTokens));
    return values.some((value) => targetTokens.has(value));
  }
  return targetList.some((target) => values.includes(target));
}

function targetIsWildcard(targets) {
  return asList(targets).some((target) => normalize(target) === "all");
}

function fitScore(course, rankValues, roleValues) {
  // Exact rank is weighted above exact role, then wildcard matches. This keeps
  // the strongest match (exact rank + exact role) first without changing the
  // existing eligibility rules.
  const roleExact = targetIsExact(course.role_targets, roleValues);
  const roleWildcard = targetIsWildcard(course.role_targets);
  return rankFitScore(course, rankValues) + (roleExact ? 1 : roleWildcard ? 0 : -1);
}

function courseSkillKeys(course) {
  return new Set(asList(course.skill_tags).map((tag) => canonicalSkill(tag) || normalize(tag)).filter(Boolean));
}

function skillPriorityScore(course) {
  const skills = courseSkillKeys(course);
  if (!skills.size) return 0;
  return [...skills].some((skill) => !LOW_PRIORITY_SKILLS.has(normalize(skill))) ? 1 : 0;
}

function compareTargeted(a, b, rankValues, roleValues) {
  const fitDiff = fitScore(b, rankValues, roleValues) - fitScore(a, rankValues, roleValues);
  if (fitDiff) return fitDiff;
  const skillDiff = skillPriorityScore(b) - skillPriorityScore(a);
  if (skillDiff) return skillDiff;
  const hrDiff = Number(Boolean(b.is_hr_recommended)) - Number(Boolean(a.is_hr_recommended));
  return hrDiff || compareRatingThenDate(a, b);
}

function compareOverall(a, b, rankValues) {
  const rankDiff = rankFitScore(b, rankValues) - rankFitScore(a, rankValues);
  if (rankDiff) return rankDiff;
  const skillDiff = skillPriorityScore(b) - skillPriorityScore(a);
  if (skillDiff) return skillDiff;
  const hrDiff = Number(Boolean(b.is_hr_recommended)) - Number(Boolean(a.is_hr_recommended));
  return hrDiff || compareRatingThenDate(a, b);
}

function selectWithSkillDiversity(ranked, limit) {
  const selected = [];
  const selectedIds = new Set();
  const usedSkills = new Set();
  const hasPreferredSkill = ranked.some((course) => skillPriorityScore(course) > 0);

  // First pass prefers different skills. Diversity is a ranking preference,
  // not a hard filter that is allowed to leave recommendation slots empty.
  for (const course of ranked) {
    if (hasPreferredSkill && skillPriorityScore(course) === 0) continue;
    const skills = courseSkillKeys(course);
    if (!skills.size || ![...skills].some((skill) => !usedSkills.has(skill))) continue;
    selected.push(course);
    selectedIds.add(String(course.id));
    skills.forEach((skill) => usedSkills.add(skill));
    if (selected.length === limit) return selected;
  }

  // Backfill with remaining valid courses, including repeated or missing
  // skill tags, until the requested limit is reached.
  for (const course of ranked) {
    if (selectedIds.has(String(course.id))) continue;
    selected.push(course);
    if (selected.length === limit) break;
  }
  return selected;
}

export function selectHRRecommendedCourses(candidates, rankValues, roleValues, usedIds = new Set(), limit = 3) {
  if (limit <= 0) return [];
  const ranked = candidates
    .filter((course) => Boolean(course.is_hr_recommended))
    .filter((course) => targetMatches(course.rank_targets, rankValues, { rank: true }))
    .filter((course) => targetMatches(course.role_targets, roleValues))
    .filter((course) => !usedIds.has(String(course.id)))
    .sort((a, b) => compareTargeted(a, b, rankValues, roleValues));

  return selectWithSkillDiversity(ranked, limit);
}

function eligible(course, completedIds, reservedIds) {
  return Boolean(course.is_active) &&
    !["draft", "cancelled"].includes(String(course.status || "").toLowerCase()) &&
    !isEnded(course) &&
    !completedIds.has(String(course.id)) &&
    !reservedIds.has(String(course.id));
}

function selectFallbackCourses(candidates, rankValues, roleValues, usedIds, limit) {
  if (limit <= 0) return [];
  const ranked = candidates
    .filter((course) => !usedIds.has(String(course.id)))
    .filter((course) => targetMatches(course.rank_targets, rankValues, { rank: true }))
    .filter((course) => targetMatches(course.role_targets, roleValues))
    .sort((a, b) => compareTargeted(a, b, rankValues, roleValues));
  return selectWithSkillDiversity(ranked, limit);
}

export function buildRecommendationsForUser(courses, user, completedIds = new Set(), reservedIds = new Set()) {
  const candidates = courses.filter((course) => eligible(course, completedIds, reservedIds));
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
      .sort((a, b) => compareQuiz(a, b, rankValues));
    const selected = matches.find((course) => !usedIds.has(String(course.id)));
    if (selected) {
      usedIds.add(String(selected.id));
      quizSkillCourses.push(selected);
    }
  }

  const hrRecommendedCourses = selectHRRecommendedCourses(
    candidates,
    rankValues,
    roleValues,
    usedIds,
    MAX_RECOMMENDATIONS - quizSkillCourses.length,
  );
  hrRecommendedCourses.forEach((course) => usedIds.add(String(course.id)));

  const fallbackCourses = selectFallbackCourses(
    candidates,
    rankValues,
    roleValues,
    usedIds,
    MAX_RECOMMENDATIONS - quizSkillCourses.length - hrRecommendedCourses.length,
  );
  const allCourses = [...quizSkillCourses, ...hrRecommendedCourses, ...fallbackCourses]
    .sort((a, b) => compareOverall(a, b, rankValues));

  return {
    quiz_skill_courses: quizSkillCourses,
    hr_recommended_courses: hrRecommendedCourses,
    fallback_courses: fallbackCourses,
    courses: allCourses,
  };
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
  const recommendations = buildRecommendationsForUser(coursesResult.rows, user, completedIds, reservedIds);
  const { quiz_skill_courses: quizSkillCourses, hr_recommended_courses: hrRecommendedCourses, fallback_courses: fallbackCourses } = recommendations;

  const [quizWithRatings, hrWithRatings, fallbackWithRatings] = await Promise.all([
    attachPublicCourseRatings(quizSkillCourses),
    attachPublicCourseRatings(hrRecommendedCourses),
    attachPublicCourseRatings(fallbackCourses),
  ]);
  return {
    quiz_skill_courses: quizWithRatings,
    hr_recommended_courses: hrWithRatings,
    fallback_courses: fallbackWithRatings,
    courses: [...quizWithRatings, ...hrWithRatings, ...fallbackWithRatings]
      .sort((a, b) => compareOverall(a, b, user.rank)),
  };
}
