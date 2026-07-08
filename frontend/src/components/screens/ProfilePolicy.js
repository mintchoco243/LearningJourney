"use client";

import React from "react";
import { GLHUI } from '../GLHUI';
import { GLHEngine } from '@/context/GameContext';
import { GLHAvatar } from '../GLHAvatar';
import { GLHParts } from '../GLHParts';
import { GLH_DATA } from '@/data/glhData';
import { getRecommendedCourses, getCalendarEvents } from '@/lib/mockApi';
import { mapCourseToCard } from '@/lib/courseMap.mjs';
import { rankCompassCourses, isCompletedCourse, Stat } from './Dashboard';

const D = GLH_DATA;
const { Icon, fmtDate } = GLHUI;
const { useGame, rankForUser } = GLHEngine;
const { Avatar } = GLHAvatar;
const { CourseModal, CourseCard } = GLHParts;




function parseRequestList(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  if (typeof value !== "string") return [value];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [value];
  }
}

function requestStatusMeta(status) {
  const normalized = String(status || "pending").toLowerCase();
  if (normalized === "approved") return { label: "Đã duyệt", color: "#2BB6A3", bg: "rgba(43,182,163,.12)" };
  if (normalized === "rejected") return { label: "Từ chối", color: "#E41E26", bg: "rgba(228,30,38,.12)" };
  if (normalized === "in_progress" || normalized === "in_review") return { label: "Đang xử lý", color: "#F5A623", bg: "rgba(245,166,35,.14)" };
  return { label: "Chờ duyệt", color: "#8A93A8", bg: "rgba(138,147,168,.14)" };
}

function requestTitle(request) {
  const skills = parseRequestList(request.skills_needed).filter(Boolean).join(", ");
  if (skills) return skills;
  const topic = String(request.description || "").split("\n").find((line) => line.toLowerCase().startsWith("topic:"));
  if (topic) return topic.replace(/^topic:\s*/i, "");
  return request.description?.slice(0, 80) || "Yêu cầu hỗ trợ đào tạo";
}

function MyLdRequestsPanel() {
  const [requests, setRequests] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/ld-requests/mine", { credentials: "include" })
      .then((res) => res.ok ? res.json() : { requests: [] })
      .then((data) => {
        if (!cancelled) setRequests(Array.isArray(data.requests) ? data.requests : []);
      })
      .catch(() => {
        if (!cancelled) setRequests([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return React.createElement("div", { className: "u-card", style: { marginBottom: 24, padding: 18 } },
    React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: requests.length || loading ? 14 : 0 } },
      React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, minWidth: 0 } },
        React.createElement("div", { style: { width: 34, height: 34, borderRadius: 8, background: "rgba(228,30,38,.1)", display: "grid", placeItems: "center", flex: "0 0 auto" } },
          React.createElement(Icon, { name: "message-square", size: 16, color: "var(--glh-accent)" })),
        React.createElement("div", { style: { minWidth: 0 } },
          React.createElement("h3", { style: { margin: 0, fontSize: 16, fontWeight: 700, color: "var(--ui-heading)" } }, "Yêu cầu hỗ trợ đào tạo của tôi"),
          React.createElement("div", { style: { marginTop: 3, fontSize: 12, color: "var(--ui-muted)" } },
            loading ? "Đang tải trạng thái..." : `${requests.length} yêu cầu đã gửi`)
        )
      )
    ),
    loading ? React.createElement("div", { style: { fontSize: 13, color: "var(--ui-muted)", padding: "8px 0" } }, "Đang tải...") :
      requests.length === 0 ? React.createElement("div", { style: { fontSize: 13, color: "var(--ui-muted)", lineHeight: 1.6 } },
        "Bạn chưa gửi yêu cầu hỗ trợ đào tạo nào.")
        : React.createElement("div", { style: { display: "grid", gap: 10 } },
          requests.map((request) => {
            const status = requestStatusMeta(request.status);
            return React.createElement("div", {
              key: request.id,
              style: {
                border: "1px solid var(--ui-box-border)",
                borderRadius: 8,
                background: "var(--ui-box)",
                padding: "12px 14px",
                display: "grid",
                gap: 6,
              },
            },
              React.createElement("div", { style: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 } },
                React.createElement("div", { style: { minWidth: 0 } },
                  React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: "var(--ui-heading)", overflowWrap: "anywhere" } }, requestTitle(request)),
                  React.createElement("div", { style: { marginTop: 4, fontSize: 12, color: "var(--ui-muted)" } },
                    request.created_at ? `Gửi ngày ${fmtDate(request.created_at)}` : "Đã gửi")
                ),
                React.createElement("span", {
                  style: {
                    flex: "0 0 auto",
                    borderRadius: 999,
                    padding: "4px 9px",
                    fontSize: 11,
                    fontWeight: 700,
                    color: status.color,
                    background: status.bg,
                  },
                }, status.label)
              ),
              request.admin_note ? React.createElement("div", { style: { fontSize: 12, color: "var(--ui-muted)", lineHeight: 1.55 } },
                React.createElement("strong", { style: { color: "var(--ui-heading)" } }, "Ghi chú từ L&D: "),
                request.admin_note
              ) : null
            );
          })
        )
  );
}

