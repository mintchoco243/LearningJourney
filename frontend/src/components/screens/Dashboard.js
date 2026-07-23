"use client";

import React from "react";
import { GLHUI } from '../GLHUI';
import { GLHEngine } from '@/context/GameContext';
import { GLHAvatar } from '../GLHAvatar';
import { CourseCard } from '../GLHParts';
import { AvatarEditModal } from './ProfilePolicy';
import { Calendar } from './CatalogCalendar';
import { GLH_DATA } from '@/data/glhData';
import { getRecommendations } from '@/lib/mockApi';
import { mapCourseToCard } from '@/lib/courseMap.mjs';

const { Icon } = GLHUI;
const D = GLH_DATA;
const { useGame, rankForUser } = GLHEngine;
const { Avatar } = GLHAvatar;

// ─── Stat box ─────────────────────────────────────────────────────────────────
export function Stat({ value, label }) {
  return React.createElement("div", { style: { textAlign: "center", minWidth: 64 } },
    React.createElement("div", { className: "glh-display", style: { fontSize: 28, fontWeight: 700, color: "var(--ui-heading)", lineHeight: 1 } }, value),
    React.createElement("div", { style: { fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--ui-muted)", marginTop: 6 } }, label));
}

function SectionRow({ title, action }) {
  return React.createElement("div", {
    style: { display: "flex", alignItems: "center", justifyContent: "space-between", margin: "36px 0 16px", gap: 16 },
  },
    React.createElement("h2", { className: "u-h3", style: { margin: 0 } }, title),
    action && React.createElement("button", { className: "u-btn u-btn--ghost", style: { fontSize: 13 }, onClick: action.onClick }, action.label));
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

  const [showAvatarEdit, setShowAvatarEdit] = React.useState(false);
  const [recommendations, setRecommendations] = React.useState({ quiz_skill_courses: [], hr_recommended_courses: [], courses: [] });
  const [selectedSkills, setSelectedSkills] = React.useState(user.focus_skills || []);
  const [requestCount, setRequestCount] = React.useState(0);

  React.useEffect(() => {
    getRecommendations().then(setRecommendations);
    fetch("/api/ld-requests/mine", { credentials: "include" })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => setRequestCount((data?.requests || []).filter((item) => ["new", "pending", "in_review"].includes(String(item.status || "").toLowerCase())).length))
      .catch(() => {});
  }, []);

  const filterBySkill = React.useCallback((courses) => selectedSkills.length
    ? courses.filter((course) => (course.skill_tags || []).some((skill) => selectedSkills.includes(skill)))
    : courses, [selectedSkills]);
  const quizCourses = filterBySkill(recommendations.quiz_skill_courses || []);
  const hrCourses = filterBySkill(recommendations.hr_recommended_courses || []);
  const rankCourses = [...quizCourses, ...hrCourses];
  const reservationCourses = (user.reservation_details || []).map((item) => mapCourseToCard(item));
  const registeredCourses = reservationCourses.filter((course) => course.type === "scheduled");
  const reservedCourses = reservationCourses.filter((course) => course.type === "interest");
  const completedCourses = (user.completed_course_details || []).map((item) => mapCourseToCard(item));
  const favoriteCourses = (user.favorite_course_details || []).map((item) => mapCourseToCard(item));
  const progressTotal = rankCourses.length;
  const progressCompleted = rankCourses.filter((course) => isCompletedCourse(course, user)).length;
  const progressPercent = progressTotal ? Math.round((progressCompleted / progressTotal) * 100) : 0;
  const completedAllRankCourses = progressTotal > 0 && progressCompleted === progressTotal;

  return React.createElement("div", { className: "glh-container fade-screen", style: { padding: "28px clamp(16px,4vw,40px) 80px" } },
    showAvatarEdit && React.createElement(AvatarEditModal, {
      initialChar: user.character,
      crisp: props.crisp,
      onClose: () => setShowAvatarEdit(false),
      onSave: c => actions.setCharacter(c)
    }),

    // ── Hero ─────────────────────────────────────────────────────────────────
    React.createElement("div", { className: "dash-hero" },
      React.createElement("div", { className: "dash-hero__avatar", style: { position: "relative" } },
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
        React.createElement("div", { style: { marginTop: 14, maxWidth: 420 } },
          React.createElement("div", { style: { fontSize: 12, color: "var(--ui-muted)", fontWeight: 700, marginBottom: 7 } },
            `Hoàn thành ${progressCompleted}/${progressTotal} khóa gợi ý cho rank của bạn`),
          React.createElement("div", { className: "xpbar", style: { height: 8 } },
            React.createElement("div", { className: "xpbar__fill", style: { width: `${progressPercent}%` } })))),
      React.createElement("div", { className: "dash-quick-stats", style: { display: "grid", gridTemplateColumns: "repeat(3, minmax(76px, 1fr))", gap: 10, minWidth: 270 } },
        [["registered-list", registeredCourses.length, "Đã đăng ký"], ["completed-list", completedCourses.length || completedSessions, "Đã học"], ["reserved-list", reservedCourses.length, "Đặt chỗ"], ["favorite-list", favoriteCourses.length, "Yêu thích"], [null, `${Number.isInteger(totalHours) ? totalHours : totalHours.toFixed(1)}h`, "Giờ học"], [null, requestCount, "Yêu cầu"]].map(([anchor, value, label]) =>
          anchor
            ? React.createElement("button", { key: label, type: "button", onClick: () => document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" }), style: { background: "transparent", border: 0, color: "inherit", cursor: "pointer", padding: 4 } }, React.createElement(Stat, { value, label }))
            : React.createElement(Stat, { key: label, value, label }))
      )),

    React.createElement(SkillFilterBar, { selected: selectedSkills, onChange: setSelectedSkills }),
    React.createElement(Calendar, { embedded: true, onOpenCourse: props.onOpenCourse }),

    React.createElement(React.Fragment, null,
      React.createElement(SectionRow, {
        title: "Gợi ý theo skill và rank của bạn",
        action: progressTotal > 0 ? { label: "Xem tất cả →", onClick: () => props.onNav("library") } : null,
      }),
      completedAllRankCourses && React.createElement("div", { style: { color: "var(--ui-muted)", fontSize: 14, lineHeight: 1.6, margin: "-6px 0 16px" } },
        React.createElement("div", { style: { color: "var(--ui-heading)", fontWeight: 700 } }, "Bạn đã hoàn thành các khóa gợi ý cho rank này."),
        React.createElement("div", null, "Khám phá thêm các khóa học khác khi bạn sẵn sàng.")),
      progressTotal === 0
        ? React.createElement("div", { className: "u-card", style: { padding: 24, background: "var(--rpg-panel)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" } },
            React.createElement("div", { style: { color: "var(--ui-muted)", fontSize: 14, fontWeight: 700 } }, "Chưa có khóa gợi ý cho rank này."),
            React.createElement("button", { className: "u-btn u-btn--primary", onClick: () => props.onNav("library") }, "Xem tất cả các khóa"))
        : React.createElement(React.Fragment, null,
            quizCourses.length ? React.createElement("div", { style: { color: "var(--ui-muted)", fontSize: 12, fontWeight: 700, marginBottom: 8 } }, "Theo skill Quiz") : null,
            React.createElement("div", { className: "rec-grid" }, quizCourses.map(c => React.createElement(CourseCard, { key: c._id || c.session_id || c.course_id, course: c, onClick: props.onOpenCourse, showDate: true }))),
            hrCourses.length ? React.createElement("div", { style: { color: "var(--ui-muted)", fontSize: 12, fontWeight: 700, margin: "18px 0 8px" } }, "HR Recommend") : null,
            React.createElement("div", { className: "rec-grid" }, hrCourses.map(c => React.createElement(CourseCard, { key: c._id || c.session_id || c.course_id, course: c, onClick: props.onOpenCourse, showDate: true }))))),

    React.createElement(PersonalAccordion, { id: "registered-list", title: "Đã đăng ký", courses: registeredCourses, onOpenCourse: props.onOpenCourse }),
    React.createElement(PersonalAccordion, { id: "completed-list", title: "Đã học", courses: completedCourses, onOpenCourse: props.onOpenCourse }),
    React.createElement(PersonalAccordion, { id: "reserved-list", title: "Đặt chỗ", courses: reservedCourses, onOpenCourse: props.onOpenCourse }),
    React.createElement(PersonalAccordion, { id: "favorite-list", title: "Yêu thích", courses: favoriteCourses, onOpenCourse: props.onOpenCourse }),

  );
}

function SkillFilterBar({ selected, onChange }) {
  const toggle = (id) => onChange(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]);
  return React.createElement("div", { style: { position: "sticky", top: 0, zIndex: 30, padding: "10px 0", marginBottom: 18, background: "var(--ui-bg)", backdropFilter: "blur(10px)" } },
    React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" } },
      React.createElement("span", { style: { color: "var(--ui-muted)", fontSize: 12, fontWeight: 700 } }, "Kỹ năng muốn cải thiện"),
      D.SKILLS.map((skill) => React.createElement("button", {
        key: skill.id,
        type: "button",
        onClick: () => toggle(skill.id),
        className: selected.includes(skill.id) ? "u-chip is-active" : "u-chip",
        style: { borderColor: selected.includes(skill.id) ? "var(--glh-accent)" : undefined, background: selected.includes(skill.id) ? "var(--glh-accent-soft)" : undefined },
      }, selected.includes(skill.id) ? "✓ " : "", skill.name)),
      selected.length ? React.createElement("button", { type: "button", className: "u-btn u-btn--ghost", style: { fontSize: 12, padding: "5px 9px" }, onClick: () => onChange([]) }, "Xóa lọc") : null
    )
  );
}

function PersonalAccordion({ id, title, courses, onOpenCourse }) {
  const [open, setOpen] = React.useState(false);
  return React.createElement("section", { id, style: { marginTop: 28, scrollMarginTop: 70 } },
    React.createElement("button", { type: "button", onClick: () => setOpen((value) => !value), style: { width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", border: "1px solid var(--ui-box-border)", borderRadius: open ? "8px 8px 0 0" : 8, background: "var(--ui-box)", color: "var(--ui-heading)", cursor: "pointer", textAlign: "left" } },
      React.createElement("span", null, `${title} (${courses.length})`),
      React.createElement("span", { style: { color: "var(--ui-muted)" } }, open ? "−" : "+")
    ),
    open ? React.createElement("div", { className: "rec-grid", style: { paddingTop: 12 } }, courses.length
      ? courses.map((course) => React.createElement(CourseCard, { key: course._id || course.course_id, course, onClick: onOpenCourse, showDate: true }))
      : React.createElement("div", { className: "u-card", style: { padding: 18, color: "var(--ui-muted)" } }, "Chưa có dữ liệu.")) : null
  );
}
