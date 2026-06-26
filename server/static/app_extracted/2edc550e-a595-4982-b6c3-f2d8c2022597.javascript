/* =============================================================
   Screen — Dashboard (utility surface, dark hero)
   ============================================================= */
(function () {
  "use strict";
  const { Icon, fmtDate } = window.GLHUI;
  const { useGame, rankForXp, nextRankForXp, levelProgress, recommendCourses, upcomingEvents } = window.GLHEngine;
  const Avatar = window.GLHAvatar.Avatar;
  const { CourseCard } = window.GLHParts;
  const D = window.GLH_DATA;

  function Stat(props) {
    return React.createElement("div", { style: { textAlign: "center", minWidth: 64 } },
      React.createElement("div", { className: "glh-display", style: { fontSize: 28, fontWeight: 700, color: "#fff", lineHeight: 1 } }, props.value),
      React.createElement("div", { style: { fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--rpg-muted)", marginTop: 6 } }, props.label));
  }

  function SectionHead(props) {
    return React.createElement("div", { style: { display: "flex", alignItems: "flex-end", justifyContent: "space-between", margin: "40px 0 18px", gap: 16 } },
      React.createElement("div", null,
        React.createElement("div", { className: "u-eyebrow" }, props.eyebrow),
        React.createElement("h2", { className: "u-h2" }, props.title)),
      props.action || null);
  }

  function Dashboard(props) {
    const { user } = useGame();
    const qr = user.quiz_result;
    const cls = D.CLASSES[qr.class_id];
    const rank = rankForXp(user.xp);
    const next = nextRankForXp(user.xp);
    const prog = levelProgress(user.xp);
    const recs = recommendCourses(user, 3);
    const events = upcomingEvents(3);
    const revealOpts = Object.assign({}, user.character, { classColor: cls.color, rank: rank.level });
    const displayName = user.email ? user.email.split("@")[0] : "bạn";
    const deptLabel = qr._answers && qr._answers[0] ? qr._answers[0].label : cls.name;
    const rankLabel = qr._answers && qr._answers[1] ? qr._answers[1].label : (rank.name + " (" + rank.en + ")");

    return React.createElement("div", { className: "glh-container fade-screen", style: { padding: "28px clamp(16px,4vw,40px) 80px" } },
      // hero
      React.createElement("div", { className: "dash-hero" },
        React.createElement("div", { className: "dash-hero__avatar" },
          React.createElement(Avatar, { opts: revealOpts, size: 120, crisp: props.crisp })),
        React.createElement("div", { style: { minWidth: 0 } },
          React.createElement("div", { className: "dash-rank" }, deptLabel + " · " + rankLabel),
          React.createElement("div", { className: "dash-classname", style: { color: "#fff" } }, displayName),
          React.createElement("p", { style: { color: "var(--rpg-muted)", margin: "8px 0 16px", maxWidth: 460, fontWeight: 300 } }, cls.tagline),
          React.createElement("div", { style: { fontSize: 13, color: "var(--amber)", fontWeight: 700 } }, user.xp + " XP")),
        React.createElement("div", { style: { display: "flex", gap: 24 } },
          React.createElement(Stat, { value: user.completed_courses.length, label: "Khóa đã học" }),
          React.createElement(Stat, { value: Object.values(window.GLHEngine.skillStatus(user)).filter((s) => s === "done").length, label: "Kỹ năng" }),
          React.createElement(Stat, { value: user.registered_events.length, label: "Sự kiện" }))),

      // quests
      React.createElement(SectionHead, {
        eyebrow: "Gợi ý cho bạn", title: "Khóa học phù hợp",
        action: React.createElement("button", { className: "u-btn u-btn--ghost", onClick: () => props.onNav("catalog") }, "Xem tất cả khóa học"),
      }),
      React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 } },
        recs.map((c) => React.createElement(CourseCard, { key: c.course_id, course: c, onOpen: props.onOpenCourse }))),

      // events
      React.createElement(SectionHead, {
        eyebrow: "Lịch đào tạo", title: "Sự kiện sắp tới",
        action: React.createElement("button", { className: "u-btn u-btn--ghost", onClick: () => props.onNav("calendar") }, "Mở lịch đầy đủ"),
      }),
      React.createElement("div", { style: { display: "grid", gap: 12 } },
        events.map((e) => React.createElement("button", {
          key: e.event_id, className: "u-card u-card--hover",
          style: { textAlign: "left", padding: "16px 20px", display: "flex", alignItems: "center", gap: 18, cursor: "pointer", background: "var(--rpg-panel)" },
          onClick: () => props.onOpenEvent(e),
        },
          React.createElement("div", { style: { textAlign: "center", background: "rgba(228,30,38,0.16)", borderRadius: 8, padding: "8px 14px", minWidth: 60 } },
            React.createElement("div", { style: { fontSize: 22, fontWeight: 700, color: "var(--garena-red)", lineHeight: 1 } }, new Date(e.start_date).getDate()),
            React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--garena-red)", textTransform: "uppercase" } }, window.GLHUI.MONTHS_VI[new Date(e.start_date).getMonth()].replace("Tháng ", "Th"))),
          React.createElement("div", { style: { flex: 1, minWidth: 0 } },
            React.createElement("div", { className: "u-h3", style: { fontSize: 16 } }, e.title),
            React.createElement("div", { style: { fontSize: 13, color: "var(--garena-grey)", marginTop: 4, display: "flex", gap: 14, flexWrap: "wrap" } },
              React.createElement("span", null, e.time), React.createElement("span", null, e.location))),
          React.createElement(Icon, { name: "chevron-right", size: 20, color: "var(--garena-grey)" })))
      )
    );
  }

  window.GLHScreens = Object.assign(window.GLHScreens || {}, { Dashboard });
})();
