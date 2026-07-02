"use client";

import React from "react";
import { GLHUI } from './GLHUI';
import { GLHEngine } from '@/context/GameContext';
import { GLH_DATA } from '@/data/glhData';
import { getCourseCta } from '@/lib/courseMap.mjs';

const { Icon, fmtDate, fmtDuration, FORMAT_LABEL } = GLHUI;
const { useGame, isRecommended } = GLHEngine;
const D = GLH_DATA;


  
  

  /* ---------- Skill pill ---------- */
  export function SkillPill(props) {
    const meta = (D.SKILL_META || {})[props.id] || { color: "#8A93A8", label: props.id };
    const size = props.size || "sm";
    const p = size === "sm" ? "3px 8px" : "5px 12px";
    const fs = size === "sm" ? 11 : 13;
    return React.createElement("span", {
      style: { display: "inline-flex", alignItems: "center", gap: 5, background: meta.color + "1a", border: "1px solid " + meta.color + "4d", color: meta.color, borderRadius: 999, padding: p, fontSize: fs, fontWeight: 700, whiteSpace: "nowrap", lineHeight: 1.2 },
    },
      React.createElement("span", { style: { width: 6, height: 6, borderRadius: "50%", background: meta.color, flexShrink: 0 } }),
      meta.label);
  }

  /* ---------- Star rating ---------- */
  export function Stars(props) {
    const v = Number(props.value);
    if (!v) return null;
    return React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 700, color: "var(--amber)" } },
      "★ ", v.toFixed(1),
      React.createElement("span", { style: { color: "var(--rpg-faint)", fontWeight: 400 } }, "/5"));
  }

  /* ---------- MetaChip ---------- */
  function MetaChip(props) {
    return React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--garena-grey)" } },
      React.createElement(Icon, { name: props.icon, size: 13, color: "var(--garena-grey)" }),
      props.children);
  }

  /* ---------- Detail item ---------- */
  export function DetailItem(props) {
    return React.createElement("div", { style: { display: "flex", gap: 10, alignItems: "flex-start" } },
      React.createElement("div", { style: { background: "rgba(255,255,255,0.06)", borderRadius: 8, padding: 8 } },
        React.createElement(Icon, { name: props.icon, size: 16, color: "var(--garena-grey)" })),
      React.createElement("div", null,
        React.createElement("div", { style: { fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--garena-grey)" } }, props.label),
        React.createElement("div", { style: { fontSize: 14, color: "#fff", fontWeight: 500, marginTop: 2 } }, props.value)));
  }

  const FORMAT_COLOR = {
    online:   { bg: "rgba(43,182,163,0.18)", color: "#2BB6A3" },
    offline:  { bg: "rgba(228,30,38,0.18)",  color: "#FF8A8E" },
    elearning:{ bg: "rgba(122,92,255,0.18)", color: "#A38BFF" },
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

  function scheduleTime(c) {
    if (!c?.start_time) return null;
    return c.end_time ? `${c.start_time} - ${c.end_time}` : c.start_time;
  }

  export function CourseCard({ course: c, onClick, showDate }) {
    const { user } = useGame();
    const fc = FORMAT_COLOR[c.format] || { bg: "rgba(255,255,255,0.07)", color: "var(--rpg-muted)" };
    const isEnded = c.course_status === "ended";
    const done = (user.completed_courses || []).includes(c.course_id);
    const cta = getCourseCta(c, user);
    const statusChipText = done ? "Đã hoàn thành" : isEnded ? "Đã kết thúc" : null;
    const desc = c.description_short || c.description;
    const timeText = scheduleTime(c);

    return React.createElement("button", {
      className: "u-card u-card--hover",
      style: { textAlign: "left", padding: 0, display: "flex", flexDirection: "column", cursor: "pointer", background: "var(--rpg-panel)", overflow: "hidden", opacity: done ? 0.72 : 1 },
      onClick: () => {
        onClick && onClick(c);
      },
    },
      React.createElement("div", { style: { padding: "18px 20px", display: "flex", flexDirection: "column", gap: 8, flex: 1 } },
        // format chip + XP
        React.createElement("div", { style: { display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" } },
          React.createElement("span", { style: { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", padding: "3px 10px", borderRadius: 999, background: fc.bg, color: fc.color } },
            FORMAT_LABEL[c.format] || c.format),
          statusChipText && React.createElement("span", { style: { fontSize: 11, fontWeight: 600, textTransform: "none", letterSpacing: 0, padding: "3px 9px", borderRadius: 999, background: "rgba(138,147,168,0.14)", color: done ? "var(--garena-positive)" : "var(--rpg-muted)", border: "1px solid rgba(138,147,168,0.22)" } },
            statusChipText),
          React.createElement("span", { style: { marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: "var(--amber)" } },
            React.createElement(Icon, { name: "zap", size: 13, color: "var(--amber)" }), "+" + c.xp_reward + " XP")),
        c.rating ? React.createElement(Stars, { value: c.rating }) : null,
        // countdown (dashboard recommended only)
        showDate && c.countdown_days != null && React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: c.countdown_days <= 5 ? "#E41E26" : c.countdown_days <= 14 ? "#FF9E00" : "var(--rpg-muted)" } },
          c.countdown_days === 0 ? "Hôm nay" : "Còn " + c.countdown_days + " ngày"),
        // title
        React.createElement("h3", { className: "u-h3", style: { fontSize: 15, lineHeight: 1.3, margin: 0 } }, c.title),
        (c.start_date || timeText) && React.createElement("div", { style: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", fontSize: 12, fontWeight: 600, color: "var(--rpg-muted)" } },
          c.start_date && React.createElement(MetaChip, { icon: "calendar" }, fmtDate(c.start_date)),
          timeText && React.createElement(MetaChip, { icon: "clock" }, timeText)),
        // description
        desc && React.createElement("p", { className: "rec-desc", style: { fontSize: 12, color: "var(--rpg-muted)", margin: 0, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } }, desc),
        // skill tags
        (c.skill_tags || []).length > 0 && React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" } },
          (c.skill_tags || []).slice(0, 2).map(sid => React.createElement(SkillPill, { key: sid, id: sid }))),
        // meta row
        React.createElement("div", { style: { display: "flex", gap: 12, marginTop: "auto", paddingTop: 6, flexWrap: "wrap", alignItems: "center" } },
          c.trainer && React.createElement(MetaChip, { icon: "user" }, c.trainer),
          c.duration_minutes && React.createElement(MetaChip, { icon: "clock" }, fmtDuration(c.duration_minutes)),
          cta && React.createElement("span", { style: { marginLeft: "auto", fontSize: 12, fontWeight: 800, color: ctaColor(cta) } }, cta.text))));
  }

  /* ---------- Course modal ---------- */
  export function CourseModal(props) {
    const { user, actions } = useGame();
    const c = props.course;
    const meta = (D.COURSE_META || {})[c?.course_id] || {};
    const [session, setSession] = React.useState(null);
    const [testimonials, setTestimonials] = React.useState(null);
    const [completedCourseId, setCompletedCourseId] = React.useState(null);
    const [ratingFormCourseId, setRatingFormCourseId] = React.useState(null);
    const [courseRating, setCourseRating] = React.useState(0);
    const [courseReview, setCourseReview] = React.useState("");
    const [ratingSubmittedCourseId, setRatingSubmittedCourseId] = React.useState(null);

    React.useEffect(() => {
      if (!c) return;
      let active = true;
      const rowId = c._id || c.course_id;
      const courseQueryId = c.course_code || c.course_id || rowId;
      fetch(`/api/sessions?course_id=${encodeURIComponent(courseQueryId)}`, { credentials: "include" })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!active) return;
          const upcoming = (data?.sessions || [])
            .filter((s) => s.status !== "cancelled")
            .sort((a, b) => new Date(a.session_date) - new Date(b.session_date))[0];
          const selected = c.session_id
            ? (data?.sessions || []).find((s) => s.id === c.session_id)
            : null;
          setSession(selected || upcoming || null);
        })
        .catch(() => {});
      fetch(`/api/courses/${encodeURIComponent(rowId)}/testimonials`, { credentials: "include" })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => { if (active) setTestimonials(data?.testimonials?.length ? data.testimonials : null); })
        .catch(() => {});
      return () => { active = false; };
    }, [c]);

    if (!c) return null;
    const isEnded = c.course_status === "ended";
    const completedNow = completedCourseId === c.course_id;
    const showRatingForm = ratingFormCourseId === c.course_id;
    const ratingSubmitted = ratingSubmittedCourseId === c.course_id;
    const done = completedNow || (user.completed_courses || []).includes(c.course_id);
    const rec = isRecommended(c, user);
    const rating = c.rating || meta.rating;
    const testimonialList = testimonials || (meta.testimonial ? [meta.testimonial] : []);
    const statusChipText = done ? "Đã hoàn thành" : isEnded ? "Đã kết thúc" : null;
    const modalCourse = Object.assign({}, c, {
      session_id: c.session_id || session?.id || null,
      session_status: c.session_status || session?.status || null,
      location: c.location || session?.location || meta.location,
      start_date: c.start_date || session?.session_date || null,
      start_time: c.start_time || (session?.session_time ? String(session.session_time).slice(0, 5) : null),
      max_participants: c.max_participants ?? session?.max_participants ?? null,
      min_participants: c.min_participants ?? session?.min_participants ?? null,
      current_count: c.current_count ?? session?.current_count ?? null,
    });
    const effectiveUser = completedNow && !(user.completed_courses || []).includes(c.course_id)
      ? Object.assign({}, user, { completed_courses: [...(user.completed_courses || []), c.course_id] })
      : user;
    const cta = getCourseCta(modalCourse, effectiveUser);
    const canOpenMaterial = Boolean(modalCourse.material_url) && modalCourse.course_status === "ended" && modalCourse.format !== "elearning";
    const completionButtonStyle = { minWidth: 180 };
    const openMaterial = () => {
      if (modalCourse.material_url) window.open(modalCourse.material_url, "_blank", "noreferrer");
    };
    const markComplete = () => {
      actions.completeCourse(c);
      setCompletedCourseId(c.course_id);
      setRatingFormCourseId(null);
    };
    const submitCourseRating = () => {
      if (!courseRating) {
        alert("Vui lòng chọn số sao");
        return;
      }
      const courseId = c._id || c.course_id || c.course_code;
      fetch(`/api/courses/${encodeURIComponent(courseId)}/testimonials`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: courseRating, content: courseReview.trim() || null }),
      }).catch(() => {});
      setRatingSubmittedCourseId(c.course_id);
      setRatingFormCourseId(null);
    };
    const handlePrimary = () => {
      if (cta.action === "material" && canOpenMaterial) {
        openMaterial();
        return;
      }
      if (cta.action === "url" && modalCourse.url && modalCourse.url !== "#") {
        window.open(modalCourse.url, "_blank", "noreferrer");
        return;
      }
      if (cta.action === "reserve") {
        actions.reserveCourseSession(modalCourse);
        return;
      }
      if (cta.action === "complete") {
        markComplete();
      }
    };
    const stop = (e) => e.stopPropagation();
    return React.createElement("div", { className: "modal-bg", onClick: props.onClose },
      React.createElement("div", { className: "modal", onClick: stop },
        React.createElement("div", { style: { background: "radial-gradient(600px 240px at 0% -40%, #1a2334, #0d1117)", color: "#fff", padding: "24px 28px 20px", borderRadius: "12px 12px 0 0", position: "relative" } },
          React.createElement("button", { onClick: props.onClose, style: { position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: 8, color: "#fff", cursor: "pointer" } },
            React.createElement(Icon, { name: "x", size: 18, color: "#fff" })),
          React.createElement("div", { style: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 } },
            React.createElement("span", { className: "u-pill", style: { background: "rgba(255,255,255,0.12)", color: "#fff" } }, FORMAT_LABEL[c.format] || c.format),
            statusChipText ? React.createElement("span", { style: { fontSize: 11, fontWeight: 600, letterSpacing: 0, textTransform: "none", padding: "3px 9px", borderRadius: 999, background: "rgba(255,255,255,0.07)", color: done ? "var(--garena-positive)" : "var(--rpg-muted)", border: "1px solid rgba(255,255,255,0.12)" } }, statusChipText) : null,
            rec ? React.createElement("span", { className: "u-pill u-pill--match" }, "Phù hợp với bạn") : null,
            rating ? React.createElement(Stars, { value: rating }) : null),
          React.createElement("h2", { style: { fontSize: 24, fontWeight: 700, margin: "0 0 8px", lineHeight: 1.2, color: "#fff" } }, c.title),
          React.createElement("div", { style: { color: "var(--amber)", fontWeight: 700, display: "flex", alignItems: "center", gap: 6, fontFamily: "var(--glh-display)", fontSize: 14 } },
            React.createElement(Icon, { name: "zap", size: 16, color: "var(--amber)" }), "+" + c.xp_reward + " XP khi hoàn thành")),
        React.createElement("div", { style: { padding: "24px 28px 28px" } },
          React.createElement("p", { style: { fontSize: 15, lineHeight: 1.65, color: "var(--rpg-text)", margin: "0 0 18px" } }, c.description),
          (c.skill_tags || []).length ? React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 } },
            (c.skill_tags || []).map((sid) => React.createElement(SkillPill, { key: sid, id: sid, size: "md" }))) : null,
          React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 } },
            c.trainer ? React.createElement(DetailItem, { icon: "user", label: "Trainer", value: c.trainer }) : null,
            c.audience ? React.createElement(DetailItem, { icon: "users", label: "Đối tượng", value: c.audience }) : null,
            c.duration_minutes ? React.createElement(DetailItem, { icon: "clock", label: "Thời lượng", value: fmtDuration(c.duration_minutes) }) : null,
            modalCourse.material_url ? React.createElement(DetailItem, { icon: "book-open", label: "Tài liệu", value: "Có tài liệu / recording" }) : null,
            modalCourse.location ? React.createElement(DetailItem, { icon: "map-pin", label: "Địa điểm", value: modalCourse.location }) : null,
            modalCourse.start_date ? React.createElement(DetailItem, { icon: "calendar", label: "Ngày tổ chức", value: fmtDate(modalCourse.start_date) }) : null,
            modalCourse.start_time ? React.createElement(DetailItem, { icon: "clock", label: "Giờ tổ chức", value: modalCourse.start_time }) : null,
            modalCourse.min_participants && !modalCourse.max_participants ? React.createElement(DetailItem, { icon: "users", label: "Tối thiểu mở lớp", value: (modalCourse.current_count ?? 0) + "/" + modalCourse.min_participants }) : null,
            modalCourse.max_participants ? React.createElement(DetailItem, { icon: "users", label: "Số lượng", value: (modalCourse.current_count ?? 0) + "/" + modalCourse.max_participants }) : null),
          testimonialList.length ? React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 } },
            testimonialList.map((t, i) => React.createElement("div", { key: i, style: { background: "rgba(255,255,255,0.04)", borderLeft: "3px solid var(--amber)", borderRadius: "0 8px 8px 0", padding: "14px 16px" } },
              React.createElement("p", { style: { fontSize: 14, fontStyle: "italic", color: "var(--rpg-text)", margin: "0 0 8px", lineHeight: 1.55 } }, "“" + (t.content || t.quote) + "”"),
              React.createElement("div", { style: { fontSize: 12, color: "var(--rpg-muted)", fontWeight: 600 } }, "— " + (t.full_name || t.author) + (t.role ? " · " + t.role : ""))))) : null,
          React.createElement(React.Fragment, null,
            cta.disabled
              ? React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, padding: 14, marginBottom: 12, background: "rgba(22,163,74,0.14)", border: "1px solid rgba(22,163,74,0.45)", borderRadius: 8, color: "var(--garena-positive)", fontWeight: 700 } },
                  React.createElement(Icon, { name: "check-circle", size: 18, color: "var(--garena-positive)" }), cta.modalText)
              : null,
            React.createElement("div", { style: { display: "flex", gap: 12, flexWrap: "wrap" } },
              !cta.disabled ? React.createElement("button", { className: "u-btn u-btn--primary", style: { flex: 1, minWidth: 180 }, onClick: handlePrimary }, cta.modalText) : null,
              canOpenMaterial && cta.action !== "material" ? React.createElement("button", { className: "u-btn u-btn--sec", onClick: openMaterial }, "Xem tài liệu") : null,
              done
                ? React.createElement("button", { className: "u-btn u-btn--sec", style: completionButtonStyle, onClick: () => setRatingFormCourseId(showRatingForm ? null : c.course_id), disabled: ratingSubmitted }, ratingSubmitted ? "Đã gửi đánh giá" : "Gửi đánh giá")
                : cta.key !== "complete" ? React.createElement("button", { className: "u-btn u-btn--sec", style: completionButtonStyle, onClick: markComplete }, "Đánh dấu đã hoàn thành") : null),
            showRatingForm ? React.createElement("div", { style: { marginTop: 14, padding: 14, borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid var(--rpg-border)" } },
              React.createElement("div", { style: { display: "flex", gap: 6, marginBottom: 10 } },
                [1, 2, 3, 4, 5].map((s) => React.createElement("button", {
                  key: s,
                  onClick: () => setCourseRating(s),
                  style: { background: "transparent", border: "none", cursor: "pointer", padding: 2 },
                  title: s + " sao",
                }, React.createElement(Icon, { name: "star", size: 24, color: courseRating >= s ? "var(--amber)" : "var(--rpg-muted)", fill: courseRating >= s ? "var(--amber)" : "none" })))),
              React.createElement("textarea", {
                value: courseReview,
                onChange: (e) => setCourseReview(e.target.value),
                placeholder: "Chia sẻ cảm nhận ngắn về khóa học...",
                rows: 3,
                style: { width: "100%", boxSizing: "border-box", resize: "vertical", marginBottom: 10, background: "var(--rpg-bg)", border: "1px solid var(--rpg-border)", borderRadius: 6, padding: 10, color: "var(--rpg-text)", fontSize: 13 },
              }),
              React.createElement("button", { className: "u-btn u-btn--primary", onClick: submitCourseRating }, "Gửi đánh giá")) : null))));
  }

  export const GLHParts = { CourseCard, CourseModal, DetailItem, SkillPill, Stars };
