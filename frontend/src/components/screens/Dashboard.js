"use client";

import React from "react";
import { GLHUI } from '../GLHUI';
import { GLHEngine } from '@/context/GameContext';
import { GLHAvatar } from '../GLHAvatar';
import { CourseCard } from '../GLHParts';
import { AvatarEditModal } from './ProfilePolicy';
import {
  Calendar,
  CourseSearchFilters,
  applyCourseFilters,
  countActiveCourseFilters,
  defaultCourseFilters,
  getVisibleFilterOptions,
  getCourseFilterOptions,
} from './CatalogCalendar';
import { getRecommendations } from '@/lib/mockApi';
import { mapCourseToCard } from '@/lib/courseMap.mjs';
import { SKILL_OPTIONS, getSkillVisual, skillLabel } from '@/lib/skillCatalog';

const { Icon } = GLHUI;
const { useGame, rankForUser } = GLHEngine;
const { Avatar } = GLHAvatar;

// ─── Stat box ─────────────────────────────────────────────────────────────────
export function Stat({ value, label, onClick }) {
  const content = React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", minWidth: 0, textAlign: "center" } },
    React.createElement("div", { style: { minWidth: 0, width: "100%" } },
      React.createElement("div", { className: "glh-display", style: { fontSize: 21, fontWeight: 700, color: "var(--ui-heading)", lineHeight: 1 } }, value),
      React.createElement("div", { style: { fontSize: 10, fontWeight: 400, color: "var(--ui-muted)", marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, label)));
  const style = { width: "100%", minWidth: 0, padding: 9, border: "1px solid var(--ui-box-border)", borderRadius: 8, background: "var(--ui-box)", color: "inherit", textAlign: "left" };
  return onClick
    ? React.createElement("button", { type: "button", onClick, title: "Mở Yêu cầu của tôi", "aria-label": "Mở Yêu cầu của tôi", className: "dash-stat dash-stat--action", style: Object.assign({}, style, { cursor: "pointer" }) }, content)
    : React.createElement("div", { className: "dash-stat", style }, content);
}

function SectionRow({ title }) {
  return React.createElement("div", {
    className: "dashboard-section-heading-row",
  },
    React.createElement("h2", { className: "u-h2 dash-section-heading", style: { margin: 0 } }, title));
}

const RANK_ALIASES = {
  rank_01: ["rank_01", "associate", "tan binh", "initiate"],
  rank_02: ["rank_02", "senior", "senior associate", "hoc viec", "apprentice"],
  rank_03: ["rank_03", "lead", "assistant manager", "thanh thao", "adept"],
  rank_04: ["rank_04", "manager", "chuyen gia", "specialist"],
  rank_05: ["rank_05", "senior manager", "bac thay", "master"],
};

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function asList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (value == null || value === "") return [];
  if (typeof value === "string") {
    const text = value.trim();
    if (!text) return [];
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {}
    return text.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [value];
}

function expandRankTokens(value) {
  const normalized = normalizeText(value);
  if (!normalized) return [];
  const matches = [normalized];
  Object.entries(RANK_ALIASES).forEach(([id, aliases]) => {
    const normalizedAliases = aliases.map(normalizeText);
    if (id === value || normalizedAliases.includes(normalized)) {
      matches.push(id, ...normalizedAliases);
    }
  });
  return Array.from(new Set(matches));
}

function userRankTokens(user, rank) {
  if (!user.db_rank) return [];
  return expandRankTokens(user.db_rank);
}

function courseMatchesRank(course, rankTokens) {
  if (!rankTokens.length) return true;
  const targets = asList(course.rank_ids || course.rank_targets).flatMap(expandRankTokens);
  if (!targets.length) return false;
  if (targets.includes("all")) return true;
  return targets.some((target) => rankTokens.includes(target));
}

function courseMatchesRole(course, user) {
  const userRoles = [user.db_role, user.db_team].map(normalizeText).filter(Boolean);
  if (!userRoles.length) return true;
  const targets = asList(course.class_ids || course.role_targets).map(normalizeText).filter(Boolean);
  if (!targets.length) return false;
  if (targets.includes("all")) return true;
  return targets.some((target) => userRoles.includes(target) || userRoles.some((role) => target.includes(role) || role.includes(target)));
}

function isActiveCourse(course) {
  return course.course_status !== "cancelled" && course.session_status !== "cancelled";
}

function courseLifecycleStatus(course) {
  return String(course.status || course.course_status || "").trim().toLowerCase();
}

function isEndedCourse(course) {
  return courseLifecycleStatus(course) === "ended";
}

function hasCourseMaterial(course) {
  return Boolean(String(course.material_url || course.materials_url || "").trim());
}

export function isCompletedCourse(course, user) {
  const rowId = course._id || course.id || course.course_row_id || course.course_id;
  return rowId ? (user.completed_courses || []).includes(rowId) : false;
}

function roleFitScore(course, user) {
  const userRoles = [user.db_team, user.db_role].map(normalizeText).filter(Boolean);
  const targets = asList(course.class_ids || course.role_targets).map(normalizeText).filter(Boolean);
  if (!userRoles.length || !targets.length) return 0;
  if (targets.includes("all")) return 1;
  if (targets.some((target) => userRoles.includes(target))) return 3;
  if (targets.some((target) => userRoles.some((role) => target.includes(role) || role.includes(target)))) return 2;
  return 0;
}

function interestFitScore(course, user) {
  const quizExt = user.quiz_extended || user.quiz_result?.quiz_extended || {};
  const userSignals = [
    ...asList(user.learning_formats),
    ...asList(user.preferred_trainers),
    ...asList(quizExt.learning_style),
    ...asList(quizExt.trainers),
  ].map(normalizeText).filter(Boolean);
  if (!userSignals.length) return 0;
  const courseSignals = [
    course.format,
    course.trainer,
    ...(course.skill_tags || []),
  ].map(normalizeText).filter(Boolean);
  return courseSignals.reduce((score, signal) => score + (userSignals.includes(signal) ? 1 : 0), 0);
}

function upcomingTime(course) {
  if (!course.start_date) return Number.POSITIVE_INFINITY;
  const time = new Date(course.start_date).getTime();
  return Number.isFinite(time) && time >= Date.now() - 86400000 ? time : Number.POSITIVE_INFINITY;
}

function courseFitTier(course, rankTokens, user) {
  const rankTargets = asList(course.rank_ids || course.rank_targets).flatMap(expandRankTokens);
  const rankIsAll = rankTargets.includes("all");
  const rankSpecificMatch = !rankIsAll && rankTargets.some((target) => rankTokens.includes(target));

  const userRoles = [user.db_role, user.db_team].map(normalizeText).filter(Boolean);
  const roleTargets = asList(course.class_ids || course.role_targets).map(normalizeText).filter(Boolean);
  const roleIsAll = roleTargets.includes("all");
  const roleSpecificMatch = !roleIsAll && roleTargets.some((target) =>
    userRoles.includes(target) || userRoles.some((role) => target.includes(role) || role.includes(target))
  );

  return rankSpecificMatch && roleSpecificMatch ? 0 : 1; // 0 = fit chuẩn rank & role, 1 = "all"/chung
}

function endedCourseDate(course) {
  const raw = course.start_date || (course.session_date ? String(course.session_date).split("T")[0] : null);
  const time = raw ? new Date(raw).getTime() : NaN;
  return Number.isFinite(time) ? time : Number.NEGATIVE_INFINITY;
}

const MAX_ENDED_MATERIAL_COURSES = 6;

export function rankCompassCourses(courses, user, rank) {
  const rankTokens = userRankTokens(user, rank);
  return (courses || [])
    .map((course, index) => ({ course, index }))
    .filter(({ course }) =>
      isActiveCourse(course) &&
      courseMatchesRank(course, rankTokens) &&
      courseMatchesRole(course, user)
    )
    .sort((a, b) => {
      const roleDiff = roleFitScore(b.course, user) - roleFitScore(a.course, user);
      if (roleDiff) return roleDiff;
      const dateDiff = upcomingTime(a.course) - upcomingTime(b.course);
      if (dateDiff) return dateDiff;
      const interestDiff = interestFitScore(b.course, user) - interestFitScore(a.course, user);
      if (interestDiff) return interestDiff;
      return a.index - b.index;
    })
    .map(({ course }) => course);
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export function Dashboard(props) {
  const { user, actions } = useGame();
  const qr       = user.quiz_result;
  const rank     = rankForUser(user);
  const revealOpts  = Object.assign({}, user.character, { rank: rank.level });
  const displayName = user.full_name || (user.email ? user.email.split("@")[0] : "bạn");
  const roleLabel   = user.db_team || user.db_role;
  const rankLabel   = user.db_rank || rank.name;
  const profileMeta = [roleLabel, rankLabel].filter(Boolean).join(" · ");
  const hasSurvey   = !!(qr?._answers?.length > 0);
  const totalHours  = Number(user.hours_total || 0);
  const completedSessions = Number(user.completed_sessions_count ?? user.completed_courses?.length ?? 0);
  const directFocusSkills = Array.isArray(user.focus_skills) ? user.focus_skills : [];
  const fallbackFocusSkills = Array.isArray(qr?.quiz_extended?.focus_skills) ? qr.quiz_extended.focus_skills : [];
  const savedFocusSkills = [...new Set((directFocusSkills.length ? directFocusSkills : fallbackFocusSkills)
    .map(skillLabel)
    .filter((skill) => SKILL_OPTIONS.includes(skill)))];
  const quizPreferences = user.quiz_extended || qr?.quiz_extended || {};
  const directLearningFormats = Array.isArray(user.learning_formats) ? user.learning_formats : [];
  const fallbackLearningFormats = Array.isArray(quizPreferences.learning_style) ? quizPreferences.learning_style : [];
  const learningFormatLabels = { video: "Video tự học", workshop: "Workshop", coaching: "Coaching 1-1", reading: "Reading / Tài liệu" };
  const availabilityLabels = { under1: "Dưới 1 giờ/tuần", "1to2": "1-2 giờ/tuần", "3plus": "3+ giờ/tuần" };
  const learningFormats = (directLearningFormats.length ? directLearningFormats : fallbackLearningFormats)
    .map((format) => learningFormatLabels[format] || format)
    .filter(Boolean);
  const weeklyHours = user.weekly_hours || quizPreferences.availability;
  const heroPreferences = [
    weeklyHours ? { icon: "clock", value: availabilityLabels[weeklyHours] || weeklyHours } : null,
    learningFormats.length ? { icon: "book-open", value: learningFormats.join(", ") } : null,
  ].filter(Boolean);

  const [showAvatarEdit, setShowAvatarEdit] = React.useState(false);
  const [recommendations, setRecommendations] = React.useState({ quiz_skill_courses: [], hr_recommended_courses: [], courses: [] });
  const [requestCount, setRequestCount] = React.useState(0);

  React.useEffect(() => {
    getRecommendations().then(setRecommendations);
    fetch("/api/ld-requests/mine", { credentials: "include" })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => setRequestCount((data?.requests || []).filter((item) => ["new", "pending", "in_review"].includes(String(item.status || "").toLowerCase())).length))
      .catch(() => {});
  }, []);

  const quizCourses = recommendations.quiz_skill_courses || [];
  const hrCourses = recommendations.hr_recommended_courses || [];
  const rankCourses = [...quizCourses, ...hrCourses];
  const reservationCourses = (user.reservation_details || []).map((item) => mapCourseToCard(item));
  const registeredCourses = reservationCourses.filter((course) => course.type === "scheduled");
  const reservedCourses = reservationCourses.filter((course) => course.type === "interest");
  const completedCourses = (user.completed_course_details || []).map((item) => mapCourseToCard(item));
  const favoriteCourses = (user.favorite_course_details || []).map((item) => mapCourseToCard(item));
  const progressTotal = rankCourses.length;
  const completedAllRankCourses = progressTotal > 0 && rankCourses.every((course) => isCompletedCourse(course, user));

  return React.createElement("div", { className: "glh-container fade-screen", style: { padding: "28px clamp(16px,4vw,40px) 80px" } },
    showAvatarEdit && React.createElement(AvatarEditModal, {
      initialChar: user.character,
      crisp: props.crisp,
      onClose: () => setShowAvatarEdit(false),
      onSave: c => actions.setCharacter(c)
    }),

    // ── Hero ─────────────────────────────────────────────────────────────────
    React.createElement("div", { className: "dash-hero", style: { padding: "8px 16px" } },
      React.createElement("div", { className: "dash-hero__avatar", style: { position: "relative", padding: 4 } },
        React.createElement(Avatar, { opts: revealOpts, size: 80, crisp: props.crisp }),
        React.createElement("button", {
          onClick: () => setShowAvatarEdit(true),
          title: "Chỉnh sửa avatar / Xem hồ sơ cá nhân",
          className: "avatar-edit-btn",
          style: {
            position: "absolute",
            bottom: -6,
            right: -6,
            background: "var(--glh-accent)",
            border: "2px solid var(--rpg-panel)",
            borderRadius: "50%",
            width: 24,
            height: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
          }
        }, React.createElement(Icon, { name: "edit-3", size: 11, color: "#fff" }))
      ),
      React.createElement("div", { style: { minWidth: 0 } },
        React.createElement("div", { className: "dash-rank" }, profileMeta),
        React.createElement("div", { className: "dash-classname", style: { color: "var(--ui-heading)" } }, displayName),
        savedFocusSkills.length ? React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 } },
          React.createElement("span", { style: { alignSelf: "center", color: "var(--ui-muted)", fontSize: 10, fontWeight: 700 } }, "Kỹ năng ưu tiên"),
          savedFocusSkills.map((skill) => {
            const visual = getSkillVisual(skill);
            return React.createElement("span", {
              key: skill,
              style: { display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 700, color: visual.color, background: visual.color + "18", border: "1px solid " + visual.color + "55", borderRadius: 999, padding: "4px 7px" }
            }, React.createElement(Icon, { name: visual.icon, size: 11, color: visual.color }), skill);
          })) : null),
    React.createElement("div", { className: "dash-hero__stats" },
      React.createElement("div", { className: "dash-quick-stats" },
        [[completedCourses.length || completedSessions, "Khóa đã học"], [`${Number.isInteger(totalHours) ? totalHours : totalHours.toFixed(1)}h`, "Giờ học tích lũy"], [requestCount, "Yêu cầu"]].map(([value, label]) =>
          React.createElement(Stat, { key: label, value, label, onClick: label === "Yêu cầu" ? props.onOpenLdRequestStatus : undefined }))
      ),
      heroPreferences.length ? React.createElement("div", { className: "dash-hero__preferences" },
          heroPreferences.map((item) => React.createElement("span", {
            key: item.icon,
            style: { display: "inline-flex", alignItems: "center", gap: 5, color: "var(--ui-muted)", fontSize: 10, fontWeight: 600 }
          }, React.createElement(Icon, { name: item.icon, size: 12, color: "var(--amber)" }), item.value))
        ) : null)),

    React.createElement(Calendar, { embedded: true, onOpenCourse: props.onOpenCourse }),

    React.createElement(React.Fragment, null,
      React.createElement(SectionRow, {
        title: "Gợi ý dành cho bạn",
      }),
      completedAllRankCourses && React.createElement("div", { style: { color: "var(--ui-muted)", fontSize: 14, lineHeight: 1.6, margin: "-6px 0 16px" } },
        React.createElement("div", { style: { color: "var(--ui-heading)", fontWeight: 700 } }, "Bạn đã hoàn thành các khóa gợi ý cho rank này."),
        React.createElement("div", null, "Khám phá thêm các khóa học khác khi bạn sẵn sàng.")),
      progressTotal === 0
        ? React.createElement("div", { className: "u-card", style: { padding: 24, background: "var(--rpg-panel)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" } },
            React.createElement("div", { style: { color: "var(--ui-muted)", fontSize: 14, fontWeight: 700 } }, "Chưa có khóa gợi ý cho rank này."),
            React.createElement("button", { className: "u-btn u-btn--primary", onClick: () => props.onNav("library") }, "Xem tất cả các khóa"))
        : React.createElement(React.Fragment, null,
            React.createElement("div", { className: "rec-grid" }, [...quizCourses, ...hrCourses].map(c => React.createElement(CourseCard, { key: c._id || c.session_id || c.course_id, course: c, onClick: props.onOpenCourse, showDate: true })))),
      progressTotal > 0 && React.createElement("div", { className: "dashboard-section-action" },
        React.createElement("button", { type: "button", className: "u-btn u-btn--ghost my-learning-section__toggle", onClick: () => props.onNav("library") }, "Khám phá toàn bộ thư viện →")),

    React.createElement(MyLearningSection, { registeredCourses, completedCourses, reservedCourses, favoriteCourses, onOpenCourse: props.onOpenCourse }),

  ));
}

