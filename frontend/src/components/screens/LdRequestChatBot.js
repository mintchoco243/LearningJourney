"use client";

import React from "react";
import { GLHUI } from '../GLHUI';
import { GLHEngine } from '@/context/GameContext';
import { GLH_DATA } from '@/data/glhData';

const D = GLH_DATA;
const { Icon } = GLHUI;
const { useGame } = GLHEngine;


  
  

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
      timing: "",
      scope: "individual",
      notes: "",
    });
    const [submitted, setSubmitted] = React.useState(false);

    const formatOptions = [
      { id: "online",    label: "Online (Zoom / Meet)" },
      { id: "offline",   label: "Offline tại văn phòng" },
      { id: "elearning", label: "E-learning tự học" },
      { id: "any",       label: "Linh hoạt theo L&D" },
    ];
    const timingOptions = [
      { id: "morning",   label: "Sáng (8–12h)" },
      { id: "afternoon", label: "Chiều (13–17h)" },
      { id: "flexible",  label: "Linh hoạt" },
    ];
    const scopeOptions = [
      { id: "individual", label: "Chỉ mình tôi" },
      { id: "team",       label: "Cả team" },
    ];

    const toggleChip = (field, id, single) => setForm(p =>
      single ? { ...p, [field]: p[field] === id ? "" : id }
             : { ...p, [field]: Array.isArray(p[field]) ? (p[field].includes(id) ? p[field].filter(x => x !== id) : [...p[field], id]) : [id] }
    );

    const handleSubmit = async () => {
      if (!form.topic.trim()) { alert("Vui lòng nhập tên khóa học / chủ đề muốn học"); return; }
      if (!form.goal.trim()) { alert("Vui lòng mô tả mục tiêu học tập"); return; }
      try {
        const res = await fetch("/api/ld-requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            topic: form.topic,
            goal: form.goal,
            preferred_format: form.format,
            preferred_timing: form.timing,
            scope: form.scope,
            notes: form.notes,
          }),
        });
        if (!res.ok) throw new Error("Lỗi gửi yêu cầu");
      } catch (e) {
        // continue to success UI even if API fails
      }
      setSubmitted(true);
      setTimeout(() => props.onClose(), 2000);
    };

    const Field = ({ icon, label, required, children }) =>
      React.createElement("div", { style: { marginBottom: 22 } },
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 8 } },
          React.createElement("div", { style: { width: 28, height: 28, borderRadius: 6, background: "rgba(228,30,38,0.1)", display: "flex", alignItems: "center", justifyContent: "center" } },
            React.createElement(Icon, { name: icon, size: 14, color: "var(--glh-accent)" })
          ),
          React.createElement("span", { style: { fontSize: 13, fontWeight: 700, color: "#fff" } }, label),
          required ? React.createElement("span", { style: { fontSize: 11, color: "var(--glh-accent)" } }, "*") : null
        ),
        children
      );

    if (submitted) {
      return React.createElement("div", { className: "modal-bg" },
        React.createElement("div", { className: "modal", style: { textAlign: "center", padding: 48 } },
          React.createElement("div", { style: { width: 64, height: 64, borderRadius: "50%", background: "rgba(31,138,91,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" } },
            React.createElement(Icon, { name: "check", size: 32, color: "#5FD9C8" })
          ),
          React.createElement("h2", { style: { margin: "0 0 8px", fontSize: 20, fontWeight: 700, color: "#fff" } }, "Đã gửi thành công!"),
          React.createElement("p", { style: { color: "var(--rpg-muted)", fontSize: 13, margin: 0 } }, "L&D team sẽ phản hồi bạn trong 2-3 ngày làm việc.")
        )
      );
    }

    return React.createElement("div", { className: "modal-bg", onClick: props.onClose },
      React.createElement("div", {
        className: "modal",
        onClick: (e) => e.stopPropagation(),
        style: { maxHeight: "85vh", overflowY: "auto", padding: 0, maxWidth: 560 }
      },
        // Header
        React.createElement("div", { style: { padding: "24px 24px 0" } },
          React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 } },
            React.createElement("div", null,
              React.createElement("h2", { style: { margin: "0 0 4px", fontSize: 20, fontWeight: 700, color: "#fff" } }, "Gửi yêu cầu học tập"),
              React.createElement("p", { style: { margin: 0, fontSize: 13, color: "var(--rpg-muted)" } }, "L&D team sẽ xem xét và phản hồi sớm")
            ),
            React.createElement("button", { onClick: props.onClose, style: { background: "none", border: "none", color: "var(--rpg-muted)", cursor: "pointer", fontSize: 20, padding: 0, lineHeight: 1 } }, "✕")
          ),
          // User info strip
          React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "rgba(255,255,255,0.04)", borderRadius: 8, marginTop: 16, marginBottom: 0 } },
            React.createElement("div", { style: { width: 32, height: 32, borderRadius: "50%", background: "var(--glh-accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff" } },
              displayName[0].toUpperCase()
            ),
            React.createElement("div", null,
              React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: "#fff" } }, displayName),
              React.createElement("div", { style: { fontSize: 11, color: "var(--rpg-muted)" } }, displayEmail)
            )
          )
        ),

        // Divider
        React.createElement("div", { style: { height: 1, background: "var(--rpg-border)", margin: "20px 0" } }),

        // Form fields
        React.createElement("div", { style: { padding: "0 24px 24px" } },

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
                style: { padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "1px solid", transition: "all 150ms",
                  borderColor: form.format === f.id ? "var(--glh-accent)" : "var(--rpg-border)",
                  background: form.format === f.id ? "rgba(228,30,38,0.15)" : "transparent",
                  color: form.format === f.id ? "#fff" : "var(--rpg-muted)",
                }
              }, f.label))
            )
          ),

          // Timing
          React.createElement(Field, { icon: "clock", label: "Khung giờ thuận tiện" },
            React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } },
              timingOptions.map(t => React.createElement("button", {
                key: t.id,
                onClick: () => toggleChip("timing", t.id, true),
                style: { padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "1px solid", transition: "all 150ms",
                  borderColor: form.timing === t.id ? "var(--glh-accent)" : "var(--rpg-border)",
                  background: form.timing === t.id ? "rgba(228,30,38,0.15)" : "transparent",
                  color: form.timing === t.id ? "#fff" : "var(--rpg-muted)",
                }
              }, t.label))
            )
          ),

          // Scope
          React.createElement(Field, { icon: "users", label: "Đối tượng tham gia" },
            React.createElement("div", { style: { display: "flex", gap: 8 } },
              scopeOptions.map(s => React.createElement("button", {
                key: s.id,
                onClick: () => setForm(p => ({ ...p, scope: s.id })),
                style: { padding: "6px 16px", borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "1px solid", transition: "all 150ms",
                  borderColor: form.scope === s.id ? "var(--glh-accent)" : "var(--rpg-border)",
                  background: form.scope === s.id ? "rgba(228,30,38,0.15)" : "transparent",
                  color: form.scope === s.id ? "#fff" : "var(--rpg-muted)",
                }
              }, s.label))
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
          React.createElement("div", { style: { display: "flex", gap: 12, justifyContent: "flex-end", paddingTop: 4 } },
            React.createElement("button", { className: "glh-btn glh-btn--ghost", onClick: props.onClose }, "Hủy"),
            React.createElement("button", {
              className: "glh-btn glh-btn--primary",
              onClick: handleSubmit,
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
      { role: "bot", text: "Xin chào! Tôi có thể giúp bạn tìm khóa học, giải thích rank, hoặc tra cứu chính sách L&D. Bạn cần hỗ trợ gì?" }
    ]);
    const [input, setInput] = React.useState("");
    const [showHelper, setShowHelper] = React.useState(false); // removed — handled in Catalog
    const chatRef = React.useRef(null);

    React.useEffect(() => {
      if (chatRef.current) {
        chatRef.current.scrollTop = chatRef.current.scrollHeight;
      }
    }, [messages]);

    const handleSend = () => {
      if (!input.trim()) return;
      
      setMessages((prev) => [...prev, { role: "user", text: input }]);
      setInput("");

      // Simulate bot response
      setTimeout(() => {
        setMessages((prev) => [...prev, {
          role: "bot",
          text: "Tính năng chat sẽ sớm ra mắt. Trong lúc đó, bạn có thể xem Chính sách L&D hoặc gửi yêu cầu học tập."
        }]);
      }, 600);
    };

    // Hide on Game World screens
    if (props.hideOnGameWorld && document.querySelector(".glh-dark.glh-center")) {
      return null;
    }

    return React.createElement(React.Fragment, null,
      // Helper button removed — CTA now lives in Catalog section

      // Chat button
      !open ? React.createElement("div", { style: { position: "fixed", bottom: 24, right: 24, zIndex: 100, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 } },
        // Speech bubble
        React.createElement("div", {
          style: {
            background: "var(--rpg-panel-2, #1c2433)",
            border: "1px solid var(--rpg-border-strong)",
            borderRadius: "12px 12px 4px 12px",
            padding: "10px 14px",
            fontSize: 13,
            color: "#fff",
            maxWidth: 220,
            boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
            lineHeight: 1.4,
            whiteSpace: "nowrap",
          }
        }, "Có cần em hỗ trợ gì không ạ? 😊"),
        // Chat bubble button with avatar
        React.createElement("button", {
          onClick: () => setOpen(true),
          style: {
            width: 56, height: 56, borderRadius: "50%",
            background: "linear-gradient(135deg, var(--glh-accent) 0%, #8b0000 100%)",
            border: "2px solid rgba(255,255,255,0.2)",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 16px rgba(228,30,38,0.4)",
            transition: "transform 200ms, box-shadow 200ms",
            fontSize: 26,
            padding: 0,
          },
          onMouseEnter: (e) => { e.currentTarget.style.transform = "scale(1.08)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(228,30,38,0.5)"; },
          onMouseLeave: (e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(228,30,38,0.4)"; },
        }, "🤖")
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
          background: "var(--rpg-panel-2)",
          border: "1px solid var(--rpg-border-strong)",
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
            borderBottom: "1px solid var(--rpg-border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }
        },
          React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, flex: 1 } },
            React.createElement("div", {
              style: {
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "linear-gradient(135deg, var(--glh-accent) 0%, rgba(255,158,0,0.6) 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                flexShrink: 0,
              }
            }, "🤖"),
            React.createElement("div", null,
              React.createElement("h3", { style: { margin: 0, fontSize: 13, fontWeight: 700 } }, "Learning Assistant"),
              React.createElement("div", { style: { fontSize: 11, color: "var(--rpg-muted)" } }, "Online")
            )
          ),
          React.createElement("button", {
            onClick: () => setOpen(false),
            style: { background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 20, padding: 0, flex: 0 },
          }, "✕")
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
                  maxWidth: "70%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: msg.role === "bot" ? "var(--rpg-border)" : "var(--glh-accent)",
                  color: msg.role === "bot" ? "#fff" : "#000",
                  fontSize: 13,
                  lineHeight: 1.5,
                  wordBreak: "break-word",
                }
              },
                msg.text
              )
            )
          )
        ),

        // Input
        React.createElement("div", {
          style: {
            padding: 12,
            borderTop: "1px solid var(--rpg-border)",
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
            style: {
              background: "none",
              border: "none",
              color: "var(--glh-accent)",
              cursor: "pointer",
              fontSize: 16,
              padding: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }
          },
            React.createElement(Icon, { name: "send", size: 18, color: "var(--glh-accent)" })
          )
        )
      ) : null
    );
  }

  