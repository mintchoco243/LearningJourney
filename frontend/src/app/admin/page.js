"use client";

import React from "react";
import { ADMComponents } from '@/components/admin/ADMComponents';
import { Dashboard, CoursesScreen } from '@/components/admin/ADMScreens1';
import { RequestsScreen } from '@/components/admin/ADMScreens2';
import { PolicyScreen, AccountsScreen, TestimonialsScreen, SiteFeedbackScreen, IntegrationsScreen } from '@/components/admin/ADMScreens3';
import { UsersScreen } from '@/components/admin/ADMScreensUsers';

const { Sidebar } = ADMComponents;

function AdminGateMessage({ title, message, action }) {
  return (
    <div className="adm-layout">
      <main className="adm-main" style={{ marginLeft: 0 }}>
        <div className="adm-content" style={{ display: "grid", minHeight: "100vh", placeItems: "center" }}>
          <section
            style={{
              width: "min(460px, calc(100vw - 32px))",
              border: "1px solid var(--rpg-border)",
              borderRadius: 8,
              background: "var(--rpg-panel)",
              padding: 28,
              textAlign: "center",
              boxShadow: "0 18px 60px rgba(0,0,0,0.28)",
            }}
          >
            <h1 style={{ margin: "0 0 10px", fontSize: 22, color: "var(--rpg-text)" }}>{title}</h1>
            <p style={{ margin: "0 0 18px", color: "var(--rpg-muted)", lineHeight: 1.6 }}>{message}</p>
            {action}
          </section>
        </div>
      </main>
    </div>
  );
}

