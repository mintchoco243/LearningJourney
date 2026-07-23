"use client";

import React from "react";
import { GLHUI } from '@/components/GLHUI';

const { Icon } = GLHUI;

function FaqItem({ item }) {
  const [isOpen, setIsOpen] = React.useState(false);
  return React.createElement("div", {
    style: {
      background: "var(--ui-box)",
      border: "1px solid var(--ui-box-border)",
      borderRadius: 10,
      overflow: "hidden",
    }
  },
    React.createElement("button", {
      onClick: () => setIsOpen(o => !o),
      style: { width: "100%", background: "none", border: "none", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, textAlign: "left", cursor: "pointer" }
    },
      React.createElement("span", { style: { fontSize: 14, fontWeight: 600, color: isOpen ? "var(--glh-accent)" : "var(--ui-heading)" } }, item.question),
      React.createElement("span", { style: { flexShrink: 0, fontWeight: 700, fontSize: 18, color: isOpen ? "var(--glh-accent)" : "var(--ui-muted)" } }, isOpen ? "−" : "+")
    ),
    isOpen && React.createElement("div", { style: { padding: "0 20px 14px", fontSize: 14, lineHeight: 1.7, color: "var(--ui-muted)", borderTop: "1px solid var(--ui-box-border)" } }, item.answer)
  );
}

export function FAQScreen(props) {
  const [faqs, setFaqs] = React.useState([]);
  const [policies, setPolicies] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");

  React.useEffect(() => {
    Promise.all([
      fetch("/api/faqs").then(r => r.ok ? r.json() : {}).catch(() => ({})),
      fetch("/api/policies", { credentials: "include" }).then(r => r.ok ? r.json() : {}).catch(() => ({})),
    ]).then(([faqData, policyData]) => {
      if (Array.isArray(faqData.faqs)) setFaqs(faqData.faqs);
      const grouped = policyData.policies || {};
      const rows = Object.entries(grouped).flatMap(([topic, items]) => (items || []).map((item) => ({
        id: `policy-${item.id}`,
        topic: `ChÃ­nh sÃ¡ch Â· ${topic}`,
        question: item.title,
        answer: String(item.content || item.preview || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
        keywords: topic,
      })));
      setPolicies(rows);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const displayItems = React.useMemo(() => [...faqs, ...policies], [faqs, policies]);

  const topics = React.useMemo(() => {
    const seen = new Set();
    const list = [];
    displayItems.forEach(item => {
      if (item.topic && !seen.has(item.topic)) {
        seen.add(item.topic);
        list.push(item.topic);
      }
    });
    return list;
  }, [displayItems]);

  const qLower = searchQuery.toLowerCase().trim();

  const filteredFaqs = React.useMemo(() => {
    if (!qLower) return displayItems;
    return displayItems.filter(item => {
      return (
        (item.topic && item.topic.toLowerCase().includes(qLower)) ||
        (item.question && item.question.toLowerCase().includes(qLower)) ||
        (item.answer && item.answer.toLowerCase().includes(qLower)) ||
        (item.keywords && item.keywords.toLowerCase().includes(qLower))
      );
    });
  }, [displayItems, qLower]);

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
              ? React.createElement("div", { style: { padding: "40px 0", color: "var(--ui-muted)", fontSize: 14 } }, "Không tìm thấy nội dung phù hợp. Bạn có thể liên hệ bộ phận Đào tạo qua Seatalk.")
              : React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } },
                  filteredFaqs.map(item => React.createElement(FaqItem, { key: item.id || item._id, item }))
                )
          )
        : topics.length === 0
          ? React.createElement("div", { style: { padding: "40px 0", color: "var(--ui-muted)", fontSize: 14 } }, "Không tìm thấy nội dung phù hợp. Bạn có thể liên hệ bộ phận Đào tạo qua Seatalk.")
          : React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 20 } },
              topics.map(t => {
                const items = faqs.filter(f => f.topic === t);
                return React.createElement("div", { key: t },
                  React.createElement("div", {
                    style: {
                      display: "inline-block",
                      fontSize: 11, fontWeight: 700,
                      letterSpacing: ".06em", textTransform: "uppercase",
                      color: "var(--glh-accent)",
                      background: "rgba(228,30,38,0.1)",
                      border: "1px solid rgba(228,30,38,0.3)",
                      borderRadius: 999,
                      padding: "3px 12px",
                      marginBottom: 10,
                    }
                  }, t + " · " + items.length),
                  React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } },
                    items.map(item => React.createElement(FaqItem, { key: item.id || item._id, item }))
                  )
                );
              })
            ),

    // Footer
    React.createElement("div", {
      style: { marginTop: 40, padding: "20px 24px", background: "var(--rpg-panel)", border: "1px solid var(--rpg-border)", borderRadius: 12 }
    },
      React.createElement("p", { style: { margin: 0, fontSize: 13, color: "var(--ui-muted)", lineHeight: 1.7 } },
        "Bộ phận Đào tạo luôn sẵn sàng hỗ trợ và giải đáp mọi thắc mắc về quyền lợi đào tạo của bạn cũng như giúp bạn tìm kiếm những khóa học phù hợp với nhu cầu. Hãy liên hệ với chúng tôi nhé!"
      )
    )
  );
}
