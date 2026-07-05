"use client";

import React from "react";
import { GLHUI } from '../GLHUI';
import { GLHEngine } from '@/context/GameContext';
import { GLH_DATA } from '@/data/glhData';
import { IconTerrible, IconBad, IconNeutral, IconGood, IconExcellent } from '../icons/emotions/EmotionIcons';

const D = GLH_DATA;
const { Icon } = GLHUI;
const { useGame } = GLHEngine;



  /* ---------- Rating Modal ---------- */
  export function RatingModal(props) {
    const { user } = useGame();
    const [anonymous, setAnonymous] = React.useState(false);
    const [overallRating, setOverallRating] = React.useState(0);
    const [aspectRatings, setAspectRatings] = React.useState({});
    const [aspectFeedback, setAspectFeedback] = React.useState({});
    const [additionalFeedback, setAdditionalFeedback] = React.useState("");
    const [submitting, setSubmitting] = React.useState(false);
    const [submitError, setSubmitError] = React.useState("");
    const [submitted, setSubmitted] = React.useState(false);

    const faces = [
      { value: 1, face: <IconTerrible size="1em" />, label: "Quá tệ", bg: "#ff5a5f" },
      { value: 2, face: <IconBad size="1em" />, label: "Không hài lòng", bg: "#ff8a4c" },
      { value: 3, face: <IconNeutral size="1em" />, label: "Bình thường", bg: "#f6c84c" },
      { value: 4, face: <IconGood size="1em" />, label: "Hài lòng", bg: "#94d66b" },
      { value: 5, face: <IconExcellent size="1em" />, label: "Tuyệt vời", bg: "#45b866" },
    ];
    const aspects = [
      { key: "visual", label: "Hình thức" },
      { key: "content", label: "Nội dung" },
      { key: "usability", label: "Tiện lợi, dễ sử dụng" },
      { key: "usefulness", label: "Hữu ích cho tôi" },
    ];

    const setAspectRating = (key, value) => {
      setAspectRatings((prev) => ({ ...prev, [key]: value }));
      if (value > 3) setAspectFeedback((prev) => ({ ...prev, [key]: "" }));
    };

    const handleSubmit = async () => {
      if (overallRating === 0) { alert("Vui lòng chọn điểm trải nghiệm tổng thể"); return; }
      const missing = aspects.find((aspect) => !aspectRatings[aspect.key]);
      if (missing) { alert("Vui lòng đánh giá: " + missing.label); return; }

      setSubmitting(true);
      setSubmitError("");
      try {
        const res = await fetch("/api/site-feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            is_anonymous: anonymous,
            overall_rating: overallRating,
            aspect_ratings: aspectRatings,
            aspect_feedback: aspectFeedback,
            additional_feedback: additionalFeedback,
          }),
        });
        if (!res.ok) throw new Error("SUBMIT_FAILED");
        setSubmitted(true);
        setTimeout(() => props.onClose(), 1800);
      } catch (error) {
        setSubmitError("Chưa gửi được đánh giá. Vui lòng thử lại sau.");
      } finally {
        setSubmitting(false);
      }
    };

    if (submitted) {
      return React.createElement("div", { className: "modal-bg" },
        React.createElement("div", { className: "modal", style: { textAlign: "center", padding: 48 } },
          React.createElement("div", { style: { fontSize: 42, marginBottom: 16, color: "var(--garena-positive)" } }, "✓"),
          React.createElement("h2", { style: { margin: "0 0 8px", fontSize: 20, fontWeight: 700, color: "var(--ui-heading)" } }, "Cảm ơn bạn!"),
          React.createElement("p", { style: { color: "var(--ui-muted)", fontSize: 13, margin: 0 } }, "Đánh giá của bạn đã được gửi đến admin Learning Hub.")
        )
      );
    }

    return React.createElement("div", { className: "modal-bg", onClick: props.onClose },
      React.createElement("div", { className: "modal", onClick: (e) => e.stopPropagation(), style: { maxWidth: 560, padding: 0 } },
        React.createElement("div", { style: { padding: "24px 24px 0", borderBottom: "1px solid var(--ui-box-border)", paddingBottom: 20 } },
          React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
            React.createElement("div", null,
              React.createElement("h2", { style: { margin: "0 0 4px", fontSize: 18, fontWeight: 700, color: "var(--ui-heading)" } }, "Đánh giá Garena Learning Hub"),
              React.createElement("p", { style: { margin: 0, fontSize: 12, color: "var(--ui-muted)" } }, "Ý kiến của bạn rất có giá trị với chúng tôi")
            ),
            React.createElement("button", { onClick: props.onClose, style: { background: "none", border: "none", color: "var(--ui-muted)", cursor: "pointer", fontSize: 20, padding: 0 } }, "×")
          )
        ),

        React.createElement("div", { style: { padding: "24px 32px 28px" } },
          React.createElement("label", { style: { display: "flex", alignItems: "center", gap: 10, margin: "0 0 20px", color: "var(--ui-text)", fontSize: 13, fontWeight: 600 } },
            React.createElement("input", { type: "checkbox", checked: anonymous, onChange: (e) => setAnonymous(e.target.checked) }),
            "Gửi ẩn danh"
          ),

          !anonymous ? React.createElement("div", { style: { marginBottom: 28, padding: "14px 18px", borderRadius: 8, background: "var(--ui-box-2)", border: "1px solid var(--ui-box-border)", color: "var(--ui-muted)", fontSize: 12, lineHeight: 1.6 } },
            "Admin sẽ nhận: ",
            React.createElement("b", { style: { color: "var(--ui-heading)" } }, user.full_name || user.email || "Người dùng"),
            user.db_team ? " · " + user.db_team : "",
            user.db_role ? " · " + user.db_role : ""
          ) : null,

          React.createElement("div", { style: { textAlign: "center", marginBottom: 34 } },
            React.createElement("div", { style: { fontSize: 13, fontWeight: 800, color: "var(--ui-muted)", marginBottom: 16, textTransform: "uppercase", letterSpacing: ".05em" } }, "1. Trải nghiệm tổng thể"),
            React.createElement(FaceScale, { value: overallRating, onChange: setOverallRating, faces })
          ),

          React.createElement("div", { style: { marginBottom: 28, textAlign: "center" } },
            React.createElement("div", { style: { fontSize: 13, fontWeight: 800, color: "var(--ui-muted)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 18, textAlign: "center" } }, "2. Từng khía cạnh"),
            aspects.map((aspect) =>
              React.createElement("div", { key: aspect.key, style: { marginBottom: 22, textAlign: "center" } },
                React.createElement("div", { style: { fontSize: 14, fontWeight: 800, color: "var(--ui-heading)", marginBottom: 10, textAlign: "center" } }, aspect.label),
                React.createElement(FaceScale, { value: aspectRatings[aspect.key] || 0, onChange: (value) => setAspectRating(aspect.key, value), faces, compact: true }),
                aspectRatings[aspect.key] > 0 && aspectRatings[aspect.key] <= 3
                  ? React.createElement("textarea", {
                      className: "u-input",
                      placeholder: "Bạn muốn phần này cải thiện gì?",
                      value: aspectFeedback[aspect.key] || "",
                      onChange: (e) => setAspectFeedback((prev) => ({ ...prev, [aspect.key]: e.target.value })),
                      style: { minHeight: 62, resize: "vertical", margin: "10px auto 0", paddingLeft: 12, textAlign: "left", maxWidth: 500 },
                    })
                  : null
              )
            )
          ),

          React.createElement("div", { style: { marginBottom: 24 } },
            React.createElement("div", { style: { fontSize: 13, fontWeight: 800, color: "var(--ui-muted)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 10 } }, "3. Góp ý thêm (tùy chọn)"),
            React.createElement("textarea", {
              className: "u-input",
              placeholder: "Bạn muốn site cải thiện hoặc bổ sung thêm gì không?",
              value: additionalFeedback,
              onChange: (e) => setAdditionalFeedback(e.target.value),
              style: { minHeight: 80, resize: "vertical", paddingLeft: 12 },
            })
          ),

          submitError ? React.createElement("div", { style: { marginBottom: 14, color: "var(--glh-accent)", fontSize: 13, fontWeight: 700 } }, submitError) : null,

          React.createElement("div", { style: { display: "flex", gap: 14, justifyContent: "center", paddingTop: 4 } },
            React.createElement("button", { className: "glh-btn glh-btn--ghost", onClick: props.onClose }, "Để sau"),
            React.createElement("button", { className: "glh-btn glh-btn--primary", onClick: handleSubmit, disabled: submitting, style: { minWidth: 120 } },
              submitting ? "Đang gửi..." : "Gửi đánh giá"
            )
          )
        )
      )
    );
  }

  function FaceScale({ value, onChange, faces, compact = false }) {
    return React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: compact ? 8 : 12, width: "100%", maxWidth: compact ? 460 : 550, margin: "0 auto", justifyItems: "stretch" } },
      faces.map((item) =>
        React.createElement("button", {
          key: item.value,
          type: "button",
          onClick: () => onChange(item.value),
          title: item.label,
          style: {
            minWidth: 0,
            border: value === item.value ? "2px solid var(--ui-heading)" : "1px solid var(--ui-box-border)",
            background: value === item.value ? "var(--ui-control-hover)" : "transparent",
            color: "var(--ui-text)",
            borderRadius: 8,
            padding: compact ? "10px 6px" : "12px 8px",
            minHeight: compact ? 78 : 108,
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
          },
        },
          React.createElement("span", { style: { width: compact ? 30 : 38, height: compact ? 30 : 38, borderRadius: "50%", background: item.bg, display: "grid", placeItems: "center", color: "rgba(0,0,0,0.55)", fontSize: compact ? 18 : 22, fontWeight: 800 } }, item.face),
          React.createElement("span", { style: { fontSize: compact ? 9 : 10, color: "var(--ui-muted)", lineHeight: 1.2, textAlign: "center" } }, compact ? item.value : item.label)
        )
      )
    );
  }
  /* ---------- Tutorial Overlay (Guided Tour) ---------- */
  const STEPS = [
    {
      title: "Trang chủ",
      desc: "Nơi hiển thị lịch đào tạo và các nội dung đào tạo được gợi ý cho cá nhân bạn theo hồ sơ và sở thích.",
      selector: "[data-tour='nav-home']",
      placement: "bottom",
    },
    {
      title: "Thư viện đào tạo",
      desc: "Khám phá kho khóa học của Garena với nhiều hình thức, chủ đề khác nhau cho bạn lựa chọn.",
      selector: "[data-tour='nav-library']",
      placement: "bottom",
    },
    {
      title: "Trang cá nhân",
      desc: "Click vào tên bạn để xem thông tin, khóa đã học và thay đổi cài đặt.",
      selector: "[data-tour='profile']",
      placement: "bottom",
    },
    {
      title: "Bot Hộ giá và Form gửi nhu cầu đào tạo",
      desc: "Dùng bot hỗ trợ để hỏi nhanh về khóa học, rank hoặc chính sách L&D. Nếu chưa thấy khóa phù hợp, bạn có thể gửi nhu cầu đào tạo để L&D team xem xét và phản hồi.",
      selector: "[data-tour='learning-support']",
      placement: "top",
    },
    {
      title: "Bạn đã sẵn sàng!",
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
      if (!cur.selector) {
        const frame = requestAnimationFrame(() => setSpotlight(null));
        return () => cancelAnimationFrame(frame);
      }
      const el = document.querySelector(cur.selector);
      if (!el) {
        const frame = requestAnimationFrame(() => setSpotlight(null));
        return () => cancelAnimationFrame(frame);
      }
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
      const timer = setTimeout(update, 350); // wait for scroll
      return () => clearTimeout(timer);
    }, [step, cur.selector]);

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

  
