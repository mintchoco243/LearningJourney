"use client";

import React from "react";
import { GLHUI } from '../GLHUI';
import { GLHEngine } from '@/context/GameContext';
import { GLHAvatar } from '../GLHAvatar';
import { GLHParts } from '../GLHParts';
import { GLH_DATA } from '@/data/glhData';

const D = GLH_DATA;
const { Icon, fmtDate } = GLHUI;
const { useGame, rankForUser } = GLHEngine;
const { Avatar } = GLHAvatar;
const { CourseModal } = GLHParts;






/* ---------- Profile Screen ---------- */
export function Profile(props) {
  const { user, actions } = useGame();
  const [selectedCourse, setSelectedCourse] = React.useState(null);
  const qr = user.quiz_result;
  if (!qr) return null;

  const cls = D.CLASSES[qr.class_id];
  const rank = rankForUser(user);
  const opts = Object.assign({}, user.character, { classColor: cls.color, rank: rank.level });

  const completedCourses = (user.completed_courses || [])
    .map((id) => D.COURSES.find((c) => c.course_id === id))
    .filter(Boolean);

  const registeredEvents = (user.registered_events || [])
    .map((id) => D.CALENDAR.find((e) => e.event_id === id))
    .filter(Boolean);

  const quizExt = qr.quiz_extended || {};

  const stats = [
    { label: "Khóa học", value: String(user.completed_sessions_count ?? completedCourses.length) },
    { label: "Sự kiện", value: registeredEvents.length.toString() },
    { label: "Giờ học", value: `${Number.isInteger(user.hours_total) ? user.hours_total : user.hours_total.toFixed(1)}h` },
  ];

  const dbRank = D.RANKS.find((r) => r.id === user.db_rank);
  const roleLabel = user.db_role || (qr._answers && qr._answers[0] ? qr._answers[0].label : cls.name);
  const teamLabel = user.db_team || null;
  const rankLabel = dbRank ? dbRank.name : (user.db_rank || (qr._answers && qr._answers[1] ? qr._answers[1].label : rank.name));
  const goalLabel = qr._answers && qr._answers[2] ? qr._answers[2].label : null;
  const displayName = user.full_name || (user.email ? user.email.split("@")[0] : "Người dùng");

  return React.createElement("div", { className: "glh-light", style: { minHeight: "100vh", paddingBottom: 80 } },
    React.createElement("div", { className: "glh-container", style: { paddingTop: 24, paddingBottom: 80 } },
      // Back button
      React.createElement("button", {
        onClick: props.onBack,
        style: { background: "none", border: "none", color: "var(--glh-accent)", cursor: "pointer", marginBottom: 28, display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, padding: 0 },
      },
        React.createElement(Icon, { name: "arrow-left", size: 18 }),
        "Dashboard"
      ),

      // Hero card - profile header
      React.createElement("div", { style: { background: "linear-gradient(135deg, rgba(228,30,38,0.12) 0%, rgba(255,158,0,0.08) 100%)", border: "1px solid var(--ui-box-border)", borderRadius: 8, padding: 32, marginBottom: 40, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "center" } },
        // Avatar side
        React.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 20 } },
          React.createElement("div", { style: { width: 88, height: 88, borderRadius: "50%", border: "3px solid var(--glh-accent)", overflow: "hidden", boxShadow: "0 0 20px rgba(228,30,38,0.3)", display: "grid", placeItems: "center" } },
            React.createElement(Avatar, { opts: opts, size: "100%", crisp: props.crisp })
          ),
          React.createElement("div", null,
            React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: "var(--ui-muted)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 4 } }, "Vai trò & Cấp bậc"),
            React.createElement("div", { style: { fontSize: 18, fontWeight: 700, color: "var(--ui-heading)", marginBottom: 4 } }, roleLabel),
            React.createElement("div", { style: { fontSize: 13, color: "var(--amber)", fontWeight: 600 } }, rankLabel)
          )
        ),
        // Info side
        React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 16 } },
          React.createElement("div", null,
            React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--ui-muted)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 } }, "Người dùng"),
            React.createElement("div", { style: { fontSize: 16, fontWeight: 700, color: "var(--ui-heading)", marginBottom: 2 } }, displayName),
            React.createElement("div", { style: { fontSize: 13, color: "var(--ui-muted)" } }, user.email || "user@garena.vn")
          ),
          goalLabel ? React.createElement("div", null,
            React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--ui-muted)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 } }, "Mục tiêu"),
            React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: "var(--ui-heading)" } }, goalLabel)
          ) : null
        )
      ),

      // Stats grid
      React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 40 } },
        stats.map((stat, idx) =>
          React.createElement("div", { key: idx, style: { background: "var(--ui-box)", border: "1px solid var(--ui-box-border)", borderRadius: 6, padding: 16, textAlign: "center" } },
            React.createElement("div", { style: { fontSize: 28, fontWeight: 700, color: "var(--glh-accent)", marginBottom: 6, fontFamily: "var(--glh-display)" } }, stat.value),
            React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--ui-muted)", textTransform: "uppercase", letterSpacing: ".05em" } }, stat.label)
          )
        )
      ),

      // Onboarding profile
      React.createElement("div", { style: { marginBottom: 40 } },
        React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 } },
          React.createElement("h3", { style: { margin: 0, fontSize: 16, fontWeight: 700, color: "var(--ui-heading)" } }, "Thông tin từ Onboarding")
        ),
        React.createElement("button", {
          onClick: () => {
            if (confirm("Bắt đầu lại từ đầu? Toàn bộ tiến độ sẽ bị xóa.")) {
              actions.reset();
              props.onReset && props.onReset();
            }
          },
          style: {
            display: "flex", alignItems: "center", gap: 8,
            width: "100%", marginBottom: 20,
            padding: "12px 20px",
            background: "rgba(228,30,38,0.08)",
            border: "1px solid rgba(228,30,38,0.3)",
            borderRadius: 6,
            color: "var(--glh-accent)",
            fontSize: 14, fontWeight: 600,
            cursor: "pointer",
            justifyContent: "center",
          },
        },
          React.createElement(Icon, { name: "refresh-cw", size: 16, color: "var(--glh-accent)" }),
          "Làm lại Onboarding"
        ),
        React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 } },
          // Role
          roleLabel ? React.createElement("div", { style: { background: "var(--ui-box)", border: "1px solid var(--ui-box-border)", borderRadius: 6, padding: 14 } },
            React.createElement("div", { style: { fontSize: 10, fontWeight: 700, color: "var(--ui-muted)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 } }, "Vai trò"),
            React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: "var(--ui-heading)" } }, roleLabel)
          ) : null,
          // Team
          teamLabel ? React.createElement("div", { style: { background: "var(--ui-box)", border: "1px solid var(--ui-box-border)", borderRadius: 6, padding: 14 } },
            React.createElement("div", { style: { fontSize: 10, fontWeight: 700, color: "var(--ui-muted)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 } }, "Bộ phận"),
            React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: "var(--ui-heading)" } }, teamLabel)
          ) : null,
          // Rank level
          rankLabel ? React.createElement("div", { style: { background: "var(--ui-box)", border: "1px solid var(--ui-box-border)", borderRadius: 6, padding: 14 } },
            React.createElement("div", { style: { fontSize: 10, fontWeight: 700, color: "var(--ui-muted)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 } }, "Cấp bậc"),
            React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: "var(--ui-heading)" } }, rankLabel)
          ) : null,
          // Goal
          goalLabel ? React.createElement("div", { style: { background: "var(--ui-box)", border: "1px solid var(--ui-box-border)", borderRadius: 6, padding: 14 } },
            React.createElement("div", { style: { fontSize: 10, fontWeight: 700, color: "var(--ui-muted)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 } }, "Mục tiêu"),
            React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: "var(--ui-heading)" } }, goalLabel)
          ) : null,
          // Learning Style
          quizExt.learning_style && quizExt.learning_style.length > 0 ? React.createElement("div", { style: { background: "var(--ui-box)", border: "1px solid var(--ui-box-border)", borderRadius: 6, padding: 14 } },
            React.createElement("div", { style: { fontSize: 10, fontWeight: 700, color: "var(--ui-muted)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 } }, "Hình thức"),
            React.createElement("div", { style: { fontSize: 12, color: "var(--ui-heading)", lineHeight: 1.4 } },
              quizExt.learning_style.slice(0, 4).map((f, i) => React.createElement("div", { key: i }, { video: "Video tự học", workshop: "Workshop", coaching: "Coaching 1-1", reading: "Reading / Tài liệu" }[f] || f))
            )
          ) : null,
          // Availability
          quizExt.availability ? React.createElement("div", { style: { background: "var(--ui-box)", border: "1px solid var(--ui-box-border)", borderRadius: 6, padding: 14 } },
            React.createElement("div", { style: { fontSize: 10, fontWeight: 700, color: "var(--ui-muted)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 } }, "Thời gian"),
            React.createElement("div", { style: { fontSize: 12, color: "var(--ui-heading)" } },
              quizExt.availability === "under1" ? "Dưới 1 giờ/tuần" :
                quizExt.availability === "1to2" ? "1–2 giờ/tuần" :
                  quizExt.availability === "3plus" ? "3+ giờ/tuần" : ""
            )
          ) : null,
          // Trainers
          quizExt.trainers && quizExt.trainers.length > 0 ? React.createElement("div", { style: { background: "var(--ui-box)", border: "1px solid var(--ui-box-border)", borderRadius: 6, padding: 14 } },
            React.createElement("div", { style: { fontSize: 10, fontWeight: 700, color: "var(--ui-muted)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 } }, "Trainers"),
            React.createElement("div", { style: { fontSize: 11, color: "var(--ui-heading)", lineHeight: 1.4 } },
              quizExt.trainers.slice(0, 2).map((t, i) => React.createElement("div", { key: i }, "• " + t)).join("")
            )
          ) : null,
        )
      ),

      // Completed courses section
      completedCourses.length > 0 ? React.createElement("div", { style: { marginBottom: 40 } },
        React.createElement("h3", { style: { margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "var(--ui-heading)" } }, "Khóa đã hoàn thành"),
        React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 } },
          completedCourses.slice(0, 6).map((c) =>
            React.createElement("button", {
              key: c.course_id,
              onClick: () => setSelectedCourse(c),
              style: { background: "var(--ui-box)", border: "1px solid var(--ui-box-border)", borderRadius: 6, padding: 14, textAlign: "left", cursor: "pointer" },
            },
              React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: "var(--ui-heading)", marginBottom: 8, lineHeight: 1.3 } }, c.title),
              React.createElement("div", { style: { fontSize: 11, color: "var(--ui-muted)", marginBottom: 10 } }, "👨‍🏫 " + c.trainer),
              React.createElement("div", { style: { display: "flex", justifyContent: "flex-end", alignItems: "center" } },
                React.createElement("span", { style: { fontSize: 10, fontWeight: 700, padding: "2px 6px", background: "rgba(31,138,91,0.3)", color: "#5FD9C8", borderRadius: 3 } }, "✅"))
            )
          )
        )
      ) : null,

      // Registered events section
      registeredEvents.length > 0 ? React.createElement("div", null,
        React.createElement("h3", { style: { margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "var(--ui-heading)" } }, "Sự kiện đang chờ"),
        React.createElement("div", { style: { display: "grid", gap: 10 } },
          registeredEvents.slice(0, 4).map((e) =>
            React.createElement("div", { key: e.event_id, style: { background: "var(--ui-box)", border: "1px solid var(--ui-box-border)", borderRadius: 6, padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center" } },
              React.createElement("div", null,
                React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: "var(--ui-heading)", marginBottom: 4 } }, e.title),
                React.createElement("div", { style: { fontSize: 11, color: "var(--ui-muted)" } }, "📅 " + new Date(e.start_date).toLocaleDateString("vi-VN") + " · " + e.time)
              ),
              React.createElement("span", { style: { fontSize: 10, fontWeight: 700, padding: "4px 8px", background: "rgba(255,158,0,0.2)", color: "var(--glh-accent)", borderRadius: 3, whiteSpace: "nowrap" } }, "⏳")
            )
          )
        )
      ) : null
    ),
    selectedCourse ? React.createElement(CourseModal, { course: selectedCourse, onClose: () => setSelectedCourse(null) }) : null
  );
}

