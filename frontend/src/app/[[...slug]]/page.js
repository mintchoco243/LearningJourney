"use client";

import React from "react";
import { GLHEngine } from '@/context/GameContext';
import { GLHUI } from '@/components/GLHUI';
import { GLHAvatar } from '@/components/GLHAvatar';
import { GLHParts } from '@/components/GLHParts';
import { Login } from '@/components/screens/Login';
import { Onboarding, CharacterCreation } from '@/components/screens/Onboarding';
import { Quiz, Reveal } from '@/components/screens/QuizReveal';
import { Policy } from '@/components/screens/ProfilePolicy';
import { Store } from '@/components/screens/Store';
import { Dashboard } from '@/components/screens/Dashboard';
import { Catalog } from '@/components/screens/CatalogCalendar';
import { LdRequestPopup, LdRequestStatusModal, ChatBot } from '@/components/screens/LdRequestChatBot';
import { RatingModal, Tutorial } from '@/components/screens/RatingTutorial';
import { FAQScreen } from '@/components/screens/FAQScreen';
import { AboutModal } from '@/components/screens/AboutModal';
import { trackEvent, trackPageView } from '@/lib/analytics';
import { mapCourseToCard } from '@/lib/courseMap.mjs';
import { MinigameLauncher } from '@/components/MinigameLauncher';

import { useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakSlider, TweakToggle, TweakButton } from '@/components/TweaksPanel';

const { useGame, rankForUser } = GLHEngine;
const { Icon } = GLHUI;
const { Avatar } = GLHAvatar;
const { CourseModal, ConfirmPopup } = GLHParts;








