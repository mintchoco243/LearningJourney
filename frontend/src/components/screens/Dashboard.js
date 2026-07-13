"use client";

import React from "react";
import { GLHUI } from '../GLHUI';
import { GLHEngine } from '@/context/GameContext';
import { GLHAvatar } from '../GLHAvatar';
import { GLH_DATA } from '@/data/glhData';
import { CourseCard } from '../GLHParts';
import { AvatarEditModal } from './ProfilePolicy';
import { Calendar } from './CatalogCalendar';
import { getRecommendedCourses } from '@/lib/mockApi';
import { sortCoursesByStatusPriority } from '@/lib/courseMap.mjs';

const D = GLH_DATA;
const { Icon } = GLHUI;
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
    React.createElement("h2", { style: { margin: 0, fontSize: "clamp(18px,2.2vw,24px)", fontWeight: 700, color: "var(--ui-heading)" } }, title),
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
  if (!targets.length || targets.includes("all")) return true;
  return targets.some((target) => userRoles.includes(target) || userRoles.some((role) => target.includes(role) || role.includes(target)));
}

function isActiveCourse(course) {
  return course.course_status !== "cancelled" && course.session_status !== "cancelled";
}

export function isCompletedCourse(course, user) {
  const rowId = course._id || course.id || course.course_row_id || course.course_id;
  return rowId ? (user.completed_courses || []).includes(rowId) : false;
}

function roleFitScore(course, user, cls) {
  const userRoles = [user.db_team, user.db_role, cls?.id].map(normalizeText).filter(Boolean);
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

export function rankCompassCourses(courses, user, rank, cls) {
  const rankTokens = userRankTokens(user, rank);
  return (courses || [])
    .map((course, index) => ({ course, index }))
    .filter(({ course }) =>
      isActiveCourse(course) &&
      courseMatchesRank(course, rankTokens) &&
      courseMatchesRole(course, user)
    )
    .sort((a, b) => {
      const roleDiff = roleFitScore(b.course, user, cls) - roleFitScore(a.course, user, cls);
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
  const cls      = D.CLASSES[qr.class_id];
  const rank     = rankForUser(user);
  const revealOpts  = Object.assign({}, user.character, { classColor: cls.color, rank: rank.level });
  const displayName = user.full_name || (user.email ? user.email.split("@")[0] : "bạn");
  const roleLabel   = user.db_team || user.db_role || cls.name;
  const rankLabel   = user.db_rank || rank.name;
  const profileMeta = [roleLabel, rankLabel].filter(Boolean).join(" · ");
  const hasSurvey   = !!(qr._answers?.length > 0);
  const totalHours  = Number(user.hours_total || 0);
  const completedSessions = Number(user.completed_sessions_count ?? user.completed_courses?.length ?? 0);

  const [showAvatarEdit, setShowAvatarEdit] = React.useState(false);
  const [recommended, setRecommended] = React.useState([]);

  React.useEffect(() => {
    getRecommendedCourses().then(rec => setRecommended(rec));
  }, []);

  const rankCourses = React.useMemo(
    () => sortCoursesByStatusPriority(rankCompassCourses(recommended, user, rank, cls), user),
    [recommended, user, rank, cls]
  );
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
      React.createElement("div", { style: { display: "flex", gap: 24 } },
        React.createElement(Stat, { value: completedSessions, label: "Khóa đã học" }),
        React.createElement(Stat, { value: `${Number.isInteger(totalHours) ? totalHours : totalHours.toFixed(1)}h`, label: "Giờ học tích lũy" }))),


    // ── Gợi ý cho rank của bạn ───────────────────────────────────────────────
    React.createElement(React.Fragment, null,
      React.createElement(SectionRow, {
        title: "Gợi ý cho rank của bạn",
        action: progressTotal > 0 ? { label: "Xem tất cả →", onClick: () => props.onNav("library") } : null,
      }),
      completedAllRankCourses && React.createElement("div", { style: { color: "var(--ui-muted)", fontSize: 14, lineHeight: 1.6, margin: "-6px 0 16px" } },
        React.createElement("div", { style: { color: "var(--ui-heading)", fontWeight: 700 } }, "Bạn đã hoàn thành các khóa gợi ý cho rank này 🎯"),
        React.createElement("div", null, "Khám phá thêm các khóa học khác khi bạn sẵn sàng.")),
      progressTotal === 0
        ? React.createElement("div", { className: "u-card", style: { padding: 24, background: "var(--rpg-panel)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" } },
            React.createElement("div", { style: { color: "var(--ui-muted)", fontSize: 14, fontWeight: 700 } }, "Chưa có khóa gợi ý cho rank này."),
            React.createElement("button", { className: "u-btn u-btn--primary", onClick: () => props.onNav("library") }, "Xem tất cả các khóa"))
        : React.createElement("div", { className: "rec-grid" },
            rankCourses.map(c => React.createElement(CourseCard, { key: c._id || c.session_id || c.course_id, course: c, onClick: props.onOpenCourse, showDate: true })))),

    // ── Lịch đào tạo ─────────────────────────────────────────────────────────
    React.createElement("div", { style: { marginTop: 40 } },
      React.createElement(Calendar, { embedded: true, onOpenCourse: props.onOpenCourse }))
  );
}
