"use client";

import React from "react";
import { GLHUI } from '../GLHUI';
import { GLHEngine } from '@/context/GameContext';
import { GLHAvatar } from '../GLHAvatar';
import { GLH_DATA } from '@/data/glhData';
import { CourseCard } from '../GLHParts';
import { getUpcomingCourses, getRecommendedCourses } from '@/lib/mockApi';
import { getCourseCta } from '@/lib/courseMap.mjs';

const D = GLH_DATA;
const { FORMAT_LABEL, DOW_VI, MONTHS_VI } = GLHUI;
const { useGame, rankForXp } = GLHEngine;
const { Avatar } = GLHAvatar;

const FORMAT_COLOR = {
  offline:   { bg: "rgba(228,30,38,0.18)",   color: "#FF8A8E" },
  online:    { bg: "rgba(43,182,163,0.18)",   color: "#2BB6A3" },
  elearning: { bg: "rgba(122,92,255,0.18)",   color: "#A38BFF" },
};

function ctaColor(cta) {
  return ({
    accent: "var(--glh-accent)",
    warning: "#FF9E00",
    purple: "#A38BFF",
    success: "var(--garena-positive)",
    muted: "var(--rpg-muted)",
  })[cta?.tone] || "var(--rpg-muted)";
}

// ─── Upcoming item (grouped by month, same as Calendar ListView) ─────────────
function UpcomingItem({ course, onOpen }) {
  const { user } = useGame();
  const { title, format, location, start_date, start_time, end_time } = course;
  const cta = getCourseCta(course, user);
  const dayNum  = start_date ? new Date(start_date).getDate() : null;
  const dow     = start_date ? DOW_VI[(new Date(start_date).getDay() + 6) % 7] : null;
  const countdown = course.countdown_days;
  const countdownColor = countdown != null ? (countdown <= 5 ? "#E41E26" : countdown <= 14 ? "#FF9E00" : "var(--rpg-muted)") : null;
  const timeMeta = [start_time && end_time ? `${start_time} – ${end_time}` : start_time, location].filter(Boolean);

  return React.createElement("button", {
    className: "u-card u-card--hover",
    style: { textAlign: "left", padding: "14px 18px", display: "flex", alignItems: "center", gap: 16, cursor: "pointer", width: "100%", background: "var(--rpg-panel)" },
    onClick: () => onOpen(course),
  },
    // date block
    dayNum && React.createElement("div", { style: { textAlign: "center", minWidth: 44, flexShrink: 0 } },
      React.createElement("div", { style: { fontSize: 22, fontWeight: 700, color: "#fff", lineHeight: 1 } }, dayNum),
      React.createElement("div", { style: { fontSize: 11, color: "var(--garena-grey)", textTransform: "uppercase", marginTop: 2 } }, dow)),

    // content
    React.createElement("div", { style: { flex: 1, minWidth: 0 } },
      React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" } },
        React.createElement("div", { className: "u-h3", style: { fontSize: 15, margin: 0 } }, title),
        React.createElement("span", { style: { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", padding: "2px 8px", borderRadius: 999, background: (FORMAT_COLOR[format] || {}).bg || "rgba(255,255,255,0.07)", color: (FORMAT_COLOR[format] || {}).color || "var(--rpg-muted)", flexShrink: 0 } },
          FORMAT_LABEL[format] || format)),
      React.createElement("div", { style: { fontSize: 13, color: "var(--garena-grey)", marginTop: 4, display: "flex", gap: 12, flexWrap: "wrap" } },
        timeMeta.map((m, i) => React.createElement("span", { key: i }, m)))),

    // right: CTA + countdown stacked
    React.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 } },
      React.createElement("span", { style: { fontSize: 12, fontWeight: 800, whiteSpace: "nowrap", color: ctaColor(cta) } }, cta.text),
      countdown != null && React.createElement("span", {
        style: { fontSize: 11, fontWeight: 700, color: countdownColor },
      }, countdown === 0 ? "Hôm nay" : `Còn ${countdown} ngày`)));
}

