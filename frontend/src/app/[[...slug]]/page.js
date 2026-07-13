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
import { Catalog } from '@/components/screens/CatalogCalendar';
import { LdRequestPopup, ChatBot } from '@/components/screens/LdRequestChatBot';
import { RatingModal, Tutorial } from '@/components/screens/RatingTutorial';
import { FAQScreen } from '@/components/screens/FAQScreen';
import { AboutModal } from '@/components/screens/AboutModal';
import { trackEvent, trackPageView } from '@/lib/analytics';
import { mapCourseToCard } from '@/lib/courseMap.mjs';

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
  { id: 1, q: "Khóa học có giới hạn số lượng chỗ không? Nếu hết chỗ thì có được vào waitlist không?", a: "Chủ yếu các khóa không giới hạn số lượng chỗ, nếu có bạn sẽ nhìn thấy số lượng đã đăng ký / số lượng chỗ tối đa trên giao diện khóa học." },
  { id: 3, q: "Sau khi đăng ký, tôi có nhận được xác nhận/nhắc lịch qua email hoặc calendar không?", a: "Có, bạn sẽ được đặt lịch trên calendar trong 24h kể từ khi đăng ký và được nhắc lịch trước ngày - giờ tổ chức khóa học." },
  { id: 5, q: "Làm thế nào để xem tài liệu của các khóa đã qua/đã học? Nếu không tham gia thì có được xem tài liệu không?", a: "Tài liệu (slide, link) được đính kèm trực tiếp trên trang chi tiết từng khóa học và hiển thị cho tất cả người dùng đã đăng nhập, không giới hạn chỉ người đã tham gia hay đã đăng ký. Tuy nhiên một số buổi đào tạo sẽ có giới hạn bảo mật về tài liệu nên có thể không được mở truy cập cho tất cả mọi người." },
  { id: 6, q: "Nếu tôi bỏ lỡ buổi học thì có bản ghi hình để xem lại không?", a: "Thông thường sẽ có đính kèm link bản ghi hình cho khóa học, trừ trường hợp có thông tin bảo mật. Nếu có, bạn có thể xem trực tiếp trên trang chi tiết khóa học — không phân biệt đã tham gia hay chưa." },
  { id: 7, q: "Tôi đánh giá (rating) khóa học vào lúc nào — có bắt buộc để được tính \"hoàn thành\" không?", a: "Bạn có thể gửi trực tiếp tại buổi hoặc gửi đánh giá sau khi khóa học được ghi nhận hoàn thành trong hồ sơ của bạn. Không bắt buộc để tính hoàn thành, nhưng BP Đào tạo rất mong nhận được phản hồi của bạn để chuẩn bị những buổi đào tạo với chất lượng cao hơn!" },
  { id: 8, q: "Đánh giá tôi gửi có hiển thị công khai cho người khác xem không, hay chỉ admin thấy?", a: "Một số đánh giá sẽ hiển thị công khai kèm tên và team của bạn cho tất cả người dùng xem trên trang khóa học với mục đích cung cấp thêm thông tin cho mọi người khi quyết định tham dự khóa học." },
  { id: 9, q: "Nếu chủ đề tôi cần học chưa có trong danh mục, gửi yêu cầu (L&D Request) xong bao lâu thì được phản hồi?", a: "Bạn có thể gửi yêu cầu đào tạo riêng qua L&D Request, Bộ phận Đào tạo sẽ phản hồi trong 3-5 ngày làm việc. Trạng thái sẽ được cập nhật cho bạn trong Trang cá nhân." },
  { id: 10, q: "Tôi có thể đăng ký khóa học không thuộc rank/phòng ban/vai trò được gợi ý cho mình không?", a: "Có. Rank và vai trò chỉ được dùng để gợi ý những khóa có độ phù hợp cao nhất cho bạn, chứ không giới hạn quyền đăng ký — bạn có thể đăng ký bất kỳ khóa học nào bạn muốn." },
];

