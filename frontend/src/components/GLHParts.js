"use client";

import React from "react";
import { GLHUI } from './GLHUI';
import { GLHEngine } from '@/context/GameContext';
import { GLH_DATA } from '@/data/glhData';

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

  export function CourseCard({ course: c, onClick, showDate }) {
    const { user } = useGame();
    const fc = FORMAT_COLOR[c.format] || { bg: "rgba(255,255,255,0.07)", color: "var(--rpg-muted)" };
    const done = (user.completed_courses || []).includes(c.course_id) || c.course_status === "ended";
    const cta = c.course_status
      ? ({ upcoming_open: { text: "Đăng ký →", color: "var(--glh-accent)" }, upcoming_closed: { text: "Đặt chỗ →", color: "#FF9E00" }, elearning: { text: "Học ngay →", color: "#A38BFF" }, ended: { text: "Xem tài liệu →", color: "var(--rpg-muted)" } })[c.course_status]
      : ({ offline: { text: "Đăng ký →", color: "var(--glh-accent)" }, online: { text: "Đăng ký →", color: "var(--glh-accent)" }, elearning: { text: "Học ngay →", color: "#A38BFF" } })[c.format] || { text: "Xem thêm →", color: "var(--rpg-muted)" };
    const desc = c.description_short || c.description;

    return React.createElement("button", {
      className: "u-card u-card--hover",
      style: { textAlign: "left", padding: 0, display: "flex", flexDirection: "column", cursor: "pointer", background: "var(--rpg-panel)", overflow: "hidden", opacity: done ? 0.72 : 1 },
      onClick: () => {
        if (c.course_status === "ended" && c.material_url) {
          window.open(c.material_url, "_blank", "noreferrer");
          return;
        }
        onClick(c);
      },
    },
      React.createElement("div", { style: { padding: "18px 20px", display: "flex", flexDirection: "column", gap: 8, flex: 1 } },
        // format chip + XP
        React.createElement("div", { style: { display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" } },
          React.createElement("span", { style: { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", padding: "3px 10px", borderRadius: 999, background: fc.bg, color: fc.color } },
            FORMAT_LABEL[c.format] || c.format),
          React.createElement("span", { style: { marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: "var(--amber)" } },
            React.createElement(Icon, { name: "zap", size: 13, color: "var(--amber)" }), "+" + c.xp_reward + " XP")),
        // date + countdown (dashboard recommended only)
        showDate && c.start_date && React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: "var(--rpg-muted)" } },
          fmtDate(c.start_date),
          c.countdown_days != null && React.createElement("span", { style: { marginLeft: 8, fontWeight: 700, color: c.countdown_days <= 5 ? "#E41E26" : c.countdown_days <= 14 ? "#FF9E00" : "var(--rpg-muted)" } },
            "· còn " + c.countdown_days + " ngày")),
        // title
        React.createElement("h3", { className: "u-h3", style: { fontSize: 15, lineHeight: 1.3, margin: 0 } }, c.title),
        // description
        desc && React.createElement("p", { className: "rec-desc", style: { fontSize: 12, color: "var(--rpg-muted)", margin: 0, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } }, desc),
        // skill tags
        (c.skill_tags || []).length > 0 && React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" } },
          (c.skill_tags || []).slice(0, 2).map(sid => React.createElement(SkillPill, { key: sid, id: sid }))),
        // meta row
        React.createElement("div", { style: { display: "flex", gap: 12, marginTop: "auto", paddingTop: 6, flexWrap: "wrap", alignItems: "center" } },
          c.trainer && React.createElement(MetaChip, { icon: "user" }, c.trainer),
          c.duration_minutes && React.createElement(MetaChip, { icon: "clock" }, fmtDuration(c.duration_minutes)),
          cta && React.createElement("span", { style: { marginLeft: "auto", fontSize: 12, fontWeight: 800, color: cta.color } }, cta.text))));
  }

  /* ---------- Course modal ---------- */
  export function CourseModal(props) {
    const { user, actions } = useGame();
    const c = props.course;
    const meta = (D.COURSE_META || {})[c?.course_id] || {};
    const [session, setSession] = React.useState(null);
    const [testimonials, setTestimonials] = React.useState(null);

    React.useEffect(() => {
      if (!c) return;
      let active = true;
      const id = c._id || c.course_id;
      fetch(`/api/sessions?course_id=${encodeURIComponent(id)}`, { credentials: "include" })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!active) return;
          const upcoming = (data?.sessions || [])
            .filter((s) => s.status !== "cancelled")
            .sort((a, b) => new Date(a.session_date) - new Date(b.session_date))[0];
          setSession(upcoming || null);
        })
        .catch(() => {});
      fetch(`/api/courses/${encodeURIComponent(id)}/testimonials`, { credentials: "include" })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => { if (active) setTestimonials(data?.testimonials?.length ? data.testimonials : null); })
        .catch(() => {});
      return () => { active = false; };
    }, [c]);

    if (!c) return null;
    const isEnded = c.course_status === "ended";
    const done = (user.completed_courses || []).includes(c.course_id);
    const rec = isRecommended(c, user);
    const rating = c.rating || meta.rating;
    const testimonialList = testimonials || (meta.testimonial ? [meta.testimonial] : []);
    const stop = (e) => e.stopPropagation();
    return React.createElement("div", { className: "modal-bg", onClick: props.onClose },
      React.createElement("div", { className: "modal", onClick: stop },
        React.createElement("div", { style: { background: "radial-gradient(600px 240px at 0% -40%, #1a2334, #0d1117)", color: "#fff", padding: "24px 28px 20px", borderRadius: "12px 12px 0 0", position: "relative" } },
          React.createElement("button", { onClick: props.onClose, style: { position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: 8, color: "#fff", cursor: "pointer" } },
            React.createElement(Icon, { name: "x", size: 18, color: "#fff" })),
          React.createElement("div", { style: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 } },
            React.createElement("span", { className: "u-pill", style: { background: "rgba(255,255,255,0.12)", color: "#fff" } }, FORMAT_LABEL[c.format] || c.format),
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
            React.createElement(DetailItem, { icon: "user", label: "Trainer", value: c.trainer }),
            React.createElement(DetailItem, { icon: "users", label: "Đối tượng", value: c.audience }),
            React.createElement(DetailItem, { icon: "clock", label: "Thời lượng", value: fmtDuration(c.duration_minutes) }),
            (session?.location || meta.location) ? React.createElement(DetailItem, { icon: "map-pin", label: "Địa điểm", value: session?.location || meta.location }) : null,
            session?.session_date ? React.createElement(DetailItem, { icon: "calendar", label: "Ngày tổ chức", value: fmtDate(session.session_date) }) : null,
            session?.session_time ? React.createElement(DetailItem, { icon: "clock", label: "Giờ tổ chức", value: String(session.session_time).slice(0, 5) }) : null),
          testimonialList.length ? React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 } },
            testimonialList.map((t, i) => React.createElement("div", { key: i, style: { background: "rgba(255,255,255,0.04)", borderLeft: "3px solid var(--amber)", borderRadius: "0 8px 8px 0", padding: "14px 16px" } },
              React.createElement("p", { style: { fontSize: 14, fontStyle: "italic", color: "var(--rpg-text)", margin: "0 0 8px", lineHeight: 1.55 } }, "“" + (t.content || t.quote) + "”"),
              React.createElement("div", { style: { fontSize: 12, color: "var(--rpg-muted)", fontWeight: 600 } }, "— " + (t.full_name || t.author) + (t.role ? " · " + t.role : ""))))) : null,
          (isEnded || done)
            ? React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, padding: 14, background: "rgba(22,163,74,0.14)", border: "1px solid rgba(22,163,74,0.45)", borderRadius: 8, color: "var(--garena-positive)", fontWeight: 700 } },
                React.createElement(Icon, { name: "check-circle", size: 18, color: "var(--garena-positive)" }), isEnded ? "Khóa học đã kết thúc" : "Bạn đã hoàn thành khóa học này")
            : React.createElement("div", { style: { display: "flex", gap: 12, flexWrap: "wrap" } },
                React.createElement("button", { className: "u-btn u-btn--primary", style: { flex: 1, minWidth: 180 }, onClick: () => { actions.completeCourse(c); props.onClose(); } }, "Đánh dấu đã hoàn thành"),
                React.createElement("a", { href: (c.course_status === "ended" ? c.material_url : null) || c.url || "#", className: "u-btn u-btn--sec", style: { textDecoration: "none", display: "inline-flex", alignItems: "center" }, target: "_blank", rel: "noreferrer" }, c.course_status === "ended" ? "Xem tài liệu" : "Mở khóa học")))));
  }

  /* ---------- Event modal ---------- */
  export function EventModal(props) {
    const { user, actions } = useGame();
    const e = props.event;
    if (!e) return null;
    const reg = (user.registered_events || []).includes(e.event_id);
    const stop = (ev) => ev.stopPropagation();
    return React.createElement("div", { className: "modal-bg", onClick: props.onClose },
      React.createElement("div", { className: "modal", onClick: stop },
        React.createElement("div", { style: { background: "var(--garena-red)", color: "#fff", padding: "24px 28px 20px", borderRadius: "12px 12px 0 0", position: "relative" } },
          React.createElement("button", { onClick: props.onClose, style: { position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.18)", border: "none", borderRadius: 8, padding: 8, color: "#fff", cursor: "pointer" } },
            React.createElement(Icon, { name: "x", size: 18, color: "#fff" })),
          React.createElement("span", { className: "u-pill", style: { background: "rgba(255,255,255,0.18)", color: "#fff" } }, FORMAT_LABEL[e.type] || e.type),
          React.createElement("h2", { style: { fontSize: 24, fontWeight: 700, margin: "12px 0 0", lineHeight: 1.25, color: "#fff" } }, e.title)),
        React.createElement("div", { style: { padding: "24px 28px 28px" } },
          React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 } },
            React.createElement(DetailItem, { icon: "calendar", label: "Ngày", value: fmtDate(e.start_date) }),
            React.createElement(DetailItem, { icon: "clock", label: "Thời gian", value: e.time }),
            React.createElement(DetailItem, { icon: "map-pin", label: "Địa điểm", value: e.location }),
            React.createElement(DetailItem, { icon: "user", label: "Tổ chức bởi", value: e.host }),
            React.createElement(DetailItem, { icon: "users", label: "Đối tượng", value: e.audience })),
          reg
            ? React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, padding: 14, background: "rgba(22,163,74,0.14)", border: "1px solid rgba(22,163,74,0.45)", borderRadius: 8, color: "var(--garena-positive)", fontWeight: 700 } },
                React.createElement(Icon, { name: "check-circle", size: 18, color: "var(--garena-positive)" }), "Đã đăng ký · đã thêm vào lịch của bạn")
            : React.createElement("div", { style: { display: "flex", gap: 12, flexWrap: "wrap" } },
                React.createElement("button", { className: "u-btn u-btn--primary", style: { flex: 1, minWidth: 160 }, onClick: () => { actions.registerEvent(e); } }, "Đăng ký tham gia"),
                React.createElement("button", { className: "u-btn u-btn--sec", onClick: () => { actions.registerEvent(e); } },
                  React.createElement(Icon, { name: "calendar", size: 15 }), " Google Calendar")))));
  }

  export const GLHParts = { CourseCard, CourseModal, EventModal, DetailItem, SkillPill, Stars };
