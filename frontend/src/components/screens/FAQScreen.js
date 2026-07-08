"use client";

import React from "react";
import { GLHUI } from '@/components/GLHUI';

const { Icon } = GLHUI;

export function FAQScreen(props) {
  const [faqs, setFaqs] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [openTopics, setOpenTopics] = React.useState(new Set());
  const [expandedId, setExpandedId] = React.useState(null);

  React.useEffect(() => {
    fetch("/api/faqs")
      .then(r => r.ok ? r.json() : {})
      .then(data => {
        if (data.faqs && Array.isArray(data.faqs)) {
          setFaqs(data.faqs);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const topics = React.useMemo(() => {
    const seen = new Set();
    const list = [];
    faqs.forEach(item => {
      if (item.topic && !seen.has(item.topic)) {
        seen.add(item.topic);
        list.push(item.topic);
      }
    });
    return list;
  }, [faqs]);

  const qLower = searchQuery.toLowerCase().trim();

  const filteredFaqs = React.useMemo(() => {
    if (!qLower) return faqs;
    return faqs.filter(item => {
      const matchSearch = !qLower ||
        (item.topic && item.topic.toLowerCase().includes(qLower)) ||
        (item.question && item.question.toLowerCase().includes(qLower)) ||
        (item.answer && item.answer.toLowerCase().includes(qLower)) ||
        (item.keywords && item.keywords.toLowerCase().includes(qLower));
      return matchSearch;
    });
  }, [faqs, qLower]);

  const toggleTopic = t => {
    setOpenTopics(prev => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t); else next.add(t);
      return next;
    });
  };

  const faqItem = item => {
    const isOpen = expandedId === item.id;
    return React.createElement("div", {
      key: item.id || item._id,
      style: { borderBottom: "1px solid var(--ui-box-border)" }
    },
      React.createElement("button", {
        onClick: () => setExpandedId(isOpen ? null : item.id),
        style: { width: "100%", background: "none", border: "none", padding: "14px 0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, textAlign: "left", cursor: "pointer" }
      },
        React.createElement("span", { style: { fontSize: 14, fontWeight: 600, color: isOpen ? "var(--glh-accent)" : "var(--ui-heading)" } }, item.question),
        React.createElement("span", { style: { flexShrink: 0, fontWeight: 700, fontSize: 18, color: isOpen ? "var(--glh-accent)" : "var(--ui-muted)" } }, isOpen ? "−" : "+")
      ),
      isOpen && React.createElement("div", { style: { paddingBottom: 14, fontSize: 14, lineHeight: 1.7, color: "var(--ui-muted)" } }, item.answer)
    );
  };

  return React.createElement("div", { className: "glh-container fade-screen", style: { padding: "28px clamp(16px,4vw,40px) 80px" } },
    React.createElement("h2", { style: { fontSize: 20, fontWeight: 700, color: "var(--ui-heading)", marginBottom: 20, marginTop: 0 } }, "Câu hỏi thường gặp (FAQ)"),

    // Search bar
    React.createElement("div", { style: { position: "relative", marginBottom: 20 } },
      React.createElement("div", { style: { position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" } },
        React.createElement(Icon, { name: "search", size: 15, color: "var(--garena-grey)" })),
      React.createElement("input", {
        type: "text",
        placeholder: "Tìm kiếm chính sách, quy trình, câu hỏi",
        value: searchQuery,
        onChange: e => setSearchQuery(e.target.value),
        className: "u-input",
        style: { paddingLeft: 40, width: "100%", boxSizing: "border-box" }
      }),
      searchQuery && React.createElement("button", {
        onClick: () => setSearchQuery(""),
        style: { position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "var(--ui-muted)", cursor: "pointer", fontSize: 18 }
      }, "×")
    ),

    // Content
    loading
      ? React.createElement("div", { style: { padding: 60, color: "var(--ui-muted)" } }, "Đang tải câu hỏi...")
      : qLower
        ? React.createElement("div", null,
            React.createElement("div", { style: { fontSize: 13, color: "var(--ui-muted)", marginBottom: 12 } }, "Tìm thấy " + filteredFaqs.length + " kết quả"),
            filteredFaqs.length === 0
              ? React.createElement("div", { style: { padding: "40px 0", color: "var(--ui-muted)", fontSize: 14 } }, "Không tìm thấy nội dung phù hợp. Bạn có thể gửi câu hỏi cho L&D qua Seatalk.")
              : React.createElement("div", { style: { background: "var(--ui-box)", border: "1px solid var(--ui-box-border)", borderRadius: 10, padding: "0 20px" } },
                  filteredFaqs.map(faqItem)
                )
          )
        : topics.length === 0
          ? React.createElement("div", { style: { padding: "40px 0", color: "var(--ui-muted)", fontSize: 14 } }, "Không tìm thấy nội dung phù hợp. Bạn có thể gửi câu hỏi cho L&D qua Seatalk.")
          : React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } },
              topics.map(t => {
                const isOpen = openTopics.has(t);
                const items = faqs.filter(f => f.topic === t);
                return React.createElement("div", {
                  key: t,
                  style: { background: "var(--ui-box)", border: "1px solid var(--ui-box-border)", borderRadius: 10, overflow: "hidden" }
                },
                  React.createElement("button", {
                    onClick: () => toggleTopic(t),
                    style: { width: "100%", background: "none", border: "none", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", textAlign: "left" }
                  },
                    React.createElement("span", { style: { fontWeight: 700, fontSize: 15, color: "var(--ui-heading)" } }, t),
                    React.createElement("span", { style: { fontWeight: 700, fontSize: 18, color: "var(--ui-muted)" } }, isOpen ? "−" : "+")
                  ),
                  isOpen && React.createElement("div", { style: { padding: "0 20px", borderTop: "1px solid var(--ui-box-border)" } },
                    items.map(faqItem)
                  )
                );
              })
            ),

    // Footer banner
    React.createElement("div", {
      style: { marginTop: 40, padding: 24, background: "var(--rpg-panel)", border: "1px solid var(--rpg-border)", borderRadius: 12, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }
    },
      React.createElement("div", { style: { fontSize: 16, fontWeight: 700, color: "var(--ui-heading)" } }, "Bạn vẫn còn thắc mắc khác?"),
      React.createElement("div", { style: { fontSize: 13, color: "var(--ui-muted)", maxWidth: 460 } }, "Đội ngũ L&D luôn sẵn sàng hỗ trợ và giải đáp mọi thắc mắc về lộ trình cũng như quyền lợi đào tạo của bạn."),
      React.createElement("a", {
        href: "mailto:minhngoc.phamnguyen@garena.vn",
        className: "glh-btn glh-btn--primary",
        style: { textDecoration: "none" }
      }, React.createElement(Icon, { name: "send", size: 15, color: "#fff" }), " Gửi thắc mắc cho L&D")
    )
  );
}
