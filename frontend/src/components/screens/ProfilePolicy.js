"use client";

import React from "react";
import { GLHUI } from '../GLHUI';
import { GLHEngine } from '@/context/GameContext';
import { GLHAvatar } from '../GLHAvatar';
import { GLHParts } from '../GLHParts';
import { GLH_DATA } from '@/data/glhData';
import { getRecommendedCourses, getStaticCalendarCourses } from '@/lib/mockApi';
import { mapCourseToCard } from '@/lib/courseMap.mjs';
import { rankCompassCourses, isCompletedCourse, Stat } from './Dashboard';

const D = GLH_DATA;
const { Icon, fmtDate } = GLHUI;
const { useGame, rankForUser } = GLHEngine;
const { Avatar } = GLHAvatar;
const { CourseModal, CourseCard } = GLHParts;






/* ---------- Profile Screen ---------- */
export function Profile(props) {
  const { user, actions } = useGame();
  const [selectedCourse, setSelectedCourse] = React.useState(null);
  const [recommended, setRecommended] = React.useState([]);

  React.useEffect(() => {
    getRecommendedCourses().then(setRecommended);
  }, []);

  const qr = user.quiz_result;
  const cls = qr ? D.CLASSES[qr.class_id] : D.CLASSES["ENG"];
  const rank = rankForUser(user);
  const rankCourses = React.useMemo(
    () => rankCompassCourses(recommended, user, rank, cls),
    [recommended, user, rank, cls]
  );

  if (!qr) return null;

  const opts = Object.assign({}, user.character, { classColor: cls.color, rank: rank.level });

  const completedCoursesFromApi = (user.completed_course_details || [])
    .map((course) => course?._id || course?.course_row_id ? course : mapCourseToCard(course))
    .filter(Boolean);
  const completedCourses = (completedCoursesFromApi.length ? completedCoursesFromApi : (user.completed_courses || [])
    .map((id) => D.COURSES.find((c) => c.course_id === id || c._id === id)))
    .filter(Boolean);

  const allUpcoming = getStaticCalendarCourses();
  const registeredCourses = (user.registered_events || [])
    .map((id) => allUpcoming.find((c) => c.session_id === id || c._id === id || c.course_id === id))
    .filter(Boolean);

  const quizExt = qr.quiz_extended || {};

  const dbRank = D.RANKS.find((r) => r.id === user.db_rank);
  const roleLabel = user.db_role || (qr._answers && qr._answers[0] ? qr._answers[0].label : cls.name);
  const teamLabel = user.db_team || null;
  const rankLabel = dbRank ? dbRank.name : (user.db_rank || (qr._answers && qr._answers[1] ? qr._answers[1].label : rank.name));
  const goalLabel = qr._answers && qr._answers[2] ? qr._answers[2].label : null;

  // Dash-hero stats and meta
  const displayNameDash = user.full_name || (user.email ? user.email.split("@")[0] : "bạn");
  const roleLabelDash = user.db_team || user.db_role || cls.name;
  const rankLabelDash = user.db_rank || rank.name;
  const profileMeta = [roleLabelDash, rankLabelDash].filter(Boolean).join(" · ");
  const totalHours = Number(user.hours_total || 0);
  const completedSessions = Number(user.completed_sessions_count ?? user.completed_courses?.length ?? 0);

  const progressTotal = rankCourses.length;
  const progressCompleted = rankCourses.filter((course) => isCompletedCourse(course, user)).length;
  const progressPercent = progressTotal ? Math.round((progressCompleted / progressTotal) * 100) : 0;

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
      React.createElement("div", { className: "dash-hero", style: { marginBottom: 40 } },
        React.createElement("div", { className: "dash-hero__avatar" },
          React.createElement(Avatar, { opts: opts, size: 80, crisp: props.crisp })),
        React.createElement("div", { style: { minWidth: 0 } },
          React.createElement("div", { className: "dash-rank" }, profileMeta),
          React.createElement("div", { className: "dash-classname", style: { color: "var(--ui-heading)" } }, displayNameDash),
          React.createElement("div", { style: { marginTop: 14, maxWidth: 420 } },
            React.createElement("div", { style: { fontSize: 12, color: "var(--ui-muted)", fontWeight: 700, marginBottom: 7 } },
              `Hoàn thành ${progressCompleted}/${progressTotal} khóa gợi ý cho rank của bạn`),
            React.createElement("div", { className: "xpbar", style: { height: 8 } },
              React.createElement("div", { className: "xpbar__fill", style: { width: `${progressPercent}%` } })))),
        React.createElement("div", { style: { display: "flex", gap: 24 } },
          React.createElement(Stat, { value: completedSessions, label: "Khóa đã học" }),
          React.createElement(Stat, { value: `${Number.isInteger(totalHours) ? totalHours : totalHours.toFixed(1)}h`, label: "Giờ học tích lũy" }))),

      // Onboarding profile (Filtered)
      React.createElement("div", { style: { marginBottom: 40 } },
        React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 } },
          // Learning Style
          quizExt.learning_style && quizExt.learning_style.length > 0 ? React.createElement("div", { style: { background: "var(--ui-box)", border: "1px solid var(--ui-box-border)", borderRadius: 6, padding: 14 } },
            React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 8 } },
              React.createElement(Icon, { name: "book-open", size: 14, color: "var(--ui-muted)" }),
              React.createElement("div", { style: { fontSize: 10, fontWeight: 700, color: "var(--ui-muted)", textTransform: "uppercase", letterSpacing: ".05em" } }, "Hình thức")
            ),
            React.createElement("div", { style: { fontSize: 12, color: "var(--ui-heading)", lineHeight: 1.4 } },
              quizExt.learning_style.slice(0, 4).map((f, i) => React.createElement("div", { key: i }, { video: "Video tự học", workshop: "Workshop", coaching: "Coaching 1-1", reading: "Reading / Tài liệu" }[f] || f))
            )
          ) : null,
          // Availability
          quizExt.availability ? React.createElement("div", { style: { background: "var(--ui-box)", border: "1px solid var(--ui-box-border)", borderRadius: 6, padding: 14 } },
            React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 8 } },
              React.createElement(Icon, { name: "clock", size: 14, color: "var(--ui-muted)" }),
              React.createElement("div", { style: { fontSize: 10, fontWeight: 700, color: "var(--ui-muted)", textTransform: "uppercase", letterSpacing: ".05em" } }, "Thời gian")
            ),
            React.createElement("div", { style: { fontSize: 12, color: "var(--ui-heading)" } },
              quizExt.availability === "under1" ? "Dưới 1 giờ/tuần" :
                quizExt.availability === "1to2" ? "1–2 giờ/tuần" :
                  quizExt.availability === "3plus" ? "3+ giờ/tuần" : ""
            )
          ) : null,
        )
      ),

      // Registered courses section
      registeredCourses.length > 0 ? React.createElement("div", { style: { marginBottom: 40 } },
        React.createElement("h3", { style: { margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "var(--ui-heading)" } }, "Khóa đã đăng ký"),
        React.createElement("div", { className: "rec-grid" },
          registeredCourses.map((c) => React.createElement(CourseCard, { key: c.course_id || c._id, course: c, onClick: () => setSelectedCourse(c), showDate: true }))
        )
      ) : null,

      // Completed courses section
      completedCourses.length > 0 ? React.createElement("div", { style: { marginBottom: 40 } },
        React.createElement("h3", { style: { margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "var(--ui-heading)" } }, "Khóa đã hoàn thành"),
        React.createElement("div", { className: "rec-grid" },
          completedCourses.map((c) => React.createElement(CourseCard, { key: c.course_id || c._id, course: c, onClick: () => setSelectedCourse(c), showDate: true }))
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