export function AvatarEditModal({ initialChar, onClose, onSave, crisp }) {
  const [c, setC] = React.useState(initialChar || { hair: "short", outfit: "red", accessory: "none", skin: "s1" });
  const set = (k, v) => setC((p) => Object.assign({}, p, { [k]: v }));
  return React.createElement("div", { className: "glh-modal-backdrop", onClick: onClose, style: { zIndex: 9999 } },
    React.createElement("div", { className: "glh-modal u-card", onClick: e => e.stopPropagation(), style: { width: "100%", maxWidth: 580, padding: 24, background: "var(--rpg-panel)", color: "var(--ui-heading)" } },
      React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 } },
        React.createElement("h3", { style: { margin: 0, fontSize: 18, fontWeight: 700 } }, "Chỉnh sửa Avatar"),
        React.createElement("button", { onClick: onClose, style: { background: "none", border: "none", color: "var(--ui-muted)", fontSize: 24, cursor: "pointer" } }, "×")
      ),
      React.createElement("div", { style: { display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center" } },
        React.createElement("div", { style: { flexShrink: 0, margin: "0 auto" } },
          React.createElement(Avatar, { opts: c, size: 140, crisp: crisp })
        ),
        React.createElement("div", { style: { flex: "1 1 240px" } },
          React.createElement("div", { style: { marginBottom: 14 } },
            React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "var(--ui-muted)", marginBottom: 6 } }, "Kiểu tóc"),
            React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" } },
              D.CHAR_OPTIONS.hair.map(o => React.createElement("button", {
                key: o.id, className: "u-chip" + (c.hair === o.id ? " is-active" : ""), onClick: () => set("hair", o.id), style: { padding: "4px 10px", fontSize: 12 }
              }, o.name))
            )
          ),
          React.createElement("div", { style: { marginBottom: 14 } },
            React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "var(--ui-muted)", marginBottom: 6 } }, "Tông da"),
            React.createElement("div", { style: { display: "flex", gap: 8 } },
              D.CHAR_OPTIONS.skin.map(o => React.createElement("button", {
                key: o.id, onClick: () => set("skin", o.id), style: { width: 30, height: 30, borderRadius: "50%", background: o.color, border: c.skin === o.id ? "3px solid var(--glh-accent)" : "2px solid var(--ui-box-border)", cursor: "pointer" }
              }))
            )
          ),
          React.createElement("div", { style: { marginBottom: 14 } },
            React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "var(--ui-muted)", marginBottom: 6 } }, "Màu trang phục"),
            React.createElement("div", { style: { display: "flex", gap: 8 } },
              D.CHAR_OPTIONS.outfit.map(o => React.createElement("button", {
                key: o.id, onClick: () => set("outfit", o.id), style: { width: 30, height: 30, borderRadius: "50%", background: o.color, border: c.outfit === o.id ? "3px solid var(--glh-accent)" : "2px solid var(--ui-box-border)", cursor: "pointer" }
              }))
            )
          ),
          React.createElement("div", { style: { marginBottom: 14 } },
            React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "var(--ui-muted)", marginBottom: 6 } }, "Phụ kiện"),
            React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" } },
              D.CHAR_OPTIONS.accessory.map(o => React.createElement("button", {
                key: o.id, className: "u-chip" + (c.accessory === o.id ? " is-active" : ""), onClick: () => set("accessory", o.id), style: { padding: "4px 10px", fontSize: 12 }
              }, o.name))
            )
          )
        )
      ),
      React.createElement("div", { style: { display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 } },
        React.createElement("button", { className: "glh-btn glh-btn--ghost", onClick: onClose }, "Hủy"),
        React.createElement("button", { className: "glh-btn glh-btn--primary", onClick: () => { onSave(c); onClose(); } }, "Lưu thay đổi")
      )
    )
  );
}

