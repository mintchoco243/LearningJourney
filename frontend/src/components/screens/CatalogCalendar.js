"use client";

import React from "react";
import { GLHUI } from '../GLHUI';
import { GLHEngine } from '@/context/GameContext';
import { GLH_DATA } from '@/data/glhData';
import { GLHParts } from '../GLHParts';

const D = GLH_DATA;
const { Icon, fmtDate, FORMAT_LABEL, MONTHS_VI, DOW_VI } = GLHUI;
const { useGame, isRecommended } = GLHEngine;
const { CourseCard } = GLHParts;


  
  
  

  /* ---------------- Catalog ---------------- */
  export function Catalog(props) {
    const { user } = useGame();
    const [q, setQ] = React.useState("");
    const [filtersOpen, setFiltersOpen] = React.useState(false);
    const [sortBy, setSortBy] = React.useState("default");

    // Multi-select filters
    const [selFormat, setSelFormat] = React.useState([]);
    const [selRole, setSelRole] = React.useState([]);
    const [selRank, setSelRank] = React.useState([]);
    const [selSkill, setSelSkill] = React.useState([]);
    const [selTrainer, setSelTrainer] = React.useState([]);
    const [selDuration, setSelDuration] = React.useState([]);

    const allTrainers = [...new Set(D.COURSES.map((c) => c.trainer))].sort();
    const allSkills = [...new Set(D.COURSES.flatMap((c) => c.skill_tags || []))];
    const formatOptions = [
      { id: "online", label: "Online" },
      { id: "offline", label: "Trực tiếp" },
      { id: "elearning", label: "E-learning" },
    ];
    const roleOptions = [
      { id: "strategist", label: "Marketing / Esports / Brand" },
      { id: "builder",    label: "Engineering / Data / Tech" },
      { id: "operator",  label: "Operations / Finance / Legal" },
      { id: "connector", label: "HR / L&D / People" },
      { id: "explorer",  label: "Design / Creative" },
    ];
    const rankOptions = [
      { id: "rank_01", label: "Fresher / dưới 1 năm" },
      { id: "rank_02", label: "Junior (1–3 năm)" },
      { id: "rank_03", label: "Senior (3–6 năm)" },
      { id: "rank_04", label: "Lead / Manager (6+ năm)" },
    ];
    const skillOptions = D.SKILLS.map((s) => ({ id: s.id, label: s.name }));
    const durationOptions = [
      { id: "short", label: "< 1 giờ", test: (m) => m < 60 },
      { id: "medium", label: "1–2 giờ", test: (m) => m >= 60 && m <= 120 },
      { id: "long", label: "> 2 giờ", test: (m) => m > 120 },
    ];

    const toggle = (setter, id) => setter((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

    const activeFilterCount = selFormat.length + selRole.length + selRank.length + selSkill.length + selTrainer.length + selDuration.length;

    const clearAll = () => { setSelFormat([]); setSelRole([]); setSelRank([]); setSelSkill([]); setSelTrainer([]); setSelDuration([]); setQ(""); };

    let filtered = D.COURSES.filter((c) => {
      if ((user.completed_courses || []).includes(c.course_id)) return false; // hide completed
      if (selFormat.length && !selFormat.includes(c.format)) return false;
      if (selRole.length && !selRole.some((r) => (c.class_ids || []).includes(r))) return false;
      if (selRank.length && !selRank.some((r) => (c.rank_ids || []).includes(r))) return false;
      if (selSkill.length && !selSkill.some((s) => (c.skill_tags || []).includes(s))) return false;
      if (selTrainer.length && !selTrainer.includes(c.trainer)) return false;
      if (selDuration.length) {
        const opt = durationOptions.find((o) => selDuration.includes(o.id));
        if (opt && !opt.test(c.duration_minutes)) return false;
      }
      if (q.trim()) {
        const hay = (c.title + " " + c.trainer + " " + (c.skill_tags || []).join(" ") + " " + c.description).toLowerCase();
        if (!hay.includes(q.trim().toLowerCase())) return false;
      }
      return true;
    });

    // Sort
    if (sortBy === "xp_desc") filtered = [...filtered].sort((a, b) => b.xp_reward - a.xp_reward);
    else if (sortBy === "xp_asc") filtered = [...filtered].sort((a, b) => a.xp_reward - b.xp_reward);
    else if (sortBy === "duration_asc") filtered = [...filtered].sort((a, b) => a.duration_minutes - b.duration_minutes);
    else if (sortBy === "duration_desc") filtered = [...filtered].sort((a, b) => b.duration_minutes - a.duration_minutes);
    else if (sortBy === "title") filtered = [...filtered].sort((a, b) => a.title.localeCompare(b.title));
    else if (sortBy === "trainer") filtered = [...filtered].sort((a, b) => a.trainer.localeCompare(b.trainer));

    const [page, setPage] = React.useState(1);
    const PAGE_SIZE = 9;

    // Reset page when filters/sort/search change
    React.useEffect(() => { setPage(1); }, [q, selFormat, selRole, selRank, selSkill, selTrainer, selDuration, sortBy]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const ChipGroup = ({ label, options, selected, onToggle }) =>
      React.createElement("div", { style: { marginBottom: 18 } },
        React.createElement("div", { style: { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--rpg-muted)", marginBottom: 8 } }, label),
        React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 6 } },
          options.map((opt) =>
            React.createElement("button", {
              key: opt.id,
              onClick: () => onToggle(opt.id),
              style: {
                padding: "5px 11px", borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: "pointer",
                border: "1px solid",
                borderColor: selected.includes(opt.id) ? "var(--glh-accent)" : "var(--rpg-border)",
                background: selected.includes(opt.id) ? "rgba(228,30,38,0.15)" : "transparent",
                color: selected.includes(opt.id) ? "#fff" : "var(--rpg-muted)",
                transition: "all 150ms",
              }
            }, opt.label)
          )
        )
      );

    return React.createElement("div", { className: "glh-container fade-screen", style: { padding: "28px clamp(16px,4vw,40px) 80px" } },
      React.createElement("div", { className: "u-eyebrow" }, "Thư viện khóa học"),
      React.createElement("h1", { className: "u-h2", style: { fontSize: "clamp(28px,4vw,40px)", marginBottom: 20 } }, "Khám phá " + D.COURSES.length + " khóa học"),

      // Search + Filter toggle + Sort row
      React.createElement("div", { style: { display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" } },
        // Search
        React.createElement("div", { style: { position: "relative", flex: "1 1 240px", minWidth: 200 } },
          React.createElement("div", { style: { position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" } },
            React.createElement(Icon, { name: "search", size: 16, color: "var(--garena-grey)" })),
          React.createElement("input", {
            className: "u-input",
            placeholder: "Tìm theo tên, trainer, kỹ năng...",
            value: q,
            onChange: (e) => setQ(e.target.value),
            style: { paddingLeft: 40 },
          })
        ),
        // Filter toggle button
        React.createElement("button", {
          onClick: () => setFiltersOpen((v) => !v),
          style: {
            display: "flex", alignItems: "center", gap: 7,
            padding: "9px 16px", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer",
            border: "1px solid",
            borderColor: activeFilterCount > 0 ? "var(--glh-accent)" : "var(--rpg-border)",
            background: activeFilterCount > 0 ? "rgba(228,30,38,0.1)" : "transparent",
            color: activeFilterCount > 0 ? "#fff" : "var(--rpg-muted)",
            transition: "all 150ms",
            flexShrink: 0,
          }
        },
          React.createElement(Icon, { name: "sliders-horizontal", size: 15, color: activeFilterCount > 0 ? "var(--glh-accent)" : "var(--rpg-muted)" }),
          "Lọc" + (activeFilterCount > 0 ? " (" + activeFilterCount + ")" : ""),
        ),
        // Sort dropdown
        React.createElement("select", {
          value: sortBy,
          onChange: (e) => setSortBy(e.target.value),
          className: "glh-filter-sel" + (sortBy !== "default" ? " is-active" : ""),
          style: { flexShrink: 0 },
        },
          React.createElement("option", { value: "default" }, "Sắp xếp: Mặc định"),
          React.createElement("option", { value: "title" }, "Tên A → Z"),
          React.createElement("option", { value: "trainer" }, "Trainer A → Z"),
          React.createElement("option", { value: "xp_desc" }, "XP cao → thấp"),
          React.createElement("option", { value: "xp_asc" }, "XP thấp → cao"),
          React.createElement("option", { value: "duration_asc" }, "Ngắn → dài"),
          React.createElement("option", { value: "duration_desc" }, "Dài → ngắn")
        )
      ),

      // Filter panel
      filtersOpen ? React.createElement("div", {
        style: {
          background: "var(--rpg-panel)",
          border: "1px solid var(--rpg-border)",
          borderRadius: 8,
          padding: 20,
          marginBottom: 20,
          animation: "fadeIn 150ms ease",
        }
      },
        React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 } },
          React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: "#fff" } }, "Bộ lọc"),
          activeFilterCount > 0 ? React.createElement("button", {
            onClick: clearAll,
            style: { background: "none", border: "none", color: "var(--glh-accent)", fontSize: 12, cursor: "pointer", fontWeight: 600, padding: 0 }
          }, "Xóa tất cả (" + activeFilterCount + ")") : null
        ),
        React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "0 32px" } },
          React.createElement(ChipGroup, { label: "Hình thức", options: formatOptions, selected: selFormat, onToggle: (id) => toggle(setSelFormat, id) }),
          React.createElement(ChipGroup, { label: "Vai trò", options: roleOptions, selected: selRole, onToggle: (id) => toggle(setSelRole, id) }),
          React.createElement(ChipGroup, { label: "Cấp độ", options: rankOptions, selected: selRank, onToggle: (id) => toggle(setSelRank, id) }),
          React.createElement(ChipGroup, { label: "Kỹ năng", options: skillOptions, selected: selSkill, onToggle: (id) => toggle(setSelSkill, id) }),
          React.createElement(ChipGroup, { label: "Trainer", options: allTrainers.map((t) => ({ id: t, label: t })), selected: selTrainer, onToggle: (id) => toggle(setSelTrainer, id) }),
          React.createElement(ChipGroup, { label: "Thời lượng", options: durationOptions.map((d) => ({ id: d.id, label: d.label })), selected: selDuration, onToggle: (id) => toggle(setSelDuration, id) })
        )
      ) : null,

      // Result count
      React.createElement("div", { style: { fontSize: 12, color: "var(--rpg-muted)", marginBottom: 16 } },
        filtered.length + " / " + D.COURSES.length + " khóa học"
        + (activeFilterCount > 0 ? " · " + activeFilterCount + " bộ lọc đang bật" : "")
      ),

      filtered.length
        ? React.createElement("div", null,
            React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 18, marginBottom: 24 } },
              paginated.map((c) => React.createElement(CourseCard, { key: c.course_id, course: c, onOpen: props.onOpenCourse }))),
            // Pagination
            totalPages > 1 ? React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 32 } },
              React.createElement("button", {
                onClick: () => setPage((p) => Math.max(1, p - 1)),
                disabled: page === 1,
                style: { padding: "8px 14px", borderRadius: 6, border: "1px solid var(--rpg-border)", background: "transparent", color: page === 1 ? "var(--rpg-muted)" : "#fff", cursor: page === 1 ? "default" : "pointer", fontSize: 13, fontWeight: 600 },
              }, "← Trước"),
              Array.from({ length: totalPages }, (_, i) => i + 1).map((p) =>
                React.createElement("button", {
                  key: p,
                  onClick: () => setPage(p),
                  style: {
                    width: 36, height: 36, borderRadius: 6, border: "1px solid",
                    borderColor: p === page ? "var(--glh-accent)" : "var(--rpg-border)",
                    background: p === page ? "var(--glh-accent)" : "transparent",
                    color: p === page ? "#fff" : "var(--rpg-muted)",
                    cursor: "pointer", fontSize: 13, fontWeight: 700,
                  }
                }, p)
              ),
              React.createElement("button", {
                onClick: () => setPage((p) => Math.min(totalPages, p + 1)),
                disabled: page === totalPages,
                style: { padding: "8px 14px", borderRadius: 6, border: "1px solid var(--rpg-border)", background: "transparent", color: page === totalPages ? "var(--rpg-muted)" : "#fff", cursor: page === totalPages ? "default" : "pointer", fontSize: 13, fontWeight: 600 },
              }, "Sau →")
            ) : null,
            // Request banner
            React.createElement("div", {
              className: "catalog-request-banner",
              style: {
                marginTop: 8,
                padding: "20px 24px",
                background: "var(--rpg-panel)",
                border: "1px solid var(--rpg-border)",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                flexWrap: "wrap",
              }
            },
              React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 14 } },
                React.createElement("div", {
                  style: {
                    width: 40, height: 40, borderRadius: 8,
                    background: "rgba(228,30,38,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }
                },
                  React.createElement(Icon, { name: "file-plus", size: 20, color: "var(--glh-accent)" })
                ),
                React.createElement("div", null,
                  React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 3 } }, "Không tìm thấy khóa học phù hợp?"),
                  React.createElement("div", { style: { fontSize: 12, color: "var(--rpg-muted)" } }, "Gửi yêu cầu — L&D team sẽ xử lý trong 2-3 ngày làm việc")
                )
              ),
              React.createElement("button", {
                className: "glh-btn glh-btn--primary",
                onClick: () => props.onOpenLdRequest && props.onOpenLdRequest(),
                style: { flexShrink: 0, whiteSpace: "nowrap" },
              },
                React.createElement(Icon, { name: "send", size: 15, color: "#fff" }),
                " Gửi yêu cầu"
              )
            )
          )
        : React.createElement("div", null,
            React.createElement("div", { style: { textAlign: "center", padding: 60, color: "var(--garena-grey)" } },
              React.createElement(Icon, { name: "search", size: 32, color: "var(--garena-light-grey)", style: { margin: "0 auto 12px" } }),
              "Không tìm thấy khóa học phù hợp."),
            React.createElement("div", {
              className: "catalog-request-banner",
              style: {
                margin: "0 auto", maxWidth: 480,
                padding: "20px 24px",
                background: "var(--rpg-panel)",
                border: "1px solid var(--rpg-border)",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
              }
            },
              React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12 } },
                React.createElement(Icon, { name: "file-plus", size: 20, color: "var(--glh-accent)" }),
                React.createElement("div", null,
                  React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 2 } }, "Gửi yêu cầu học tập"),
                  React.createElement("div", { style: { fontSize: 11, color: "var(--rpg-muted)" } }, "L&D team sẽ phản hồi sớm")
                )
              ),
              React.createElement("button", {
                className: "glh-btn glh-btn--primary",
                onClick: () => props.onOpenLdRequest && props.onOpenLdRequest(),
              }, "Gửi yêu cầu")
            )
          )
    );
  }

  function FilterRow(props) {
    return React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" } },
      React.createElement("span", { style: { fontSize: 12, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--garena-grey)", minWidth: 96 } }, props.label),
      props.children);
  }

  /* ---------------- Calendar ---------------- */
  const TYPE_COLOR = {
    workshop: { bg: "rgba(228,30,38,0.18)", fg: "#FF8A8E" },
    webinar: { bg: "rgba(46,84,109,0.34)", fg: "#A8CAEA" },
    bootcamp: { bg: "rgba(191,107,0,0.26)", fg: "#EFA15C" },
    talk: { bg: "rgba(43,182,163,0.22)", fg: "#5FD9C8" },
  };

  export function Calendar(props) {
    const [view, setView] = React.useState("month"); // month | quarter | year
    const [cursor, setCursor] = React.useState({ y: 2026, m: 5 }); // June 2026 (0-idx)
    const [typeFilter, setTypeFilter] = React.useState("all");
    const [skillFilter, setSkillFilter] = React.useState("all");

    const types = ["all", ...Array.from(new Set(D.CALENDAR.map((e) => e.type)))];
    const calSkills = ["all", ...Array.from(new Set(D.CALENDAR.flatMap((e) => e.skill_tags || [])))];
    const events = D.CALENDAR.filter((e) =>
      (typeFilter === "all" || e.type === typeFilter) &&
      (skillFilter === "all" || (e.skill_tags || []).includes(skillFilter))
    );
    const TYPE_COLOR = {
      workshop: { bg: "rgba(228,30,38,0.18)", color: "#FF8A8E" },
      webinar:  { bg: "rgba(46,84,109,0.34)",  color: "#A8CAEA" },
      bootcamp: { bg: "rgba(191,107,0,0.26)",  color: "#EFA15C" },
      talk:     { bg: "rgba(43,182,163,0.22)", color: "#5FD9C8" },
    };
    const TYPE_LABEL = { workshop: "Workshop", webinar: "Webinar", bootcamp: "Bootcamp", talk: "Talk" };
    const SKILL_LABEL = { leadership: "Lãnh đạo", data: "Dữ liệu", ai: "AI", communication: "Giao tiếp", product: "Sản phẩm", foundations: "Nền tảng", facilitation: "Đào tạo", analytics: "Phân tích", strategy: "Chiến lược", ops_excellence: "Vận hành", mentoring: "Dẫn dắt" };

    const skillColors = { leadership: "#E41E26", data: "#2E546D", ai: "#F5A623", communication: "#2BB6A3", product: "#7C5CFF", foundations: "#8A93A8", facilitation: "#2BB6A3", analytics: "#2E546D", strategy: "#7C5CFF", ops_excellence: "#3B6FB0", mentoring: "#F2683C" };

      // type + skill filters
      const filterSection = React.createElement("div", { style: { marginBottom: 22 } },
        React.createElement("div", { style: { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--rpg-muted)", marginBottom: 8 } }, "Loại hình"),
        React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 } },
          types.map((t) => React.createElement("button", {
            key: t,
            onClick: () => setTypeFilter(t),
            style: {
              padding: "5px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: "pointer",
              border: "1px solid",
              borderColor: typeFilter === t ? (TYPE_COLOR[t] || {}).color || "var(--glh-accent)" : "var(--rpg-border)",
              background: typeFilter === t ? (TYPE_COLOR[t] || {}).bg || "rgba(228,30,38,0.15)" : "transparent",
              color: typeFilter === t ? (TYPE_COLOR[t] || {}).color || "#fff" : "var(--rpg-muted)",
              transition: "all 150ms",
            }
          }, t === "all" ? "Tất cả" : (TYPE_LABEL[t] || t))
          )
        ),
        React.createElement("div", { style: { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--rpg-muted)", marginBottom: 8 } }, "Kỹ năng"),
        React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } },
          calSkills.map((s) => {
            const sColor = skillColors[s] || "#8A93A8";
            const isActive = skillFilter === s;
            return React.createElement("button", {
              key: s,
              onClick: () => setSkillFilter(s),
              style: {
                padding: "5px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: "pointer",
                border: "1px solid",
                borderColor: isActive ? sColor : "var(--rpg-border)",
                background: isActive ? sColor + "33" : "transparent",
                color: isActive ? sColor : "var(--rpg-muted)",
                transition: "all 150ms",
              }
            }, s === "all" ? "Tất cả" : (SKILL_LABEL[s] || s));
          })
        )
      );
    const evByDay = {};
    events.forEach((e) => { const d = new Date(e.start_date); const k = d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate(); (evByDay[k] = evByDay[k] || []).push(e); });

    return React.createElement("div", { className: "glh-container fade-screen", style: { padding: "28px clamp(16px,4vw,40px) 80px" } },
      React.createElement("div", { style: { display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 20 } },
        React.createElement("div", null,
          React.createElement("div", { className: "u-eyebrow" }, "Lịch đào tạo"),
          React.createElement("h1", { className: "u-h2", style: { fontSize: "clamp(28px,4vw,40px)" } }, "Lịch đào tạo 2026")),
        React.createElement("div", { style: { display: "flex", gap: 4, background: "var(--rpg-panel)", border: "1px solid var(--rpg-border)", borderRadius: 8, padding: 4 } },
          [["month", "Tháng"], ["quarter", "Sắp tới"]].map(([v, l]) => React.createElement("button", {
            key: v, onClick: () => setView(v),
            className: "appbar__link" + (view === v ? " is-active" : ""),
            style: { borderRadius: 6 },
          }, l)))),

      filterSection,

      view === "month" ? React.createElement(MonthView, { cursor, setCursor, evByDay, onOpen: props.onOpenEvent })
        : React.createElement(ListView, { view, events, onOpen: props.onOpenEvent })
    );
  }

  function MonthView(props) {
    const { cursor, setCursor, evByDay, onOpen } = props;
    const { y, m } = cursor;
    const first = new Date(y, m, 1);
    const startDow = (first.getDay() + 6) % 7; // Monday-first
    const daysIn = new Date(y, m + 1, 0).getDate();
    const today = new Date("2026-06-05");
    const cells = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= daysIn; d++) cells.push(d);

    const shift = (delta) => {
      let nm = m + delta, ny = y;
      if (nm < 0) { nm = 11; ny--; } if (nm > 11) { nm = 0; ny++; }
      setCursor({ y: ny, m: nm });
    };

    return React.createElement("div", null,
      React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 16, marginBottom: 16 } },
        React.createElement("button", { className: "u-btn u-btn--ghost", onClick: () => shift(-1), style: { padding: 10 } }, React.createElement(Icon, { name: "chevron-left", size: 18 })),
        React.createElement("h3", { className: "u-h3", style: { fontSize: 20, minWidth: 160, textAlign: "center" } }, MONTHS_VI[m] + " " + y),
        React.createElement("button", { className: "u-btn u-btn--ghost", onClick: () => shift(1), style: { padding: 10 } }, React.createElement(Icon, { name: "chevron-right", size: 18 }))),
      React.createElement("div", { className: "cal-grid", style: { marginBottom: 8 } },
        DOW_VI.map((d) => React.createElement("div", { key: d, className: "cal-dow" }, d))),
      React.createElement("div", { className: "cal-grid" },
        cells.map((d, i) => {
          if (d === null) return React.createElement("div", { key: i, className: "cal-cell is-empty" });
          const k = y + "-" + m + "-" + d;
          const dayEvents = evByDay[k] || [];
          const isToday = today.getFullYear() === y && today.getMonth() === m && today.getDate() === d;
          return React.createElement("div", { key: i, className: "cal-cell" + (isToday ? " is-today" : "") },
            React.createElement("div", { className: "cal-day", style: isToday ? { color: "var(--garena-red)" } : null }, d),
            dayEvents.map((e) => {
              const col = TYPE_COLOR[e.type] || { bg: "rgba(255,255,255,0.07)", fg: "#cfd6e4" };
              return React.createElement("button", {
                key: e.event_id, className: "cal-ev", style: { background: col.bg, color: col.fg },
                onClick: () => onOpen(e),
              }, e.title);
            }));
        }))
    );
  }

  function ListView(props) {
    const today = new Date("2026-06-05");
    let list = props.events.slice().sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
    if (props.view === "quarter") {
      const q0 = 3; // Q starting month for cursor — show Q2/Q3 window from June: simplest is next 3 months
      list = list.filter((e) => { const d = new Date(e.start_date); return d >= today && d < new Date(2026, 8, 30); });
    }
    // group by month
    const groups = {};
    list.forEach((e) => { const d = new Date(e.start_date); const key = d.getFullYear() + "-" + d.getMonth(); (groups[key] = groups[key] || []).push(e); });
    return React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 28 } },
      Object.keys(groups).map((key) => {
        const [yy, mm] = key.split("-").map(Number);
        return React.createElement("div", { key: key },
          React.createElement("h3", { className: "u-h3", style: { fontSize: 18, marginBottom: 12, color: "var(--garena-red)" } }, MONTHS_VI[mm] + " " + yy),
          React.createElement("div", { style: { display: "grid", gap: 10 } },
            groups[key].map((e) => {
              const col = TYPE_COLOR[e.type] || { bg: "rgba(255,255,255,0.07)", fg: "#cfd6e4" };
              return React.createElement("button", {
                key: e.event_id, className: "u-card u-card--hover",
                style: { textAlign: "left", padding: "14px 18px", display: "flex", alignItems: "center", gap: 16, cursor: "pointer", background: "var(--rpg-panel)" },
                onClick: () => props.onOpen(e),
              },
                React.createElement("div", { style: { textAlign: "center", minWidth: 50 } },
                  React.createElement("div", { style: { fontSize: 20, fontWeight: 700, color: "#fff", lineHeight: 1 } }, new Date(e.start_date).getDate()),
                  React.createElement("div", { style: { fontSize: 11, color: "var(--garena-grey)", textTransform: "uppercase" } }, DOW_VI[(new Date(e.start_date).getDay() + 6) % 7])),
                React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                  React.createElement("div", { className: "u-h3", style: { fontSize: 16 } }, e.title),
                  React.createElement("div", { style: { fontSize: 13, color: "var(--garena-grey)", marginTop: 3, display: "flex", gap: 12, flexWrap: "wrap" } },
                    React.createElement("span", null, e.time), React.createElement("span", null, e.location), React.createElement("span", null, e.audience))),
                React.createElement("span", { className: "u-pill", style: { background: col.bg, color: col.fg } }, FORMAT_LABEL[e.type] || e.type));
            })));
      }));
  }

  