const ACCENTS = { red: { v: "#E41E26", soft: "rgba(228,30,38,0.16)" }, amber: { v: "#FF9E00", soft: "rgba(255,158,0,0.18)" } };
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
  const rank = rankForUser(user);
  const opts = Object.assign({}, user.character, { rank: rank.level });

  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [restartingOnboarding, setRestartingOnboarding] = React.useState(false);
  const [confirmDialog, setConfirmDialog] = React.useState(null);

  // Close sidebar on navigation (for mobile)
  const handleNav = (id) => {
    props.onNav(id);
    setSidebarOpen(false);
  };

  const requestLogout = () => {
    setConfirmDialog({
      id: "logout",
      title: "Đăng xuất",
      message: "Bạn có chắc muốn đăng xuất?",
      confirmText: "Đăng xuất",
      cancelText: "Hủy",
    });
  };

  const requestRestartOnboarding = () => {
    setConfirmDialog({
      id: "restart-onboarding",
      title: "Làm lại Onboarding Quiz",
      message: "Làm lại Onboarding Quiz sẽ xóa các lựa chọn học tập hiện tại và tính lại gợi ý khóa học. Bạn muốn tiếp tục?",
      confirmText: "Làm lại",
      cancelText: "Hủy",
    });
  };

  const handleConfirmDialog = async () => {
    if (!confirmDialog) return;
    if (confirmDialog.id === "logout") {
      setConfirmDialog(null);
      fetch("/auth/logout", { method: "POST", credentials: "include" })
        .finally(() => { setProfileOpen(false); props.onLogout && props.onLogout(); });
      return;
    }
    if (confirmDialog.id === "restart-onboarding") {
      setRestartingOnboarding(true);
      const ok = await props.onRestartOnboarding?.();
      setRestartingOnboarding(false);
      if (!ok) {
        setConfirmDialog({
          id: "restart-onboarding-error",
          title: "Không thể đặt lại",
          message: "Không thể đặt lại Onboarding Quiz. Vui lòng thử lại.",
          confirmText: "Đóng",
        });
        return;
      }
      setConfirmDialog(null);
      setProfileOpen(false);
      return;
    }
    setConfirmDialog(null);
  };

  const tabs = [
    ["home", "Trang chủ", "home"],
    ["library", "Thư viện đào tạo", "book-open"],
    ["qa", "FAQ", "help-circle"],
  ];

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
          React.createElement("div", { style: { position: "relative", flex: "0 0 auto" } },
            React.createElement("button", { className: "appbar__mini", "data-tour": "profile", onClick: () => setProfileOpen((value) => !value), title: "Mở menu cá nhân", style: { cursor: "pointer" } },
              React.createElement("div", { style: { width: 34, height: 34, borderRadius: "50%", overflow: "hidden", background: "#0a0e15", display: "grid", placeItems: "center" } },
                React.createElement(Avatar, { opts: opts, size: "100%", crisp: props.crisp })),
              React.createElement("div", { style: { textAlign: "left", lineHeight: 1.2 } },
                React.createElement("div", { className: "nm" }, user.email ? user.email.split("@")[0] : "Người dùng"))),
            profileOpen && React.createElement("div", { style: { position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 80, minWidth: 250, padding: 8, background: "var(--ui-surface, var(--rpg-panel))", border: "1px solid var(--ui-box-border, var(--rpg-border))", borderRadius: 10, boxShadow: "0 16px 36px rgba(0,0,0,.22)" } },
              React.createElement("button", {
                type: "button",
                disabled: restartingOnboarding,
                onClick: requestRestartOnboarding,
                style: { width: "100%", padding: "9px 10px", border: 0, borderBottom: "1px solid var(--ui-box-border)", background: "transparent", color: "var(--ui-heading)", textAlign: "left", cursor: restartingOnboarding ? "wait" : "pointer", borderRadius: 6, display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }
              }, React.createElement(Icon, { name: "rotate-ccw", size: 15, color: "currentColor" }), restartingOnboarding ? "Đang đặt lại..." : "Làm lại Onboarding Quiz"),
              React.createElement("button", {
                type: "button",
                onClick: requestLogout,
                style: { width: "100%", padding: "9px 10px", border: 0, background: "transparent", color: "var(--ui-heading)", textAlign: "left", cursor: "pointer", borderRadius: 6, display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }
              }, React.createElement(Icon, { name: "log-out", size: 15, color: "currentColor" }), "Log out")
            )
          )
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
          }, React.createElement(Icon, { name: "star", size: 18, color: "var(--amber)" }))
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
              requestLogout();
            }
          }, React.createElement(Icon, { name: "log-out", size: 16, color: "var(--ui-heading)" }))
        )
      )
    ),
    React.createElement(ConfirmPopup, {
      dialog: confirmDialog,
      busy: restartingOnboarding,
      onCancel: () => !restartingOnboarding && setConfirmDialog(null),
      onConfirm: handleConfirmDialog,
    })
  );
}


/* ---------- Tweaks ---------- */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "red",
  "spriteScale": 1,
  "crisp": false,
  "anim": "normal"
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