/* ---------- Policy Screen ---------- */
function PolicyItem(props) {
  const [open, setOpen] = React.useState(false);
  return React.createElement("div", { style: { borderTop: "1px solid var(--ui-box-border)", padding: "16px 0" } },
    React.createElement("button", {
      onClick: () => setOpen(!open),
      style: {
        background: "none", border: "none", color: "var(--ui-heading)", fontSize: 14, fontWeight: 600,
        width: "100%", textAlign: "left", display: "flex", justifyContent: "space-between",
        alignItems: "center", cursor: "pointer", padding: "8px 0",
      },
    },
      props.title,
      React.createElement(Icon, { name: open ? "chevron-up" : "chevron-down", size: 16, color: "var(--ui-muted)" })
    ),
    open ? React.createElement("div", { style: { fontSize: 13, color: "var(--ui-muted)", marginTop: 12, lineHeight: 1.6 } },
      props.children) : null
  );
}

export function Policy(props) {
  const STATIC_CATEGORIES = [
    {
      title: "Loại hình đào tạo",
      items: [
        { title: "Workshop nội bộ", desc: "Các buổi workshop do L&D team tổ chức định kỳ, dành cho toàn bộ nhân sự..." },
        { title: "Khóa học online", desc: "Hỗ trợ đăng ký các nền tảng học trực tuyến như Coursera, LinkedIn Learning..." },
      ],
    },
    {
      title: "Hỗ trợ chi phí học tập",
      items: [
        { title: "Quy trình xin hỗ trợ", desc: "Nhân sự có thể đề xuất khóa học ngoài và nhận hỗ trợ chi phí theo quy định..." },
        { title: "Mức hỗ trợ", desc: "Mức hỗ trợ tối đa tùy theo cấp bậc và loại hình đào tạo..." },
      ],
    },
    {
      title: "Quy trình đăng ký",
      items: [
        { title: "Đăng ký workshop", desc: "Truy cập tab Lịch đào tạo, chọn workshop phù hợp và nhấn Đặt chỗ..." },
        { title: "Đề xuất nhu cầu", desc: "Nếu không tìm thấy khóa học phù hợp, sử dụng form Gửi yêu cầu học tập..." },
      ],
    },
    {
      title: "Câu hỏi thường gặp",
      items: [
        { title: "Tôi có thể học bao nhiêu khóa mỗi quý?", desc: "Không giới hạn số khóa học nội bộ. Khuyến khích tối thiểu 1 khóa/quý." },
        { title: "Khi nào giờ học được ghi nhận?", desc: "Giờ học được ghi nhận khi bạn hoàn thành khóa hoặc khi L&D xác minh tham gia." },
      ],
    },
  ];

  const [categories, setCategories] = React.useState(STATIC_CATEGORIES);
  React.useEffect(() => {
    fetch("/api/policies", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data || !data.policies || !data.policies.length) return;
        const map = {};
        data.policies.forEach(p => {
          if (!p.is_active) return;
          if (!map[p.category]) map[p.category] = { title: p.category, items: [] };
          map[p.category].items.push({ title: p.title, desc: p.content || "" });
        });
        const cats = Object.values(map);
        if (cats.length) setCategories(cats);
      })
      .catch(() => { });
  }, []);

  const categories_used = categories;

  return React.createElement("div", { className: "glh-light", style: { minHeight: "100vh", paddingBottom: 40 } },
    React.createElement("div", { className: "glh-container", style: { padding: "28px clamp(16px,4vw,40px)" } },
      React.createElement("button", {
        onClick: props.onBack,
        style: { background: "none", border: "none", color: "var(--glh-accent)", cursor: "pointer", marginBottom: 20, display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600 },
      },
        React.createElement(Icon, { name: "arrow-left", size: 16 }),
        "Quay lại"
      ),

      React.createElement("h1", { className: "u-h2", style: { marginBottom: 8, fontSize: "clamp(26px,4vw,36px)" } }, "Chính sách & Hướng dẫn L&D"),
      React.createElement("p", { style: { color: "var(--ui-muted)", marginBottom: 32, fontSize: 14 } }, "Tìm hiểu về các hình thức hỗ trợ học tập tại Garena"),

      categories_used.map((cat, catIdx) =>
        React.createElement("div", { key: catIdx, className: "u-card", style: { marginBottom: 16, padding: 20 } },
          React.createElement("h3", { className: "u-eyebrow", style: { marginBottom: 12 } }, cat.title),
          cat.items.map((item, itemIdx) =>
            React.createElement(PolicyItem, { key: itemIdx, title: item.title },
              item.desc)
          )
        )
      )
    )
  );
}


