"use client";

import React from "react";
import { GLHUI } from '../GLHUI';
import { GLHEngine } from '@/context/GameContext';
import { GLH_DATA } from '@/data/glhData';
import { GLHParts } from '../GLHParts';
import { getCalendarEvents, getStaticCalendarCourses } from '@/lib/mockApi';
import { getCourseCta, mapCourseToCard } from '@/lib/courseMap.mjs';

const D = GLH_DATA;
const { Icon, FORMAT_LABEL, MONTHS_VI, DOW_VI } = GLHUI;
const { useGame, isRecommended } = GLHEngine;
const { CourseCard } = GLHParts;

const FORMAT_COLOR = {
  offline:   { bg: "rgba(228,30,38,0.18)",   color: "#FF8A8E" },
  online:    { bg: "rgba(43,182,163,0.18)",   color: "#2BB6A3" },
  elearning: { bg: "rgba(122,92,255,0.18)",   color: "#A38BFF" },
};
const SKILL_LABEL = { leadership: "Lãnh đạo", data: "Dữ liệu", ai: "AI", communication: "Giao tiếp", product: "Sản phẩm", foundations: "Nền tảng", facilitation: "Đào tạo", analytics: "Phân tích", strategy: "Chiến lược", ops_excellence: "Vận hành", mentoring: "Dẫn dắt" };

