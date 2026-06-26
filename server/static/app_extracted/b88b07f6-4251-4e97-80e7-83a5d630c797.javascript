/* =============================================================
   Shared utility components — CourseCard (rich), CourseModal,
   EventModal. Used by Dashboard, Catalog, Calendar.
   ============================================================= */
(function () {
  "use strict";
  const { Icon, fmtDate, fmtDuration, FORMAT_LABEL } = window.GLHUI;
  const { useGame, isRecommended } = window.GLHEngine;
  const D = window.GLH_DATA;

  /* ---------- Skill pill ---------- */
  function SkillPill(props) {
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
  function Stars(props) {
    const v = props.value;
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
  function DetailItem(props) {
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

  function CourseCard(props) {
    const { user } = useGame();
    const c = props.course;
    const meta = (D.COURSE_META || {})[c.course_id] || {};
    const done = (user.completed_courses || []).includes(c.course_id);
    const rec = isRecommended(c, user);

    return React.createElement("button", {
      className: "u-card u-card--hover" + (rec ? " u-card--feature" : ""),
      style: { textAlign: "left", padding: 0, display: "flex", flexDirection: "column", cursor: "pointer", background: "var(--rpg-panel)", overflow: "hidden" },
      onClick: () => props.onOpen(c),
    },
      // Body
      React.createElement("div", { style: { padding: "18px 20px", display: "flex", flexDirection: "column", gap: 8, flex: 1 } },
        // Top row
        React.createElement("div", { style: { display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" } },
          React.createElement("span", {
            style: {
              fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em",
              padding: "3px 10px", borderRadius: 999,
              background: (FORMAT_COLOR[c.format] || {}).bg || "rgba(255,255,255,0.07)",
              color: (FORMAT_COLOR[c.format] || {}).color || "var(--rpg-muted)",
            }
          }, FORMAT_LABEL[c.format] || c.format),
          done ? React.createElement("span", { style: { fontSize: 11, fontWeight: 700, color: "var(--garena-positive)", display: "inline-flex", alignItems: "center", gap: 4 } },
            React.createElement(Icon, { name: "check-circle", size: 12, color: "var(--garena-positive)" }), "Đã học") : null,
          rec && !done ? React.createElement("span", { className: "u-pill u-pill--match" }, "Gợi ý") : null,
          React.createElement("span", { style: { marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: "var(--amber)" } },
            React.createElement(Icon, { name: "zap", size: 13, color: "var(--amber)" }), "+" + c.xp_reward + " XP")
        ),
        React.createElement("h3", { className: "u-h3", style: { fontSize: 15, lineHeight: 1.3 } }, c.title),
        React.createElement("p", { style: { fontSize: 12, color: "var(--rpg-muted)", margin: 0, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } }, c.description),
        (c.skill_tags || []).length > 0 ? React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" } },
          (c.skill_tags || []).slice(0, 2).map((sid) => React.createElement(SkillPill, { key: sid, id: sid }))
        ) : null,
        React.createElement("div", { style: { display: "flex", gap: 12, marginTop: "auto", paddingTop: 6, flexWrap: "wrap", alignItems: "center" } },
          React.createElement(MetaChip, { icon: "user" }, c.trainer),
          React.createElement(MetaChip, { icon: "clock" }, fmtDuration(c.duration_minutes)),
          c.format === "offline" ? React.createElement(MetaChip, { icon: "map-pin" }, "Tầng 12, HQ") :
          c.format === "online" ? React.createElement(MetaChip, { icon: "map" }, "Online") :
          React.createElement(MetaChip, { icon: "map" }, "E-learning")
        )
      )
    );
  }

  /* ---------- Course modal ---------- */
  function CourseModal(props) {
    const { user, actions } = useGame();
    const c = props.course;
    if (!c) return null;
    const meta = (D.COURSE_META || {})[c.course_id] || {};
    const done = (user.completed_courses || []).includes(c.course_id);
    const rec = isRecommended(c, user);
    const stop = (e) => e.stopPropagation();
    return React.createElement("div", { className: "modal-bg", onClick: props.onClose },
      React.createElement("div", { className: "modal", onClick: stop },
        React.createElement("div", { style: { background: "radial-gradient(600px 240px at 0% -40%, #1a2334, #0d1117)", color: "#fff", padding: "24px 28px 20px", borderRadius: "12px 12px 0 0", position: "relative" } },
          React.createElement("button", { onClick: props.onClose, style: { position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: 8, color: "#fff", cursor: "pointer" } },
            React.createElement(Icon, { name: "x", size: 18, color: "#fff" })),
          React.createElement("div", { style: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 } },
            React.createElement("span", { className: "u-pill", style: { background: "rgba(255,255,255,0.12)", color: "#fff" } }, FORMAT_LABEL[c.format] || c.format),
            rec ? React.createElement("span", { className: "u-pill u-pill--match" }, "Phù hợp với bạn") : null,
            meta.rating ? React.createElement(Stars, { value: meta.rating }) : null),
          React.createElement("h2", { style: { fontSize: 24, fontWeight: 700, margin: "0 0 8px", lineHeight: 1.2, color: "#fff" } }, c.title),
          React.createElement("div", { style: { color: "var(--amber)", fontWeight: 700, display: "flex", alignItems: "center", gap: 6, fontFamily: "var(--glh-display)", fontSize: 14 } },
            React.createElement(Icon, { name: "zap", size: 16, color: "var(--amber)" }), "+" + c.xp_reward + " XP khi hoàn thành")),
        React.createElement("div", { style: { padding: "24px 28px 28px" } },
          React.createElement("p", { style: { fontSize: 15, lineHeight: 1.65, color: "var(--rpg-text)", margin: "0 0 18px" } }, c.description),
          (c.skill_tags || []).length ? React.createElement("div", { style: { marginBottom: 18 } },
            React.createElement("div", { style: { fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--garena-grey)", marginBottom: 8 } }, "Competencies"),
            React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } },
              (c.skill_tags || []).map((sid) => React.createElement(SkillPill, { key: sid, id: sid, size: "md" })))) : null,
          React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 } },
            React.createElement(DetailItem, { icon: "user", label: "Trainer", value: c.trainer }),
            React.createElement(DetailItem, { icon: "users", label: "Đối tượng", value: c.audience }),
            React.createElement(DetailItem, { icon: "clock", label: "Thời lượng", value: fmtDuration(c.duration_minutes) }),
            meta.location ? React.createElement(DetailItem, { icon: "map-pin", label: "Địa điểm", value: meta.location }) : null),
          meta.testimonial ? React.createElement("div", { style: { background: "rgba(255,255,255,0.04)", borderLeft: "3px solid var(--amber)", borderRadius: "0 8px 8px 0", padding: "14px 16px", marginBottom: 20 } },
            React.createElement("p", { style: { fontSize: 14, fontStyle: "italic", color: "var(--rpg-text)", margin: "0 0 8px", lineHeight: 1.55 } }, "\u201c" + meta.testimonial.quote + "\u201d"),
            React.createElement("div", { style: { fontSize: 12, color: "var(--rpg-muted)", fontWeight: 600 } }, "— " + meta.testimonial.author + " · " + meta.testimonial.role)) : null,
          done
            ? React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, padding: 14, background: "rgba(22,163,74,0.14)", border: "1px solid rgba(22,163,74,0.45)", borderRadius: 8, color: "var(--garena-positive)", fontWeight: 700 } },
                React.createElement(Icon, { name: "check-circle", size: 18, color: "var(--garena-positive)" }), "Bạn đã hoàn thành khóa học này")
            : React.createElement("div", { style: { display: "flex", gap: 12, flexWrap: "wrap" } },
                React.createElement("button", { className: "u-btn u-btn--primary", style: { flex: 1, minWidth: 180 }, onClick: () => { actions.completeCourse(c); props.onClose(); } }, "Đánh dấu đã hoàn thành"),
                React.createElement("a", { href: c.url || "#", className: "u-btn u-btn--sec", style: { textDecoration: "none", display: "inline-flex", alignItems: "center" }, target: "_blank", rel: "noreferrer" }, "Mở khóa học")))));
  }

  /* ---------- Event modal ---------- */
  function EventModal(props) {
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

  window.GLHParts = { CourseCard, CourseModal, EventModal, DetailItem, SkillPill, Stars };
})();
