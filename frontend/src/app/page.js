"use client";

import React from "react";
import { GLHEngine } from '@/context/GameContext';
import { GLHUI } from '@/components/GLHUI';
import { GLHAvatar } from '@/components/GLHAvatar';
import { GLHParts } from '@/components/GLHParts';
import { GLH_DATA } from '@/data/glhData';
import { Login } from '@/components/screens/Login';
import { Onboarding, CharacterCreation } from '@/components/screens/Onboarding';
import { Quiz, Reveal } from '@/components/screens/QuizReveal';
import { Profile, Policy } from '@/components/screens/ProfilePolicy';
import { Store } from '@/components/screens/Store';
import { Dashboard } from '@/components/screens/Dashboard';
import { Catalog, Calendar } from '@/components/screens/CatalogCalendar';
import { LdRequestPopup, ChatBot } from '@/components/screens/LdRequestChatBot';
import { RatingModal, Tutorial } from '@/components/screens/RatingTutorial';

import { useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakSelect, TweakSlider, TweakToggle, TweakButton } from '@/components/TweaksPanel';

const { useGame, rankForXp } = GLHEngine;
const { Icon } = GLHUI;
const { Avatar } = GLHAvatar;
const { CourseModal } = GLHParts;
const D = GLH_DATA;


  
  
  
  
  

  const ACCENTS = { red: { v: "#E41E26", soft: "rgba(228,30,38,0.16)" }, amber: { v: "#FF9E00", soft: "rgba(255,158,0,0.18)" } };
  const FONTS = {
    "Chakra Petch": '"Chakra Petch", "Be Vietnam Pro", sans-serif',
    "Oxanium": '"Oxanium", "Be Vietnam Pro", sans-serif',
    "Press Start 2P": '"Press Start 2P", "Be Vietnam Pro", sans-serif',
  };

  function seededNoise(seed) {
    const x = Math.sin(seed * 999) * 10000;
    return x - Math.floor(x);
  }

  /* ---------- XP burst toast ---------- */
  function XpToast() {
    const { xpBurst, actions } = useGame();
    React.useEffect(() => {
      if (!xpBurst) return;
      const t = setTimeout(() => actions.clearXpBurst(), 1700);
      return () => clearTimeout(t);
    }, [actions, xpBurst]);
    if (!xpBurst) return null;
    return React.createElement("div", { className: "xp-burst", key: xpBurst.id },
      React.createElement(Icon, { name: "zap", size: 18, color: "var(--amber)" }),
      "+" + xpBurst.amount + " XP",
      xpBurst.label ? React.createElement("span", { style: { fontWeight: 400, color: "var(--rpg-muted)", fontSize: 13 } }, "· " + xpBurst.label) : null);
  }

  /* ---------- Level-up overlay ---------- */
  function LevelUp(props) {
    const { user, levelUp, actions } = useGame();
    const cls = user.quiz_result ? D.CLASSES[user.quiz_result.class_id] : null;
    const opts = Object.assign({}, user.character, { classColor: cls ? cls.color : null, rank: levelUp?.level });
    const intensity = props.intensity || "normal";
    const confettiN = intensity === "celebratory" ? 90 : intensity === "subtle" ? 0 : 44;
    const confetti = React.useMemo(() => {
      const cols = ["#FFBA00", "#E41E26", "#7C5CFF", "#2BB6A3", "#fff"];
      return Array.from({ length: confettiN }, (_, i) => ({
        left: seededNoise(i + 1) * 100,
        delay: seededNoise(i + 101) * 0.5,
        dur: 1.6 + seededNoise(i + 201) * 1.4,
        col: cols[i % cols.length],
        rot: seededNoise(i + 301) * 360,
      }));
    }, [confettiN]);
    if (!levelUp) return null;
    return React.createElement("div", { className: "lvlup", onClick: actions.clearLevelUp },
      intensity !== "subtle" ? React.createElement("div", { className: "lvlup__flash" }) : null,
      confetti.map((c, i) => React.createElement("div", {
        key: i, className: "confetti",
        style: { left: c.left + "%", background: c.col, animationDelay: c.delay + "s", animationDuration: c.dur + "s", transform: `rotate(${c.rot}deg)` },
      })),
      React.createElement("div", { className: "lvlup__card", onClick: (e) => e.stopPropagation() },
        React.createElement("h1", { className: "lvlup__title" }, "LEVEL UP!"),
        React.createElement("div", { className: "lvlup__avatar", style: { width: 150, height: 150 } },
          React.createElement(Avatar, { opts: opts, size: 150, crisp: props.crisp })),
        React.createElement("div", { className: "lvlup__rank" }, "Rank " + levelUp.level + " · " + levelUp.name),
        React.createElement("p", { className: "lvlup__sub" }, levelUp.description),
        React.createElement("button", { className: "glh-btn glh-btn--primary glh-btn--lg", onClick: actions.clearLevelUp }, "Tiếp tục")));
  }

  /* ---------- Q&A section ---------- */
  const QA_SAMPLES = [
    { id: 1, q: "Tôi có thể đăng ký bao nhiêu khóa học trong một tháng?", a: "Không giới hạn số lượng khóa đăng ký. Tuy nhiên, bạn nên cân nhắc lịch học để đảm bảo hoàn thành đúng hạn." },
    { id: 2, q: "Điểm XP được tính như thế nào?", a: "XP được cộng sau khi hoàn thành khóa học và được xác nhận bởi trainer. Mỗi khóa có số XP khác nhau tùy theo độ dài và mức độ." },
    { id: 3, q: "Tôi có thể đề xuất chủ đề đào tạo mới không?", a: "Có. Bạn có thể gửi đề xuất qua nút \"Gửi yêu cầu khóa học\" hoặc liên hệ trực tiếp team L&D qua email." },
    { id: 4, q: "Chính sách hoàn trả XP khi hủy đăng ký là gì?", a: "XP chỉ được ghi nhận sau khi hoàn thành, do đó không phát sinh vấn đề hoàn trả khi hủy đăng ký trước khi khóa diễn ra." },
    { id: 5, q: "Khóa học E-learning có hạn truy cập không?", a: "Hiện tại các khóa E-learning được mở truy cập không thời hạn. Thông tin này có thể thay đổi, bạn nên theo dõi mục Chính sách để cập nhật." },
  ];

  function QASection() {
    const [expanded, setExpanded] = React.useState(null);
    const [showForm, setShowForm] = React.useState(false);
    const [question, setQuestion] = React.useState("");
    const [submitted, setSubmitted] = React.useState(false);

    const handleSubmit = (e) => {
      e.preventDefault();
      if (!question.trim()) return;
      setSubmitted(true);
      setQuestion("");
      setTimeout(() => { setSubmitted(false); setShowForm(false); }, 3000);
    };

    return React.createElement("section", { style: { padding: "clamp(16px,4vw,40px)" } },
      React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 } },
        React.createElement("h2", { style: { fontSize: "clamp(18px,2.5vw,22px)", fontWeight: 700, margin: 0 } }, "Câu hỏi thường gặp"),
        React.createElement("button", {
          className: "glh-btn glh-btn--secondary",
          onClick: () => { setShowForm(v => !v); setSubmitted(false); },
        }, showForm ? "Hủy" : "Gửi câu hỏi mới")),
      showForm && React.createElement("form", {
        onSubmit: handleSubmit,
        style: { background: "var(--rpg-panel)", border: "1px solid var(--rpg-border)", borderRadius: 10, padding: 16, marginBottom: 20 },
      },
        submitted
          ? React.createElement("p", { style: { color: "var(--glh-accent)", margin: 0 } }, "✓ Câu hỏi đã được gửi. Team L&D sẽ phản hồi sớm nhất!")
          : React.createElement(React.Fragment, null,
              React.createElement("textarea", {
                value: question, onChange: e => setQuestion(e.target.value),
                placeholder: "Nhập câu hỏi của bạn...",
                rows: 3,
                style: { width: "100%", resize: "vertical", background: "var(--rpg-bg)", border: "1px solid var(--rpg-border)", borderRadius: 6, padding: 10, color: "var(--rpg-text)", fontSize: 14, boxSizing: "border-box" },
              }),
              React.createElement("button", { type: "submit", className: "glh-btn glh-btn--primary", style: { marginTop: 10 } }, "Gửi"))),
      QA_SAMPLES.map(item =>
        React.createElement("div", {
          key: item.id,
          style: { borderBottom: "1px solid var(--rpg-border)", padding: "14px 0" },
        },
          React.createElement("button", {
            onClick: () => setExpanded(expanded === item.id ? null : item.id),
            style: { width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, color: "var(--rpg-text)", fontWeight: 600, fontSize: 15 },
          },
            item.q,
            React.createElement(Icon, { name: expanded === item.id ? "chevron-down" : "chevron-right", size: 16, color: "var(--rpg-muted)" })),
          expanded === item.id && React.createElement("p", {
            style: { margin: "10px 0 0", color: "var(--rpg-muted)", fontSize: 14, lineHeight: 1.6 },
          }, item.a))));
  }

  /* ---------- App bar (utility) ---------- */
  function AppBar(props) {
    const { user } = useGame();
    const cls = D.CLASSES[user.quiz_result.class_id];
    const rank = rankForXp(user.xp);
    const opts = Object.assign({}, user.character, { classColor: cls.color, rank: rank.level });
    const tabs = [
      ["home",    null],                    // icon only
      ["library", "Thư viện đào tạo"],
      ["policy",  "Chính sách đào tạo"],
      ["store",   "Kho đổi quà"],           // disabled
      ["qa",      "Q&A"],
    ];

    const [isDark, setIsDark] = React.useState(() => {
      try { if (typeof window !== "undefined") { return localStorage.getItem("glh_theme") !== "light"; } } catch(e) {} return true;
    });

    const toggleTheme = () => {
      const next = !isDark;
      setIsDark(next);
      document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
      localStorage.setItem("glh_theme", next ? "dark" : "light");
    };

    React.useEffect(() => {
      const saved = localStorage.getItem("glh_theme") || "dark";
      document.documentElement.setAttribute("data-theme", saved);
    }, []);

    return React.createElement("header", { className: "appbar" },
      React.createElement("div", { className: "appbar__in" },
        React.createElement("nav", { className: "appbar__nav" },
          tabs.map(([id, label]) => {
            const isStore = id === "store";
            const isHome  = id === "home";
            return React.createElement("button", {
              key: id,
              className: "appbar__link" + (props.tab === id ? " is-active" : ""),
              onClick: () => props.onNav(id),
              style: isStore ? { opacity: 0.45, display: "flex", alignItems: "center", gap: 5 }
                   : isHome  ? { display: "flex", alignItems: "center" }
                   : {},
            },
              isHome  ? React.createElement(React.Fragment, null,
                  React.createElement("img", { src: "/assets/logo_icon.png", alt: "Garena", style: { height: 24, display: "block" } }),
                  React.createElement("span", { className: "glh-brand-text", style: { fontWeight: 700, fontSize: 13, whiteSpace: "nowrap" } }, "Garena Learning Hub"))
            : isStore ? React.createElement(React.Fragment, null, label, React.createElement(Icon, { name: "lock", size: 11, color: "currentColor", style: { marginTop: 1 } }))
            : label
            );
          })),
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
          // Tutorial button
          React.createElement("button", {
            onClick: () => props.onOpenTutorial && props.onOpenTutorial(),
            title: "Hướng dẫn sử dụng",
            style: { width: 34, height: 34, borderRadius: 8, background: "var(--rpg-panel)", border: "1px solid var(--rpg-border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }
          }, React.createElement(Icon, { name: "help-circle", size: 16, color: "var(--rpg-muted)" })),
          // Rating button
          React.createElement("button", {
            onClick: () => props.onOpenRating && props.onOpenRating(),
            title: "Đánh giá site",
            style: { width: 34, height: 34, borderRadius: 8, background: "var(--rpg-panel)", border: "1px solid var(--rpg-border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }
          }, React.createElement(Icon, { name: "star", size: 16, color: "var(--amber)" })),
          // Theme toggle
          React.createElement("button", {
            onClick: toggleTheme,
            title: isDark ? "Chuyển sang Light Mode" : "Chuyển sang Dark Mode",
            style: { width: 34, height: 34, borderRadius: 8, background: "var(--rpg-panel)", border: "1px solid var(--rpg-border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 200ms" }
          }, React.createElement(Icon, { name: isDark ? "sun" : "moon", size: 16, color: "var(--rpg-muted)" })),
          // Logout button
          React.createElement("button", {
            title: "Đăng xuất",
            onClick: () => {
              if (!confirm("Bạn có chắc muốn đăng xuất?")) return;
              fetch("/auth/logout", { method: "POST", credentials: "include" })
                .finally(() => { props.onLogout && props.onLogout(); });
            },
            style: { width: 34, height: 34, borderRadius: 8, background: "var(--rpg-panel)", border: "1px solid var(--rpg-border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }
          }, React.createElement(Icon, { name: "log-out", size: 16, color: "var(--rpg-muted)" })),
          React.createElement("button", { className: "appbar__mini", onClick: () => props.onNav("profile"), title: "Thông tin tôi", style: { cursor: "pointer" } },
            React.createElement("div", { style: { width: 34, height: 34, borderRadius: "50%", overflow: "hidden", background: "#0a0e15", display: "grid", placeItems: "center" } },
              React.createElement(Avatar, { opts: opts, size: 40, crisp: props.crisp })),
            React.createElement("div", { style: { textAlign: "left", lineHeight: 1.2 } },
              React.createElement("div", { className: "nm" }, user.email ? user.email.split("@")[0] : "Người dùng"),
              React.createElement("div", { className: "lv" }, "RANK " + rank.level + " · " + user.xp + " XP")))
        )));
  }

  /* ---------- Tweaks ---------- */
  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "accent": "red",
    "spriteScale": 1,
    "crisp": false,
    "anim": "normal",
    "displayFont": "Chakra Petch"
  }/*EDITMODE-END*/;

  function TweaksUI(props) {
    const t = props.t, setTweak = props.setTweak;
    const { actions } = useGame();
    return React.createElement(TweaksPanel, null,
      React.createElement(TweakSection, { label: "Thương hiệu" }),
      React.createElement(TweakRadio, {
        label: "Màu nhấn", value: t.accent, options: ["red", "amber"],
        onChange: (v) => setTweak("accent", v),
      }),
      React.createElement(TweakSelect, {
        label: "Font hiển thị", value: t.displayFont, options: ["Chakra Petch", "Oxanium", "Press Start 2P"],
        onChange: (v) => setTweak("displayFont", v),
      }),
      React.createElement(TweakSection, { label: "Nhân vật pixel" }),
      React.createElement(TweakSlider, {
        label: "Kích thước sprite", value: t.spriteScale, min: 0.75, max: 1.5, step: 0.05, unit: "×",
        onChange: (v) => setTweak("spriteScale", v),
      }),
      React.createElement(TweakToggle, {
        label: "Viền pixel sắc nét", value: t.crisp, onChange: (v) => setTweak("crisp", v),
      }),
      React.createElement(TweakSection, { label: "Chuyển động" }),
      React.createElement(TweakRadio, {
        label: "Cường độ hiệu ứng", value: t.anim, options: ["subtle", "normal", "celebratory"],
        onChange: (v) => setTweak("anim", v),
      }),
      React.createElement(TweakSection, { label: "Prototype" }),
      React.createElement(TweakButton, {
        label: "Chơi lại từ đầu", onClick: () => { if (confirm("Xóa toàn bộ tiến độ và chơi lại?")) { actions.reset(); window.scrollTo(0, 0); } },
      }));
  }

  /* ---------- Root App ---------- */
  function AppInner() {
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => {
      const frame = requestAnimationFrame(() => setMounted(true));
      return () => cancelAnimationFrame(frame);
    }, []);

    const { user, actions } = useGame();
    const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
    const verifiedSessionRef = React.useRef(false);

    // initial phase — now starts with login check
    const [phase, setPhase] = React.useState(() => {
      if (!user.email && !user.onboarded) return "login";
      if (!user.quiz_result) return "onboarding";
      return "app";
    });

    // On mount: verify server session without destroying local learning progress.
    React.useEffect(() => {
      if (verifiedSessionRef.current) return;
      verifiedSessionRef.current = true;
      fetch("/api/me", { credentials: "include" })
        .then((r) => {
          if (r.status === 401) {
            if (!user.email && !user.onboarded && !user.quiz_result) setPhase("login");
            return null;
          }
          return r.ok ? r.json() : null;
        })
        .then((data) => {
          if (data && data.user && data.user.email) {
            actions.setUserProfile(data.user);
            setPhase(user.quiz_result ? "app" : "onboarding");
          }
        })
        .catch(() => {});
    }, [actions, user.email, user.onboarded, user.quiz_result]);
    const [activeTab, setActiveTab] = React.useState("home");

    const [course, setCourse] = React.useState(null);
    const [ldRequest, setLdRequest] = React.useState(false);
    const [showRating, setShowRating] = React.useState(false);
    const [showTutorial, setShowTutorial] = React.useState(() => {
      try { if (typeof window !== "undefined") { return !localStorage.getItem("glh_tutorial_done"); } } catch(e) {} return false;
    });

    const pendingScroll = React.useRef(null);
    React.useEffect(() => {
      if (!pendingScroll.current) return;
      const el = document.getElementById(pendingScroll.current);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      pendingScroll.current = null;
    }, [activeTab]);

    const scrollTo = React.useCallback((id, section) => {
      if (id === "store")   { setPhase("store");   window.scrollTo(0, 0); return; }
      if (id === "policy")  { setPhase("policy");  window.scrollTo(0, 0); return; }
      if (id === "qa")      { setPhase("qa");      window.scrollTo(0, 0); return; }
      if (id === "profile") { setPhase("profile"); window.scrollTo(0, 0); return; }
      if (section) pendingScroll.current = section;
      setPhase("app");
      setActiveTab(id);
      window.scrollTo(0, 0);
    }, []);

    // apply tweaks to :root
    React.useEffect(() => {
      const r = document.documentElement.style;
      const acc = ACCENTS[t.accent] || ACCENTS.red;
      r.setProperty("--glh-accent", acc.v);
      r.setProperty("--glh-accent-soft", acc.soft);
      r.setProperty("--glh-sprite-scale", String(t.spriteScale));
      r.setProperty("--glh-display", FONTS[t.displayFont] || FONTS["Chakra Petch"]);
    }, [t.accent, t.spriteScale, t.displayFont]);

    const crisp = t.crisp;
    const goApp = () => { setPhase("app"); window.scrollTo(0, 0); };

    if (!mounted) return null;
    let body;
    if (phase === "login") {
      body = React.createElement(Login, { onLogin: (email) => { actions.setEmail(email); setPhase(user.quiz_result ? "app" : "onboarding"); } });
    } else if (phase === "onboarding") {
      body = React.createElement(Onboarding, { crisp, onStart: (returning) => { returning ? goApp() : setPhase("character"); } });
    } else if (phase === "character") {
      body = React.createElement(CharacterCreation, { crisp, onBack: () => setPhase("onboarding"), onNext: () => setPhase("quiz") });
    } else if (phase === "quiz") {
      body = React.createElement(Quiz, { onBack: () => setPhase("character"), onComplete: () => setPhase("reveal") });
    } else if (phase === "reveal") {
      body = React.createElement(Reveal, { crisp, onNext: () => goApp() });
    } else if (phase === "profile") {
      body = React.createElement(Profile, { crisp, onBack: () => { setPhase("app"); window.scrollTo(0, 0); }, onReset: () => { setPhase("onboarding"); window.scrollTo(0, 0); } });
    } else if (phase === "store") {
      body = React.createElement("div", { className: "glh-light" },
        React.createElement(AppBar, { tab: "store", crisp, onNav: scrollTo, onOpenTutorial: () => setShowTutorial(true), onOpenRating: () => setShowRating(true), onLogout: () => { actions.reset(); setPhase("login"); window.scrollTo(0, 0); } }),
        React.createElement(Store, {}));
    } else if (phase === "policy") {
      body = React.createElement(Policy, { crisp, onBack: () => { setPhase("app"); window.scrollTo(0, 0); } });
    } else if (phase === "qa") {
      body = React.createElement("div", { className: "glh-light" },
        React.createElement(AppBar, { tab: "qa", crisp, onNav: scrollTo, onOpenTutorial: () => setShowTutorial(true), onOpenRating: () => setShowRating(true), onLogout: () => { actions.reset(); setPhase("login"); window.scrollTo(0, 0); } }),
        React.createElement(QASection, null));
    } else {
      // app — tab-based navigation
      const utilCommon = { crisp, onNav: scrollTo, onOpenCourse: setCourse, onOpenLdRequest: () => setLdRequest(true) };
      const appBar = React.createElement(AppBar, { tab: activeTab, crisp, onNav: scrollTo, onOpenTutorial: () => setShowTutorial(true), onOpenRating: () => setShowRating(true), onLogout: () => { actions.reset(); setPhase("login"); window.scrollTo(0, 0); } });
      let tabContent;
      if (activeTab === "home") {
        tabContent = React.createElement(Dashboard, {
          crisp,
          onNav: scrollTo,
          onOpenCourse: setCourse,
          onOpenLdRequest: () => setLdRequest(true),
        });
      } else if (activeTab === "library") {
        tabContent = React.createElement("div", null,
          React.createElement("div", { id: "calendar-section" },
            React.createElement(Calendar, utilCommon)),
          React.createElement("div", { style: { height: 1, background: "var(--rpg-border)", margin: "20px clamp(16px,4vw,40px)" } }),
          React.createElement(Catalog, utilCommon),
          React.createElement("button", {
            className: "library-fab",
            onClick: utilCommon.onOpenLdRequest,
            title: "Gửi yêu cầu học tập",
          },
            React.createElement(Icon, { name: "send", size: 18, color: "#fff" }),
            React.createElement("span", { className: "library-fab__label" }, "Gửi yêu cầu")));
      }
      body = React.createElement("div", { className: "glh-light" }, appBar, React.createElement("main", null, tabContent));
    }

    return React.createElement(React.Fragment, null,
      body,

      course ? React.createElement(CourseModal, { course, onClose: () => setCourse(null) }) : null,
      ldRequest ? React.createElement(LdRequestPopup, { onClose: () => setLdRequest(false) }) : null,
      showRating ? React.createElement(RatingModal, { onClose: () => setShowRating(false) }) : null,
      showTutorial && phase === "app" ? React.createElement(Tutorial, { onClose: () => setShowTutorial(false) }) : null,
      phase === "app" ? React.createElement(ChatBot, { hideOnGameWorld: true }) : null,
      // Floating rating button
      phase === "app" ? React.createElement("button", {
        onClick: () => setShowRating(true),
        title: "Đánh giá site",
        style: {
          position: "fixed", bottom: 88, right: 24, zIndex: 98,
          padding: "8px 14px", borderRadius: 6, fontSize: 12, fontWeight: 700,
          background: "var(--rpg-panel)", border: "1px solid var(--rpg-border)",
          color: "var(--rpg-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
          transition: "all 200ms",
        },
        onMouseEnter: (e) => { e.currentTarget.style.borderColor = "var(--glh-accent)"; e.currentTarget.style.color = "var(--glh-accent)"; },
        onMouseLeave: (e) => { e.currentTarget.style.borderColor = "var(--rpg-border)"; e.currentTarget.style.color = "var(--rpg-muted)"; },
      },
        React.createElement(Icon, { name: "star", size: 14, color: "var(--amber)" }), " Đánh giá"
      ) : null,
      React.createElement(XpToast, null),
      React.createElement(LevelUp, { crisp, intensity: t.anim }),
      React.createElement(TweaksUI, { t, setTweak }));
  }

  export default function App() {
    return React.createElement(GLHEngine.GameProvider, null, React.createElement(AppInner, null));
  }