// Groups upcoming by month — same as Calendar ListView
function UpcomingList({ courses, onOpen }) {
  const groups = {};
  courses.forEach(c => {
    const d = new Date(c.start_date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    (groups[key] = groups[key] || []).push(c);
  });
  return React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 24 } },
    Object.keys(groups).map(key => {
      const [yy, mm] = key.split("-").map(Number);
      return React.createElement("div", { key },
        React.createElement("h3", { style: { fontSize: 16, fontWeight: 700, color: "var(--garena-red)", marginBottom: 10, marginTop: 0 } },
          `${MONTHS_VI[mm]} ${yy}`),
        React.createElement("div", { style: { display: "grid", gap: 8 } },
          groups[key].map(c => React.createElement(UpcomingItem, { key: c.course_id, course: c, onOpen }))));
    }));
}

// ─── Stat box ─────────────────────────────────────────────────────────────────
function Stat({ value, label }) {
  return React.createElement("div", { style: { textAlign: "center", minWidth: 64 } },
    React.createElement("div", { className: "glh-display", style: { fontSize: 28, fontWeight: 700, color: "#fff", lineHeight: 1 } }, value),
    React.createElement("div", { style: { fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--rpg-muted)", marginTop: 6 } }, label));
}

function SectionRow({ title, action }) {
  return React.createElement("div", {
    style: { display: "flex", alignItems: "center", justifyContent: "space-between", margin: "36px 0 16px", gap: 16 },
  },
    React.createElement("h2", { style: { margin: 0, fontSize: "clamp(18px,2.2vw,24px)", fontWeight: 700, color: "#fff" } }, title),
    action && React.createElement("button", { className: "u-btn u-btn--ghost", style: { fontSize: 13 }, onClick: action.onClick }, action.label));
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export function Dashboard(props) {
  const { user } = useGame();
  const qr       = user.quiz_result;
  const cls      = D.CLASSES[qr.class_id];
  const rank     = rankForXp(user.xp);
  const revealOpts  = Object.assign({}, user.character, { classColor: cls.color, rank: rank.level });
  const displayName = user.full_name || (user.email ? user.email.split("@")[0] : "bạn");
  const deptLabel   = qr._answers?.[0]?.label ?? cls.name;
  const hasSurvey   = !!(qr._answers?.length > 0);
  const totalHours  = Math.round(user.xp * 0.5);

  const [upcoming, setUpcoming]       = React.useState([]);
  const [recommended, setRecommended] = React.useState([]);

  React.useEffect(() => {
    Promise.all([getUpcomingCourses(), getRecommendedCourses()]).then(([up, rec]) => {
      setUpcoming(up);
      const upIds = new Set(up.map(c => c.course_id));
      setRecommended(rec.filter(c => !upIds.has(c.course_id)));
    });
  }, []);

  return React.createElement("div", { className: "glh-container fade-screen", style: { padding: "28px clamp(16px,4vw,40px) 80px" } },

    // ── Hero ─────────────────────────────────────────────────────────────────
    React.createElement("div", { className: "dash-hero" },
      React.createElement("div", { className: "dash-hero__avatar" },
        React.createElement(Avatar, { opts: revealOpts, size: 80, crisp: props.crisp })),
      React.createElement("div", { style: { minWidth: 0 } },
        React.createElement("div", { className: "dash-rank" }, deptLabel),
        React.createElement("div", { className: "dash-classname", style: { color: "#fff" } }, displayName),
        React.createElement("div", { style: { fontSize: 13, color: "var(--amber)", fontWeight: 700, marginTop: 8 } }, `${user.xp} XP`)),
      React.createElement("div", { style: { display: "flex", gap: 24 } },
        React.createElement(Stat, { value: user.completed_courses.length, label: "Khóa đã học" }),
        React.createElement(Stat, { value: `${totalHours}h`, label: "Giờ học tích lũy" }))),

    // ── Lịch sắp tới ─────────────────────────────────────────────────────────
    upcoming.length > 0 && React.createElement(React.Fragment, null,
      React.createElement(SectionRow, {
        title: "Lịch sắp tới",
        action: { label: "Xem tất cả →", onClick: () => props.onNav("library", "calendar-section") },
      }),
      React.createElement(UpcomingList, { courses: upcoming, onOpen: props.onOpenCourse })),

    // ── Dành riêng cho bạn ───────────────────────────────────────────────────
    recommended.length > 0 && React.createElement(React.Fragment, null,
      React.createElement(SectionRow, {
        title: "Gợi ý cho bạn",
        action: { label: "Xem tất cả →", onClick: () => props.onNav("library") },
      }),


React.createElement("div", { className: "rec-grid" },
        recommended.map(c => React.createElement(CourseCard, { key: c.course_id, course: c, onClick: props.onOpenCourse, showDate: true }))))
  );
}
