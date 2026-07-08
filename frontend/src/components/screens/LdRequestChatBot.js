"use client";

import React from "react";
import { GLHUI } from '../GLHUI';
import { GLHEngine } from '@/context/GameContext';
import { GLH_DATA } from '@/data/glhData';

const D = GLH_DATA;
const { Icon } = GLHUI;
const { useGame } = GLHEngine;

function renderInlineMarkdown(text, keyPrefix) {
  const parts = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__|_[^_]+_|\[[^\]]+\]\(https?:\/\/[^)\s]+\)|https?:\/\/[^\s]+)/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));

    const token = match[0];
    const key = `${keyPrefix}-${parts.length}`;
    if (token.startsWith("**") || token.startsWith("__")) {
      parts.push(React.createElement("strong", { key }, token.slice(2, -2)));
    } else if (token.startsWith("*") || token.startsWith("_")) {
      parts.push(React.createElement("em", { key }, token.slice(1, -1)));
    } else if (token.startsWith("[")) {
      const link = token.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/);
      parts.push(React.createElement("a", { key, href: link[2], target: "_blank", rel: "noreferrer" }, link[1]));
    } else {
      parts.push(React.createElement("a", { key, href: token, target: "_blank", rel: "noreferrer" }, token));
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

function normalizeBotMarkdown(text) {
  if (!text || /(^|\n)\s*[-*]\s+\S/.test(text)) return text;
  const chunks = text.split(/\s+-\s+/).map((chunk) => chunk.trim()).filter(Boolean);
  if (chunks.length < 3) return text;
  return `${chunks[0]}\n${chunks.slice(1).map((chunk) => `- ${chunk}`).join("\n")}`;
}

function FormattedMessage({ text, role }) {
  const normalized = role === "bot" ? normalizeBotMarkdown(text) : text;
  const lines = normalized.split(/\r?\n/);
  const nodes = [];
  let listItems = [];

  const flushList = () => {
    if (!listItems.length) return;
    const items = listItems;
    listItems = [];
    nodes.push(React.createElement("ul", { key: `ul-${nodes.length}` },
      items.map((item, itemIdx) => React.createElement("li", { key: itemIdx },
        renderInlineMarkdown(item, `li-${nodes.length}-${itemIdx}`)
      ))
    ));
  };

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      return;
    }

    const bullet = line.match(/^[-*]\s+(.+)$/);
    if (bullet) {
      listItems.push(bullet[1]);
      return;
    }

    flushList();
    const label = line.match(/^([^:]{2,28}):\s+(.+)$/);
    nodes.push(React.createElement("p", { key: `p-${idx}` },
      label
        ? React.createElement(React.Fragment, null,
            React.createElement("strong", null, label[1] + ": "),
            renderInlineMarkdown(label[2], `p-${idx}`)
          )
        : renderInlineMarkdown(line, `p-${idx}`)
    ));
  });

  flushList();
  return React.createElement("div", { className: "chat-message-format" }, nodes);
}

const Field = ({ icon, label, required, children }) =>
  React.createElement("div", { style: { marginBottom: 22 } },
    React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 8 } },
      React.createElement("div", { style: { width: 28, height: 28, borderRadius: 6, background: "rgba(228,30,38,0.1)", display: "flex", alignItems: "center", justifyContent: "center" } },
        React.createElement(Icon, { name: icon, size: 14, color: "var(--glh-accent)" })
      ),
      React.createElement("span", { style: { fontSize: 13, fontWeight: 700, color: "var(--ui-heading)" } }, label),
      required ? React.createElement("span", { style: { fontSize: 11, color: "var(--glh-accent)" } }, "*") : null
    ),
    children
  );



