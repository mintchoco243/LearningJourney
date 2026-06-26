/* =============================================================
   App — router, AppBar, Level-Up overlay, XP toast, Tweaks
   ============================================================= */
(function () {
  "use strict";
  const { useGame, rankForXp } = window.GLHEngine;
  const { Icon } = window.GLHUI;
  const Avatar = window.GLHAvatar.Avatar;
  const S = window.GLHScreens;
  const { CourseModal, EventModal } = window.GLHParts;
  const D = window.GLH_DATA;

  const ACCENTS = { red: { v: "#E41E26", soft: "rgba(228,30,38,0.16)" }, amber: { v: "#FF9E00", soft: "rgba(255,158,0,0.18)" } };
  const FONTS = {
    "Chakra Petch": '"Chakra Petch", "Be Vietnam Pro", sans-serif',
    "Oxanium": '"Oxanium", "Be Vietnam Pro", sans-serif',
    "Press Start 2P": '"Press Start 2P", "Be Vietnam Pro", sans-serif',
  };

  /* ---------- XP burst toast ---------- */
  function XpToast() {
    const { xpBurst, actions } = useGame();
    React.useEffect(() => {
      if (!xpBurst) return;
      const t = setTimeout(() => actions.clearXpBurst(), 1700);
      return () => clearTimeout(t);
    }, [xpBurst]);
    if (!xpBurst) return null;
    return React.createElement("div", { className: "xp-burst", key: xpBurst.id },
      React.createElement(Icon, { name: "zap", size: 18, color: "var(--amber)" }),
      "+" + xpBurst.amount + " XP",
      xpBurst.label ? React.createElement("span", { style: { fontWeight: 400, color: "var(--rpg-muted)", fontSize: 13 } }, "· " + xpBurst.label) : null);
  }

  /* ---------- Level-up overlay ---------- */
  function LevelUp(props) {
    const { user, levelUp, actions } = useGame();
    if (!levelUp) return null;
    const cls = user.quiz_result ? D.CLASSES[user.quiz_result.class_id] : null;
    const opts = Object.assign({}, user.character, { classColor: cls ? cls.color : null, rank: levelUp.level });
    const intensity = props.intensity || "normal";
    const confettiN = intensity === "celebratory" ? 90 : intensity === "subtle" ? 0 : 44;
    const confetti = React.useMemo(() => {
      const cols = ["#FFBA00", "#E41E26", "#7C5CFF", "#2BB6A3", "#fff"];
      return Array.from({ length: confettiN }, (_, i) => ({
        left: Math.random() * 100, delay: Math.random() * 0.5, dur: 1.6 + Math.random() * 1.4,
        col: cols[i % cols.length], rot: Math.random() * 360,
      }));
    }, [levelUp.id, confettiN]);
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

  /* ---------- App bar (utility) ---------- */
  function AppBar(props) {
    const { user } = useGame();
    const cls = D.CLASSES[user.quiz_result.class_id];
    const rank = rankForXp(user.xp);
    const opts = Object.assign({}, user.character, { classColor: cls.color, rank: rank.level });
    const tabs = [["dashboard", "Trang chủ"], ["catalog", "Khóa học"], ["calendar", "Lịch đào tạo"], ["store", "Kho đổi quà"], ["policy", "Chính sách L&D"]];

    const [isDark, setIsDark] = React.useState(() => {
      return localStorage.getItem("glh_theme") !== "light";
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
        React.createElement("img", { className: "appbar__logo", src: (window.__resources && window.__resources.logo) || "assets/logo_horizontal.png", alt: "Garena", onClick: () => props.onNav("dashboard"), style: { cursor: "pointer" } }),
        React.createElement("nav", { className: "appbar__nav" },
          tabs.map(([id, label]) => {
            const isStore = id === "store";
            return React.createElement("button", {
              key: id,
              className: "appbar__link" + (props.tab === id ? " is-active" : ""),
              onClick: () => props.onNav(id),
              style: isStore ? { opacity: 0.45, display: "flex", alignItems: "center", gap: 5 } : {},
            },
              label,
              isStore ? React.createElement(Icon, { name: "lock", size: 11, color: "currentColor", style: { marginTop: 1 } }) : null
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
    return React.createElement(window.TweaksPanel, null,
      React.createElement(window.TweakSection, { label: "Thương hiệu" }),
      React.createElement(window.TweakRadio, {
        label: "Màu nhấn", value: t.accent, options: ["red", "amber"],
        onChange: (v) => setTweak("accent", v),
      }),
      React.createElement(window.TweakSelect, {
        label: "Font hiển thị", value: t.displayFont, options: ["Chakra Petch", "Oxanium", "Press Start 2P"],
        onChange: (v) => setTweak("displayFont", v),
      }),
      React.createElement(window.TweakSection, { label: "Nhân vật pixel" }),
      React.createElement(window.TweakSlider, {
        label: "Kích thước sprite", value: t.spriteScale, min: 0.75, max: 1.5, step: 0.05, unit: "×",
        onChange: (v) => setTweak("spriteScale", v),
      }),
      React.createElement(window.TweakToggle, {
        label: "Viền pixel sắc nét", value: t.crisp, onChange: (v) => setTweak("crisp", v),
      }),
      React.createElement(window.TweakSection, { label: "Chuyển động" }),
      React.createElement(window.TweakRadio, {
        label: "Cường độ hiệu ứng", value: t.anim, options: ["subtle", "normal", "celebratory"],
        onChange: (v) => setTweak("anim", v),
      }),
      React.createElement(window.TweakSection, { label: "Prototype" }),
      React.createElement(window.TweakButton, {
        label: "Chơi lại từ đầu", onClick: () => { if (confirm("Xóa toàn bộ tiến độ và chơi lại?")) { actions.reset(); window.scrollTo(0, 0); } },
      }));
  }

  /* ---------- Root App ---------- */
  function AppInner() {
    const { user, actions } = useGame();
    const [t, setTweak] = window.useTweaks(TWEAK_DEFAULTS);

    // initial phase — now starts with login check
    const [phase, setPhase] = React.useState(() => {
      if (!user.email && !user.onboarded) return "login";
      if (!user.quiz_result) return "onboarding";
      return "app";
    });

    // On mount: always verify session with /api/me
    // If 401 → clear stale localStorage and force login
    React.useEffect(() => {
      fetch("/api/me", { credentials: "include" })
        .then((r) => {
          if (r.status === 401) {
            actions.reset(); // clear stale localStorage
            setPhase("login");
            return null;
          }
          return r.ok ? r.json() : null;
        })
        .then((data) => {
          if (data && data.user && data.user.email) {
            if (!user.email) actions.setEmail(data.user.email);
            setPhase(user.quiz_result ? "app" : "onboarding");
          }
        })
        .catch(() => {});
    }, []);
    const [activeSection, setActiveSection] = React.useState("dashboard");

    const [course, setCourse] = React.useState(null);
    const [event, setEvent] = React.useState(null);
    const [ldRequest, setLdRequest] = React.useState(false);
    const [showRating, setShowRating] = React.useState(false);
    const [showTutorial, setShowTutorial] = React.useState(() => {
      return !localStorage.getItem("glh_tutorial_done");
    });
    const dashRef = React.useRef(null);
    const catalogRef = React.useRef(null);
    const calRef = React.useRef(null);
    const sectionRefs = { dashboard: dashRef, catalog: catalogRef, calendar: calRef };

    React.useEffect(() => {
      if (phase !== "app") return;
      const OFFSET = 90;
      const onScroll = () => {
        let cur = "dashboard";
        [["calendar", calRef], ["catalog", catalogRef], ["dashboard", dashRef]].forEach(([id, ref]) => {
          if (ref.current && ref.current.getBoundingClientRect().top <= OFFSET) cur = id;
        });
        setActiveSection(cur);
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => window.removeEventListener("scroll", onScroll);
    }, [phase]);

    const scrollTo = React.useCallback((id) => {

      if (id === "store") { setPhase("store"); window.scrollTo(0, 0); return; }
      if (id === "policy") { setPhase("policy"); window.scrollTo(0, 0); return; }
      if (id === "profile") { setPhase("profile"); window.scrollTo(0, 0); return; }
      const ref = sectionRefs[id];
      if (ref && ref.current) {
        const top = ref.current.getBoundingClientRect().top + window.scrollY - 68;
        window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
      }
    }, [phase]);

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

    let body;
    if (phase === "login") {
      body = React.createElement(S.Login, { onLogin: (email) => { actions.setEmail(email); setPhase(user.quiz_result ? "app" : "onboarding"); } });
    } else if (phase === "onboarding") {
      body = React.createElement(S.Onboarding, { crisp, onStart: (returning) => { returning ? goApp() : setPhase("character"); } });
    } else if (phase === "character") {
      body = React.createElement(S.CharacterCreation, { crisp, onBack: () => setPhase("onboarding"), onNext: () => setPhase("quiz") });
    } else if (phase === "quiz") {
      body = React.createElement(S.Quiz, { onBack: () => setPhase("character"), onComplete: () => setPhase("reveal") });
    } else if (phase === "reveal") {
      body = React.createElement(S.Reveal, { crisp, onNext: () => goApp() });
    } else if (phase === "profile") {
      body = React.createElement(S.Profile, { crisp, onBack: () => { setPhase("app"); window.scrollTo(0, 0); }, onReset: () => { setPhase("onboarding"); window.scrollTo(0, 0); } });
    } else if (phase === "store") {
      body = React.createElement("div", { className: "glh-light" },
        React.createElement(AppBar, { tab: "store", crisp, onNav: scrollTo, onOpenTutorial: () => setShowTutorial(true), onOpenRating: () => setShowRating(true) }),
        React.createElement(S.Store, {}));
    } else if (phase === "policy") {
      body = React.createElement(S.Policy, { crisp, onBack: () => { setPhase("app"); window.scrollTo(0, 0); } });
    } else {
      // app — single scrollable page, nav scrolls to sections
      const utilCommon = { crisp, onNav: scrollTo, onOpenCourse: setCourse, onOpenEvent: setEvent, onOpenLdRequest: () => setLdRequest(true) };
      body = React.createElement("div", { className: "glh-light" },
        React.createElement(AppBar, { tab: activeSection, crisp, onNav: scrollTo, onOpenTutorial: () => setShowTutorial(true), onOpenRating: () => setShowRating(true) }),
        React.createElement("main", null,
          React.createElement("div", { ref: dashRef },
            React.createElement(S.Dashboard, Object.assign({}, utilCommon))),
          React.createElement("div", { style: { height: 1, background: "var(--rpg-border)", margin: "20px clamp(16px,4vw,40px)" } }),
          React.createElement("div", { ref: catalogRef },
            React.createElement(S.Catalog, utilCommon)),
          React.createElement("div", { style: { height: 1, background: "var(--rpg-border)", margin: "20px clamp(16px,4vw,40px)" } }),
          React.createElement("div", { ref: calRef, "data-section": "calendar" },
            React.createElement(S.Calendar, utilCommon))));
    }

    return React.createElement(React.Fragment, null,
      body,

      course ? React.createElement(CourseModal, { course, onClose: () => setCourse(null) }) : null,
      event ? React.createElement(EventModal, { event, onClose: () => setEvent(null) }) : null,
      ldRequest ? React.createElement(S.LdRequestPopup, { onClose: () => setLdRequest(false) }) : null,
      showRating ? React.createElement(S.RatingModal, { onClose: () => setShowRating(false) }) : null,
      showTutorial && phase === "app" ? React.createElement(S.Tutorial, { onClose: () => setShowTutorial(false) }) : null,
      phase === "app" ? React.createElement(S.ChatBot, { hideOnGameWorld: true }) : null,
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

  function App() {
    return React.createElement(window.GLHEngine.GameProvider, null, React.createElement(AppInner, null));
  }

  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(React.createElement(App, null));
})();
