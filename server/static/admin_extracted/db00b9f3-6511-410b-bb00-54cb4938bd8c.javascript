/* =============================================================
   Admin app root — router, topbar, layout shell
   ============================================================= */
(function () {
  "use strict";
  const { Sidebar } = window.ADMComponents;
  const { Dashboard, CoursesScreen }       = window.ADMScreens1;
  const { SessionsScreen, RequestsScreen } = window.ADMScreens2;
  const { PolicyScreen, AccountsScreen, TestimonialsScreen } = window.ADMScreens3;
  const { UsersScreen } = window.ADMScreensUsers;

  const PAGE_META = {
    dashboard:    { label: "Dashboard" },
    users:        { label: "Quản lý Users" },
    courses:      { label: "Quản lý Khóa học" },
    sessions:     { label: "Quản lý Sessions" },
    requests:     { label: "L&D Requests" },
    policy:       { label: "Chính sách L&D" },
    testimonials: { label: "Testimonials" },
    accounts:     { label: "Admin Accounts" },
  };

  function AdminApp() {
    const [page, setPage] = React.useState(
      () => localStorage.getItem("adm_page") || "dashboard"
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

    const screens = {
      dashboard:    <Dashboard />,
      users:        <UsersScreen />,
      courses:      <CoursesScreen />,
      sessions:     <SessionsScreen />,
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

  const root = ReactDOM.createRoot(document.getElementById("admin-root"));
  root.render(<AdminApp />);
})();
