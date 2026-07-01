"use client";

import React from "react";
import { ADMComponents } from '@/components/admin/ADMComponents';
import { Dashboard, CoursesScreen } from '@/components/admin/ADMScreens1';
import { RequestsScreen } from '@/components/admin/ADMScreens2';
import { PolicyScreen, AccountsScreen, TestimonialsScreen } from '@/components/admin/ADMScreens3';
import { UsersScreen } from '@/components/admin/ADMScreensUsers';

const { Sidebar } = ADMComponents;


  
  
  
  

  const PAGE_META = {
    dashboard:    { label: "Dashboard" },
    users:        { label: "Quản lý Users" },
    courses:      { label: "Quản lý Khóa học" },
    requests:     { label: "L&D Requests" },
    policy:       { label: "Chính sách L&D" },
    testimonials: { label: "Testimonials" },
    accounts:     { label: "Admin Accounts" },
  };

  export default function AdminApp() {
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => { setMounted(true); }, []);

    const [page, setPage] = React.useState(
      () => {
        try {
          if (typeof window !== "undefined") {
            const saved = localStorage.getItem("adm_page") || "dashboard";
            return saved === "sessions" ? "courses" : saved;
          }
        } catch (e) {}
        return "dashboard";
      }
    );
    const adminRole = "super_admin"; // mock: in prod read from session

    React.useEffect(() => {
      localStorage.setItem("adm_page", page);
    }, [page]);

    function navigate(p) {
      setPage(p);
      // scroll main content area to top
      const el = document.querySelector(".adm-content");
      if (el) el.scrollTop = 0;
    }

    if (!mounted) return null;
    const screens = {
      dashboard:    <Dashboard />,
      users:        <UsersScreen />,
      courses:      <CoursesScreen />,
      requests:     <RequestsScreen />,
      policy:       <PolicyScreen />,
      testimonials: <TestimonialsScreen />,
      accounts:     adminRole === "super_admin" ? <AccountsScreen /> : null,
    };

    const meta = PAGE_META[page] || { label: page };

    return (
      <div className="adm-layout">
        <Sidebar activePage={page} onNavigate={navigate} adminRole={adminRole} />

        <main className="adm-main">
          {/* Topbar */}
          <div className="adm-topbar">
            <span className="adm-topbar__breadcrumb">
              Garena Learning Hub · Admin &nbsp;/&nbsp; <strong>{meta.label}</strong>
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
