"use client";

import React from "react";
import { GLHUI } from '../GLHUI';
import { GLHEngine } from '@/context/GameContext';
import { GLH_DATA } from '@/data/glhData';

const D = GLH_DATA;
const { Icon } = GLHUI;
const { useGame } = GLHEngine;



  /* ---------- Rating Modal ---------- */
  export function RatingModal(props) {
    const [rating, setRating] = React.useState(0);
    const [hover, setHover] = React.useState(0);
    const [feedback, setFeedback] = React.useState("");
    const [submitted, setSubmitted] = React.useState(false);

    const aspects = ["Dễ sử dụng", "Nội dung phù hợp", "Thiết kế đẹp", "Tính năng đầy đủ"];
    const [aspectRatings, setAspectRatings] = React.useState({});

    const handleSubmit = () => {
      if (rating === 0) { alert("Vui lòng chọn số sao"); return; }
      setSubmitted(true);
      setTimeout(() => props.onClose(), 2000);
    };

    if (submitted) {
      return React.createElement("div", { className: "modal-bg" },
        React.createElement("div", { className: "modal", style: { textAlign: "center", padding: 48 } },
          React.createElement("div", { style: { fontSize: 48, marginBottom: 16 } }, "🎉"),
          React.createElement("h2", { style: { margin: "0 0 8px", fontSize: 20, fontWeight: 700 } }, "Cảm ơn bạn!"),
          React.createElement("p", { style: { color: "var(--rpg-muted)", fontSize: 13, margin: 0 } }, "Đánh giá của bạn giúp chúng tôi cải thiện Learning Hub.")
        )
      );
    }

    return React.createElement("div", { className: "modal-bg", onClick: props.onClose },
      React.createElement("div", { className: "modal", onClick: (e) => e.stopPropagation(), style: { maxWidth: 480, padding: 0 } },
        // Header
        React.createElement("div", { style: { padding: "24px 24px 0", borderBottom: "1px solid var(--rpg-border)", paddingBottom: 20 } },
          React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
            React.createElement("div", null,
              React.createElement("h2", { style: { margin: "0 0 4px", fontSize: 18, fontWeight: 700 } }, "Đánh giá Garena Learning Hub"),
              React.createElement("p", { style: { margin: 0, fontSize: 12, color: "var(--rpg-muted)" } }, "Ý kiến của bạn rất có giá trị với chúng tôi")
            ),
            React.createElement("button", { onClick: props.onClose, style: { background: "none", border: "none", color: "var(--rpg-muted)", cursor: "pointer", fontSize: 20, padding: 0 } }, "✕")
          )
        ),

        React.createElement("div", { style: { padding: 24 } },
          // Star rating
          React.createElement("div", { style: { textAlign: "center", marginBottom: 28 } },
            React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: "var(--rpg-muted)", marginBottom: 12, textTransform: "uppercase", letterSpacing: ".05em" } }, "Trải nghiệm tổng thể"),
            React.createElement("div", { style: { display: "flex", justifyContent: "center", gap: 8 } },
              [1,2,3,4,5].map((s) =>
                React.createElement("button", {
                  key: s,
                  onClick: () => setRating(s),
                  onMouseEnter: () => setHover(s),
                  onMouseLeave: () => setHover(0),
                  style: { background: "none", border: "none", cursor: "pointer", padding: 4, transition: "transform 150ms" },
                },
                  React.createElement("svg", { width: 36, height: 36, viewBox: "0 0 24 24", fill: (hover || rating) >= s ? "var(--amber)" : "none", stroke: (hover || rating) >= s ? "var(--amber)" : "var(--rpg-muted)", strokeWidth: 1.5, style: { transition: "all 150ms" } },
                    React.createElement("polygon", { points: "12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" })
                  )
                )
              )
            ),
            rating > 0 ? React.createElement("div", { style: { marginTop: 8, fontSize: 13, color: "var(--amber)", fontWeight: 600 } },
              ["", "Cần cải thiện nhiều", "Có thể tốt hơn", "Ổn", "Khá tốt", "Tuyệt vời!"][rating]
            ) : null
          ),

          // Aspect ratings
          React.createElement("div", { style: { marginBottom: 20 } },
            React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "var(--rpg-muted)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 12 } }, "Đánh giá từng khía cạnh"),
            React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 } },
              aspects.map((asp) =>
                React.createElement("div", {
                  key: asp,
                  onClick: () => setAspectRatings((p) => ({ ...p, [asp]: p[asp] === "good" ? "bad" : "good" })),
                  style: {
                    padding: "10px 14px", borderRadius: 6, border: "1px solid",
                    borderColor: aspectRatings[asp] === "good" ? "var(--glh-accent)" : "var(--rpg-border)",
                    background: aspectRatings[asp] === "good" ? "rgba(228,30,38,0.1)" : "transparent",
                    cursor: "pointer", fontSize: 12, fontWeight: 600,
                    color: aspectRatings[asp] === "good" ? "#fff" : "var(--rpg-muted)",
                    display: "flex", alignItems: "center", gap: 8, transition: "all 150ms",
                  }
                },
                  aspectRatings[asp] === "good" ? "✓ " : "",
                  asp
                )
              )
            )
          ),

          // Text feedback
          React.createElement("div", { style: { marginBottom: 24 } },
            React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "var(--rpg-muted)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 } }, "Góp ý thêm (tùy chọn)"),
            React.createElement("textarea", {
              className: "u-input",
              placeholder: "Bạn muốn thêm tính năng gì? Điều gì chưa tốt?",
              value: feedback,
              onChange: (e) => setFeedback(e.target.value),
              style: { minHeight: 80, resize: "vertical" },
            })
          ),

          // Footer
          React.createElement("div", { style: { display: "flex", gap: 12, justifyContent: "flex-end" } },
            React.createElement("button", { className: "glh-btn glh-btn--ghost", onClick: props.onClose }, "Để sau"),
            React.createElement("button", { className: "glh-btn glh-btn--primary", onClick: handleSubmit, style: { minWidth: 120 } },
              "Gửi đánh giá"
            )
          )
        )
      )
    );
  }

  /* ---------- Tutorial Overlay (Guided Tour) ---------- */
  const STEPS = [
    {
      title: "Chào mừng đến với Learning Hub! 👋",
      desc: "Hãy để chúng tôi chỉ bạn các tính năng chính trong 6 bước nhanh.",
      selector: null,
      placement: "center",
    },
    {
      title: "Trang chủ — Dashboard",
      desc: "Xem tổng quan hành trình học tập, khóa được gợi ý và XP của bạn.",
      selector: ".dash-hero",
      placement: "bottom",
    },
    {
      title: "Khám phá Khóa học",
      desc: "Dùng bộ lọc đa chiều để tìm khóa phù hợp theo vai trò, cấp độ và kỹ năng.",
      selector: ".glh-container .u-eyebrow",
      placement: "bottom",
    },
    {
      title: "Lịch đào tạo",
      desc: "Xem lịch workshop, webinar sắp tới và đặt chỗ tham gia.",
      selector: "[data-section='calendar']",
      placement: "top",
    },
    {
      title: "AppBar điều hướng",
      desc: "Dùng thanh menu này để chuyển giữa Dashboard, Khóa học, Lịch và Chính sách L&D.",
      selector: ".appbar",
      placement: "bottom",
    },
    {
      title: "Trang cá nhân",
      desc: "Click vào tên bạn để xem thông tin, khóa đã học và thay đổi cài đặt.",
      selector: ".appbar__mini",
      placement: "bottom",
    },
    {
      title: "Bạn đã sẵn sàng! 🎉",
      desc: "Chúc bạn học vui và hiệu quả. Bấm vào chat bubble góc phải nếu cần hỗ trợ!",
      selector: null,
      placement: "center",
    },
  ];

  export function Tutorial(props) {
    const [step, setStep] = React.useState(0);
    const [spotlight, setSpotlight] = React.useState(null);
    const tooltipRef = React.useRef(null);

    const cur = STEPS[step];
    const isLast = step === STEPS.length - 1;

    const isDark = document.documentElement.getAttribute("data-theme") !== "light";
    const overlayBg = isDark ? "rgba(0,0,0,0.72)" : "rgba(0,0,0,0.5)";
    const tooltipBg = isDark ? "var(--rpg-panel-2, #1c2433)" : "#ffffff";
    const tooltipColor = isDark ? "#fff" : "#111827";
    const tooltipMuted = isDark ? "rgba(255,255,255,0.65)" : "#6B7280";
    const tooltipBorder = isDark ? "rgba(228,30,38,0.4)" : "rgba(228,30,38,0.3)";
    const stepColor = isDark ? "rgba(255,255,255,0.35)" : "#9CA3AF";
    const inactiveProg = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)";
    const prevBtnBorder = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)";
    const prevBtnColor = isDark ? "#fff" : "#374151";
    const prevBtnBg = isDark ? "transparent" : "#F3F4F6";

    // Update spotlight when step changes
    React.useEffect(() => {
      if (!cur.selector) { setSpotlight(null); return; }
      const el = document.querySelector(cur.selector);
      if (!el) { setSpotlight(null); return; }
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      const update = () => {
        const rect = el.getBoundingClientRect();
        setSpotlight({
          top: rect.top - 8,
          left: rect.left - 8,
          width: rect.width + 16,
          height: rect.height + 16,
          bottom: rect.bottom + 8,
          right: rect.right + 8,
        });
      };
      setTimeout(update, 350); // wait for scroll
    }, [step]);

    const finish = () => {
      localStorage.setItem("glh_tutorial_done", "1");
      props.onClose();
    };

    // Tooltip positioning based on spotlight
    const getTooltipStyle = () => {
      if (!spotlight || cur.placement === "center") {
        return {
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          maxWidth: 380,
        };
      }
      const vpH = window.innerHeight;
      const vpW = window.innerWidth;
      const W = 340;
      let top, left;

      if (cur.placement === "bottom") {
        top = Math.min(spotlight.bottom + 16, vpH - 220);
      } else {
        top = Math.max(spotlight.top - 200, 16);
      }

      left = Math.max(16, Math.min(spotlight.left + spotlight.width / 2 - W / 2, vpW - W - 16));

      return { position: "fixed", top, left, width: W };
    };

    const arrowDir = spotlight && cur.placement === "bottom" ? "top" : "bottom";

    return React.createElement("div", {
      style: { position: "fixed", inset: 0, zIndex: 200, pointerEvents: "none" }
    },
      // Dark overlay with spotlight cutout using SVG mask
      React.createElement("svg", {
        style: { position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "auto" },
        onClick: (e) => e.stopPropagation(),
      },
        React.createElement("defs", null,
          React.createElement("mask", { id: "tut-mask" },
            React.createElement("rect", { x: 0, y: 0, width: "100%", height: "100%", fill: "white" }),
            spotlight ? React.createElement("rect", {
              x: spotlight.left,
              y: spotlight.top,
              width: spotlight.width,
              height: spotlight.height,
              rx: 8,
              fill: "black",
            }) : null,
          )
        ),
        React.createElement("rect", {
          x: 0, y: 0, width: "100%", height: "100%",
          fill: overlayBg,
          mask: "url(#tut-mask)",
        }),
        // Highlight border
        spotlight ? React.createElement("rect", {
          x: spotlight.left,
          y: spotlight.top,
          width: spotlight.width,
          height: spotlight.height,
          rx: 8,
          fill: "none",
          stroke: "#E41E26",
          strokeWidth: 2,
          strokeDasharray: "6 3",
          style: { animation: "none" },
        }) : null,
      ),

      // Tooltip card
      React.createElement("div", {
        ref: tooltipRef,
        style: Object.assign({}, getTooltipStyle(), {
          background: tooltipBg,
          border: "1px solid " + tooltipBorder + ",",
          borderRadius: 10,
          padding: 20,
          boxShadow: "0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(228,30,38,0.2)",
          pointerEvents: "auto",
          zIndex: 201,
          animation: "fadeIn 200ms ease",
        })
      },
        // Progress dots
        React.createElement("div", { style: { display: "flex", gap: 5, marginBottom: 14 } },
          STEPS.map((_, i) =>
            React.createElement("div", {
              key: i,
              style: {
                height: 3, borderRadius: 99,
                flex: i === step ? 2 : 1,
                background: i <= step ? "#E41E26" : inactiveProg,
                transition: "all 300ms",
              }
            })
          )
        ),

        React.createElement("div", { style: { fontSize: 11, color: "#E41E26", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 } },
          "Bước " + (step + 1) + " / " + STEPS.length
        ),
        React.createElement("h3", { style: { margin: "0 0 8px", fontSize: 15, fontWeight: 700, color: tooltipColor } }, cur.title),
        React.createElement("p", { style: { margin: "0 0 18px", fontSize: 13, color: tooltipMuted, lineHeight: 1.6 } }, cur.desc),

        React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
          React.createElement("button", {
            onClick: finish,
            style: { background: "none", border: "none", color: stepColor, fontSize: 12, cursor: "pointer", padding: 0 }
          }, "Bỏ qua"),
          React.createElement("div", { style: { display: "flex", gap: 8 } },
            step > 0 ? React.createElement("button", {
              onClick: () => setStep((s) => s - 1),
              style: { padding: "7px 14px", borderRadius: 6, border: "1px solid " + prevBtnBorder, background: prevBtnBg, color: prevBtnColor, cursor: "pointer", fontSize: 12, fontWeight: 600 },
            }, "← Trước") : null,
            React.createElement("button", {
              onClick: () => isLast ? finish() : setStep((s) => s + 1),
              style: { padding: "7px 16px", borderRadius: 6, border: "none", background: "#E41E26", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700 },
            }, isLast ? "Bắt đầu! 🚀" : "Tiếp →")
          )
        )
      )
    );
  }

  