/* ---------- L&D Request Popup ---------- */
export function LdRequestPopup(props) {
  const { user } = useGame();
  const qr = user.quiz_result || {};
  const quizExt = qr.quiz_extended || {};

  const displayName = user.email ? user.email.split("@")[0] : "Người dùng";
  const displayEmail = user.email || "user@garena.vn";

  const [form, setForm] = React.useState({
    topic: "",
    goal: "",
    format: "",
    format_other: "",
    timing: "",
    weekly_hours: "",
    preferred_trainers: "",
    scope: "individual",
    scope_other: "",
    notes: "",
  });
  const [submitted, setSubmitted] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState("");

  const formatOptions = [
    { id: "online", label: "Online (Zoom / Meet)" },
    { id: "offline", label: "Offline tại văn phòng" },
    { id: "elearning", label: "E-learning tự học" },
    { id: "any", label: "Linh hoạt theo L&D" },
    { id: "other", label: "Khác" },
  ];
  const timingOptions = [
    { id: "office", label: "Trong giờ hành chính" },
    { id: "lunch", label: "Giờ nghỉ trưa (12h - 13h30)" },
    { id: "after", label: "Sau giờ làm việc (Sau 18h30)" },
    { id: "weekend", label: "Cuối tuần (T7, CN)" },
  ];
  const scopeOptions = [
    { id: "individual", label: "Chỉ mình tôi" },
    { id: "team", label: "Team của tôi" },
    { id: "other", label: "Khác" },
  ];

  const toggleChip = (field, id, single) => setForm(p =>
    single ? { ...p, [field]: p[field] === id ? "" : id }
      : { ...p, [field]: Array.isArray(p[field]) ? (p[field].includes(id) ? p[field].filter(x => x !== id) : [...p[field], id]) : [id] }
  );

  const handleSubmit = async () => {
    if (!form.topic.trim()) { alert("Vui lòng nhập tên khóa học / chủ đề muốn học"); return; }
    if (!form.goal.trim()) { alert("Vui lòng mô tả mục tiêu học tập"); return; }
    setSubmitting(true);
    setSubmitError("");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const preferredFormat = form.format === "other" ? form.format_other : form.format;
      const requestScope = form.scope === "other" ? form.scope_other : form.scope;
      const description = [
        `Topic: ${form.topic}`,
        `Goal: ${form.goal}`,
        form.timing ? `Preferred timing: ${form.timing}` : "",
        requestScope ? `Scope: ${requestScope}` : "",
        form.weekly_hours ? `Weekly hours: ${form.weekly_hours}` : "",
        form.preferred_trainers ? `Preferred trainers: ${form.preferred_trainers}` : "",
      ].filter(Boolean).join("\n");
      const res = await fetch("/api/ld-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        signal: controller.signal,
        body: JSON.stringify({
          description,
          skills_needed: [form.topic],
          preferred_formats: preferredFormat ? [preferredFormat] : [],
          weekly_hours: form.weekly_hours,
          preferred_trainers: form.preferred_trainers,
          other_notes: form.notes,
          topic: form.topic,
          goal: form.goal,
          preferred_format: preferredFormat,
          preferred_timing: form.timing,
          scope: requestScope,
          notes: form.notes,
        }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Không thể gửi yêu cầu");
      }
      setSubmitted(true);
      setTimeout(() => props.onClose(), 2000);
    } catch (e) {
      setSubmitError(e.name === "AbortError"
        ? "Không kết nối được API. Vui lòng thử lại sau."
        : (e.message || "Không thể gửi yêu cầu. Vui lòng thử lại."));
    } finally {
      clearTimeout(timeout);
      setSubmitting(false);
    }
  };


  if (submitted) {
    return React.createElement("div", { className: "modal-bg" },
      React.createElement("div", { className: "modal", style: { textAlign: "center", padding: 48 } },
        React.createElement("div", { style: { width: 64, height: 64, borderRadius: "50%", background: "rgba(31,138,91,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" } },
          React.createElement(Icon, { name: "check", size: 32, color: "#5FD9C8" })
        ),
        React.createElement("h2", { style: { margin: "0 0 8px", fontSize: 20, fontWeight: 700, color: "var(--ui-heading)" } }, "Đã gửi thành công!"),
        React.createElement("p", { style: { color: "var(--rpg-muted)", fontSize: 13, margin: 0 } }, "L&D team sẽ phản hồi bạn trong 2-3 ngày làm việc.")
      )
    );
  }

  return React.createElement("div", { className: "modal-bg", onClick: props.onClose },
    React.createElement("div", {
      className: "modal",
      onClick: (e) => e.stopPropagation(),
      style: { maxHeight: "85vh", overflow: "hidden", padding: 0, maxWidth: 560, display: "flex", flexDirection: "column" }
    },
      // Header
      React.createElement("div", { style: { padding: "24px 24px 0", flexShrink: 0 } },
        React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 } },
          React.createElement("div", null,
            React.createElement("h2", { style: { margin: "0 0 4px", fontSize: 20, fontWeight: 700, color: "var(--ui-heading)" } }, "Gửi yêu cầu học tập"),
            React.createElement("p", { style: { margin: 0, fontSize: 13, color: "var(--rpg-muted)" } }, "L&D team sẽ xem xét và phản hồi sớm")
          ),
          React.createElement("button", { onClick: props.onClose, style: { background: "none", border: "none", color: "var(--rpg-muted)", cursor: "pointer", fontSize: 20, padding: 0, lineHeight: 1 } }, "✕")
        ),
        // User info strip
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "rgba(0,0,0,0.05)", borderRadius: 8, marginTop: 16, marginBottom: 0 } },
          React.createElement("div", { style: { width: 32, height: 32, borderRadius: "50%", background: "var(--glh-accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff" } },
            displayName[0].toUpperCase()
          ),
          React.createElement("div", null,
            React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: "var(--ui-heading)" } }, displayName),
            React.createElement("div", { style: { fontSize: 11, color: "var(--rpg-muted)" } }, displayEmail)
          )
        )
      ),

      // Divider
      React.createElement("div", { style: { height: 1, background: "var(--rpg-border)", margin: "20px 0", flexShrink: 0 } }),

      // Form fields
      React.createElement("div", { style: { padding: "0 24px 24px", overflowY: "auto", flex: 1 } },

        // Topic
        React.createElement(Field, { icon: "book-open", label: "Tên khóa học / Chủ đề muốn học", required: true },
          React.createElement("input", {
            className: "u-input",
            placeholder: "Ví dụ: Kỹ năng thuyết trình, Python cơ bản, OKR...",
            value: form.topic,
            onChange: e => setForm(p => ({ ...p, topic: e.target.value })),
          })
        ),

        // Goal
        React.createElement(Field, { icon: "target", label: "Mục tiêu học tập", required: true },
          React.createElement("textarea", {
            className: "u-input",
            placeholder: "Bạn muốn đạt được gì sau khoá học? Áp dụng vào công việc như thế nào?",
            value: form.goal,
            onChange: e => setForm(p => ({ ...p, goal: e.target.value })),
            style: { minHeight: 80, resize: "vertical" },
          })
        ),

        // Format
        React.createElement(Field, { icon: "layers", label: "Hình thức mong muốn" },
          React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } },
            formatOptions.map(f => React.createElement("button", {
              key: f.id,
              onClick: () => toggleChip("format", f.id, true),
              style: {
                padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "1px solid", transition: "all 150ms",
                borderColor: form.format === f.id ? "var(--glh-accent)" : "var(--rpg-border)",
                background: form.format === f.id ? "rgba(228,30,38,0.15)" : "transparent",
                color: form.format === f.id ? "#fff" : "var(--rpg-muted)",
              }
            }, f.label)),
            form.format === "other" ? React.createElement("input", {
              className: "u-input",
              placeholder: "Nhập hình thức mong muốn...",
              value: form.format_other,
              onChange: e => setForm(p => ({ ...p, format_other: e.target.value })),
              style: { flexBasis: "100%", marginTop: 4, marginBottom: 0 },
            }) : null
          )
        ),

        // Timing
        React.createElement(Field, { icon: "clock", label: "Khung giờ thuận tiện" },
          React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } },
            timingOptions.map(t => React.createElement("button", {
              key: t.id,
              onClick: () => toggleChip("timing", t.id, true),
              style: {
                padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "1px solid", transition: "all 150ms",
                borderColor: form.timing === t.id ? "var(--glh-accent)" : "var(--rpg-border)",
                background: form.timing === t.id ? "rgba(228,30,38,0.15)" : "transparent",
                color: form.timing === t.id ? "#fff" : "var(--rpg-muted)",
              }
            }, t.label))
          )
        ),

        // Weekly hours
        React.createElement(Field, { icon: "timer", label: "Thời lượng có thể dành cho việc học mỗi tuần" },
          React.createElement("input", {
            className: "u-input",
            placeholder: "Ví dụ: 2 giờ/tuần, 1 buổi/tuần, linh hoạt theo lịch team...",
            value: form.weekly_hours,
            onChange: e => setForm(p => ({ ...p, weekly_hours: e.target.value })),
          })
        ),

        // Preferred trainers
        React.createElement(Field, { icon: "user-check", label: "Trainer / đơn vị đào tạo mong muốn" },
          React.createElement("input", {
            className: "u-input",
            placeholder: "Ví dụ: L&D Team, Product Guild, chuyên gia bên ngoài, Coursera...",
            value: form.preferred_trainers,
            onChange: e => setForm(p => ({ ...p, preferred_trainers: e.target.value })),
          })
        ),

        // Scope
        React.createElement(Field, { icon: "users", label: "Đối tượng tham gia" },
          React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } },
            scopeOptions.map(s => React.createElement("button", {
              key: s.id,
              onClick: () => setForm(p => ({ ...p, scope: s.id })),
              style: {
                padding: "6px 16px", borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "1px solid", transition: "all 150ms",
                borderColor: form.scope === s.id ? "var(--glh-accent)" : "var(--rpg-border)",
                background: form.scope === s.id ? "rgba(228,30,38,0.15)" : "transparent",
                color: form.scope === s.id ? "#fff" : "var(--rpg-muted)",
              }
            }, s.label)),
            form.scope === "other" ? React.createElement("input", {
              className: "u-input",
              placeholder: "Nhập đối tượng tham gia...",
              value: form.scope_other,
              onChange: e => setForm(p => ({ ...p, scope_other: e.target.value })),
              style: { flexBasis: "100%", marginTop: 4, marginBottom: 0 },
            }) : null
          )
        ),

        // Notes
        React.createElement(Field, { icon: "message-square", label: "Ghi chú thêm" },
          React.createElement("textarea", {
            className: "u-input",
            placeholder: "Số lượng người tham gia, yêu cầu đặc biệt...",
            value: form.notes,
            onChange: e => setForm(p => ({ ...p, notes: e.target.value })),
            style: { minHeight: 60, resize: "vertical" },
          })
        ),

        // Footer
        submitError ? React.createElement("div", {
          style: {
            background: "rgba(228,30,38,.12)",
            border: "1px solid rgba(228,30,38,.35)",
            borderRadius: 8,
            color: "#ff8f8f",
            fontSize: 13,
            lineHeight: 1.5,
            marginBottom: 14,
            padding: "10px 12px",
          },
        }, submitError) : null,
        React.createElement("div", { style: { display: "flex", gap: 12, justifyContent: "flex-end", paddingTop: 4 } },
          React.createElement("button", { className: "glh-btn glh-btn--ghost", onClick: props.onClose }, "Hủy"),
          React.createElement("button", {
            className: "glh-btn glh-btn--primary",
            onClick: handleSubmit,
            disabled: submitting,
            style: { minWidth: 120 },
          },
            React.createElement(Icon, { name: "send", size: 15, color: "#fff" }), " Gửi yêu cầu"
          )
        )
      )
    )
  );
}

