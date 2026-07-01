"use client";

import React from "react";
import { GLHUI } from '../GLHUI';
import { GLHEngine } from '@/context/GameContext';
import { GLHAvatar } from '../GLHAvatar';
import { GLH_DATA } from '@/data/glhData';
import { Step4LearningStyle, Step5Availability, Step6TrainerPreference } from './OnboardingSteps';

const D = GLH_DATA;
const { Icon, Starfield } = GLHUI;
const { useGame } = GLHEngine;
const { Avatar } = GLHAvatar;


  
  
  
  /* ---------------- Quiz (3 preference steps) ---------------- */
  export function Quiz(props) {
    const { user, actions } = useGame();
    const [idx, setIdx] = React.useState(0);
    const [step4, setStep4] = React.useState([]);
    const [step5, setStep5] = React.useState("");
    const [step6, setStep6] = React.useState([]);
    const [anim, setAnim] = React.useState(0);

    const TOTAL_STEPS = 3;
    const goTo = (n) => { setIdx(n); setAnim((a) => a + 1); };

    const finishExtended = () => {
      const dbRank = D.RANKS.find((r) => r.id === user.db_rank);
      const result = {
        class_id: "explorer",
        personality: "explorer",
        rank_id: user.db_rank || "rank_01",
        start_xp: dbRank ? dbRank.required_xp + 50 : 50,
        completed_at: new Date().toISOString(),
        quiz_extended: { learning_style: step4, availability: step5, trainers: step6 },
      };
      actions.completeQuiz(result);
      fetch("/api/me/onboarding", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          learning_formats: step4 || [],
          weekly_hours: step5 || null,
          preferred_trainers: step6 || [],
        }),
      }).catch(() => {});
      props.onComplete();
    };

    const canContinue = () => {
      if (idx === 0) return step4.length > 0;
      if (idx === 1) return step5 !== "";
      return true;
    };

    return React.createElement("div", { className: "glh-screen glh-dark glh-center glh-pad", style: { position: "relative" } },
      React.createElement(Starfield),
      React.createElement("button", {
        className: "glh-back",
        onClick: () => (idx === 0 ? props.onBack() : goTo(idx - 1)),
      }, React.createElement(Icon, { name: "arrow-left", size: 16 }), idx === 0 ? "Quay lại" : "Câu trước"),
      React.createElement("div", { className: "qz-wrap" },
        React.createElement("div", { className: "qz-top" },
          React.createElement("div", { className: "qz-progress" },
            React.createElement("div", { className: "qz-progress__fill", style: { width: Math.round(((idx + 1) / TOTAL_STEPS) * 100) + "%" } })),
          React.createElement("div", { className: "qz-count glh-display" }, (idx + 1) + " / " + TOTAL_STEPS)),
        React.createElement("div", { key: anim, className: "qz-anim-enter" },
          idx === 0 ? React.createElement(Step4LearningStyle, { value: step4, onChange: setStep4 })
          : idx === 1 ? React.createElement(Step5Availability, { value: step5, onChange: setStep5 })
          : React.createElement(Step6TrainerPreference, { value: step6, onChange: setStep6 })
        ),
        React.createElement("div", { style: { marginTop: 24, display: "flex", gap: 12 } },
          idx > 0 ? React.createElement("button", {
            className: "glh-btn glh-btn--ghost",
            onClick: () => goTo(idx - 1),
          }, React.createElement(Icon, { name: "arrow-left", size: 16 }), " Quay lại") : null,
          React.createElement("button", {
            className: "glh-btn glh-btn--primary",
            onClick: () => idx === TOTAL_STEPS - 1 ? finishExtended() : goTo(idx + 1),
            disabled: !canContinue(),
            style: { opacity: canContinue() ? 1 : 0.5, flex: 1 },
          }, idx === TOTAL_STEPS - 1 ? "Hoàn thành" : "Tiếp tục")
        )
      )
    );
  }

  /* ---------------- Reveal ---------------- */
  function Typewriter(props) {
    const chars = (props.text || "").split("");
    return React.createElement("span", { "aria-label": props.text }, chars.map((ch, i) =>
      React.createElement("span", {
        key: i, className: "tw-char",
        style: { animationDelay: (props.delay || 0) + i * 0.055 + "s" },
      }, ch === " " ? "\u00A0" : ch)));
  }

  function Sparkles(props) {
    const items = React.useMemo(() => {
      const arr = []; for (let i = 0; i < 14; i++) {
        const ang = (i / 14) * Math.PI * 2;
        const noise = (salt) => {
          const x = Math.sin((i + 1) * salt) * 10000;
          return x - Math.floor(x);
        };
        arr.push({
          x: 50 + Math.cos(ang) * (38 + noise(17) * 16),
          y: 50 + Math.sin(ang) * (38 + noise(31) * 16),
          d: noise(47) * 0.4,
          s: 5 + noise(61) * 7,
        });
      }
      return arr;
    }, []);
    if (!props.on) return null;
    return React.createElement("div", { style: { position: "absolute", inset: 0, pointerEvents: "none" } },
      items.map((s, i) => React.createElement("span", {
        key: i, className: "spark",
        style: {
          left: s.x + "%", top: s.y + "%", width: s.s, height: s.s,
          animation: `rvPop .5s ${s.d}s both`, background: i % 2 ? "var(--amber)" : "var(--glh-accent)",
        },
      })));
  }

  export function Reveal(props) {
    const { user } = useGame();
    const qr = user.quiz_result;

    const quizExt = qr.quiz_extended || {};
    const deptAnswer = user.db_role || null;
    const rankObj = D.RANKS.find((r) => r.id === (user.db_rank || qr.rank_id));
    const rankAnswer = rankObj ? rankObj.name : (user.db_rank || null);

    const displayName = user.full_name ? user.full_name.split(" ").pop() : (user.email ? user.email.split("@")[0] : "Bạn");

    const learningStyleLabels = { video: "Video tự học", workshop: "Workshop", coaching: "Coaching 1-1", reading: "Reading / Tài liệu" };
    const availabilityLabel = { under1: "Dưới 1 giờ/tuần", "1to2": "1–2 giờ/tuần", "3plus": "3+ giờ/tuần" };

    const summaryItems = [
      deptAnswer ? { icon: "building-2", label: "Bộ phận", value: deptAnswer } : null,
      rankAnswer ? { icon: "bar-chart-2", label: "Cấp bậc", value: rankAnswer } : null,
      quizExt.learning_style && quizExt.learning_style.length > 0 ? {
        icon: "book-open", label: "Hình thức học",
        value: quizExt.learning_style.map((s) => learningStyleLabels[s] || s).join(", ")
      } : null,
      quizExt.availability ? {
        icon: "clock", label: "Thời gian/tuần",
        value: availabilityLabel[quizExt.availability] || quizExt.availability
      } : null,
      quizExt.trainers && quizExt.trainers.length > 0 ? {
        icon: "users", label: "Trainer yêu thích",
        value: quizExt.trainers.join(", ")
      } : null,
    ].filter(Boolean);

    return React.createElement("div", { className: "glh-screen glh-dark glh-center glh-pad", style: { position: "relative", overflowY: "auto" } },
      React.createElement(Starfield),
      React.createElement("div", { className: "rv-wrap", style: { maxWidth: 520, width: "100%", textAlign: "left" } },
        // Header
        React.createElement("div", { className: "rv-rise", style: { textAlign: "center", marginBottom: 32, animationDelay: ".05s" } },
          React.createElement("div", { style: { fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--amber)", marginBottom: 10 } }, "Hồ sơ học tập của bạn"),
          React.createElement("h1", { style: { margin: 0, fontSize: "clamp(22px,4vw,32px)", fontWeight: 700, color: "#fff", fontFamily: "var(--glh-display)" } },
            "Xin chào, ", React.createElement("span", { style: { color: "var(--glh-accent)" } }, displayName), "!")
        ),

        // Summary cards
        React.createElement("div", { style: { display: "grid", gap: 10, marginBottom: 32 } },
          summaryItems.map((item, i) =>
            React.createElement("div", {
              key: i,
              className: "rv-rise",
              style: {
                animationDelay: (0.1 + i * 0.08) + "s",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid var(--rpg-border)",
                borderRadius: 8,
                padding: "14px 18px",
                display: "flex",
                alignItems: "center",
                gap: 14,
              }
            },
              React.createElement("div", {
                style: {
                  width: 36, height: 36, borderRadius: 6,
                  background: "rgba(228,30,38,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }
              },
                React.createElement(Icon, { name: item.icon, size: 18, color: "var(--glh-accent)" })
              ),
              React.createElement("div", null,
                React.createElement("div", { style: { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--rpg-muted)", marginBottom: 3 } }, item.label),
                React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "#fff" } }, item.value)
              )
            )
          )
        ),

        // CTA
        React.createElement("div", { className: "rv-rise", style: { animationDelay: ".7s", textAlign: "center" } },
          React.createElement("button", {
            className: "glh-btn glh-btn--primary glh-btn--lg",
            onClick: props.onNext,
            style: { width: "100%" },
          },
            "Vào trang học tập", React.createElement(Icon, { name: "arrow-right", size: 18, color: "#fff" })
          )
        )
      )
    );
  }

  