function BackToTop() {
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 360);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (!visible) return null;
  return React.createElement("button", {
    type: "button",
    onClick: () => {
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      window.scrollTo(0, 0);
    },
    title: "Lên đầu trang",
    style: {
      position: "fixed", right: 220, bottom: 47, zIndex: 110,
      width: 40, height: 40, borderRadius: "50%",
      border: "2px solid #ff3b30", background: "var(--ui-surface, var(--rpg-panel, #14181f))",
      color: "#ff3b30", display: "grid", placeItems: "center", cursor: "pointer",
      boxShadow: "0 0 0 3px rgba(255,59,48,.25), 0 0 16px rgba(255,59,48,.65)",
    },
  }, React.createElement(Icon, { name: "chevron-up", size: 26, color: "currentColor" }));
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
  const previewPhase = (() => {
    if (process.env.NODE_ENV === "production" || typeof window === "undefined") return "";
    const value = new URLSearchParams(window.location.search).get("preview");
    return ["onboarding", "character", "reveal", "home", "qa"].includes(value) ? value : "";
  })();

  // initial phase - now starts with login check
  const [phase, setPhase] = React.useState(() => {
    if (previewPhase) return previewPhase;
    if (!user.email && !user.onboarded) return "login";
    if (!user.quiz_result) return "onboarding";
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      if (path === "/library") return "app";
      if (path === "/policy") return "qa";
      if (path === "/qa") return "qa";
      if (path === "/profile") return "app";
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
      setPhase("qa");
      if (typeof window !== "undefined") window.history.replaceState(null, "", "/qa");
    } else if (path === "/qa") {
      setPhase("qa");
    } else if (path === "/profile") {
      setPhase("app");
      setActiveTab("home");
      if (typeof window !== "undefined") window.history.replaceState(null, "", "/");
    } else if (path === "/store") {
      setPhase("store");
    } else {
      setPhase("app");
      setActiveTab("home");
    }
  }, [setPhase, setActiveTab]);

  // On mount: verify server session without destroying local learning progress.
  React.useEffect(() => {
    if (previewPhase) return;
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
          actions.setUserProfile(data.user, data.enrollments, data.reservations, data.favorites);
          if (user.quiz_result || data.user.quiz_result || data.user.onboarding_done) {
            syncRouteState();
          } else {
            setPhase("onboarding");
          }
        }
      })
      .catch(() => { });
  }, [actions, user.email, user.onboarded, user.quiz_result, syncRouteState, previewPhase]);

  const [course, setCourse] = React.useState(null);
  const [ldRequest, setLdRequest] = React.useState(false);
  const [ldRequestStatus, setLdRequestStatus] = React.useState(false);
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
    if (!user.email || typeof window === "undefined") return undefined;
    const activity = course ? "course" : (phase === "app" && activeTab === "library" ? "library" : phase === "app" && activeTab === "home" ? "home" : "");
    if (!activity) return undefined;
    const timer = window.setInterval(() => {
      window.dispatchEvent(new CustomEvent("minigame:activity", { detail: { activity, seconds: 5 } }));
      fetch("/api/minigame/activity", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activity, seconds: 5 }),
      }).catch(() => {});
    }, 5000);
    return () => window.clearInterval(timer);
  }, [user.email, phase, activeTab, course]);

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
  }, [t.accent, t.spriteScale]);

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

  const restartOnboarding = React.useCallback(async () => {
    const ok = await actions.resetOnboarding();
    if (!ok) return false;
    setCourse(null);
    setPhase("onboarding");
    setActiveTab("home");
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", "/");
      window.scrollTo(0, 0);
    }
    return true;
  }, [actions]);

  if (!mounted) return null;
  let body;
  if (phase === "login") {
    body = React.createElement(Login, { onLogin: (email) => {
      fetch("/api/me", { credentials: "include" })
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (data && data.user) {
            actions.setUserProfile(data.user, data.enrollments, data.reservations, data.favorites);
            if (data.user.onboarding_done) {
              syncRouteState();
            } else {
              setPhase("onboarding");
            }
          } else {
            actions.setEmail(email);
            setPhase("onboarding");
          }
        })
        .catch(() => {
          actions.setEmail(email);
          setPhase("onboarding");
        });
    } });
  } else if (phase === "onboarding") {
    body = React.createElement(Onboarding, { crisp, onStart: (returning) => { returning ? goApp() : setPhase("character"); } });
  } else if (phase === "character") {
    body = React.createElement(CharacterCreation, { crisp, onBack: () => setPhase("onboarding"), onNext: () => setPhase("quiz") });
  } else if (phase === "quiz") {
    body = React.createElement(Quiz, { onBack: () => setPhase("character"), onComplete: () => setPhase("reveal") });
  } else if (phase === "reveal") {
    body = React.createElement(Reveal, { crisp, onNext: () => goApp() });
  } else if (phase === "policy") {
    body = React.createElement("div", { className: "glh-layout glh-light" },
      React.createElement(AppBar, { tab: "policy", crisp, onNav: scrollTo, onOpenAbout: () => setShowAbout(true), onOpenTutorial: () => setShowTutorial(true), onOpenRating: () => setShowRating(true), onRestartOnboarding: restartOnboarding, onLogout: () => { actions.reset(); setPhase("login"); if (typeof window !== "undefined") { window.history.replaceState(null, "", "/"); } window.scrollTo(0, 0); } }),
      React.createElement("main", { className: "app-main" },
        React.createElement(Policy, { crisp, onBack: () => { setPhase("app"); setActiveTab("home"); if (typeof window !== "undefined") { window.history.pushState(null, "", "/"); } window.scrollTo(0, 0); } })));
  } else if (phase === "qa") {
    body = React.createElement("div", { className: "glh-layout glh-light" },
      React.createElement(AppBar, { tab: "qa", crisp, onNav: scrollTo, onOpenAbout: () => setShowAbout(true), onOpenTutorial: () => setShowTutorial(true), onOpenRating: () => setShowRating(true), onRestartOnboarding: restartOnboarding, onLogout: () => { actions.reset(); setPhase("login"); if (typeof window !== "undefined") { window.history.replaceState(null, "", "/"); } window.scrollTo(0, 0); } }),
      React.createElement("main", { className: "app-main" }, React.createElement(FAQScreen, null)));
  } else {
    // app - tab-based navigation
    const utilCommon = { crisp, onNav: scrollTo, onOpenCourse: setCourse, onOpenLdRequest: () => setLdRequest(true) };
    const appBar = React.createElement(AppBar, { tab: activeTab, crisp, onNav: scrollTo, onOpenAbout: () => setShowAbout(true), onOpenTutorial: () => setShowTutorial(true), onOpenRating: () => setShowRating(true), onRestartOnboarding: restartOnboarding, onLogout: () => { actions.reset(); setPhase("login"); if (typeof window !== "undefined") { window.history.replaceState(null, "", "/"); } window.scrollTo(0, 0); } });
    let tabContent;
    if (activeTab === "home") {
      tabContent = React.createElement(Dashboard, {
        crisp,
        onNav: scrollTo,
        onOpenCourse: setCourse,
        onOpenLdRequest: () => setLdRequest(true),
        onOpenLdRequestStatus: () => setLdRequestStatus(true),
      });
    } else if (activeTab === "library") {
      tabContent = React.createElement("div", null,
        React.createElement(Catalog, utilCommon),
        React.createElement("button", {
          className: "library-fab",
          "data-tour": "training-request",
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
    React.createElement(MinigameLauncher, { authenticated: Boolean(user.email) }),

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
    ldRequestStatus ? React.createElement(LdRequestStatusModal, { onClose: () => setLdRequestStatus(false) }) : null,
    showRating ? React.createElement(RatingModal, { onClose: () => setShowRating(false) }) : null,
    showAbout ? React.createElement(AboutModal, { onClose: () => setShowAbout(false) }) : null,
    showTutorial && phase === "app" ? React.createElement(Tutorial, { onClose: () => setShowTutorial(false) }) : null,
    !["login", "onboarding", "character", "quiz"].includes(phase) ? React.createElement(ChatBot, {
      hideOnGameWorld: true,
      onOpenLdRequest: () => setLdRequest(true),
      onOpenCourse: setCourse,
    }) : null,
    !["login", "onboarding", "character", "quiz"].includes(phase) ? React.createElement(ContactFooter, null) : null,
    !["login", "onboarding", "character", "quiz"].includes(phase) ? React.createElement(BackToTop, null) : null,
    React.createElement(XpToast, null),
    React.createElement(TweaksUI, { t, setTweak }));
}

export default function App() {
  return React.createElement(GLHEngine.GameProvider, null, React.createElement(AppInner, null));
}
