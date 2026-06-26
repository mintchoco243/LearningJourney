/* =============================================================
   Screens 3 — Constellation Map
   ============================================================= */
(function () {
  "use strict";
  const { Icon, Starfield } = window.GLHUI;
  const { useGame, skillStatus } = window.GLHEngine;
  const D = window.GLH_DATA;

  const COLORS = { done: "#FFFFFF", current: "#FFBA00", locked: "#4a5268" };
  const STATUS_LABEL = { done: "Đã mở khóa", current: "Sẵn sàng học", locked: "Chưa mở" };

  function Constellation(props) {
    const { user } = useGame();
    const status = skillStatus(user);
    const [hover, setHover] = React.useState(null); // skill id
    const byId = React.useMemo(() => { const m = {}; D.SKILLS.forEach((s) => (m[s.id] = s)); return m; }, []);
    const doneCount = Object.values(status).filter((s) => s === "done").length;

    const hoverSkill = hover ? byId[hover] : null;
    const hoverCourses = hoverSkill ? (hoverSkill.courses || []).map((id) => D.COURSES.find((c) => c.course_id === id)).filter(Boolean) : [];

    return React.createElement("div", { className: "glh-screen glh-dark glh-pad cm-screen fade-screen", style: { position: "relative" } },
      React.createElement(Starfield),
      props.onBack ? React.createElement("button", { className: "glh-back", onClick: props.onBack },
        React.createElement(Icon, { name: "arrow-left", size: 16 }), "Quay lại") : null,
      React.createElement("div", { style: { position: "relative", zIndex: 1, textAlign: "center", marginBottom: 8 } },
        React.createElement("div", { className: "qz-group glh-display", style: { justifyContent: "center" } }, "Bản đồ kỹ năng"),
        React.createElement("h2", { className: "glh-display", style: { fontSize: "clamp(26px,5vw,42px)", color: "#fff", margin: "0 0 6px" } }, "Chòm sao năng lực của bạn"),
        React.createElement("p", { style: { color: "var(--rpg-muted)", margin: 0, fontWeight: 300 } },
          "Đã thắp sáng ", React.createElement("b", { style: { color: "#fff" } }, doneCount + "/" + D.SKILLS.length), " ngôi sao. Hoàn thành khóa học để mở thêm.")),
      React.createElement("div", { className: "cm-canvas" },
        React.createElement("svg", { className: "cm-svg", viewBox: "0 0 100 100", preserveAspectRatio: "xMidYMid meet" },
          // edges
          D.SKILL_EDGES.map((e, i) => {
            const a = byId[e[0]], b = byId[e[1]];
            const lit = status[e[0]] === "done" && status[e[1]] === "done";
            const semi = status[e[0]] !== "locked" && status[e[1]] !== "locked";
            return React.createElement("line", {
              key: i, x1: a.x, y1: a.y, x2: b.x, y2: b.y,
              stroke: lit ? "rgba(255,255,255,0.55)" : semi ? "rgba(255,186,0,0.28)" : "rgba(255,255,255,0.08)",
              strokeWidth: lit ? 0.5 : 0.35,
            });
          }),
          // nodes
          D.SKILLS.map((s) => {
            const st = status[s.id];
            const col = COLORS[st];
            const isHover = hover === s.id;
            const baseR = st === "locked" ? 1.7 : 2.4;
            return React.createElement("g", {
              key: s.id, className: "cm-node",
              onMouseEnter: () => setHover(s.id), onMouseLeave: () => setHover(null),
              onClick: () => setHover(isHover ? null : s.id),
            },
              // glow for lit nodes
              st !== "locked" ? React.createElement("circle", { cx: s.x, cy: s.y, r: baseR + 3.5, fill: col, opacity: st === "current" ? 0.22 : 0.16 }) : null,
              React.createElement("circle", {
                cx: s.x, cy: s.y, r: isHover ? baseR + 1 : baseR, fill: col,
                stroke: st === "current" ? "#fff" : "none", strokeWidth: 0.4,
                style: { transition: "r .15s" },
              }),
              // label
              React.createElement("text", {
                x: s.x, y: s.y + (s.y > 80 ? 6.4 : -4.2), textAnchor: "middle",
                fill: st === "locked" ? "var(--rpg-faint)" : "#cfd6e4",
                style: { fontSize: 2.7, fontWeight: 600, fontFamily: "var(--garena-font-vn)" },
              }, s.name)
            );
          })
        ),
        // tooltip
        hoverSkill ? React.createElement("div", {
          className: "cm-tooltip",
          style: { left: hoverSkill.x + "%", top: hoverSkill.y + "%" },
        },
          React.createElement("h5", null, hoverSkill.name),
          React.createElement("div", { className: "st", style: { color: COLORS[status[hoverSkill.id]] === "#FFFFFF" ? "#fff" : COLORS[status[hoverSkill.id]] } }, STATUS_LABEL[status[hoverSkill.id]]),
          React.createElement("p", null, hoverCourses.length
            ? "Khóa liên quan: " + hoverCourses.map((c) => c.title).join(", ")
            : "Hoàn thành khóa học liên quan để thắp sáng ngôi sao này.")
        ) : null
      ),
      React.createElement("div", { className: "cm-legend" },
        React.createElement("span", null, React.createElement("i", { className: "cm-dot", style: { background: COLORS.done } }), "Đã mở khóa"),
        React.createElement("span", null, React.createElement("i", { className: "cm-dot", style: { background: COLORS.current } }), "Sẵn sàng học"),
        React.createElement("span", null, React.createElement("i", { className: "cm-dot", style: { background: COLORS.locked } }), "Chưa mở")),
      props.embedded ? null : React.createElement("div", { style: { textAlign: "center", marginTop: 26, position: "relative", zIndex: 1 } },
        React.createElement("button", { className: "glh-btn glh-btn--primary glh-btn--lg", onClick: props.onNext },
          "Vào Dashboard của tôi", React.createElement(Icon, { name: "arrow-right", size: 18, color: "#fff" })))
    );
  }

  window.GLHScreens = Object.assign(window.GLHScreens || {}, { Constellation });
})();
