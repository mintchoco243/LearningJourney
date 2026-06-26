/* =============================================================
   Admin screens 1 — Dashboard & Course management
   Exports: window.ADMScreens1 = { Dashboard, CoursesScreen }
   ============================================================= */
(function () {
  "use strict";
  const { Icon } = window.GLHUI;
  const { Badge, PageHeader, StatCard, SectionCard, Modal, Toggle, SearchInput } = window.ADMComponents;
  const D = window.ADM_DATA;

  /* ===================== DASHBOARD ===================== */
  function Dashboard() {
    const s = D.ADMIN_STATS;
    const total = s.enrollments_breakdown.reduce((a, i) => a + i.count, 0);
    const maxE  = Math.max(...s.top_courses.map(c => c.enrollments));
    const pendingReqs = D.ADMIN_REQUESTS.filter(r => r.status === "pending");

    return (
      <div data-screen-label="Dashboard">
        <PageHeader
          title="Dashboard"
          subtitle={`Tổng quan hệ thống · ${new Date().toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}`}
        />

        {/* Stat row */}
        <div className="adm-stat-grid">
          <StatCard label="Người dùng onboard"        value={s.total_users.toLocaleString("vi-VN")} icon="users"         color="#6aa3e0" iconBg="rgba(59,111,176,.14)" />
          <StatCard label="Enrollments tháng này"     value={s.enrollments_this_month}              icon="trending-up"   color="#2BB6A3" iconBg="rgba(43,182,163,.14)" delta={s.enrollments_delta} />
          <StatCard label="L&D Requests chờ duyệt"   value={s.pending_ld_requests}                 icon="message-square" color="#E41E26" iconBg="rgba(228,30,38,.12)" />
          <StatCard label="Khóa học đang hoạt động"  value={s.active_courses}                      icon="book-open"     color="#9b7fff" iconBg="rgba(124,92,255,.14)" />
        </div>

        {/* Two-col grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Bar chart */}
            <SectionCard title="Top 5 khóa học · Enrollments tháng này">
              <div className="adm-bar-chart">
                {s.top_courses.map((c, i) => (
                  <div key={i} className="adm-bar-row">
                    <span className="adm-bar-name" title={c.name}>{c.name}</span>
                    <div className="adm-bar-track">
                      <div className="adm-bar-fill" style={{ width: `${(c.enrollments / maxE) * 100}%` }} />
                    </div>
                    <span className="adm-bar-val">{c.enrollments}</span>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Source breakdown */}
            <SectionCard title={`Breakdown theo nguồn · ${total} enrollments`}>
              <div className="adm-source-list">
                {s.enrollments_breakdown.map((item, i) => (
                  <div key={i} className="adm-source-item">
                    <span className="adm-source-dot" style={{ background: item.color }} />
                    <span className="adm-source-name">{item.source}</span>
                    <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,.06)", borderRadius: 999, overflow: "hidden", maxWidth: 180 }}>
                      <div style={{ height: "100%", background: item.color, borderRadius: 999, width: `${(item.count / total) * 100}%`, transition: "width .7s" }} />
                    </div>
                    <span className="adm-source-count">{item.count}</span>
                    <span className="adm-source-pct">{Math.round((item.count / total) * 100)}%</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          {/* Right: pending requests */}
          <SectionCard title="L&D Requests chờ duyệt">
            {pendingReqs.slice(0, 5).map((r, i) => (
              <div key={r.id} style={{ padding: "11px 0", borderBottom: i < pendingReqs.length - 1 ? "1px solid var(--rpg-border)" : "none" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#fff", marginBottom: 2 }}>{r.user_name}</div>
                <div style={{ fontSize: 12, color: "var(--rpg-muted)", marginBottom: 6, lineHeight: 1.4 }}>{r.title}</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, background: "rgba(255,255,255,.05)", borderRadius: 4, padding: "2px 7px", color: "var(--rpg-muted)" }}>{r.dept}</span>
                  <span style={{ fontSize: 11, color: "var(--rpg-faint)" }}>{r.submitted_at.slice(5).replace("-", "/")}</span>
                </div>
              </div>
            ))}
            {pendingReqs.length > 5 && (
              <div style={{ marginTop: 12, fontSize: 12, color: "var(--glh-accent)", fontWeight: 600 }}>
                + {pendingReqs.length - 5} requests khác
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    );
  }

  /* ===================== COURSES ===================== */
  const RANK_NAMES = { rank_01: "Tân Binh", rank_02: "Học Việc", rank_03: "Thành Thạo", rank_04: "Chuyên Gia", rank_05: "Bậc Thầy" };
  const RANKS_ALL  = [
    { id: "rank_01", name: "Tân Binh" }, { id: "rank_02", name: "Học Việc" },
    { id: "rank_03", name: "Thành Thạo" }, { id: "rank_04", name: "Chuyên Gia" },
    { id: "rank_05", name: "Bậc Thầy" },
  ];
  const XP_MAP = { rank_01: "60–80", rank_02: "80–120", rank_03: "100–150", rank_04: "140–200", rank_05: "180–250" };

  function CoursesScreen() {
    const [courses, setCourses] = React.useState(D.ADMIN_COURSES);
    const [search, setSearch]   = React.useState("");
    const [statusFilter, setStatusFilter] = React.useState("all");
    const [editModal, setEditModal]   = React.useState(false);
    const [importModal, setImportModal] = React.useState(false);
    const [editTarget, setEditTarget] = React.useState(null);

    const filtered = courses.filter(c => {
      const q = search.toLowerCase();
      const matchQ = !search || c.title.toLowerCase().includes(q) || c.id.toLowerCase().includes(q);
      const matchS = statusFilter === "all" || (statusFilter === "active" ? c.is_active : !c.is_active);
      return matchQ && matchS;
    });

    function openEdit(c) { setEditTarget(c); setEditModal(true); }
    function openCreate() { setEditTarget(null); setEditModal(true); }
    function toggleActive(id) { setCourses(cs => cs.map(c => c.id === id ? { ...c, is_active: !c.is_active } : c)); }

    return (
      <div data-screen-label="Courses">
        <PageHeader
          title="Quản lý Khóa học"
          subtitle={`${courses.filter(c => c.is_active).length} hoạt động · ${courses.filter(c => !c.is_active).length} ẩn`}
          action={
            <div style={{ display: "flex", gap: 8 }}>
              <button className="adm-btn adm-btn--sec" onClick={() => setImportModal(true)}>
                <Icon name="users" size={14} /> Import participants
              </button>
              <button className="adm-btn adm-btn--primary" onClick={openCreate}>
                <Icon name="file-plus" size={14} /> Tạo khóa học
              </button>
            </div>
          }
        />

        <div className="adm-filter-row">
          <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo tên hoặc mã..." />
          <div className="adm-tab-filter">
            {[["all","Tất cả"],["active","Đang hoạt động"],["inactive","Đã ẩn"]].map(([v,l]) => (
              <button key={v} className={`adm-tab-filter__item${statusFilter===v?" is-active":""}`} onClick={()=>setStatusFilter(v)}>{l}</button>
            ))}
          </div>
        </div>

        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th style={{ width: 86 }}>Mã</th>
                <th>Tên khóa học</th>
                <th style={{ width: 108 }}>Format</th>
                <th style={{ width: 60 }}>XP</th>
                <th>Rank targets</th>
                <th style={{ width: 90 }}>Enrollments</th>
                <th style={{ width: 110 }}>Hiển thị</th>
                <th style={{ width: 70 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td><code style={{ fontSize: 11 }}>{c.id}</code></td>
                  <td>
                    <div style={{ fontWeight: 600, color: "#fff" }}>{c.title}</div>
                    <div style={{ fontSize: 11, color: "var(--rpg-muted)" }}>{c.duration} phút</div>
                  </td>
                  <td><Badge status={c.format} /></td>
                  <td><span style={{ fontWeight: 700, color: "var(--amber)" }}>+{c.xp}</span></td>
                  <td>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {c.rank_targets.map(r => (
                        <span key={r} style={{ fontSize: 10, background: "rgba(255,255,255,.05)", border: "1px solid var(--rpg-border)", borderRadius: 4, padding: "2px 6px", color: "var(--rpg-muted)" }}>
                          {RANK_NAMES[r]}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{c.enrollments}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Toggle value={c.is_active} onChange={() => toggleActive(c.id)} />
                      <span style={{ fontSize: 11, color: "var(--rpg-muted)" }}>{c.is_active ? "Hiện" : "Ẩn"}</span>
                    </div>
                  </td>
                  <td>
                    <button className="adm-btn adm-btn--sec adm-btn--sm adm-btn--icon" onClick={() => openEdit(c)}>
                      <Icon name="edit-3" size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="adm-empty">Không tìm thấy khóa học nào phù hợp</div>
          )}
        </div>

        {/* Create / Edit modal */}
        <Modal open={editModal} onClose={() => setEditModal(false)} title={editTarget ? `Chỉnh sửa — ${editTarget.id}` : "Tạo khóa học mới"} width={620}>
          <CourseForm course={editTarget} onClose={() => setEditModal(false)} />
        </Modal>

        {/* Import participants */}
        <Modal open={importModal} onClose={() => setImportModal(false)} title="Import Participants" width={520}>
          <ImportForm onClose={() => setImportModal(false)} />
        </Modal>
      </div>
    );
  }

  function CourseForm({ course, onClose }) {
    const [rankTargets, setRankTargets] = React.useState(course?.rank_targets || []);
    const [xpHint, setXpHint] = React.useState(null);

    function toggleRank(id) {
      setRankTargets(p => p.includes(id) ? p.filter(r => r !== id) : [...p, id]);
      setXpHint(null);
    }

    function suggestXp() {
      if (!rankTargets.length) return;
      const top = rankTargets[rankTargets.length - 1];
      setXpHint(XP_MAP[top] || "80–120");
    }

    return (
      <div>
        <div className="adm-form-group">
          <label className="adm-label">Tên khóa học</label>
          <input className="adm-input" defaultValue={course?.title || ""} placeholder="VD: Kỹ năng thuyết trình nâng cao" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div className="adm-form-group">
            <label className="adm-label">Format</label>
            <select className="adm-select" defaultValue={course?.format || "online"}>
              {["online","offline","elearning","webinar","workshop","bootcamp","talk"].map(f => (
                <option key={f} value={f}>{f.charAt(0).toUpperCase()+f.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="adm-form-group">
            <label className="adm-label">Thời lượng (phút)</label>
            <input className="adm-input" type="number" defaultValue={course?.duration || 120} />
          </div>
        </div>
        <div className="adm-form-group">
          <label className="adm-label">Rank targets</label>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 10 }}>
            {RANKS_ALL.map(r => (
              <button key={r.id} type="button" onClick={() => toggleRank(r.id)} style={{
                padding: "5px 13px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                background: rankTargets.includes(r.id) ? "rgba(228,30,38,.15)" : "rgba(255,255,255,.04)",
                border: `1px solid ${rankTargets.includes(r.id) ? "var(--glh-accent)" : "var(--rpg-border)"}`,
                color: rankTargets.includes(r.id) ? "#E41E26" : "var(--rpg-muted)",
                cursor: "pointer", transition: "all .12s",
              }}>{r.name}</button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button type="button" className="adm-btn adm-btn--sec adm-btn--sm" onClick={suggestXp}>
              <Icon name="sparkles" size={13} /> Gợi ý XP
            </button>
            {xpHint && <span style={{ fontSize: 13, color: "var(--amber)", fontWeight: 700 }}>Gợi ý: {xpHint} XP</span>}
          </div>
        </div>
        <div className="adm-form-group">
          <label className="adm-label">XP reward</label>
          <input className="adm-input" type="number" defaultValue={course?.xp || 100} />
        </div>
        <div style={{ display: "flex", gap: 9, justifyContent: "flex-end" }}>
          <button className="adm-btn adm-btn--sec" onClick={onClose}>Huỷ</button>
          <button className="adm-btn adm-btn--primary" onClick={onClose}>
            <Icon name="check" size={13} /> {course ? "Lưu thay đổi" : "Tạo khóa học"}
          </button>
        </div>
      </div>
    );
  }

  function ImportForm({ onClose }) {
    const [fileName, setFileName] = React.useState(null);
    const [result, setResult]     = React.useState(null);

    function simulate() { setResult({ matched: 18, not_found: 3, existed: 5 }); }

    if (result) return (
      <div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 18 }}>
          {[{ l: "Matched", v: result.matched, c: "#2BB6A3" }, { l: "Not found", v: result.not_found, c: "#F5A623" }, { l: "Đã tồn tại", v: result.existed, c: "#8A93A8" }].map(i => (
            <div key={i.l} style={{ background: "rgba(255,255,255,.03)", border: "1px solid var(--rpg-border)", borderRadius: 8, padding: "14px", textAlign: "center" }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: i.c, marginBottom: 3 }}>{i.v}</div>
              <div style={{ fontSize: 11, color: "var(--rpg-muted)" }}>{i.l}</div>
            </div>
          ))}
        </div>
        <div className="adm-info-banner adm-info-banner--amber" style={{ marginBottom: 18 }}>
          <Icon name="info" size={14} color="#F5A623" style={{ flexShrink: 0, marginTop: 1 }} />
          {result.not_found} email không tìm thấy trong hệ thống. Đã log vào <code>not_found.csv</code>.
        </div>
        <div style={{ display: "flex", gap: 9, justifyContent: "flex-end" }}>
          <button className="adm-btn adm-btn--sec" onClick={onClose}>Đóng</button>
          <button className="adm-btn adm-btn--primary" onClick={onClose}>
            <Icon name="check" size={13} /> Confirm import ({result.matched} records)
          </button>
        </div>
      </div>
    );

    return (
      <div>
        <div className="adm-upload-zone" onClick={() => setFileName("participants_q3.xlsx")}>
          <Icon name="file-plus" size={30} color="var(--rpg-muted)" style={{ margin: "0 auto 10px", display: "block" }} />
          <div style={{ fontWeight: 700, color: "#fff", marginBottom: 5 }}>{fileName || "Kéo thả file vào đây hoặc click để chọn"}</div>
          <div style={{ fontSize: 12, color: "var(--rpg-muted)" }}>Hỗ trợ .CSV và .XLSX · Cột email: <code>email</code></div>
        </div>
        <div className="adm-form-group" style={{ marginTop: 18 }}>
          <label className="adm-label">Khóa học</label>
          <select className="adm-select">
            {D.ADMIN_COURSES.filter(c => c.is_active).map(c => (
              <option key={c.id} value={c.id}>{c.id} — {c.title}</option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", gap: 9, justifyContent: "flex-end" }}>
          <button className="adm-btn adm-btn--sec" onClick={onClose}>Huỷ</button>
          <button className="adm-btn adm-btn--primary" onClick={simulate} disabled={!fileName}>
            <Icon name="refresh-cw" size={13} /> Xử lý file
          </button>
        </div>
      </div>
    );
  }

  window.ADMScreens1 = { Dashboard, CoursesScreen };
})();
