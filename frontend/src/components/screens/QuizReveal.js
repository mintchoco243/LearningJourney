"use client";

import React from "react";
import { GLHUI } from '../GLHUI';
import { GLHEngine } from '@/context/GameContext';
import { GLHAvatar } from '../GLHAvatar';
import { GLH_DATA } from '@/data/glhData';
import { Step4LearningStyle, Step5Availability, Step6TrainerPreference } from './OnboardingSteps';

const D = GLH_DATA;
const { Icon, Starfield } = GLHUI;
const { useGame, scoreQuiz, rankForXp } = GLHEngine;
const { Avatar } = GLHAvatar;


  
  
  
  const KEYS = ["A", "B", "C", "D"];

  /* ---------------- Quiz (with extended steps 4-6) ---------------- */
  export function Quiz(props) {
    const { user, actions } = useGame();
    const [idx, setIdx] = React.useState(0);
    const [answers, setAnswers] = React.useState(() => new Array(D.QUIZ.length).fill(null));
    const [step4, setStep4] = React.useState([]); // learning style
    const [step5, setStep5] = React.useState(""); // availability
    const [step6, setStep6] = React.useState([]); // trainers
    const [anim, setAnim] = React.useState(0);
    const lockRef = React.useRef(false);

    const TOTAL_STEPS = D.QUIZ.length + 3; // original 3 + new 3 steps
    const q = idx < D.QUIZ.length ? D.QUIZ[idx] : null;
    const pct = Math.round(((idx + (idx < D.QUIZ.length && answers[idx] ? 1 : idx >= D.QUIZ.length ? 1 : 0)) / TOTAL_STEPS) * 100);

    const goTo = (n) => { setIdx(n); setAnim((a) => a + 1); };

    const choose = (optIndex) => {
      if (lockRef.current) return;
      if (idx >= D.QUIZ.length) return; // no choosing on extended steps
      
      const next = answers.slice();
      next[idx] = q.options[optIndex];
      setAnswers(next);
      lockRef.current = true;
      window.setTimeout(() => {
        lockRef.current = false;
        if (idx < D.QUIZ.length - 1) goTo(idx + 1);
        else goTo(D.QUIZ.length); // move to step 4
      }, 320);
    };

    const finishExtended = () => {
      const result = scoreQuiz(answers);
      result._answers = answers;
      result.quiz_extended = { learning_style: step4, availability: step5, trainers: step6 };
      actions.completeQuiz(result);
      // Persist onboarding data to backend (fire-and-forget)
      fetch("/api/me/onboarding", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rank: result.rank_id,
          role: (answers[0] && answers[0].label) || "",
          class_archetype: result.class_id,
          learning_formats: step4 || [],
          weekly_hours: step5 || null,
          preferred_trainers: step6 || [],
          learning_goals: (answers[2] && answers[2].label) || "",
        }),
      }).catch(() => {});
      props.onComplete();
    };

    const canContinue = () => {
      if (idx < D.QUIZ.length) return answers[idx] !== null;
      if (idx === D.QUIZ.length) return step4.length > 0; // step 4: at least one selected
      if (idx === D.QUIZ.length + 1) return step5 !== ""; // step 5: must select
      return true; // step 6: optional
    };

    
    const selectedIndex = idx < D.QUIZ.length && answers[idx] ? D.QUIZ[idx].options.indexOf(answers[idx]) : -1;

    return React.createElement("div", { className: "glh-screen glh-dark glh-center glh-pad", style: { position: "relative" } },
      React.createElement(Starfield),
      React.createElement("button", {
        className: "glh-back",
        onClick: () => (idx === 0 ? props.onBack() : goTo(idx - 1)),
      }, React.createElement(Icon, { name: "arrow-left", size: 16 }), idx === 0 ? "Quay lại" : "Câu trước"),
      React.createElement("div", { className: "qz-wrap" },
        React.createElement("div", { className: "qz-top" },
          React.createElement("div", { className: "qz-progress" },
            React.createElement("div", { className: "qz-progress__fill", style: { width: pct + "%" } })),
          React.createElement("div", { className: "qz-count glh-display" }, (idx + 1) + " / " + TOTAL_STEPS)),
        React.createElement("div", { key: anim, className: "qz-anim-enter" },
          idx < D.QUIZ.length ? (
            // Original quiz questions (steps 1-3)
            React.createElement(React.Fragment, null,
              React.createElement("div", { className: "qz-group" },
                React.createElement(Icon, { name: q.icon, size: 16, color: "var(--amber)" }), q.group),
              React.createElement("h2", { className: "qz-q" }, q.text),
              React.createElement("div", { className: "qz-options" },
                q.options.map((o, i) => React.createElement("button", {
                  key: i, className: "qz-opt" + (selectedIndex === i ? " is-active" : ""),
                  onClick: () => choose(i),
                },
                  React.createElement("span", { className: "qz-key" }, KEYS[i]),
                  React.createElement("span", null, o.label)))))
          ) : idx === D.QUIZ.length ? (
            // Step 4: Learning Style
            React.createElement(Step4LearningStyle, { value: step4, onChange: setStep4 })
          ) : idx === D.QUIZ.length + 1 ? (
            // Step 5: Availability
            React.createElement(Step5Availability, { value: step5, onChange: setStep5 })
          ) : (
            // Step 6: Trainer Preference
            React.createElement(Step6TrainerPreference, { value: step6, onChange: setStep6 })
          )
        ),
        // Next button for extended steps
        idx >= D.QUIZ.length ? React.createElement("div", { style: { marginTop: 24, display: "flex", gap: 12 } },
          React.createElement("button", {
            className: "glh-btn glh-btn--ghost",
            onClick: () => goTo(idx - 1),
          },
            React.createElement(Icon, { name: "arrow-left", size: 16 }), " Quay lại"
          ),
          React.createElement("button", {
            className: "glh-btn glh-btn--primary",
            onClick: () => idx === D.QUIZ.length + 2 ? finishExtended() : goTo(idx + 1),
            disabled: !canContinue(),
            style: { opacity: canContinue() ? 1 : 0.5 },
          },
            idx === D.QUIZ.length + 2 ? "Hoàn thành" : "Tiếp tục"
          )
        ) : null
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
        arr.push({ x: 50 + Math.cos(ang) * (38 + Math.random() * 16), y: 50 + Math.sin(ang) * (38 + Math.random() * 16), d: Math.random() * 0.4, s: 5 + Math.random() * 7 });
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
    const deptAnswer = qr._answers && qr._answers[0] ? qr._answers[0].label : null;
    const rankAnswer = qr._answers && qr._answers[1] ? qr._answers[1].label : null;
    const goalAnswer = qr._answers && qr._answers[2] ? qr._answers[2].label : null;

    const displayName = user.email ? user.email.split("@")[0] : "Bạn";

    const learningStyleLabels = { video: "Video tự học", workshop: "Workshop", coaching: "Coaching 1-1", reading: "Reading / Tài liệu" };
    const availabilityLabel = { under1: "Dưới 1 giờ/tuần", "1to2": "1–2 giờ/tuần", "3plus": "3+ giờ/tuần" };

    const summaryItems = [
      { icon: "building-2", label: "Bộ phận", value: deptAnswer },
      { icon: "bar-chart-2", label: "Cấp bậc", value: rankAnswer },
      { icon: "target", label: "Mục tiêu", value: goalAnswer },
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

  