function MyLearningSection({ registeredCourses, completedCourses, reservedCourses, favoriteCourses, onOpenCourse }) {
  const { user } = useGame();
  const [open, setOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("registered");
  const [filters, setFilters] = React.useState(defaultCourseFilters);
  const groups = {
    registered: { label: "Đã đăng ký", courses: registeredCourses },
    completed: { label: "Đã học", courses: completedCourses },
    reserved: { label: "Đặt chỗ", courses: reservedCourses },
    favorite: { label: "Yêu thích", courses: favoriteCourses },
  };
  const summary = `${registeredCourses.length} đã đăng ký · ${completedCourses.length} đã học · ${reservedCourses.length} đặt chỗ · ${favoriteCourses.length} yêu thích`;
  const active = groups[activeTab];
  const allCourses = [...registeredCourses, ...completedCourses, ...reservedCourses, ...favoriteCourses];
  const filterOptions = getCourseFilterOptions(allCourses);
  const visibleFilterOptions = getVisibleFilterOptions(active.courses, filters, filterOptions);
  const activeFilterCount = countActiveCourseFilters(filters);
  const visibleCourses = applyCourseFilters(active.courses, filters, user);

  return React.createElement("section", { id: "my-learning", className: "my-learning-section", style: { scrollMarginTop: 70 } },
    React.createElement("div", { className: "my-learning-section__header" },
      React.createElement("h2", { className: "u-h2 dash-section-heading", style: { margin: 0 } }, "Khóa học của bạn"),
      React.createElement("button", { type: "button", className: "u-btn u-btn--ghost my-learning-section__toggle", onClick: () => setOpen((value) => !value), "aria-expanded": open }, open ? "Ẩn danh sách ↑" : "Hiện danh sách ↓")),
    React.createElement("div", { className: "my-learning-section__summary" }, summary),
    open ? React.createElement(React.Fragment, null,
      React.createElement("div", { className: "my-learning-tabs", role: "tablist" }, Object.entries(groups).map(([key, group]) =>
        React.createElement("button", { key, type: "button", role: "tab", "aria-selected": activeTab === key, className: activeTab === key ? "my-learning-tab is-active" : "my-learning-tab", onClick: () => setActiveTab(key) }, `${group.label} (${group.courses.length})`))),
      React.createElement(CourseSearchFilters, { filters, setFilters, options: visibleFilterOptions, activeFilterCount }),
      visibleCourses.length
        ? React.createElement("div", { className: "my-learning-list" }, visibleCourses.map((course) => React.createElement(SimpleCourseRow, { key: course._id || course.course_id, course, tab: activeTab, onOpenCourse })))
        : React.createElement("div", { className: "u-card my-learning-empty" }, active.courses.length ? "Không có khóa học phù hợp với bộ lọc." : "Chưa có dữ liệu.")) : null
  );
}

function SimpleCourseRow({ course, tab, onOpenCourse }) {
  const status = tab === "completed" ? "Đã hoàn thành" : tab === "reserved" ? "Đã đặt chỗ" : tab === "favorite" ? "Yêu thích" : "Đã đăng ký";
  return React.createElement("button", { type: "button", className: "my-learning-row", onClick: () => onOpenCourse(course) },
    React.createElement("span", { className: "my-learning-row__title" }, course.title),
    React.createElement("span", { className: "my-learning-row__status" }, status),
    React.createElement(Icon, { name: "chevron-right", size: 16, color: "var(--glh-accent)" }));
}
