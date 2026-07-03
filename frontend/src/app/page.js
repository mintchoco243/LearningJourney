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

const { useGame, rankForUser } = GLHEngine;
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
    return null;
  }

  /* ---------- FAQ section ---------- */
  const FAQ_SAMPLES = [
    { id: 1, q: "Tôi có thể đăng ký bao nhiêu khóa học trong một tháng?", a: "Không giới hạn số lượng khóa đăng ký. Tuy nhiên, bạn nên cân nhắc lịch học để đảm bảo hoàn thành đúng hạn." },
    { id: 3, q: "Tôi có thể đề xuất chủ đề đào tạo mới không?", a: "Có. Bạn có thể gửi đề xuất qua nút \"Gửi yêu cầu khóa học\" hoặc liên hệ trực tiếp team L&D qua email." },
    { id: 5, q: "Khóa học E-learning có hạn truy cập không?", a: "Hiện tại các khóa E-learning được mở truy cập không thời hạn. Thông tin này có thể thay đổi, bạn nên theo dõi mục Chính sách để cập nhật." },
  ];

  function FAQSection() {
    const [expanded, setExpanded] = React.useState(null);

    return React.createElement("div", { className: "glh-container", style: { padding: "28px clamp(16px,4vw,40px)" } },
      React.createElement("h1", { className: "u-h2", style: { marginBottom: 8, fontSize: "clamp(26px,4vw,36px)" } }, "FAQ"),
      React.createElement("p", { style: { color: "var(--ui-muted)", marginBottom: 32, fontSize: 14 } }, "Các câu hỏi thường gặp về đăng ký, đề xuất và truy cập khóa học."),

      React.createElement("div", { className: "u-card", style: { marginBottom: 16, padding: 20 } },
        React.createElement("h3", { className: "u-eyebrow", style: { marginBottom: 12 } }, "Câu hỏi thường gặp"),
        FAQ_SAMPLES.map(item =>
          React.createElement("div", {
            key: item.id,
            style: { borderTop: "1px solid var(--ui-box-border)", padding: "16px 0" },
          },
            React.createElement("button", {
              onClick: () => setExpanded(expanded === item.id ? null : item.id),
              style: {
                background: "none", border: "none", color: "var(--ui-heading)", fontSize: 14, fontWeight: 600,
                width: "100%", textAlign: "left", display: "flex", justifyContent: "space-between",
                alignItems: "center", cursor: "pointer", padding: "8px 0",
              },
            },
              item.q,
              React.createElement(Icon, { name: expanded === item.id ? "chevron-down" : "chevron-right", size: 16, color: "var(--ui-muted)" })),
            expanded === item.id && React.createElement("div", {
              style: { fontSize: 13, color: "var(--ui-muted)", marginTop: 12, lineHeight: 1.6 },
            }, item.a))))
    );
  }
  /* ---------- App bar (utility) ---------- */
  function AppBar(props) {
    const { user } = useGame();
    const cls = D.CLASSES[user.quiz_result.class_id];
    const rank = rankForUser(user);
    const opts = Object.assign({}, user.character, { classColor: cls.color, rank: rank.level });
    const pageTitles = {
      home: "Garena Learning Hub",
      library: "Thư viện đào tạo",
      policy: "Chính sách đào tạo",
      store: "Kho đổi quà",
      qa: "FAQ",
      profile: "Thông tin cá nhân",
    };
    const pageTitle = pageTitles[props.tab] || pageTitles.home;
    const tabs = [
      ["home",    null],                    // icon only
      ["library", "Thư viện đào tạo"],
      ["policy",  "Chính sách đào tạo"],
      ["store",   "Kho đổi quà"],           // disabled
      ["qa",      "FAQ"],
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
              "data-tour": "nav-" + id,
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
        React.createElement("div", { className: "appbar__title", title: pageTitle }, pageTitle),
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, flex: "0 0 auto" } },
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
          React.createElement("button", { className: "appbar__mini", "data-tour": "profile", onClick: () => props.onNav("profile"), title: "Thông tin tôi", style: { cursor: "pointer" } },
            React.createElement("div", { style: { width: 34, height: 34, borderRadius: "50%", overflow: "hidden", background: "#0a0e15", display: "grid", placeItems: "center" } },
              React.createElement(Avatar, { opts: opts, size: 40, crisp: props.crisp })),
            React.createElement("div", { style: { textAlign: "left", lineHeight: 1.2 } },
              React.createElement("div", { className: "nm" }, user.email ? user.email.split("@")[0] : "Người dùng"),
              React.createElement("div", { className: "lv" }, user.db_team || user.db_role || "Learning Hub")))
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

    // initial phase - now starts with login check
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
            actions.setUserProfile(data.user, data.enrollments, data.reservations);
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
      body = React.createElement("div", { className: "glh-light" },
        React.createElement(AppBar, { tab: "profile", crisp, onNav: scrollTo, onOpenTutorial: () => setShowTutorial(true), onOpenRating: () => setShowRating(true), onLogout: () => { actions.reset(); setPhase("login"); window.scrollTo(0, 0); } }),
        React.createElement("main", null,
          React.createElement(Profile, { crisp, onBack: () => { setPhase("app"); window.scrollTo(0, 0); }, onReset: () => { setPhase("onboarding"); window.scrollTo(0, 0); } })));
    } else if (phase === "store") {
      body = React.createElement("div", { className: "glh-light" },
        React.createElement(AppBar, { tab: "store", crisp, onNav: scrollTo, onOpenTutorial: () => setShowTutorial(true), onOpenRating: () => setShowRating(true), onLogout: () => { actions.reset(); setPhase("login"); window.scrollTo(0, 0); } }),
        React.createElement(Store, {}));
    } else if (phase === "policy") {
      body = React.createElement("div", { className: "glh-light" },
        React.createElement(AppBar, { tab: "policy", crisp, onNav: scrollTo, onOpenTutorial: () => setShowTutorial(true), onOpenRating: () => setShowRating(true), onLogout: () => { actions.reset(); setPhase("login"); window.scrollTo(0, 0); } }),
        React.createElement("main", null,
          React.createElement(Policy, { crisp, onBack: () => { setPhase("app"); window.scrollTo(0, 0); } })));
    } else if (phase === "qa") {
      body = React.createElement("div", { className: "glh-light" },
        React.createElement(AppBar, { tab: "qa", crisp, onNav: scrollTo, onOpenTutorial: () => setShowTutorial(true), onOpenRating: () => setShowRating(true), onLogout: () => { actions.reset(); setPhase("login"); window.scrollTo(0, 0); } }),
        React.createElement(FAQSection, null));
    } else {
      // app - tab-based navigation
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
      React.createElement(TweaksUI, { t, setTweak }));
  }

  export default function App() {
    return React.createElement(GLHEngine.GameProvider, null, React.createElement(AppInner, null));
  }
