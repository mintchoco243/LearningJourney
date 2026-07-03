"use client";

import React from "react";
import { GLHUI } from '../GLHUI';

const { Icon } = GLHUI;



  /* ---- Status / format badge ---- */
  function Badge({ status }) {
    const C = {
      open:        { label: "Mở đăng ký",     bg: "rgba(43,182,163,.13)",  color: "#2BB6A3", bdr: "rgba(43,182,163,.3)"  },
      full:        { label: "Đủ chỗ",          bg: "rgba(245,166,35,.13)",  color: "#F5A623", bdr: "rgba(245,166,35,.3)"  },
      confirmed:   { label: "Đã xác nhận",     bg: "rgba(76,175,80,.13)",   color: "#4CAF50", bdr: "rgba(76,175,80,.3)"   },
      cancelled:   { label: "Đã huỷ",          bg: "rgba(192,80,77,.13)",   color: "#C0504D", bdr: "rgba(192,80,77,.3)"   },
      pending:     { label: "Chờ duyệt",       bg: "rgba(245,166,35,.13)",  color: "#F5A623", bdr: "rgba(245,166,35,.3)"  },
      approved:    { label: "Đã duyệt",        bg: "rgba(43,182,163,.13)",  color: "#2BB6A3", bdr: "rgba(43,182,163,.3)"  },
      rejected:    { label: "Từ chối",         bg: "rgba(192,80,77,.13)",   color: "#C0504D", bdr: "rgba(192,80,77,.3)"   },
      in_progress: { label: "Đang xử lý",      bg: "rgba(124,92,255,.13)",  color: "#9b7fff", bdr: "rgba(124,92,255,.3)"  },
      active:      { label: "Đang hoạt động",  bg: "rgba(43,182,163,.13)",  color: "#2BB6A3", bdr: "rgba(43,182,163,.3)"  },
      inactive:    { label: "Tạm ẩn",          bg: "rgba(138,147,168,.10)", color: "#8A93A8", bdr: "rgba(138,147,168,.22)"},
      featured:    { label: "Nổi bật",         bg: "rgba(255,186,0,.13)",   color: "#FFBA00", bdr: "rgba(255,186,0,.3)"   },
      super_admin: { label: "Super Admin",     bg: "rgba(228,30,38,.13)",   color: "#E41E26", bdr: "rgba(228,30,38,.3)"   },
      ld_admin:    { label: "L&D Admin",       bg: "rgba(59,111,176,.13)",  color: "#6aa3e0", bdr: "rgba(59,111,176,.3)"  },
      scheduled:    { label: "Co lich",         bg: "rgba(43,182,163,.10)",  color: "#2BB6A3", bdr: "rgba(43,182,163,.22)" },
      interest:     { label: "Dat cho",         bg: "rgba(245,166,35,.10)",  color: "#F5A623", bdr: "rgba(245,166,35,.22)" },
      external:     { label: "External",        bg: "rgba(138,147,168,.10)", color: "#8A93A8", bdr: "rgba(138,147,168,.22)"},
      material_only:{ label: "Tai lieu",        bg: "rgba(138,147,168,.10)", color: "#8A93A8", bdr: "rgba(138,147,168,.22)"},
      elearning:   { label: "E-Learning",      bg: "rgba(124,92,255,.10)",  color: "#9b7fff", bdr: "rgba(124,92,255,.22)" },
      online:      { label: "Online",          bg: "rgba(59,111,176,.10)",  color: "#6aa3e0", bdr: "rgba(59,111,176,.22)" },
      offline:     { label: "Trực tiếp",       bg: "rgba(43,182,163,.10)",  color: "#2BB6A3", bdr: "rgba(43,182,163,.22)" },
      workshop:    { label: "Workshop",        bg: "rgba(245,166,35,.10)",  color: "#F5A623", bdr: "rgba(245,166,35,.22)" },
      bootcamp:    { label: "Bootcamp",        bg: "rgba(228,30,38,.10)",   color: "#E41E26", bdr: "rgba(228,30,38,.22)"  },
      talk:        { label: "Talk",            bg: "rgba(138,147,168,.10)", color: "#8A93A8", bdr: "rgba(138,147,168,.22)"},
      webinar:     { label: "Webinar",         bg: "rgba(59,111,176,.10)",  color: "#6aa3e0", bdr: "rgba(59,111,176,.22)" },
    };
    const c = C[status] || { label: status, bg: "rgba(255,255,255,.06)", color: "#8A93A8", bdr: "rgba(255,255,255,.14)" };
    return (
      <span style={{
        display: "inline-flex", alignItems: "center",
        padding: "2px 9px", borderRadius: 999,
        fontSize: 11, fontWeight: 700, letterSpacing: "0.035em",
        background: c.bg, color: c.color, border: `1px solid ${c.bdr}`,
        whiteSpace: "nowrap",
      }}>{c.label}</span>
    );
  }

  /* ---- Sidebar ---- */
  const NAV = [
    { id: "dashboard",    label: "Dashboard",      icon: "layout-dashboard" },
    { id: "users",        label: "Users",           icon: "users-round" },
    { id: "courses",      label: "Khóa học",        icon: "book-open" },
    { id: "requests",     label: "L&D Requests",    icon: "message-square" },
    { id: "policy",       label: "Chính sách",      icon: "layers" },
    { id: "testimonials", label: "Testimonials",    icon: "star" },
    { id: "site_feedback", label: "Site Feedback",  icon: "message-square" },
    { id: "accounts",     label: "Admin Accounts",  icon: "shield", superOnly: true },
  ];

  function Sidebar({ activePage, onNavigate, adminRole, requestBadge = 0 }) {
    return (
      <aside className="adm-sidebar">
        <div className="adm-sidebar__logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={((typeof window !== "undefined" && window.__resources) && (typeof window !== "undefined" && window.__resources).adminLogo) || "assets/logo_horizontal.png"} alt="Garena" height={20} />
          <span className="adm-sidebar__badge">Admin</span>
        </div>
        <nav className="adm-sidebar__nav">
          {NAV.filter(n => !n.superOnly || adminRole === "super_admin").map(n => {
            const badge = n.id === "requests" ? requestBadge : n.badge;
            return (
            <button
              key={n.id}
              className={`adm-sidebar__item${activePage === n.id ? " is-active" : ""}`}
              onClick={() => onNavigate(n.id)}
            >
              <Icon name={n.icon} size={16} />
              <span style={{ flex: 1 }}>{n.label}</span>
              {badge > 0 && activePage !== n.id
                ? <span className="adm-notif-dot">{badge}</span>
                : null}
            </button>
            );
          })}
        </nav>
        <div className="adm-sidebar__foot">
          <div className="adm-sidebar__user">
            <div className="adm-sidebar__avatar">VA</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Van Anh Lê</div>
              <div style={{ fontSize: 11, color: "var(--rpg-muted)" }}>
                {adminRole === "super_admin" ? "Super Admin" : "L&D Admin"}
              </div>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  /* ---- Page header ---- */
  function PageHeader({ title, subtitle, action }) {
    return (
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">{title}</h1>
          {subtitle && <p className="adm-page-sub">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
    );
  }

  /* ---- Stat card ---- */
  function StatCard({ label, value, icon, delta, color = "#E41E26", iconBg = "rgba(228,30,38,0.12)" }) {
    return (
      <div className="adm-stat-card">
        <div className="adm-stat-card__icon" style={{ background: iconBg }}>
          <Icon name={icon} size={19} color={color} />
        </div>
        <div>
          <div className="adm-stat-card__val">{value}</div>
          <div className="adm-stat-card__label">{label}</div>
          {delta !== undefined && (
            <div className="adm-stat-card__delta" style={{ color: delta >= 0 ? "#2BB6A3" : "#C0504D" }}>
              {delta >= 0 ? "↑" : "↓"} {Math.abs(delta)}% so với tháng trước
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ---- Section card wrapper ---- */
  function SectionCard({ title, children, action }) {
    return (
      <div className="adm-section-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h3 className="adm-section-card__title">{title}</h3>
          {action && <div>{action}</div>}
        </div>
        {children}
      </div>
    );
  }

  /* ---- Modal ---- */
  function Modal({ open, onClose, title, children, width = 560 }) {
    React.useEffect(() => {
      document.body.style.overflow = open ? "hidden" : "";
      return () => { document.body.style.overflow = ""; };
    }, [open]);
    if (!open) return null;
    return (
      <div className="adm-modal-overlay" onClick={onClose}>
        <div className="adm-modal" style={{ maxWidth: width }} onClick={e => e.stopPropagation()}>
          <div className="adm-modal__head">
            <h3 className="adm-modal__title">{title}</h3>
            <button className="adm-modal__close" onClick={onClose}>
              <Icon name="x" size={17} />
            </button>
          </div>
          <div className="adm-modal__body">{children}</div>
        </div>
      </div>
    );
  }

  /* ---- Toggle switch ---- */
  function Toggle({ value, onChange, disabled = false }) {
    return (
      <button
        className={`adm-toggle${value ? " is-on" : ""}`}
        onClick={() => !disabled && onChange(!value)}
        type="button"
        style={{ opacity: disabled ? 0.38 : 1, cursor: disabled ? "not-allowed" : "pointer" }}
      >
        <span className="adm-toggle__thumb" />
      </button>
    );
  }

  /* ---- Search input ---- */
  function SearchInput({ value, onChange, placeholder = "Tìm kiếm..." }) {
    return (
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", display: "flex" }}>
          <Icon name="search" size={14} color="#8A93A8" />
        </span>
        <input
          className="adm-search"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
        />
      </div>
    );
  }

  export const ADMComponents = { Badge, Sidebar, PageHeader, StatCard, SectionCard, Modal, Toggle, SearchInput };
