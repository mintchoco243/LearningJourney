/* =============================================================
   Admin screens 2 — Sessions & L&D Requests
   Exports: window.ADMScreens2 = { SessionsScreen, RequestsScreen }
   ============================================================= */
(function () {
  "use strict";
  const { Icon } = window.GLHUI;
  const { Badge, PageHeader, Modal, Toggle, SearchInput } = window.ADMComponents;
  const D = window.ADM_DATA;

  /* ===================== SESSIONS ===================== */
  function SessionsScreen() {
    const [sessions, setSessions] = React.useState(D.ADMIN_SESSIONS);
    const [filterCourse, setFilterCourse] = React.useState("all");
    const [filterStatus, setFilterStatus] = React.useState("all");
    const [attendeesModal, setAttendeesModal] = React.useState(null);
    const [createModal, setCreateModal]     = React.useState(false);
    const [confirmId, setConfirmId]         = React.useState(null);

    const courseOptions = [...new Set(sessions.map(s => s.course_id))].map(id => {
      const s = sessions.find(x => x.course_id === id);
      return { id, title: s.course_title };
    });

    const filtered = sessions.filter(s => {
      if (filterCourse !== "all" && s.course_id !== filterCourse) return false;
      if (filterStatus !== "all" && s.status !== filterStatus) return false;
      return true;
    });

    function confirmSession(id) {
      setSessions(ss => ss.map(s => s.id === id ? { ...s, status: "confirmed" } : s));
      setConfirmId(null);
    }

    function fmtDate(d) {
      return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
    }

    return (
      <div data-screen-label="Sessions">
        <PageHeader
          title="Quản lý Sessions"
          subtitle={`${sessions.length} sessions · ${sessions.filter(s => s.status === "open").length} đang mở đăng ký`}
          action={
            <button className="adm-btn adm-btn--primary" onClick={() => setCreateModal(true)}>
              <Icon name="file-plus" size={14} /> Tạo session
            </button>
          }
        />

        <div className="adm-filter-row">
          <select
            className="adm-select"
            style={{ width: "auto", fontSize: 12, padding: "7px 30px 7px 12px" }}
            value={filterCourse}
            onChange={e => setFilterCourse(e.target.value)}
          >
            <option value="all">Tất cả khóa học</option>
            {courseOptions.map(c => (
              <option key={c.id} value={c.id}>{c.id} — {c.title}</option>
            ))}
          </select>
          <div className="adm-tab-filter">
            {[["all","Tất cả"],["open","Mở"],["full","Đủ chỗ"],["confirmed","Xác nhận"],["cancelled","Huỷ"]].map(([v,l]) => (
              <button key={v} className={`adm-tab-filter__item${filterStatus===v?" is-active":""}`} onClick={()=>setFilterStatus(v)}>{l}</button>
            ))}
          </div>
        </div>

        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Khóa học</th>
                <th style={{ width: 108 }}>Ngày</th>
                <th style={{ width: 100 }}>Giờ</th>
                <th>Địa điểm</th>
                <th style={{ width: 110 }}>Đăng ký</th>
                <th style={{ width: 118 }}>Trạng thái</th>
                <th style={{ width: 170 }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => {
                const pct = Math.min(Math.round((s.current_count / s.max_participants) * 100), 100);
                const enoughForMin = s.current_count >= s.min_participants;
                return (
                  <tr key={s.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: "#fff", fontSize: 13 }}>{s.course_title}</div>
                      <div style={{ fontSize: 10, color: "var(--rpg-faint)", fontFamily: "monospace" }}>{s.id} · {s.trainer}</div>
                    </td>
                    <td style={{ fontVariantNumeric: "tabular-nums", fontSize: 13 }}>{fmtDate(s.date)}</td>
                    <td style={{ fontSize: 12, color: "var(--rpg-muted)" }}>{s.time}</td>
                    <td style={{ fontSize: 12 }}>{s.location}</td>
                    <td>
                      <div style={{ marginBottom: 5 }}>
                        <span style={{ fontWeight: 700, color: enoughForMin ? "#2BB6A3" : "#F5A623" }}>
                          {s.current_count}
                        </span>
                        <span style={{ color: "var(--rpg-muted)", fontSize: 11 }}>/{s.max_participants}</span>
                        <span style={{ fontSize: 10, color: "var(--rpg-faint)", marginLeft: 4 }}>min {s.min_participants}</span>
                      </div>
                      <div style={{ height: 3, background: "rgba(255,255,255,.06)", borderRadius: 999, overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: 999, transition: "width .5s", width: `${pct}%`, background: pct >= 100 ? "#F5A623" : "#2BB6A3" }} />
                      </div>
                    </td>
                    <td><Badge status={s.status} /></td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="adm-btn adm-btn--sec adm-btn--sm" onClick={() => setAttendeesModal(s)}>
                          <Icon name="users" size={13} /> DS
                        </button>
                        {(s.status === "open" || s.status === "full") && (
                          <button className="adm-btn adm-btn--primary adm-btn--sm" onClick={() => setConfirmId(s.id)}>
                            Xác nhận mở lớp
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="adm-empty">Không có sessions nào phù hợp với bộ lọc</div>}
        </div>

        {/* Attendees modal */}
        <Modal open={!!attendeesModal} onClose={() => setAttendeesModal(null)}
          title={attendeesModal ? `Danh sách đặt chỗ · ${attendeesModal.id}` : ""} width={600}>
          {attendeesModal && <AttendeesView session={attendeesModal} />}
        </Modal>

        {/* Create session */}
        <Modal open={createModal} onClose={() => setCreateModal(false)} title="Tạo session mới" width={560}>
          <SessionForm onClose={() => setCreateModal(false)} />
        </Modal>

        {/* Confirm dialog */}
        <Modal open={!!confirmId} onClose={() => setConfirmId(null)} title="Xác nhận mở lớp" width={420}>
          {confirmId && (() => {
            const sess = sessions.find(s => s.id === confirmId);
            return (
              <div>
                <p style={{ color: "var(--rpg-text)", marginBottom: 18, lineHeight: 1.7, fontSize: 14 }}>
                  Xác nhận sẽ đổi trạng thái session <strong style={{ color: "#fff" }}>{confirmId}</strong> thành <Badge status="confirmed" />{" "}
                  và gửi email tự động đến <strong style={{ color: "#fff" }}>{sess?.current_count} người</strong> đã đặt chỗ.
                </p>
                <div style={{ display: "flex", gap: 9, justifyContent: "flex-end" }}>
                  <button className="adm-btn adm-btn--sec" onClick={() => setConfirmId(null)}>Huỷ</button>
                  <button className="adm-btn adm-btn--primary" onClick={() => confirmSession(confirmId)}>
                    <Icon name="send" size={13} /> Xác nhận & Gửi email
                  </button>
                </div>
              </div>
            );
          })()}
        </Modal>
      </div>
    );
  }

  function AttendeesView({ session }) {
    const list = (D.SESSION_ATTENDEES[session.id] || []).concat(
      session.current_count > (D.SESSION_ATTENDEES[session.id] || []).length
        ? Array.from({ length: session.current_count - (D.SESSION_ATTENDEES[session.id]||[]).length }, (_, i) => ({
            name: `Nhân viên #${i + (D.SESSION_ATTENDEES[session.id]||[]).length + 1}`,
            email: `user${i + 10}@garena.vn`, dept: "Garena", booked_at: session.date,
          }))
        : []
    ).slice(0, session.current_count);

    return (
      <div>
        <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
          {[{ l: "Đặt chỗ", v: session.current_count, c: "#2BB6A3" }, { l: "Tối thiểu", v: session.min_participants, c: "#F5A623" }, { l: "Sức chứa", v: session.max_participants, c: "#8A93A8" }].map(i => (
            <div key={i.l} style={{ flex: 1, textAlign: "center", background: "rgba(255,255,255,.03)", border: "1px solid var(--rpg-border)", borderRadius: 8, padding: "12px 8px" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: i.c }}>{i.v}</div>
              <div style={{ fontSize: 11, color: "var(--rpg-muted)" }}>{i.l}</div>
            </div>
          ))}
        </div>
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Tên</th><th>Email</th><th>Phòng ban</th><th>Ngày đặt</th></tr></thead>
            <tbody>
              {list.map((a, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{a.name}</td>
                  <td style={{ fontSize: 12, color: "var(--rpg-muted)" }}>{a.email}</td>
                  <td style={{ fontSize: 12 }}>{a.dept}</td>
                  <td style={{ fontSize: 12, color: "var(--rpg-muted)" }}>{a.booked_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
          <button className="adm-btn adm-btn--sec adm-btn--sm"><Icon name="refresh-cw" size={12} /> Export CSV</button>
        </div>
      </div>
    );
  }

  function SessionForm({ onClose }) {
    return (
      <div>
        <div className="adm-form-group">
          <label className="adm-label">Khóa học</label>
          <select className="adm-select">
            {D.ADMIN_COURSES.filter(c => c.is_active).map(c => (
              <option key={c.id} value={c.id}>{c.id} — {c.title}</option>
            ))}
          </select>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div className="adm-form-group">
            <label className="adm-label">Ngày</label>
            <input className="adm-input" type="date" defaultValue="2026-08-15" />
          </div>
          <div className="adm-form-group">
            <label className="adm-label">Khung giờ</label>
            <input className="adm-input" placeholder="09:00–12:00" defaultValue="09:00–12:00" />
          </div>
        </div>
        <div className="adm-form-group">
          <label className="adm-label">Địa điểm</label>
          <input className="adm-input" placeholder="VD: HCM Office – P.501  hoặc  Online – Zoom" />
        </div>
        <div className="adm-form-group">
          <label className="adm-label">Trainer</label>
          <input className="adm-input" placeholder="Tên trainer" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div className="adm-form-group">
            <label className="adm-label">Tối thiểu (người)</label>
            <input className="adm-input" type="number" defaultValue={10} />
          </div>
          <div className="adm-form-group">
            <label className="adm-label">Sức chứa tối đa</label>
            <input className="adm-input" type="number" defaultValue={25} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 9, justifyContent: "flex-end" }}>
          <button className="adm-btn adm-btn--sec" onClick={onClose}>Huỷ</button>
          <button className="adm-btn adm-btn--primary" onClick={onClose}>
            <Icon name="check" size={13} /> Tạo session
          </button>
        </div>
      </div>
    );
  }

  /* ===================== L&D REQUESTS ===================== */
  function RequestsScreen() {
    const [requests, setRequests] = React.useState(D.ADMIN_REQUESTS);
    const [filterStatus, setFilterStatus] = React.useState("all");
    const [search, setSearch]   = React.useState("");
    const [selected, setSelected] = React.useState(null);

    const counts = {
      all: requests.length,
      pending:     requests.filter(r => r.status === "pending").length,
      in_progress: requests.filter(r => r.status === "in_progress").length,
      approved:    requests.filter(r => r.status === "approved").length,
      rejected:    requests.filter(r => r.status === "rejected").length,
    };

    const filtered = requests.filter(r => {
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!r.user_name.toLowerCase().includes(q) && !r.title.toLowerCase().includes(q)) return false;
      }
      return true;
    });

    function updateRequest(id, patch) {
      setRequests(rs => rs.map(r => r.id === id ? { ...r, ...patch } : r));
      setSelected(prev => prev?.id === id ? { ...prev, ...patch } : prev);
    }

    return (
      <div data-screen-label="L&D Requests">
        <PageHeader
          title="L&D Requests"
          subtitle={`${counts.pending} chờ duyệt · ${counts.in_progress} đang xử lý`}
        />

        <div className="adm-filter-row">
          <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo tên hoặc tiêu đề..." />
        </div>

        <div className="adm-tab-filter" style={{ marginBottom: 16 }}>
          {[["all","Tất cả"],["pending","Chờ duyệt"],["in_progress","Đang xử lý"],["approved","Đã duyệt"],["rejected","Từ chối"]].map(([v,l]) => (
            <button key={v} className={`adm-tab-filter__item${filterStatus===v?" is-active":""}`} onClick={()=>setFilterStatus(v)}>
              {l}
              {counts[v] > 0 && (
                <span style={{ marginLeft: 5, background: filterStatus===v ? "rgba(255,255,255,.25)" : "rgba(255,255,255,.09)", borderRadius: 999, padding: "0 6px", fontSize: 10 }}>
                  {counts[v]}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th style={{ width: 76 }}>ID</th>
                <th style={{ width: 180 }}>Người gửi</th>
                <th>Yêu cầu đào tạo</th>
                <th style={{ width: 100 }}>Phòng ban</th>
                <th style={{ width: 80 }}>Ngày</th>
                <th style={{ width: 118 }}>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className={`is-clickable${r.status==="pending"?" is-pending":""}`} onClick={() => setSelected(r)}>
                  <td><code style={{ fontSize: 10 }}>{r.id}</code></td>
                  <td>
                    <div style={{ fontWeight: 600, color: "#fff", fontSize: 13 }}>{r.user_name}</div>
                    <div style={{ fontSize: 11, color: "var(--rpg-muted)" }}>{r.email}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500, color: "var(--rpg-text)" }}>{r.title}</div>
                    {r.admin_note && (
                      <div style={{ fontSize: 11, color: "var(--rpg-faint)", marginTop: 2, fontStyle: "italic" }}>
                        {r.admin_note.length > 60 ? r.admin_note.slice(0, 60) + "…" : r.admin_note}
                      </div>
                    )}
                  </td>
                  <td style={{ fontSize: 12, color: "var(--rpg-muted)" }}>{r.dept}</td>
                  <td style={{ fontSize: 12, color: "var(--rpg-faint)", fontVariantNumeric: "tabular-nums" }}>{r.submitted_at.slice(5).replace("-", "/")}</td>
                  <td><Badge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="adm-empty">Không có requests nào phù hợp</div>}
        </div>

        {/* Detail modal */}
        <Modal open={!!selected} onClose={() => setSelected(null)} title={selected ? `${selected.id} · Chi tiết yêu cầu` : ""} width={640}>
          {selected && <RequestDetail request={selected} onUpdate={updateRequest} onClose={() => setSelected(null)} />}
        </Modal>
      </div>
    );
  }

  function RequestDetail({ request, onUpdate, onClose }) {
    const [status, setStatus] = React.useState(request.status);
    const [note, setNote]     = React.useState(request.admin_note || "");

    function save() { onUpdate(request.id, { status, admin_note: note }); onClose(); }

    return (
      <div>
        <div className="adm-detail-panel">
          {[
            { l: "Người gửi",  v: request.user_name },
            { l: "Email",      v: request.email },
            { l: "Phòng ban",  v: request.dept },
            { l: "Ngày gửi",   v: request.submitted_at },
          ].map(f => (
            <div key={f.l} className="adm-detail-field">
              <div className="adm-detail-field__label">{f.l}</div>
              <div className="adm-detail-field__val">{f.v}</div>
            </div>
          ))}
        </div>

        <div className="adm-form-group">
          <label className="adm-label">Tên khóa học / yêu cầu</label>
          <div style={{ background: "rgba(255,255,255,.03)", border: "1px solid var(--rpg-border)", borderRadius: 8, padding: "12px 14px", fontSize: 15, fontWeight: 700, color: "#fff" }}>
            {request.title}
          </div>
        </div>

        <div className="adm-form-group">
          <label className="adm-label">Lý do đề xuất</label>
          <div style={{ background: "rgba(255,255,255,.03)", border: "1px solid var(--rpg-border)", borderRadius: 8, padding: "12px 14px", fontSize: 13, color: "var(--rpg-text)", lineHeight: 1.65 }}>
            {request.reason}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "190px 1fr", gap: 14 }}>
          <div className="adm-form-group">
            <label className="adm-label">Cập nhật trạng thái</label>
            <select className="adm-select" value={status} onChange={e => setStatus(e.target.value)}>
              {[["pending","Chờ duyệt"],["in_progress","Đang xử lý"],["approved","Đã duyệt"],["rejected","Từ chối"]].map(([v,l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div className="adm-form-group">
            <label className="adm-label">Admin note (gửi kèm email cho user)</label>
            <textarea className="adm-textarea" style={{ minHeight: 72 }} value={note} onChange={e => setNote(e.target.value)} placeholder="Ghi chú lý do hoặc hướng dẫn tiếp theo..." />
          </div>
        </div>

        <div className="adm-info-banner adm-info-banner--blue" style={{ marginBottom: 18 }}>
          <Icon name="info" size={13} color="#6aa3e0" style={{ flexShrink: 0, marginTop: 1 }} />
          Khi lưu, user sẽ tự động nhận email thông báo về trạng thái mới cùng admin note.
        </div>

        <div style={{ display: "flex", gap: 9, justifyContent: "flex-end" }}>
          <button className="adm-btn adm-btn--sec" onClick={onClose}>Đóng</button>
          <button className="adm-btn adm-btn--primary" onClick={save}>
            <Icon name="send" size={13} /> Lưu & Gửi thông báo
          </button>
        </div>
      </div>
    );
  }

  window.ADMScreens2 = { SessionsScreen, RequestsScreen };
})();