/* ---------- Profile Screen ---------- */
export function Profile(props) {
  const { user, actions } = useGame();
  const [showAvatarEdit, setShowAvatarEdit] = React.useState(false);
  const [selectedCourse, setSelectedCourse] = React.useState(null);
  const [recommended, setRecommended] = React.useState([]);
  const [calendarCourses, setCalendarCourses] = React.useState([]);

  React.useEffect(() => {
    getRecommendedCourses().then(setRecommended);
    getCalendarEvents().then(setCalendarCourses);
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
  const completedCourses = completedCoursesFromApi.filter(Boolean);

  const allUpcoming = calendarCourses;
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
      showAvatarEdit && React.createElement(AvatarEditModal, {
        initialChar: user.character,
        crisp: props.crisp,
        onClose: () => setShowAvatarEdit(false),
        onSave: (newChar) => actions && actions.setCharacter && actions.setCharacter(newChar)
      }),
      // Hero card - profile header
      React.createElement("div", { className: "dash-hero", style: { marginBottom: 40 } },
        React.createElement("div", { className: "dash-hero__avatar", style: { position: "relative" } },
          React.createElement(Avatar, { opts: opts, size: 80, crisp: props.crisp }),
          React.createElement("button", {
            onClick: () => setShowAvatarEdit(true),
            title: "Chỉnh sửa avatar / Xem hồ sơ cá nhân",
            className: "avatar-edit-btn",
            style: {
              position: "absolute",
              bottom: -6,
              right: -6,
              background: "var(--glh-accent)",
              border: "2px solid var(--rpg-panel)",
              borderRadius: "50%",
              width: 24,
              height: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
            }
          }, React.createElement(Icon, { name: "edit-3", size: 11, color: "#fff" }))
        ),
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

      React.createElement(MyLdRequestsPanel, null),

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
function normalizePolicyHeadingText(text) {
  return String(text || "")
    .replace(/^[IVXLCDM]+\.\s*/i, "")
    .replace(/\s+/g, " ")
    .replace(/[:：.]$/, "")
    .trim()
    .toLowerCase();
}

function isDuplicatePolicyHeading(source, target) {
  return normalizePolicyHeadingText(source) === normalizePolicyHeadingText(target);
}

function isHiddenPolicySection(title) {
  return normalizePolicyHeadingText(title) === normalizePolicyHeadingText("I. Khóa học nội bộ do công ty tổ chức");
}

function stripPolicyNumber(title) {
  return String(title || "").replace(/^[IVXLCDM]+\.\s*/i, "").trim();
}

function toRomanNumber(value) {
  const numerals = [
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let n = value;
  let result = "";
  numerals.forEach(([amount, numeral]) => {
    while (n >= amount) {
      result += numeral;
      n -= amount;
    }
  });
  return result;
}

function PolicyItem(props) {
  const [open, setOpen] = React.useState(false);
  const isHtml = props.content && (
    props.content.trimStart().startsWith("<") ||
    props.content.includes("<p") ||
    props.content.includes("<div") ||
    props.content.includes("<ul") ||
    props.content.includes("<table")
  );

  return React.createElement("div", { style: { borderTop: "1px solid var(--ui-box-border)" } },
    React.createElement("button", {
      onClick: () => setOpen(!open),
      style: {
        background: "none", border: "none", color: "var(--ui-heading)", fontSize: 14, fontWeight: 600,
        width: "100%", textAlign: "left", display: "flex", justifyContent: "space-between",
        alignItems: "center", cursor: "pointer", padding: "16px 0",
      },
    },
      props.title,
      React.createElement(Icon, { name: open ? "chevron-up" : "chevron-down", size: 16, color: "var(--ui-muted)" })
    ),
    open ? React.createElement("div", { style: { paddingBottom: 16 } },
      isHtml
        ? React.createElement("div", {
            className: "policy-rich-content",
            dangerouslySetInnerHTML: { __html: props.content }
          })
        : React.createElement("div", {
            style: { fontSize: 13, color: "var(--ui-muted)", lineHeight: 1.6 }
          }, props.content)
    ) : null
  );
}

const POLICY_STYLES = `
  .policy-rich-content {
    font-size: 13.5px;
    line-height: 1.75;
    color: var(--ui-text, #374151);
    font-family: var(--garena-font-vn);
    overflow-wrap: anywhere;
  }
  .policy-rich-content,
  .policy-rich-content * {
    font-family: var(--garena-font-vn) !important;
    letter-spacing: 0 !important;
  }
  .policy-rich-content * {
    color: var(--ui-text) !important;
  }
  .policy-rich-content p { margin: 0 0 8px; }
  .policy-rich-content ul, .policy-rich-content ol { padding-left: 22px; margin: 6px 0 10px; }
  .policy-rich-content li { margin-bottom: 4px; }
  .policy-rich-content strong { font-weight: 700; color: var(--ui-heading, #111) !important; }
  .policy-rich-content em { font-style: italic; color: var(--ui-muted) !important; }
  .policy-rich-content table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0 16px;
    font-size: 13px;
    border-radius: 6px;
    overflow: hidden;
  }
  .policy-rich-content table td, .policy-rich-content table th {
    border: 1px solid var(--ui-box-border, #e5e7eb);
    padding: 8px 10px;
    vertical-align: top;
    text-align: left;
    background: var(--ui-box-2);
    color: var(--ui-text) !important;
  }
  .policy-rich-content table th,
  .policy-rich-content table tr:first-child td {
    background: var(--glh-accent, #E51A34);
    color: #fff !important;
    font-weight: 700;
    border-color: var(--glh-accent, #E51A34);
    text-align: center;
  }
  .policy-rich-content table tbody tr:nth-child(even) td {
    background: var(--ui-box, #fafafa);
  }
  .policy-rich-content img {
    display: block !important;
    float: none !important;
    clear: both !important;
    max-width: 100% !important;
    height: auto !important;
    margin: 16px auto !important;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  }
  .policy-rich-content a {
    color: var(--glh-accent, #E51A34) !important;
    text-decoration: underline;
  }
  .policy-rich-content h1, .policy-rich-content h2, .policy-rich-content h3, .policy-rich-content h4 {
    font-weight: 700;
    color: var(--ui-heading) !important;
    margin: 14px 0 8px;
    line-height: 1.35;
  }
  .policy-rich-content h1 { font-size: 18px !important; }
  .policy-rich-content h2 { font-size: 16px !important; }
  .policy-rich-content h3,
  .policy-rich-content h4 { font-size: 14px !important; }
  .policy-rich-content span,
  .policy-rich-content p,
  .policy-rich-content li,
  .policy-rich-content td {
    font-size: inherit !important;
  }
  .policy-rich-content > div[class="policy-html-content"] > p:first-child,
  .policy-rich-content > div[class="policy-html-content"] > span:first-child {
    margin-top: 0;
  }
  .policy-rich-content > .policy-html-content > h1:first-child,
  .policy-rich-content > .policy-html-content > h2:first-child,
  .policy-rich-content > .policy-html-content > h3:first-child,
  .policy-rich-content > .policy-html-content > h4:first-child,
  .policy-rich-content > .policy-html-content > strong:first-child {
    display: none !important;
  }
`;

export function Policy(props) {
  const STATIC_CATEGORIES = [
    {
      title: "Loại hình đào tạo",
      items: [
        { title: "Workshop nội bộ", content: "Các buổi workshop do L&D team tổ chức định kỳ, dành cho toàn bộ nhân sự." },
        { title: "Khóa học online", content: "Hỗ trợ đăng ký các nền tảng học trực tuyến như Coursera, LinkedIn Learning..." },
      ],
    },
    {
      title: "Hỗ trợ chi phí học tập",
      items: [
        { title: "Quy trình xin hỗ trợ", content: "Nhân sự có thể đề xuất khóa học ngoài và nhận hỗ trợ chi phí theo quy định." },
        { title: "Mức hỗ trợ", content: "Mức hỗ trợ tối đa tùy theo cấp bậc và loại hình đào tạo." },
      ],
    },
  ];

  const [categories, setCategories] = React.useState(STATIC_CATEGORIES);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/policies", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data || !data.policies) return;

        let cats;
        // API may return grouped object { "Category": [...] } or flat array
        if (Array.isArray(data.policies)) {
          const map = {};
          data.policies.forEach(p => {
            if (!p.is_active) return;
            if (isHiddenPolicySection(p.category) || isHiddenPolicySection(p.title)) return;
            if (!map[p.category]) map[p.category] = { title: p.category, items: [] };
            map[p.category].items.push({ title: p.title, content: p.content || p.preview || "" });
          });
          cats = Object.values(map).filter(cat => cat.items.length);
        } else {
          cats = Object.entries(data.policies)
            .filter(([catName]) => !isHiddenPolicySection(catName))
            .map(([catName, entries]) => ({
              title: catName,
              items: (entries || [])
                .filter(p => p.is_active !== false && !isHiddenPolicySection(p.title))
                .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
                .map(p => ({ title: p.title, content: p.content || p.preview || "" })),
            }))
            .filter(cat => cat.items.length);
        }
        if (cats.length) setCategories(cats);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  return React.createElement("div", { className: "glh-light", style: { minHeight: "100vh", paddingBottom: 40 } },
    React.createElement("style", null, POLICY_STYLES),
    React.createElement("div", { className: "glh-container", style: { padding: "28px clamp(16px,4vw,40px)" } },
      React.createElement("h1", { className: "u-h2", style: { marginBottom: 8, fontSize: "clamp(22px,4vw,32px)" } }, "Chính sách & Hướng dẫn L&D"),
      React.createElement("p", { style: { color: "var(--ui-muted)", marginBottom: 32, fontSize: 14 } }, "Tìm hiểu về các hình thức hỗ trợ học tập tại Garena"),

      loading
        ? React.createElement("div", { style: { textAlign: "center", padding: 40, color: "var(--ui-muted)", fontSize: 14 } }, "Đang tải...")
        : categories.map((cat, catIdx) => {
            const visibleItems = (cat.items || [])
              .filter(item => !isHiddenPolicySection(item.title))
              .map((item, itemIdx) => ({
                ...item,
                displayTitle: `${toRomanNumber(itemIdx + 1)}. ${stripPolicyNumber(item.title)}`,
              }));
            const firstItemTitle = visibleItems[0]?.displayTitle || "";
            const showCategoryHeading = cat.title
              && cat.title !== "Chính sách đào tạo"
              && cat.title !== "General"
              && !isDuplicatePolicyHeading(cat.title, firstItemTitle);

            return React.createElement("div", { key: catIdx, className: "u-card", style: { marginBottom: 16, padding: "4px 20px 4px" } },
              showCategoryHeading
                ? React.createElement("h3", { className: "u-eyebrow", style: { marginBottom: 0, paddingTop: 16, paddingBottom: 4 } }, cat.title)
                : React.createElement("div", { style: { height: 12 } }), // spacer instead of eyebrow
              visibleItems.map((item, itemIdx) =>
                React.createElement(PolicyItem, { key: itemIdx, title: item.displayTitle, content: item.content })
              )
            );
          })
    )
  );
}
