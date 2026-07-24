"use client";

import React from "react";
import { GLHUI } from '../GLHUI';
import { GLHEngine } from '@/context/GameContext';
import { GLH_DATA } from '@/data/glhData';
import { FaceScale, RATING_FACES } from '../ratings/EmojiScale';
import { trackEvent } from '@/lib/analytics';

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

    const faces = RATING_FACES;
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
        trackEvent("feedback_submit", {
          overall_rating: overallRating,
          is_anonymous: anonymous,
          has_comment: Boolean(additionalFeedback.trim()),
        });
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
          React.createElement("p", { style: { color: "var(--ui-muted)", fontSize: 13, margin: 0 } }, "Đánh giá của bạn đã được gửi đến admin Learning Compass.")
        )
      );
    }

    return React.createElement("div", { className: "modal-bg", onClick: props.onClose },
      React.createElement("div", { className: "modal", onClick: (e) => e.stopPropagation(), style: { maxWidth: 560, padding: 0, maxHeight: "88vh", overflow: "hidden", display: "flex", flexDirection: "column" } },
        React.createElement("div", { style: { padding: "24px 24px 20px", borderBottom: "1px solid var(--ui-box-border)", flexShrink: 0 } },
          React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
            React.createElement("div", null,
              React.createElement("h2", { style: { margin: "0 0 4px", fontSize: 18, fontWeight: 700, color: "var(--ui-heading)" } }, "Đánh giá Garena Learning Compass"),
              React.createElement("p", { style: { margin: 0, fontSize: 12, color: "var(--ui-muted)" } }, "Ý kiến của bạn rất có giá trị với chúng tôi")
            ),
            React.createElement("button", { onClick: props.onClose, style: { background: "none", border: "none", color: "var(--ui-muted)", cursor: "pointer", fontSize: 20, padding: 0 } }, "×")
          )
        ),

        React.createElement("div", { style: { padding: "24px 32px 28px", overflowY: "auto", flex: 1 } },
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

          React.createElement("div", { style: { textAlign: "left", marginBottom: 34 } },
            React.createElement("div", { style: { fontSize: 13, fontWeight: 800, color: "var(--ui-muted)", marginBottom: 16, textTransform: "uppercase", letterSpacing: ".05em" } }, "1. Trải nghiệm tổng thể"),
            React.createElement(FaceScale, { value: overallRating, onChange: setOverallRating, faces })
          ),

          React.createElement("div", { style: { marginBottom: 28, textAlign: "left" } },
            React.createElement("div", { style: { fontSize: 13, fontWeight: 800, color: "var(--ui-muted)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 18, textAlign: "left" } }, "2. Từng khía cạnh"),
            aspects.map((aspect) =>
              React.createElement("div", { key: aspect.key, style: { marginBottom: 22, textAlign: "left" } },
                React.createElement("div", { style: { fontSize: 14, fontWeight: 800, color: "var(--ui-heading)", marginBottom: 10, textAlign: "left" } }, aspect.label),
                React.createElement(FaceScale, { value: aspectRatings[aspect.key] || 0, onChange: (value) => setAspectRating(aspect.key, value), faces }),
                aspectRatings[aspect.key] > 0 && aspectRatings[aspect.key] <= 3
                  ? React.createElement("textarea", {
                      className: "u-input",
                      placeholder: "Bạn muốn phần này cải thiện gì?",
                      value: aspectFeedback[aspect.key] || "",
                      onChange: (e) => setAspectFeedback((prev) => ({ ...prev, [aspect.key]: e.target.value })),
                      style: { minHeight: 62, resize: "vertical", margin: "10px 0 0", paddingLeft: 12, textAlign: "left", maxWidth: 500 },
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
      selectors: ["[data-tour='training-request']", "[data-tour='learning-support']"],
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
    const [spotlights, setSpotlights] = React.useState([]);
    const tooltipRef = React.useRef(null);

    const cur = STEPS[step];
    const isLast = step === STEPS.length - 1;
    const spotlight = spotlights[0] || null;

    const overlayBg = "rgba(0,0,0,0.72)";
    const tooltipBg = "var(--rpg-panel-2, #1c2433)";
    const tooltipColor = "#fff";
    const tooltipMuted = "rgba(255,255,255,0.65)";
    const tooltipBorder = "rgba(228,30,38,0.4)";
    const stepColor = "rgba(255,255,255,0.35)";
    const inactiveProg = "rgba(255,255,255,0.15)";
    const prevBtnBorder = "rgba(255,255,255,0.15)";
    const prevBtnColor = "#fff";
    const prevBtnBg = "transparent";

    // Update spotlight when step changes
    React.useEffect(() => {
      const selectors = cur.selectors || (cur.selector ? [cur.selector] : []);
      if (!selectors.length) {
        const frame = requestAnimationFrame(() => setSpotlights([]));
        return () => cancelAnimationFrame(frame);
      }
      const elements = selectors.flatMap((selector) => [...document.querySelectorAll(selector)]);
      if (!elements.length) {
        const frame = requestAnimationFrame(() => setSpotlights([]));
        return () => cancelAnimationFrame(frame);
      }

      const scrollTarget = elements.find((element) => getComputedStyle(element).position !== "fixed");
      if (scrollTarget) scrollTarget.scrollIntoView({ behavior: "auto", block: "center" });

      const update = () => {
        const next = elements
          .map((element) => element.getBoundingClientRect())
          .filter((rect) => rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight)
          .map((rect) => ({
            top: rect.top - 8,
            left: rect.left - 8,
            width: rect.width + 16,
            height: rect.height + 16,
            bottom: rect.bottom + 8,
            right: rect.right + 8,
          }));
        setSpotlights(next);
      };
      const frame = requestAnimationFrame(update);
      window.addEventListener("resize", update);
      window.addEventListener("scroll", update, true);
      return () => {
        cancelAnimationFrame(frame);
        window.removeEventListener("resize", update);
        window.removeEventListener("scroll", update, true);
      };
    }, [step, cur.selector, cur.selectors]);

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
            spotlights.map((item, index) => React.createElement("rect", {
              key: "mask-" + index,
              x: item.left,
              y: item.top,
              width: item.width,
              height: item.height,
              rx: 8,
              fill: "black",
            })),
          )
        ),
        React.createElement("rect", {
          x: 0, y: 0, width: "100%", height: "100%",
          fill: overlayBg,
          mask: "url(#tut-mask)",
        }),
        // Highlight border
        spotlights.map((item, index) => React.createElement("rect", {
          key: "border-" + index,
          x: item.left,
          y: item.top,
          width: item.width,
          height: item.height,
          rx: 8,
          fill: "none",
          stroke: "#E41E26",
          strokeWidth: 2,
          strokeDasharray: "6 3",
          style: { animation: "none" },
        })),
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

  