function FAQSection() {
  const [expanded, setExpanded] = React.useState(null);

  return React.createElement("div", { className: "glh-container", style: { padding: "28px clamp(16px,4vw,40px)" } },
    React.createElement("h1", { className: "u-h2", style: { marginBottom: 8, fontSize: "clamp(26px,4vw,36px)" } }, "FAQ"),
    React.createElement("p", { style: { color: "var(--ui-muted)", marginBottom: 24, fontSize: 14 } }, "Các câu hỏi thường gặp về đăng ký, đề xuất và truy cập khóa học."),

    React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } },
      FAQ_SAMPLES.map(item => {
        const isOpen = expanded === item.id;
        return React.createElement("div", {
          key: item.id,
          className: "u-card",
          style: {
            padding: 20,
            borderColor: isOpen ? "var(--garena-red)" : "var(--ui-box-border)",
          },
        },
          React.createElement("button", {
            onClick: () => setExpanded(isOpen ? null : item.id),
            style: {
              background: "none", border: "none", color: "var(--ui-heading)", fontSize: 14, fontWeight: 600,
              width: "100%", textAlign: "left", display: "flex", justifyContent: "space-between",
              alignItems: "center", gap: 16, cursor: "pointer", padding: 0,
            },
          },
            React.createElement("span", null, item.q),
            React.createElement("span", {
              style: {
                flex: "0 0 auto", width: 22, height: 22, borderRadius: "50%",
                border: "1px solid var(--ui-box-border)", color: "var(--ui-muted)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 15, lineHeight: 1,
              },
            }, isOpen ? "×" : "+")),
          isOpen && React.createElement("div", {
            style: { fontSize: 13, color: "var(--ui-muted)", marginTop: 16, lineHeight: 1.7 },
          }, item.a));
      }))
  );
}
/* ---------- App bar (Sidebar) ---------- */
function AppBar(props) {
  const { user } = useGame();
  const cls = D.CLASSES[user.quiz_result.class_id] || D.CLASSES["ENG"];
  const rank = rankForUser(user);
  const opts = Object.assign({}, user.character, { classColor: cls.color, rank: rank.level });

  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  // Close sidebar on navigation (for mobile)
  const handleNav = (id) => {
    props.onNav(id);
    setSidebarOpen(false);
  };

  const tabs = [
    ["home", "Trang chủ", "home"],
    ["library", "Thư viện đào tạo", "book-open"],
    ["policy", "Chính sách đào tạo", "layers"],
    ["qa", "FAQ", "help-circle"],
  ];

  const [isDark, setIsDark] = React.useState(() => {
    try { if (typeof window !== "undefined") { return localStorage.getItem("glh_theme") !== "light"; } } catch (e) { } return true;
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

  return React.createElement(React.Fragment, null,
    // Desktop header (only visible >= 1160px)
    React.createElement("header", { className: "appbar desktop-only" },
      React.createElement("div", { className: "appbar__in" },
        React.createElement("nav", { className: "appbar__nav" },
          tabs.map(([id, label, icon]) => {
            const isStore = id === "store";
            const isHome = id === "home";
            return React.createElement("button", {
              key: id,
              className: "appbar__link" + (props.tab === id ? " is-active" : ""),
              "data-tour": "nav-" + id,
              onClick: () => handleNav(id),
              style: isStore ? { opacity: 0.45, display: "flex", alignItems: "center", gap: 5 }
                : isHome ? { display: "flex", alignItems: "center", marginLeft: -14 }
                  : {},
            },
              isHome ? React.createElement(React.Fragment, null,
                React.createElement("img", { src: "/assets/logo_icon.png", alt: "Garena", style: { height: 24, display: "block" } }),
                React.createElement("span", { className: "glh-brand-text", style: { fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", marginLeft: 8 } }, "Garena Learning Compass"))
                : isStore ? React.createElement(React.Fragment, null, label, React.createElement(Icon, { name: "lock", size: 11, color: "currentColor", style: { marginTop: 1 } }))
                  : label
            );
          })),
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, flex: "0 0 auto" } },
          // About button
          React.createElement("button", {
            onClick: () => props.onOpenAbout && props.onOpenAbout(),
            title: "Về Learning Compass",
            style: { width: 34, height: 34, borderRadius: 8, background: "var(--rpg-panel)", border: "1px solid var(--rpg-border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }
          }, React.createElement(Icon, { name: "info", size: 16, color: "var(--ui-heading)" })),
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
          }, React.createElement(Icon, { name: isDark ? "sun" : "moon", size: 16, color: "var(--ui-heading)" })),
          // Logout button
          React.createElement("button", {
            title: "Đăng xuất",
            onClick: () => {
              if (!confirm("Bạn có chắc muốn đăng xuất?")) return;
              fetch("/auth/logout", { method: "POST", credentials: "include" })
                .finally(() => { props.onLogout && props.onLogout(); });
            },
            style: { width: 34, height: 34, borderRadius: 8, background: "var(--rpg-panel)", border: "1px solid var(--rpg-border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }
          }, React.createElement(Icon, { name: "log-out", size: 16, color: "var(--ui-heading)" })),
          React.createElement("button", { className: "appbar__mini", "data-tour": "profile", onClick: () => handleNav("profile"), title: "Thông tin tôi", style: { cursor: "pointer" } },
            React.createElement("div", { style: { width: 34, height: 34, borderRadius: "50%", overflow: "hidden", background: "#0a0e15", display: "grid", placeItems: "center" } },
              React.createElement(Avatar, { opts: opts, size: "100%", crisp: props.crisp })),
            React.createElement("div", { style: { textAlign: "left", lineHeight: 1.2 } },
              React.createElement("div", { className: "nm" }, user.email ? user.email.split("@")[0] : "Người dùng")))
        )
      )
    ),

    // Mobile header (only visible < 1160px)
    React.createElement("header", { className: "mobile-header mobile-only" },
      React.createElement("button", { className: "mobile-header__menu", onClick: () => setSidebarOpen(true) },
        React.createElement(Icon, { name: "menu", size: 24, color: "var(--rpg-muted)" })
      ),
      React.createElement("div", { className: "mobile-header__logo" },
        React.createElement("img", { src: "/assets/logo_icon.png", alt: "Garena", style: { height: 24 } }),
        React.createElement("span", { className: "glh-brand-text", style: { fontWeight: 700, fontSize: 13, marginLeft: 8 } }, "Learning Compass")
      )
    ),

    // Sidebar Backdrop for mobile
    sidebarOpen && React.createElement("div", {
      className: "sidebar-backdrop mobile-only",
      onClick: () => setSidebarOpen(false)
    }),

    // Sidebar
    React.createElement("aside", { className: "app-sidebar mobile-only" + (sidebarOpen ? " is-open" : "") },
      React.createElement("div", { className: "app-sidebar__top" },
        React.createElement("div", null),
        React.createElement("button", { className: "sidebar-close", onClick: () => setSidebarOpen(false) },
          React.createElement(Icon, { name: "x", size: 24, color: "var(--rpg-muted)" })
        )
      ),

      React.createElement("nav", { className: "app-sidebar__nav" },
        tabs.map(([id, label, icon]) => {
          const isStore = id === "store";
          const isHome = id === "home";
          const isActive = props.tab === id;
          return React.createElement("button", {
            key: id,
            className: "app-sidebar__link" + (isActive ? " is-active" : ""),
            onClick: () => handleNav(id),
            style: isStore ? { opacity: 0.6 } : {}
          },
            isHome ? React.createElement("img", { src: "/assets/logo_icon.png", alt: "Garena", style: { height: 24, width: 24, objectFit: "contain" } }) : React.createElement(Icon, { name: icon, size: 18, color: "currentColor" }),
            isHome ? React.createElement("span", { className: "glh-brand-text", style: { fontWeight: 700, fontSize: 14 } }, "Garena Learning Compass") : React.createElement("span", null, label),
            isStore && React.createElement(Icon, { name: "lock", size: 12, color: "var(--rpg-muted)", style: { marginLeft: "auto" } })
          );
        })
      ),

      React.createElement("div", { className: "app-sidebar__bottom" },
        React.createElement("div", { className: "app-sidebar__tools" },
          React.createElement("button", {
            className: "tool-btn", onClick: () => props.onOpenAbout && props.onOpenAbout(), title: "Về Learning Compass"
          }, React.createElement(Icon, { name: "info", size: 18, color: "var(--rpg-muted)" })),
          React.createElement("button", {
            className: "tool-btn", onClick: () => props.onOpenRating && props.onOpenRating(), title: "Đánh giá"
          }, React.createElement(Icon, { name: "star", size: 18, color: "var(--amber)" })),
          React.createElement("button", {
            className: "tool-btn", onClick: toggleTheme, title: "Đổi Theme"
          }, React.createElement(Icon, { name: isDark ? "sun" : "moon", size: 18, color: "var(--rpg-muted)" }))
        ),

        React.createElement("div", { className: "app-sidebar__profile", onClick: () => handleNav("profile") },
          React.createElement("div", { className: "avatar-box" },
            React.createElement(Avatar, { opts: opts, size: 36, crisp: props.crisp })
          ),
          React.createElement("div", { className: "profile-info" },
            React.createElement("div", { className: "nm" }, user.email ? user.email.split("@")[0] : "Người dùng")
          ),
          React.createElement("button", {
            className: "logout-btn",
            title: "Đăng xuất",
            onClick: (e) => {
              e.stopPropagation();
              if (!confirm("Bạn có chắc muốn đăng xuất?")) return;
              fetch("/auth/logout", { method: "POST", credentials: "include" })
                .finally(() => { props.onLogout && props.onLogout(); });
            }
          }, React.createElement(Icon, { name: "log-out", size: 16, color: "var(--ui-heading)" }))
        )
      )
    )
  );
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

function EmailChip({ email }) {
  const [copied, setCopied] = React.useState(false);
  const copy = () => {
    navigator.clipboard.writeText(email).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };
  return React.createElement("button", {
    onClick: copy,
    style: {
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 999,
      background: "rgba(228,30,38,0.1)", border: "1px solid rgba(228,30,38,0.25)",
      color: copied ? "var(--garena-positive)" : "var(--glh-accent)",
      fontSize: 12, fontWeight: 600, cursor: "pointer",
      transition: "color 0.2s",
    }
  }, copied ? "Đã sao chép!" : email);
}

function ContactFooter() {
  return React.createElement("footer", { className: "contact-footer" },
    React.createElement("p", { className: "contact-footer__text" },
      "Mọi thắc mắc vui lòng liên hệ bộ phận People: ",
      React.createElement(EmailChip, { email: "minhngoc.phamnguyen@garena.vn" }),
      " hoặc ",
      React.createElement(EmailChip, { email: "thutrang.pham@garena.vn" })
    )
  );
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
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      if (path === "/library") return "app";
      if (path === "/policy") return "policy";
      if (path === "/qa") return "qa";
      if (path === "/profile") return "profile";
      if (path === "/store") return "store";
    }
    return "app";
  });

  const [activeTab, setActiveTab] = React.useState(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      if (path === "/library") return "library";
    }
    return "home";
  });

  // Helper to sync phase and tab based on pathname
  const syncRouteState = React.useCallback((path = typeof window !== "undefined" ? window.location.pathname : "/") => {
    if (path === "/library") {
      setPhase("app");
      setActiveTab("library");
    } else if (path === "/policy") {
      setPhase("policy");
    } else if (path === "/qa") {
      setPhase("qa");
    } else if (path === "/profile") {
      setPhase("profile");
    } else if (path === "/store") {
      setPhase("store");
    } else {
      setPhase("app");
      setActiveTab("home");
    }
  }, [setPhase, setActiveTab]);

  // On mount: verify server session without destroying local learning progress.
  React.useEffect(() => {
    if (verifiedSessionRef.current) return;
    verifiedSessionRef.current = true;
    fetch("/api/me", { credentials: "include" })
      .then((r) => {
        if (r.status === 401) {
          if (process.env.NODE_ENV !== "production" && user.email) {
            return fetch("/auth/dev-login", {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: user.email }),
            })
              .then((loginRes) => (loginRes.ok ? fetch("/api/me", { credentials: "include" }) : null))
              .then((meRes) => (meRes?.ok ? meRes.json() : null));
          }
          if (!user.email && !user.onboarded && !user.quiz_result) setPhase("login");
          return null;
        }
        return r.ok ? r.json() : null;
      })
      .then((data) => {
        if (data && data.user && data.user.email) {
          actions.setUserProfile(data.user, data.enrollments, data.reservations);
          if (user.quiz_result || data.user.quiz_result) {
            syncRouteState();
          } else {
            setPhase("onboarding");
          }
        }
      })
      .catch(() => { });
  }, [actions, user.email, user.onboarded, user.quiz_result, syncRouteState]);

  const [course, setCourse] = React.useState(null);
  const [ldRequest, setLdRequest] = React.useState(false);
  const [showAbout, setShowAbout] = React.useState(false);
  const [showRating, setShowRating] = React.useState(false);
  const [courseLinkNotice, setCourseLinkNotice] = React.useState("");
  const activeCourseLinkRef = React.useRef("");
  const [showTutorial, setShowTutorial] = React.useState(() => {
    try { if (typeof window !== "undefined") { return !localStorage.getItem("glh_tutorial_done"); } } catch (e) { } return false;
  });

  // Listen to browser popstate (back/forward navigation)
  React.useEffect(() => {
    if (!user.email || !user.quiz_result) return;
    const handlePopState = () => {
      syncRouteState();
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [user.email, user.quiz_result, syncRouteState]);

  React.useEffect(() => {
    if (phase === "login") return; // Chỉ loại trừ màn hình login, theo dõi toàn bộ phễu onboarding
    const pageName = phase === "app" ? activeTab : phase;
    trackPageView(`/${pageName}`, pageName);
    if (pageName === "policy") trackEvent("policy_view", { page: "policy" });
  }, [phase, activeTab]);

  React.useEffect(() => {
    if (!mounted || !user.email || !user.quiz_result || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const courseId = params.get("courseId");
    if (!courseId) {
      activeCourseLinkRef.current = "";
      return;
    }
    if (activeCourseLinkRef.current === courseId) return;
    activeCourseLinkRef.current = courseId;
    setCourseLinkNotice("");
    setPhase("app");
    setActiveTab("library");
    fetch(`/api/courses/${encodeURIComponent(courseId)}`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("COURSE_NOT_FOUND");
        return res.json();
      })
      .then((data) => {
        if (!data?.course) throw new Error("COURSE_NOT_FOUND");
        setCourse(mapCourseToCard(data.course));
      })
      .catch(() => {
        setCourse(null);
        setCourseLinkNotice("Khóa học không còn khả dụng hoặc bạn chưa có quyền xem khóa này.");
      });
  }, [mounted, user.email, user.quiz_result]);

  const pendingScroll = React.useRef(null);
  React.useEffect(() => {
    if (!pendingScroll.current) return;
    const el = document.getElementById(pendingScroll.current);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    pendingScroll.current = null;
  }, [activeTab]);

  const scrollTo = React.useCallback((id, section) => {
    if (section) pendingScroll.current = section;
    
    // 1. Update React state immediately
    if (id === "home") {
      setPhase("app");
      setActiveTab("home");
    } else if (id === "library") {
      setPhase("app");
      setActiveTab("library");
    } else {
      setPhase(id);
    }

    // 2. Push to browser history without Next.js unmount/remount
    const targetUrl = id === "home" ? "/" : "/" + id;
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", targetUrl);
    }
    window.scrollTo(0, 0);
  }, [setPhase, setActiveTab]);

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
  const closeCourse = React.useCallback(() => {
    setCourse(null);
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (!url.searchParams.has("courseId")) return;
    url.searchParams.delete("courseId");
    activeCourseLinkRef.current = "";
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  }, []);

  const goApp = () => {
    setPhase("app");
    setActiveTab("home");
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", "/");
    }
    window.scrollTo(0, 0);
  };

  if (!mounted) return null;
  let body;
  if (phase === "login") {
    body = React.createElement(Login, { onLogin: (email) => {
      actions.setEmail(email);
      syncRouteState();
    } });
  } else if (phase === "onboarding") {
    body = React.createElement(Onboarding, { crisp, onStart: (returning) => { returning ? goApp() : setPhase("character"); } });
  } else if (phase === "character") {
    body = React.createElement(CharacterCreation, { crisp, onBack: () => setPhase("onboarding"), onNext: () => setPhase("quiz") });
  } else if (phase === "quiz") {
    body = React.createElement(Quiz, { onBack: () => setPhase("character"), onComplete: () => setPhase("reveal") });
  } else if (phase === "reveal") {
    body = React.createElement(Reveal, { crisp, onNext: () => goApp() });
  } else if (phase === "profile") {
    body = React.createElement("div", { className: "glh-layout glh-light" },
      React.createElement(AppBar, { tab: "profile", crisp, onNav: scrollTo, onOpenAbout: () => setShowAbout(true), onOpenTutorial: () => setShowTutorial(true), onOpenRating: () => setShowRating(true), onLogout: () => { actions.reset(); setPhase("login"); if (typeof window !== "undefined") { window.history.replaceState(null, "", "/"); } window.scrollTo(0, 0); } }),
      React.createElement("main", { className: "app-main" },
        React.createElement(Profile, { crisp, onBack: () => { setPhase("app"); setActiveTab("home"); if (typeof window !== "undefined") { window.history.pushState(null, "", "/"); } window.scrollTo(0, 0); } }))
    );
  } else if (phase === "policy") {
    body = React.createElement("div", { className: "glh-layout glh-light" },
      React.createElement(AppBar, { tab: "policy", crisp, onNav: scrollTo, onOpenAbout: () => setShowAbout(true), onOpenTutorial: () => setShowTutorial(true), onOpenRating: () => setShowRating(true), onLogout: () => { actions.reset(); setPhase("login"); if (typeof window !== "undefined") { window.history.replaceState(null, "", "/"); } window.scrollTo(0, 0); } }),
      React.createElement("main", { className: "app-main" },
        React.createElement(Policy, { crisp, onBack: () => { setPhase("app"); setActiveTab("home"); if (typeof window !== "undefined") { window.history.pushState(null, "", "/"); } window.scrollTo(0, 0); } })));
  } else if (phase === "qa") {
    body = React.createElement("div", { className: "glh-layout glh-light" },
      React.createElement(AppBar, { tab: "qa", crisp, onNav: scrollTo, onOpenAbout: () => setShowAbout(true), onOpenTutorial: () => setShowTutorial(true), onOpenRating: () => setShowRating(true), onLogout: () => { actions.reset(); setPhase("login"); if (typeof window !== "undefined") { window.history.replaceState(null, "", "/"); } window.scrollTo(0, 0); } }),
      React.createElement("main", { className: "app-main" }, React.createElement(FAQScreen, null)));
  } else {
    // app - tab-based navigation
    const utilCommon = { crisp, onNav: scrollTo, onOpenCourse: setCourse, onOpenLdRequest: () => setLdRequest(true) };
    const appBar = React.createElement(AppBar, { tab: activeTab, crisp, onNav: scrollTo, onOpenAbout: () => setShowAbout(true), onOpenTutorial: () => setShowTutorial(true), onOpenRating: () => setShowRating(true), onLogout: () => { actions.reset(); setPhase("login"); if (typeof window !== "undefined") { window.history.replaceState(null, "", "/"); } window.scrollTo(0, 0); } });
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
        React.createElement(Catalog, utilCommon),
        React.createElement("button", {
          className: "library-fab",
          onClick: utilCommon.onOpenLdRequest,
          title: "Gửi yêu cầu học tập",
        },
          React.createElement(Icon, { name: "send", size: 18, color: "#fff" }),
          React.createElement("span", { className: "library-fab__label" }, "Gửi yêu cầu")));
    }
    body = React.createElement("div", { className: "glh-layout glh-light" }, appBar, React.createElement("main", { className: "app-main" }, tabContent));
  }

  return React.createElement(React.Fragment, null,
    body,

    course ? React.createElement(CourseModal, { course, onClose: closeCourse }) : null,
    courseLinkNotice ? React.createElement("div", {
      style: {
        position: "fixed",
        right: 18,
        bottom: 18,
        zIndex: 1000,
        maxWidth: 360,
        background: "var(--rpg-panel)",
        border: "1px solid var(--rpg-border)",
        borderRadius: 8,
        padding: "12px 14px",
        color: "var(--ui-heading)",
        boxShadow: "0 16px 44px rgba(0,0,0,.28)",
        fontSize: 13,
        lineHeight: 1.5,
      },
    },
      React.createElement("div", { style: { display: "flex", gap: 10, alignItems: "flex-start" } },
        React.createElement(Icon, { name: "alert-circle", size: 17, color: "var(--glh-accent)" }),
        React.createElement("div", { style: { flex: 1 } }, courseLinkNotice),
        React.createElement("button", {
          onClick: () => setCourseLinkNotice(""),
          style: { background: "transparent", border: 0, color: "var(--ui-muted)", cursor: "pointer", padding: 0 },
          title: "Đóng",
        }, React.createElement(Icon, { name: "x", size: 15, color: "var(--ui-muted)" })))) : null,
    ldRequest ? React.createElement(LdRequestPopup, { onClose: () => setLdRequest(false) }) : null,
    showRating ? React.createElement(RatingModal, { onClose: () => setShowRating(false) }) : null,
    showAbout ? React.createElement(AboutModal, { onClose: () => setShowAbout(false) }) : null,
    showTutorial && phase === "app" ? React.createElement(Tutorial, { onClose: () => setShowTutorial(false) }) : null,
    !["login", "onboarding", "character", "quiz"].includes(phase) ? React.createElement(ChatBot, {
      hideOnGameWorld: true,
      onOpenLdRequest: () => setLdRequest(true)
    }) : null,
    !["login", "onboarding", "character", "quiz"].includes(phase) ? React.createElement(ContactFooter, null) : null,
    React.createElement(XpToast, null),
    React.createElement(TweaksUI, { t, setTweak }));
}

export default function App() {
  return React.createElement(GLHEngine.GameProvider, null, React.createElement(AppInner, null));
}