/* ---------- ChatBot Bubble + Helper Button ---------- */
export function ChatBot(props) {
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState([
    { role: "bot", text: "Xin chào! Hộ giá có thể giúp bạn tìm khóa học, giải thích rank, hoặc tra cứu chính sách L&D. Bạn cần hỗ trợ gì?", hasQuickReplies: true }
  ]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const chatRef = React.useRef(null);

  React.useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (textOrEvent) => {
    const messageText = typeof textOrEvent === "string" ? textOrEvent : input;
    if (!messageText.trim() || loading) return;

    const newMsg = { role: "user", text: messageText };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = [...messages, newMsg]
        .filter(m => !m.hasQuickReplies && (m.role === "user" || m.role === "bot"))
        .map(m => ({
          role: m.role === "bot" ? "assistant" : "user",
          content: m.text
        }));

      const res = await fetch("/api/bot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ messages: history })
      });

      if (!res.ok) throw new Error("API_ERROR");
      const data = await res.json();

      setMessages((prev) => [...prev, {
        role: "bot",
        text: data.reply || "Xin lỗi, mình chưa có phản hồi cho câu hỏi này.",
        citations: data.citations || [],
        images: data.images || []
      }]);
    } catch (err) {
      setMessages((prev) => [...prev, {
        role: "bot",
        text: "⚠️ Không thể kết nối tới AI Trợ lý. Bạn vui lòng kiểm tra lại cấu hình hoặc thử lại sau nhé!"
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Hide on Game World screens
  if (props.hideOnGameWorld && document.querySelector(".glh-dark.glh-center")) {
    return null;
  }

  return React.createElement(React.Fragment, null,
    // Chat button
    !open ? React.createElement("div", { "data-tour": "learning-support", style: { position: "fixed", bottom: 24, right: 24, zIndex: 100, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 } },
      React.createElement("div", {
        style: {
          background: "var(--ui-surface, var(--rpg-panel-2, #1c2433))",
          border: "1px solid var(--ui-box-border, var(--rpg-border-strong))",
          borderRadius: "12px 12px 4px 12px",
          padding: "10px 14px",
          fontSize: 13,
          color: "var(--ui-heading, #fff)",
          maxWidth: 260,
          boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
          lineHeight: 1.4,
          whiteSpace: "nowrap",
        }
      }, "Cần Hộ giá gợi ý không ạ?"),
      React.createElement("button", {
        onClick: () => setOpen(true),
        style: {
          width: 86, height: 86,
          background: "none",
          border: "none",
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "transform 200ms ease",
          padding: 0,
        },
        onMouseEnter: (e) => { e.currentTarget.style.transform = "scale(1.1)"; },
        onMouseLeave: (e) => { e.currentTarget.style.transform = "scale(1)"; },
      }, React.createElement("img", { src: "/assets/avatar%20bot.png", alt: "Hộ giá bot", style: { width: "100%", height: "100%", objectFit: "contain", filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.35))" } }))
    ) : null,

    // Chat window
    open ? React.createElement("div", {
      style: {
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 101,
        width: 380,
        height: 520,
        background: "var(--ui-surface, var(--rpg-panel-2))",
        border: "1px solid var(--ui-box-border, var(--rpg-border-strong))",
        color: "var(--ui-text, #fff)",
        borderRadius: 12,
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        animation: "slideUp 300ms ease-out",
      },
    },
      // Header
      React.createElement("div", {
        style: {
          padding: 16,
          borderBottom: "1px solid var(--ui-box-border, var(--rpg-border))",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }
      },
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, flex: 1 } },
          React.createElement("div", {
            style: {
              width: 40,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }
          }, React.createElement("img", { src: "/assets/avatar%20bot.png", alt: "Hộ giá bot", style: { width: "100%", height: "100%", objectFit: "contain" } })),
          React.createElement("div", null,
            React.createElement("h3", { style: { margin: 0, fontSize: 13, fontWeight: 700, color: "var(--ui-heading, #fff)" } }, "Hộ giá"),
            React.createElement("div", { style: { fontSize: 11, color: "var(--ui-muted, var(--rpg-muted))" } }, "Online")
          )
        ),
        React.createElement("button", {
          onClick: () => setOpen(false),
          style: { background: "none", border: "none", color: "var(--ui-heading, #fff)", cursor: "pointer", fontSize: 20, padding: 0, flex: 0 },
        }, "×")
      ),

      // Messages
      React.createElement("div", {
        ref: chatRef,
        style: {
          flex: 1,
          overflowY: "auto",
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }
      },
        messages.map((msg, idx) =>
          React.createElement("div", {
            key: idx,
            style: {
              display: "flex",
              justifyContent: msg.role === "bot" ? "flex-start" : "flex-end",
            }
          },
            React.createElement("div", {
              style: {
                maxWidth: "85%",
              }
            },
              React.createElement("div", {
                className: "chat-message-bubble",
                style: {
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: msg.role === "bot" ? "var(--ui-box-bg, var(--rpg-border))" : "var(--glh-accent)",
                  color: msg.role === "bot" ? "var(--ui-text, #fff)" : "#fff",
                  fontSize: 13,
                  lineHeight: 1.5,
                  wordBreak: "break-word",
                  marginBottom: msg.hasQuickReplies ? 8 : 0,
                }
              },
                React.createElement(FormattedMessage, { text: msg.text, role: msg.role }),
                msg.citations && msg.citations.length > 0 ? React.createElement("div", {
                  style: { marginTop: 8, paddingTop: 8, borderTop: "1px dashed rgba(255,255,255,0.2)", fontSize: 11 }
                },
                  React.createElement("div", { style: { fontWeight: 700, color: "var(--glh-accent)", marginBottom: 4 } }, "📚 Tài liệu tham khảo:"),
                  msg.citations.map((c, cIdx) =>
                    React.createElement("div", { key: cIdx, style: { marginBottom: 3 } },
                      c.url ? React.createElement("a", { href: c.url, target: "_blank", rel: "noreferrer", style: { color: "#6aa3e0", textDecoration: "underline" } }, `[${cIdx + 1}] ${c.title || c.url}`)
                            : React.createElement("span", { style: { color: "var(--rpg-muted)" } }, `[${cIdx + 1}] ${c.title || "Tài liệu nội bộ"}`)
                    )
                  )
                ) : null
              ),
              msg.hasQuickReplies ? React.createElement("div", {
                style: { display: "flex", flexDirection: "column", gap: 6 }
              },
                React.createElement("button", {
                  onClick: () => handleSend("📚 Gợi ý khóa học"),
                  style: { padding: "8px 12px", background: "var(--ui-surface, var(--rpg-panel))", border: "1px solid var(--ui-box-border, var(--rpg-border))", borderRadius: 16, color: "var(--ui-heading, #fff)", cursor: "pointer", fontSize: 13, textAlign: "left", transition: "border-color 0.2s" },
                  onMouseEnter: (e) => e.currentTarget.style.borderColor = "var(--glh-accent)",
                  onMouseLeave: (e) => e.currentTarget.style.borderColor = "var(--ui-box-border, var(--rpg-border))"
                }, "📚 Gợi ý khóa học"),
                React.createElement("button", {
                  onClick: () => { setOpen(false); props.onOpenLdRequest && props.onOpenLdRequest(); },
                  style: { padding: "8px 12px", background: "var(--ui-surface, var(--rpg-panel))", border: "1px solid var(--ui-box-border, var(--rpg-border))", borderRadius: 16, color: "var(--ui-heading, #fff)", cursor: "pointer", fontSize: 13, textAlign: "left", transition: "border-color 0.2s" },
                  onMouseEnter: (e) => e.currentTarget.style.borderColor = "var(--glh-accent)",
                  onMouseLeave: (e) => e.currentTarget.style.borderColor = "var(--ui-box-border, var(--rpg-border))"
                }, "📝 Gửi yêu cầu đào tạo"),
                React.createElement("button", {
                  onClick: () => handleSend("📜 Hỏi đáp Chính sách L&D"),
                  style: { padding: "8px 12px", background: "var(--ui-surface, var(--rpg-panel))", border: "1px solid var(--ui-box-border, var(--rpg-border))", borderRadius: 16, color: "var(--ui-heading, #fff)", cursor: "pointer", fontSize: 13, textAlign: "left", transition: "border-color 0.2s" },
                  onMouseEnter: (e) => e.currentTarget.style.borderColor = "var(--glh-accent)",
                  onMouseLeave: (e) => e.currentTarget.style.borderColor = "var(--ui-box-border, var(--rpg-border))"
                }, "📜 Hỏi đáp Chính sách L&D")
              ) : null
            )
          )
        ),
        loading ? React.createElement("div", { style: { display: "flex", justifyContent: "flex-start" } },
          React.createElement("div", { style: { padding: "10px 14px", borderRadius: 8, background: "var(--ui-box-bg, var(--rpg-border))", color: "var(--rpg-muted)", fontSize: 13, fontStyle: "italic" } },
            "⏳ Hộ giá đang suy nghĩ..."
          )
        ) : null
      ),

      // Input
      React.createElement("div", {
        style: {
          padding: 12,
          borderTop: "1px solid var(--ui-box-border, var(--rpg-border))",
          display: "flex",
          gap: 8,
        }
      },
        React.createElement("input", {
          type: "text",
          className: "u-input",
          placeholder: "Nhập câu hỏi...",
          value: input,
          onChange: (e) => setInput(e.target.value),
          onKeyPress: (e) => e.key === "Enter" && handleSend(),
          style: { flex: 1, marginBottom: 0 },
        }),
        React.createElement("button", {
          onClick: handleSend,
          disabled: loading,
          style: {
            background: "none",
            border: "none",
            color: loading ? "var(--rpg-muted)" : "var(--glh-accent)",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: 16,
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }
        },
          React.createElement(Icon, { name: "send", size: 18, color: loading ? "var(--rpg-muted)" : "var(--glh-accent)" })
        )
      )
    ) : null
  );
}