function ctaColor(cta) {
  return ({
    accent: "var(--glh-accent)",
    warning: "#FF9E00",
    purple: "#A38BFF",
    success: "var(--garena-positive)",
    muted: "var(--rpg-muted)",
  })[cta?.tone] || "var(--rpg-muted)";
}

  
  
  

  /* ---------------- Catalog ---------------- */
  export function Catalog(props) {
    const { user } = useGame();
    const [courses, setCourses] = React.useState(D.COURSES);
    const [q, setQ] = React.useState("");
    const [fmtFilter,      setFmtFilter]      = React.useState("all");
    const [cmFilter,       setCmFilter]       = React.useState("all"); // Chuyên môn
    const [trainerFilter,  setTrainerFilter]  = React.useState("all");
    const [durationFilter, setDurationFilter] = React.useState("all");
    const [tagFilter,      setTagFilter]      = React.useState("all"); // skill TAGS chips
    const [sortMode,       setSortMode]       = React.useState("newest");

    React.useEffect(() => {
      fetch("/api/courses?limit=100", { credentials: "include" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          const sourceCourses = data?.courses?.length
            ? data.courses.map((course) => mapCourseToCard(course))
            : D.COURSES;
          setCourses(sourceCourses);
        })
        .catch(() => {
          setCourses(D.COURSES);
        });
    }, []);

    const allTrainers = [...new Set(courses.map(c => c.trainer))].sort();
    const allSkillIds = [...new Set(courses.flatMap(c => c.skill_tags || []))];
    const durationOptions = [
      { id: "short",  label: "< 1 giờ",  test: m => m < 60 },
      { id: "medium", label: "1–2 giờ",  test: m => m >= 60 && m <= 120 },
      { id: "long",   label: "> 2 giờ",  test: m => m > 120 },
    ];
    const activeFilterCount = [fmtFilter, cmFilter, trainerFilter, durationFilter, tagFilter].filter(v => v !== "all").length;
    const clearAll = () => { setFmtFilter("all"); setCmFilter("all"); setTrainerFilter("all"); setDurationFilter("all"); setTagFilter("all"); setQ(""); };

    let filtered = courses.filter(c => {
      if (fmtFilter !== "all" && c.format !== fmtFilter) return false;
      if (cmFilter !== "all" && (c.class_ids || []).length && !(c.class_ids || []).includes(cmFilter)) return false;
      if (trainerFilter !== "all" && c.trainer !== trainerFilter) return false;
      if (durationFilter !== "all") { const opt = durationOptions.find(o => o.id === durationFilter); if (opt && !opt.test(c.duration_minutes)) return false; }
      if (tagFilter !== "all" && !(c.skill_tags || []).includes(tagFilter)) return false;
      if (q.trim()) {
        const hay = [c.title, c.trainer, c.description, c.audience, ...(c.skill_tags || [])].join(" ").toLowerCase();
        if (!hay.includes(q.trim().toLowerCase())) return false;
      }
      return true;
    });

    if (sortMode === "dur_asc")     filtered = [...filtered].sort((a, b) => a.duration_minutes - b.duration_minutes);
    if (sortMode === "dur_desc")    filtered = [...filtered].sort((a, b) => b.duration_minutes - a.duration_minutes);
    if (sortMode === "recommended") filtered = [...filtered].sort((a, b) => (isRecommended(b, user) ? 1 : 0) - (isRecommended(a, user) ? 1 : 0));

    const [page, setPage] = React.useState(1);
    const PAGE_SIZE = 9;
    React.useEffect(() => {
      const frame = requestAnimationFrame(() => setPage(1));
      return () => cancelAnimationFrame(frame);
    }, [q, fmtFilter, cmFilter, trainerFilter, durationFilter, tagFilter, sortMode]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const Sel = ({ placeholder, value, onChange, options, noDefault }) =>
      React.createElement("select", {
        value, onChange: e => onChange(e.target.value),
        className: "glh-filter-sel",
        style: { flex: "1 1 auto", minWidth: 110, maxWidth: 180 },
      },
        !noDefault && React.createElement("option", { value: "all" }, placeholder),
        options.map(o => React.createElement("option", { key: o.id, value: o.id }, o.label)));

    const chip = (label, active, onClick) =>
      React.createElement("button", { onClick, style: { padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "1px solid", transition: "all 150ms",
        borderColor: active ? "var(--glh-accent)" : "var(--rpg-border)",
        background: active ? "rgba(228,30,38,0.15)" : "transparent",
        color: active ? "#fff" : "var(--rpg-muted)",
      }}, label);


    return React.createElement("div", { className: "glh-container fade-screen", style: { padding: "28px clamp(16px,4vw,40px) 80px" } },
      React.createElement("h2", { style: { margin: "0 0 16px", fontSize: "clamp(18px,2.2vw,24px)", fontWeight: 700, color: "var(--ui-heading)" } },
        "Kho khóa đào tạo"),

      // Row 1: Search
      React.createElement("div", { style: { position: "relative", marginBottom: 8 } },
        React.createElement("div", { style: { position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" } },
          React.createElement(Icon, { name: "search", size: 15, color: "var(--garena-grey)" })),
        React.createElement("input", { className: "u-input", placeholder: "Tìm theo tên khóa học, trainer, kỹ năng, mô tả...", value: q, onChange: e => setQ(e.target.value), style: { paddingLeft: 40, width: "100%", boxSizing: "border-box" } })),

      // Row 2: Dropdowns + Sort
      React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap", alignItems: "center" } },
        React.createElement(Sel, { placeholder: "Hình thức", value: fmtFilter, onChange: setFmtFilter, options: [{ id: "online", label: "Online" }, { id: "offline", label: "Offline" }, { id: "elearning", label: "E-learning" }] }),
        React.createElement(Sel, { placeholder: "Kỹ năng", value: tagFilter, onChange: setTagFilter, options: allSkillIds.map(sid => ({ id: sid, label: SKILL_LABEL[sid] || sid })) }),
        React.createElement(Sel, { placeholder: "Trainer", value: trainerFilter, onChange: setTrainerFilter, options: allTrainers.map(t => ({ id: t, label: t })) }),
        React.createElement(Sel, { placeholder: "Thời lượng", value: durationFilter, onChange: setDurationFilter, options: durationOptions.map(d => ({ id: d.id, label: d.label })) }),
        React.createElement("span", { style: { fontSize: 12, fontWeight: 600, color: "var(--ui-muted)", flexShrink: 0, whiteSpace: "nowrap" } }, "Sắp xếp:"),
        React.createElement(Sel, { noDefault: true, value: sortMode, onChange: setSortMode, options: [{ id: "newest", label: "Mới nhất" }, { id: "recommended", label: "Gợi ý cho tôi" }, { id: "dur_asc", label: "Thời lượng ↑" }, { id: "dur_desc", label: "Thời lượng ↓" }] }),
        activeFilterCount > 0 && React.createElement("button", { onClick: clearAll, style: { background: "none", border: "none", color: "var(--glh-accent)", fontSize: 12, cursor: "pointer", fontWeight: 700, padding: "0 4px", flexShrink: 0 } }, "Xóa lọc ×")),

      // Row 3: Chuyên môn chips (role/vai trò)
      React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 20, flexWrap: "wrap" } },
        React.createElement("span", { style: { fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--garena-grey)", flexShrink: 0 } }, "Vai trò"),
        chip("Tất cả", cmFilter === "all", () => setCmFilter("all")),
        [{ id: "strategist", label: "Marketing / Esports" }, { id: "builder", label: "Kỹ thuật / Dữ liệu" }, { id: "operator", label: "Vận hành / Tài chính" }, { id: "connector", label: "HR / L&D" }, { id: "explorer", label: "Sáng tạo / Design" }]
          .map(r => chip(r.label, cmFilter === r.id, () => setCmFilter(cmFilter === r.id ? "all" : r.id)))),

      // Result count
      React.createElement("div", { style: { fontSize: 12, color: "var(--ui-muted)", marginBottom: 16 } },
        filtered.length + " / " + courses.length + " khóa học"
        + (activeFilterCount > 0 || q.trim() ? " · đang lọc" : "")),

      filtered.length
        ? React.createElement("div", null,
            React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 18, marginBottom: 24 } },
              paginated.map(c => React.createElement(CourseCard, { key: c._id || c.session_id || c.course_id, course: c, onClick: props.onOpenCourse }))),
            // Pagination
            totalPages > 1 ? React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 32 } },
              React.createElement("button", {
                onClick: () => setPage((p) => Math.max(1, p - 1)),
                disabled: page === 1,
                style: { padding: "8px 14px", borderRadius: 6, border: "1px solid var(--rpg-border)", background: "transparent", color: page === 1 ? "var(--ui-muted)" : "var(--ui-heading)", cursor: page === 1 ? "default" : "pointer", fontSize: 13, fontWeight: 600 },
              }, "← Trước"),
              Array.from({ length: totalPages }, (_, i) => i + 1).map((p) =>
                React.createElement("button", {
                  key: p,
                  onClick: () => setPage(p),
                  style: {
                    width: 36, height: 36, borderRadius: 6, border: "1px solid",
                    borderColor: p === page ? "var(--glh-accent)" : "var(--rpg-border)",
                    background: p === page ? "var(--glh-accent)" : "transparent",
                    color: p === page ? "#fff" : "var(--ui-muted)",
                    cursor: "pointer", fontSize: 13, fontWeight: 700,
                  }
                }, p)
              ),
              React.createElement("button", {
                onClick: () => setPage((p) => Math.min(totalPages, p + 1)),
                disabled: page === totalPages,
                style: { padding: "8px 14px", borderRadius: 6, border: "1px solid var(--rpg-border)", background: "transparent", color: page === totalPages ? "var(--ui-muted)" : "var(--ui-heading)", cursor: page === totalPages ? "default" : "pointer", fontSize: 13, fontWeight: 600 },
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
                  React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: "var(--ui-heading)", marginBottom: 3 } }, "Không tìm thấy khóa học phù hợp?"),
                  React.createElement("div", { style: { fontSize: 12, color: "var(--ui-muted)" } }, "Gửi yêu cầu — L&D team sẽ xử lý trong 2-3 ngày làm việc")
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
                  React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: "var(--ui-heading)", marginBottom: 2 } }, "Gửi yêu cầu học tập"),
                  React.createElement("div", { style: { fontSize: 11, color: "var(--ui-muted)" } }, "L&D team sẽ phản hồi sớm")
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

  /* ---------------- Calendar ---------------- */
  export function Calendar(props) {
    const [view, setView] = React.useState("quarter");
    const _now = new Date();
    const [cursor, setCursor] = React.useState({ y: _now.getFullYear(), m: _now.getMonth() });
    const [skillFilter, setSkillFilter] = React.useState("all");
    const [calendarEvents, setCalendarEvents] = React.useState(() => getStaticCalendarCourses());

    React.useEffect(() => { getCalendarEvents().then(setCalendarEvents); }, []);

    const calSkills = [...new Set(calendarEvents.flatMap(e => e.skill_tags || []))];
    const events = calendarEvents.filter(e =>
      skillFilter === "all" || (e.skill_tags || []).includes(skillFilter)
    );

    const calChip = (label, active, onClick) =>
      React.createElement("button", { onClick, style: { padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "1px solid", transition: "all 150ms",
        borderColor: active ? "var(--glh-accent)" : "var(--rpg-border)",
        background: active ? "rgba(228,30,38,0.15)" : "transparent",
        color: active ? "#fff" : "var(--rpg-muted)",
      }}, label);

    const filterSection = React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 20 } },
      React.createElement("span", { style: { fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--garena-grey)", flexShrink: 0 } }, "Kỹ năng"),
      calChip("Tất cả", skillFilter === "all", () => setSkillFilter("all")),
      calSkills.map(s => calChip(SKILL_LABEL[s] || s, skillFilter === s, () => setSkillFilter(skillFilter === s ? "all" : s))));
    const evByDay = {};
    events.forEach((e) => { const d = new Date(e.start_date); const k = d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate(); (evByDay[k] = evByDay[k] || []).push(e); });

    return React.createElement("div", { className: "glh-container fade-screen", style: { padding: "28px clamp(16px,4vw,40px) 80px" } },
      React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 20 } },
        React.createElement("h2", { style: { margin: 0, fontSize: "clamp(18px,2.2vw,24px)", fontWeight: 700, color: "var(--ui-heading)" } }, "Lịch đào tạo 2026"),
        React.createElement("div", { style: { display: "flex", gap: 4, background: "var(--rpg-panel)", border: "1px solid var(--rpg-border)", borderRadius: 8, padding: 4 } },
          [["quarter", "Năm"], ["month", "Tháng"]].map(([v, l]) => React.createElement("button", {
            key: v, onClick: () => setView(v),
            className: "appbar__link" + (view === v ? " is-active" : ""),
            style: { borderRadius: 6 },
          }, l)))),

      filterSection,

      view === "month" ? React.createElement(MonthView, { cursor, setCursor, evByDay, onOpen: props.onOpenCourse })
        : React.createElement(ListView, { view, events, onOpen: props.onOpenCourse })
    );
  }

  function MonthView(props) {
    const { cursor, setCursor, evByDay, onOpen } = props;
    const { y, m } = cursor;
    const first = new Date(y, m, 1);
    const startDow = (first.getDay() + 6) % 7; // Monday-first
    const daysIn = new Date(y, m + 1, 0).getDate();
    const today = new Date();
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
              const col = FORMAT_COLOR[e.format] || { bg: "rgba(255,255,255,0.07)", color: "#cfd6e4" };
              return React.createElement("button", {
                key: e.session_id || e.course_id, className: "cal-ev", style: { background: col.bg, color: col.color },
                onClick: () => onOpen(e),
              }, e.title);
            }));
        }))
    );
  }

  function ListView(props) {
    const { user } = useGame();
    const today = new Date();
    let list = props.events.slice().sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
    if (props.view === "quarter") {
      const threeMonths = new Date(today.getFullYear(), today.getMonth() + 3, 0);
      list = list.filter(e => { const d = new Date(e.start_date); return d >= today && d <= threeMonths; });
    }
    const groups = {};
    list.forEach(e => { const d = new Date(e.start_date); const key = d.getFullYear() + "-" + d.getMonth(); (groups[key] = groups[key] || []).push(e); });

    return React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 28 } },
      Object.keys(groups).map(key => {
        const [yy, mm] = key.split("-").map(Number);
        return React.createElement("div", { key },
          React.createElement("h3", { style: { fontSize: 16, fontWeight: 700, color: "var(--garena-red)", marginBottom: 10, marginTop: 0 } }, MONTHS_VI[mm] + " " + yy),
          React.createElement("div", { style: { display: "grid", gap: 8 } },
            groups[key].map(e => {
              const d = new Date(e.start_date);
              const isPast = d < today;
              const daysLeft = Math.ceil((d - today) / 86400000);
              const fc = FORMAT_COLOR[e.format] || { bg: "rgba(255,255,255,0.07)", color: "var(--ui-muted)" };
              const cta = getCourseCta(e, user);
              const cdColor = daysLeft <= 5 ? "#E41E26" : daysLeft <= 14 ? "#FF9E00" : "var(--rpg-muted)";
              const timeMeta = [e.start_time && e.end_time ? `${e.start_time} – ${e.end_time}` : e.start_time, e.location].filter(Boolean);

              return React.createElement("button", {
                key: e.session_id || e.course_id, className: "u-card u-card--hover",
                style: { textAlign: "left", padding: "14px 18px", display: "flex", alignItems: "center", gap: 16, cursor: "pointer", background: "var(--rpg-panel)" },
                onClick: () => props.onOpen(e),
              },
                // date block
                React.createElement("div", { style: { textAlign: "center", minWidth: 44, flexShrink: 0 } },
                  React.createElement("div", { style: { fontSize: 22, fontWeight: 700, color: "var(--ui-heading)", lineHeight: 1 } }, d.getDate()),
                  React.createElement("div", { style: { fontSize: 11, color: "var(--garena-grey)", textTransform: "uppercase", marginTop: 2 } }, DOW_VI[(d.getDay() + 6) % 7])),
                // content
                React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                  React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" } },
                    React.createElement("div", { className: "u-h3", style: { fontSize: 15, margin: 0 } }, e.title),
                    React.createElement("span", { style: { fontSize: 11, fontWeight: 700, textTransform: "uppercase", padding: "2px 8px", borderRadius: 999, background: fc.bg, color: fc.color, flexShrink: 0 } },
                      FORMAT_LABEL[e.format] || e.format)),
                  React.createElement("div", { style: { fontSize: 13, color: "var(--garena-grey)", marginTop: 4, display: "flex", gap: 12, flexWrap: "wrap" } },
                    timeMeta.map((m, i) => React.createElement("span", { key: i }, m)))),
                // CTA + countdown
                React.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 } },
                  React.createElement("span", { style: { fontSize: 12, fontWeight: 800, color: ctaColor(cta), whiteSpace: "nowrap" } }, cta.text),
                  !isPast && React.createElement("span", { style: { fontSize: 11, fontWeight: 700, color: cdColor } },
                    daysLeft === 0 ? "Hôm nay" : "Còn " + daysLeft + " ngày")));
            })));
      }));
  }

  