function DevLoginButton() {
  const [loading, setLoading] = React.useState(false);

  async function login() {
    setLoading(true);
    try {
      const res = await fetch("/auth/dev-login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "demo@garena.vn" }),
      });
      if (!res.ok) throw new Error("DEV_LOGIN_FAILED");
      window.location.reload();
    } catch {
      setLoading(false);
      alert("Dev login failed. Please check backend port 5001.");
    }
  }

  return (
    <button className="adm-btn adm-btn--sec" onClick={login} disabled={loading}>
      {loading ? "Dang dang nhap..." : "Dev login"}
    </button>
  );
}


  
  
  
  

  const PAGE_META = {
    dashboard:    { label: "Dashboard" },
    users:        { label: "Quản lý Users" },
    courses:      { label: "Quản lý Khóa học" },
    requests:     { label: "L&D Requests" },
    policy:       { label: "Chính sách L&D" },
    testimonials: { label: "Testimonials" },
    site_feedback:{ label: "Site Feedback" },
    bot_settings: { label: "Cấu hình Hệ thống" },
    accounts:     { label: "Admin Accounts" },
  };

  export default function AdminApp() {
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => {
      const frame = requestAnimationFrame(() => setMounted(true));
      return () => cancelAnimationFrame(frame);
    }, []);
    const [adminSession, setAdminSession] = React.useState({ status: "loading", user: null, role: null });
    const [requestBadge, setRequestBadge] = React.useState(0);

    const [page, setPage] = React.useState(
      () => {
        try {
          if (typeof window !== "undefined") {
            const savedPage = localStorage.getItem("adm_page") || "dashboard";
            return savedPage === "sessions" ? "courses" : savedPage;
          }
        } catch (e) {}
        return "dashboard";
      }
    );
    React.useEffect(() => {
      if (!mounted) return;
      let cancelled = false;
      fetch("/admin/api/me", { credentials: "include" })
        .then(async (res) => {
          if (cancelled) return;
          if (res.status === 401) {
            setAdminSession({ status: "unauthenticated", user: null, role: null });
            return;
          }
          if (res.status === 403) {
            setAdminSession({ status: "forbidden", user: null, role: null });
            return;
          }
          if (!res.ok) {
            setAdminSession({ status: "error", user: null, role: null });
            return;
          }
          const data = await res.json();
          if (!cancelled) {
            setAdminSession({ status: "ready", user: data.user, role: data.role });
          }
        })
        .catch(() => {
          if (!cancelled) setAdminSession({ status: "error", user: null, role: null });
        });
      return () => { cancelled = true; };
    }, [mounted]);

    React.useEffect(() => {
      localStorage.setItem("adm_page", page === "sessions" ? "courses" : page);
    }, [page]);

    React.useEffect(() => {
      if (adminSession.status !== "ready") return;
      let cancelled = false;
      fetch("/admin/api/ld-requests", { credentials: "include" })
        .then(async (res) => {
          if (!res.ok) return { requests: [] };
          return res.json();
        })
        .then((data) => {
          if (cancelled) return;
          const openStatuses = new Set(["pending", "new", "in_review", "in_progress"]);
          const requests = Array.isArray(data?.requests) ? data.requests : [];
          setRequestBadge(
            requests.filter((request) => openStatuses.has(String(request.status || "").toLowerCase())).length,
          );
        })
        .catch(() => {
          if (!cancelled) setRequestBadge(0);
        });
      return () => { cancelled = true; };
    }, [adminSession.status, page]);

    function navigate(p) {
      setPage(p === "sessions" ? "courses" : p);
      // scroll main content area to top
      const el = document.querySelector(".adm-content");
      if (el) el.scrollTop = 0;
    }

    if (!mounted) return null;
    if (adminSession.status === "loading") {
      return (
        <AdminGateMessage
          title="Dang kiem tra quyen admin"
          message="Vui long cho trong giay lat."
        />
      );
    }
    if (adminSession.status === "unauthenticated") {
      return (
        <AdminGateMessage
          title="Can dang nhap"
          message="Dang nhap bang tai khoan Garena de tiep tuc vao man admin."
          action={
            <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
              <a className="adm-btn adm-btn--primary" href="/auth/google?next=/admin">Dang nhap Garena</a>
              {process.env.NODE_ENV !== "production" && <DevLoginButton />}
            </div>
          }
        />
      );
    }
    if (adminSession.status === "forbidden") {
      return (
        <AdminGateMessage
          title="Khong co quyen admin"
          message="Tai khoan cua ban chua nam trong danh sach admin duoc phe duyet."
          action={<button className="adm-btn" onClick={() => { window.location.href = "/"; }}>Ve trang chinh</button>}
        />
      );
    }
    if (adminSession.status === "error") {
      return (
        <AdminGateMessage
          title="Khong kiem tra duoc quyen"
          message="Thu tai lai trang hoac kiem tra backend dang chay."
          action={<button className="adm-btn adm-btn--primary" onClick={() => window.location.reload()}>Tai lai</button>}
        />
      );
    }

    const adminRole = adminSession.role;
    const screens = {
      dashboard:    <Dashboard onNavigate={navigate} />,
      users:        <UsersScreen />,
      courses:      <CoursesScreen />,
      requests:     <RequestsScreen />,
      policy:       <PolicyScreen />,
      testimonials: <TestimonialsScreen />,
      site_feedback:<SiteFeedbackScreen />,
      bot_settings: <IntegrationsScreen />,
      accounts:     adminRole === "super_admin" ? <AccountsScreen /> : null,
    };

    const meta = PAGE_META[page] || { label: page };

    return (
      <div className="adm-layout">
        <Sidebar activePage={page} onNavigate={navigate} adminRole={adminRole} requestBadge={requestBadge} />

        <main className="adm-main">
          {/* Topbar */}
          <div className="adm-topbar">
            <span className="adm-topbar__breadcrumb">
              Garena Learning Hub · Admin &nbsp;/&nbsp; <strong>{meta.label}</strong>
            </span>
            <span style={{ color: "var(--rpg-muted)", fontSize: 13 }}>
              {adminSession.user?.email} · {adminRole}
            </span>
          </div>

          {/* Page content */}
          <div className="adm-content">
            {screens[page] ?? (
              <div style={{ color: "var(--rpg-muted)", padding: 40, textAlign: "center" }}>
                Trang không tồn tại
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }
