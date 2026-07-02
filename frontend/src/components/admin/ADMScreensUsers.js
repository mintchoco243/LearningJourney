"use client";

import React from "react";
import { GLHUI } from '../GLHUI';
import { ADMComponents } from './ADMComponents';
import { ADM_DATA } from '@/data/admData';

const { Icon } = GLHUI;
const { Badge, PageHeader, StatCard, SectionCard, Modal, Toggle, SearchInput } = ADMComponents;
const D = ADM_DATA;


  
  

  const RANK_META = {
    rank_01: { name: "Tân Binh",    color: "#8A93A8", bg: "rgba(138,147,168,.12)", min: 0,    max: 149  },
    rank_02: { name: "Học Việc",   color: "#6aa3e0", bg: "rgba(59,111,176,.12)",  min: 150,  max: 399  },
    rank_03: { name: "Thành Thạo", color: "#2BB6A3", bg: "rgba(43,182,163,.12)",  min: 400,  max: 699  },
    rank_04: { name: "Chuyên Gia", color: "#9b7fff", bg: "rgba(124,92,255,.12)",  min: 700,  max: 999  },
    rank_05: { name: "Bậc Thầy",  color: "#FFBA00", bg: "rgba(255,186,0,.12)",   min: 1000, max: 9999 },
  };

  const ENROLL_STATUS = {
    completed:   { label: "Hoàn thành",   color: "#2BB6A3", bg: "rgba(43,182,163,.12)",  bdr: "rgba(43,182,163,.3)"  },
    in_progress: { label: "Đang học",     color: "#9b7fff", bg: "rgba(124,92,255,.12)",  bdr: "rgba(124,92,255,.3)"  },
    enrolled:    { label: "Đã đăng ký",  color: "#6aa3e0", bg: "rgba(59,111,176,.12)",  bdr: "rgba(59,111,176,.3)"  },
    dropped:     { label: "Đã huỷ",      color: "#C0504D", bg: "rgba(192,80,77,.12)",   bdr: "rgba(192,80,77,.3)"   },
  };

  async function apiFetch(path, opts = {}) {
    const res = await fetch(path, { credentials: "include", ...opts });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || res.status); }
    return res.json();
  }

  function asList(value) {
    if (Array.isArray(value)) return value.filter(Boolean);
    if (value === null || value === undefined || value === "") return [];
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed.filter(Boolean);
      } catch (_) {}
      return value.split(",").map(item => item.trim()).filter(Boolean);
    }
    return [String(value)];
  }

  function displayValue(value) {
    const list = asList(value);
    if (list.length > 1) return list.join(", ");
    if (list.length === 1) return list[0];
    return "—";
  }

  function Field({ label, value }) {
    return (
      <div style={{ background: "rgba(255,255,255,.03)", border: "1px solid var(--rpg-border)", borderRadius: 8, padding: "10px 12px", minWidth: 0 }}>
        <div style={{ fontSize: 10, color: "var(--rpg-muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5 }}>{label}</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", lineHeight: 1.35, overflowWrap: "anywhere" }}>{displayValue(value)}</div>
      </div>
    );
  }

  function RankBadge({ rank }) {
    const m = RANK_META[rank] || { ...RANK_META.rank_01, name: rank || RANK_META.rank_01.name };
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "2px 9px", borderRadius: 999, fontSize: 11, fontWeight: 700,
        background: m.bg, color: m.color, border: `1px solid ${m.color}33`,
        whiteSpace: "nowrap",
      }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: m.color, flexShrink: 0 }} />
        {m.name}
      </span>
    );
  }

  function EnrollBadge({ status }) {
    const s = ENROLL_STATUS[status] || ENROLL_STATUS.enrolled;
    return (
      <span style={{
        display: "inline-flex", alignItems: "center",
        padding: "2px 9px", borderRadius: 999, fontSize: 11, fontWeight: 700,
        background: s.bg, color: s.color, border: `1px solid ${s.bdr}`,
        whiteSpace: "nowrap",
      }}>{s.label}</span>
    );
  }

  function Avatar({ name }) {
    const initials = (name || "?").split(" ").slice(-2).map(w => w[0]).join("").toUpperCase();
    const hue = (name || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
    return (
      <div style={{
        width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
        background: `hsl(${hue},40%,28%)`, border: `1px solid hsl(${hue},40%,38%)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 700, color: `hsl(${hue},60%,75%)`,
      }}>{initials}</div>
    );
  }

  /* ===================== USER DETAIL MODAL ===================== */
  function UserDetailModal({ user, onClose }) {
    const [enrollments, setEnrollments] = React.useState(D.USER_ENROLLMENTS[user.id] || []);
    const [loadingEnr, setLoadingEnr]   = React.useState(true);

    React.useEffect(() => {
      apiFetch(`/admin/api/users/${user.id}`)
        .then(data => { if (data.enrollments) setEnrollments(data.enrollments); })
        .catch(() => {})
        .finally(() => setLoadingEnr(false));
    }, [user.id]);

    const completed   = enrollments.filter(e => e.status === "completed");
    const ongoing     = enrollments.filter(e => e.status !== "completed");
    const rm          = RANK_META[user.rank] || RANK_META.rank_01;

    return (
      <div>
        {/* Header */}
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 20, paddingBottom: 18, borderBottom: "1px solid var(--rpg-border)" }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
            background: `hsl(${(user.full_name||"").split("").reduce((a,c)=>a+c.charCodeAt(0),0)%360},40%,28%)`,
            border: `2px solid ${rm.color}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 700,
            color: `hsl(${(user.full_name||"").split("").reduce((a,c)=>a+c.charCodeAt(0),0)%360},60%,75%)`,
          }}>
            {(user.full_name||"?").split(" ").slice(-2).map(w=>w[0]).join("").toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#fff", marginBottom: 3 }}>{user.full_name}</div>
            <div style={{ fontSize: 13, color: "var(--rpg-muted)", marginBottom: 8 }}>{user.email}{user.team ? ` · ${user.team}` : ""}</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <RankBadge rank={user.rank} />
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            {user.joined_at && <>
              <div style={{ fontSize: 11, color: "var(--rpg-muted)", marginBottom: 3 }}>Tham gia</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{(user.joined_at||"").slice(0,7).replace("-","/")} </div>
            </>}
            {user.last_active && <>
              <div style={{ fontSize: 11, color: "var(--rpg-muted)", marginTop: 6 }}>Hoạt động gần nhất</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{(user.last_active||"").slice(5).replace("-","/")} </div>
            </>}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 10, marginBottom: 20 }}>
          <Field label="Email" value={user.email} />
          <Field label="Full name" value={user.full_name} />
          <Field label="Rank" value={user.rank} />
          <Field label="Role" value={user.role} />
          <Field label="Team" value={user.team} />
          <Field label="Learning formats" value={user.learning_formats} />
          <Field label="Weekly hours" value={user.weekly_hours} />
          <Field label="Preferred trainers" value={user.preferred_trainers} />
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 20 }}>
          {[
            { l: "Khóa đã hoàn thành", v: completed.length, c: "#2BB6A3" },
            { l: "Đang theo học",       v: ongoing.filter(e=>e.status==="in_progress").length, c: "#9b7fff" },
            { l: "Đã đăng ký",         v: ongoing.filter(e=>e.status==="enrolled").length, c: "#6aa3e0" },
          ].map(s => (
            <div key={s.l} style={{ background: "rgba(255,255,255,.03)", border: "1px solid var(--rpg-border)", borderRadius: 8, padding: "12px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.c, marginBottom: 2 }}>{s.v}</div>
              <div style={{ fontSize: 11, color: "var(--rpg-muted)" }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Enrollment list */}
        {loadingEnr ? (
          <div style={{ textAlign: "center", color: "var(--rpg-muted)", padding: "20px 0", fontSize: 13 }}>Đang tải...</div>
        ) : enrollments.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--rpg-muted)", padding: "20px 0", fontSize: 13 }}>
            Chưa đăng ký khóa học nào.
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--rpg-muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>
              Lịch sử khóa học ({enrollments.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {enrollments.map((e, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  background: "rgba(255,255,255,.025)", border: "1px solid var(--rpg-border)",
                  borderRadius: 8, padding: "10px 14px",
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: "#fff", fontSize: 13, marginBottom: 2 }}>{e.course_title || e.title}</div>
                    <div style={{ fontSize: 11, color: "var(--rpg-muted)" }}>
                      Đăng ký {(e.enrolled_at||"").slice(5).replace("-","/")}
                    </div>
                  </div>
                  <EnrollBadge status={e.status} />
                  {e.score !== null && e.score !== undefined && (
                    <span style={{ fontSize: 12, fontWeight: 700, color: e.score >= 90 ? "#2BB6A3" : e.score >= 75 ? "#F5A623" : "#C0504D", minWidth: 34, textAlign: "right" }}>
                      {e.score}đ
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ===================== USERS SCREEN ===================== */
  function SyncUsersForm({ onClose }) {
    const [fileName, setFileName] = React.useState(null);
    const [csvText, setCsvText]   = React.useState(null);
    const [step, setStep]         = React.useState("upload"); // upload | errors | ready | done
    const [batch, setBatch]       = React.useState(null);
    const [errorRows, setErrorRows] = React.useState([]);
    const [loading, setLoading]   = React.useState(false);
    const [error, setError]       = React.useState("");

    function handleFile(e) {
      const f = e.target.files?.[0];
      if (!f) return;
      setFileName(f.name);
      setStep("upload");
      const reader = new FileReader();
      reader.onload = ev => setCsvText(ev.target.result);
      reader.readAsText(f);
    }

    async function handleCheck() {
      if (!csvText) return;
      setLoading(true); setError("");
      try {
        const res = await fetch("/admin/api/data-prep/users/import-csv", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ csvText, source: `CSV upload — ${fileName}` }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          setErrorRows((data.results || []).filter(r => r.errors.length));
          setStep("errors");
          return;
        }
        setBatch({ id: data.batchId, savedRows: data.savedRows });
        setStep("ready");
      } catch (e) {
        setError(e.message || "Kiểm tra thất bại");
      } finally {
        setLoading(false);
      }
    }

    async function handlePromote() {
      if (!batch) return;
      setLoading(true); setError("");
      try {
        const res = await fetch("/admin/api/data-prep/users/promote", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ batchId: batch.id }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Promote thất bại");
        setStep("done");
        onClose?.();
      } catch (e) {
        setError(e.message || "Promote thất bại");
      } finally {
        setLoading(false);
      }
    }

    if (step === "done") return (
      <div>
        <div style={{ background: "rgba(43,182,163,.1)", border: "1px solid rgba(43,182,163,.3)", borderRadius: 8, padding: "14px 16px", marginBottom: 18, color: "#2BB6A3", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="check-circle" size={16} /> Đã đồng bộ {batch.savedRows} người dùng lên hệ thống.
        </div>
        <div style={{ display: "flex", gap: 9, justifyContent: "flex-end" }}>
          <button className="adm-btn adm-btn--primary" onClick={onClose}><Icon name="check" size={13} /> Xong</button>
        </div>
      </div>
    );

    if (step === "errors") return (
      <div>
        <div style={{ color: "var(--rpg-muted)", fontSize: 13, marginBottom: 12 }}>
          {errorRows.length} dòng có lỗi — sửa trong Sheet rồi tải lại CSV, chưa có gì được lưu.
        </div>
        <div style={{ maxHeight: 320, overflowY: "auto", border: "1px solid var(--rpg-border)", borderRadius: 8 }}>
          {errorRows.map(r => (
            <div key={r.index} style={{ padding: "10px 14px", borderBottom: "1px solid var(--rpg-border)", fontSize: 12 }}>
              <div style={{ fontWeight: 700, color: "#fff", marginBottom: 4 }}>Dòng {r.index + 2} — {r.row.email || "(không có email)"}</div>
              <div style={{ color: "#ff6b6b" }}>{r.errors.join("; ")}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 9, justifyContent: "flex-end", marginTop: 18 }}>
          <button className="adm-btn adm-btn--sec" onClick={() => setStep("upload")}>Chọn file khác</button>
          <button className="adm-btn adm-btn--sec" onClick={onClose}>Đóng</button>
        </div>
      </div>
    );

    if (step === "ready") return (
      <div>
        <div style={{ background: "rgba(43,182,163,.1)", border: "1px solid rgba(43,182,163,.3)", borderRadius: 8, padding: "14px 16px", marginBottom: 18, color: "#2BB6A3", fontSize: 13 }}>
          Đã lưu nháp {batch.savedRows} người dùng, chưa hiển thị cho hệ thống. Bấm &quot;Đẩy lên live&quot; để áp dụng.
        </div>
        {error && <div style={{ color: "#ff6b6b", fontSize: 13, marginBottom: 10 }}>{error}</div>}
        <div style={{ display: "flex", gap: 9, justifyContent: "flex-end" }}>
          <button className="adm-btn adm-btn--sec" onClick={onClose} disabled={loading}>Để sau</button>
          <button className="adm-btn adm-btn--primary" onClick={handlePromote} disabled={loading}>
            {loading ? "Đang đẩy lên..." : <><Icon name="upload" size={13} /> Đẩy lên live</>}
          </button>
        </div>
      </div>
    );

    return (
      <div>
        <div style={{ fontSize: 12, color: "var(--rpg-muted)", marginBottom: 12, lineHeight: 1.5 }}>
          Columns used: <code>email, full_name, rank, role, team, learning_formats, weekly_hours, preferred_trainers</code>. Header aliases like <code>Learning_formats</code>, <code>Preferred_trainers</code>, and <code>Prefferd_trainers</code> are accepted.
        </div>
        <label className="adm-upload-zone" style={{ cursor: "pointer" }}>
          <input type="file" accept=".csv" style={{ display: "none" }} onChange={handleFile} />
          <Icon name="file-plus" size={30} color="var(--rpg-muted)" style={{ margin: "0 auto 10px", display: "block" }} />
          <div style={{ fontWeight: 700, color: "#fff", marginBottom: 5 }}>{fileName || "Click để chọn file CSV"}</div>
          <div style={{ fontSize: 12, color: "var(--rpg-muted)" }}>Export từ Google Sheet: File → Download → Comma Separated Values</div>
        </label>
        {error && <div style={{ color: "#ff6b6b", fontSize: 13, marginTop: 10 }}>{error}</div>}
        <div style={{ display: "flex", gap: 9, justifyContent: "flex-end", marginTop: 18 }}>
          <button className="adm-btn adm-btn--sec" onClick={onClose}>Huỷ</button>
          <button className="adm-btn adm-btn--primary" onClick={handleCheck} disabled={!csvText || loading}>
            {loading ? "Đang kiểm tra..." : <><Icon name="check" size={13} /> Kiểm tra dữ liệu</>}
          </button>
        </div>
      </div>
    );
  }

  export function UsersScreen() {
    const [users, setUsers]               = React.useState(D.ADMIN_USERS);
    const [loading, setLoading]           = React.useState(true);
    const [search, setSearch]             = React.useState("");
    const [teamFilter, setTeamFilter]     = React.useState("all");
    const [rankFilter, setRankFilter]     = React.useState("all");
    const [selectedUser, setSelectedUser] = React.useState(null);
    const [page, setPage]                 = React.useState(1);
    const [syncModal, setSyncModal]       = React.useState(false);
    const PER_PAGE = 10;

    React.useEffect(() => {
      apiFetch("/admin/api/users")
        .then(data => { if (data.users?.length) setUsers(data.users); })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, []);

    const teams = ["all", ...Array.from(new Set(users.map(u => u.team).filter(Boolean))).sort()];

    const filtered = users.filter(u => {
      const q = search.toLowerCase();
      const searchable = [
        u.full_name,
        u.email,
        u.rank,
        u.role,
        u.team,
        displayValue(u.learning_formats),
        u.weekly_hours,
        displayValue(u.preferred_trainers),
      ].join(" ").toLowerCase();
      const matchQ = !search || searchable.includes(q);
      const matchT = teamFilter === "all" || u.team === teamFilter;
      const matchR = rankFilter === "all" || u.rank === rankFilter;
      return matchQ && matchT && matchR;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const currentPage = Math.min(page, totalPages);
    const paged = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

    function handleSearch(value) {
      setSearch(value);
      setPage(1);
    }

    function handleTeamFilter(value) {
      setTeamFilter(value);
      setPage(1);
    }

    function handleRankFilter(value) {
      setRankFilter(value);
      setPage(1);
    }

    const withTeam  = users.filter(u => u.team).length;
    const withRole  = users.filter(u => u.role).length;
    const withPrefs = users.filter(u => asList(u.learning_formats).length || asList(u.preferred_trainers).length || u.weekly_hours).length;

    return (
      <div data-screen-label="Users">
        <PageHeader
          title="Quản lý Users"
          subtitle={`${users.length} users`}
          action={
            <button className="adm-btn adm-btn--sec" onClick={() => setSyncModal(true)}>
              <Icon name="refresh-cw" size={14} /> Đồng bộ CSV
            </button>
          }
        />

        <div className="adm-stat-grid" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
          <StatCard label="Total users"              value={users.length}  icon="users"        color="#6aa3e0" iconBg="rgba(59,111,176,.14)" />
          <StatCard label="With team"                value={withTeam}      icon="briefcase"    color="#2BB6A3" iconBg="rgba(43,182,163,.14)" />
          <StatCard label="With role"                value={withRole}      icon="user-check"   color="#9b7fff" iconBg="rgba(124,92,255,.14)" />
          <StatCard label="With learning prefs"      value={withPrefs}     icon="book-open"    color="#FFBA00" iconBg="rgba(255,186,0,.14)"  />
        </div>

        <div className="adm-filter-row" style={{ flexWrap: "wrap", gap: 8 }}>
          <SearchInput value={search} onChange={handleSearch} placeholder="Search name, email, role, team..." />
          <select className="adm-select" style={{ minWidth: 150 }} value={teamFilter} onChange={e => handleTeamFilter(e.target.value)}>
            <option value="all">All teams</option>
            {teams.filter(d => d !== "all").map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select className="adm-select" style={{ minWidth: 140 }} value={rankFilter} onChange={e => handleRankFilter(e.target.value)}>
            <option value="all">Tất cả rank</option>
            {Object.entries(RANK_META).map(([k, m]) => <option key={k} value={k}>{m.name}</option>)}
          </select>
        </div>

        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}>#</th>
                <th style={{ minWidth: 220 }}>Email</th>
                <th style={{ minWidth: 180 }}>Full name</th>
                <th style={{ width: 130 }}>Rank</th>
                <th style={{ minWidth: 120 }}>Role</th>
                <th style={{ minWidth: 120 }}>Team</th>
                <th style={{ minWidth: 160 }}>Learning formats</th>
                <th style={{ width: 110 }}>Weekly hours</th>
                <th style={{ minWidth: 170 }}>Preferred trainers</th>
                <th style={{ width: 44 }}></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", color: "var(--rpg-muted)", padding: 32 }}>Đang tải...</td>
                </tr>
              )}
              {!loading && paged.map((u, idx) => {
                const rowNum = (currentPage - 1) * PER_PAGE + idx + 1;
                return (
                  <tr key={u.id} style={{ cursor: "pointer" }} onClick={() => setSelectedUser(u)}>
                    <td style={{ color: "var(--rpg-faint)", fontSize: 11 }}>{rowNum}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar name={u.email || u.full_name} />
                        <div>
                          <div style={{ fontWeight: 600, color: "#fff", fontSize: 13, overflowWrap: "anywhere" }}>{u.email || "—"}</div>
                          <div style={{ fontSize: 11, color: "var(--rpg-muted)" }}>{u.full_name || "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: "#fff", fontWeight: 600 }}>{u.full_name || "—"}</td>
                    <td><RankBadge rank={u.rank || "rank_01"} /></td>
                    <td style={{ fontSize: 12, color: "var(--rpg-muted)" }}>{u.role || "—"}</td>
                    <td>
                      <span style={{ fontSize: 12, color: "var(--rpg-muted)", background: "rgba(255,255,255,.04)", border: "1px solid var(--rpg-border)", borderRadius: 4, padding: "2px 7px" }}>
                        {u.team || "—"}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: "var(--rpg-muted)", maxWidth: 220, overflowWrap: "anywhere" }}>{displayValue(u.learning_formats)}</td>
                    <td style={{ fontSize: 12, color: "var(--rpg-muted)" }}>{u.weekly_hours || "—"}</td>
                    <td style={{ fontSize: 12, color: "var(--rpg-muted)", maxWidth: 240, overflowWrap: "anywhere" }}>{displayValue(u.preferred_trainers)}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <button className="adm-btn adm-btn--sec adm-btn--sm adm-btn--icon" onClick={() => setSelectedUser(u)}>
                        <Icon name="eye" size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {!loading && filtered.length === 0 && (
            <div className="adm-empty">Không tìm thấy người dùng nào phù hợp</div>
          )}
        </div>

        {totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, fontSize: 13 }}>
            <span style={{ color: "var(--rpg-muted)" }}>
              {filtered.length} kết quả · trang {currentPage}/{totalPages}
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="adm-btn adm-btn--sec adm-btn--sm" disabled={currentPage === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                <Icon name="chevron-left" size={14} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(n => n === 1 || n === totalPages || Math.abs(n - currentPage) <= 1)
                .reduce((acc, n, i, arr) => {
                  if (i > 0 && n - arr[i-1] > 1) acc.push("…");
                  acc.push(n);
                  return acc;
                }, [])
                .map((n, i) => n === "…"
                  ? <span key={`e${i}`} style={{ padding: "0 4px", color: "var(--rpg-muted)" }}>…</span>
                  : <button key={n} className={`adm-btn adm-btn--sm${currentPage === n ? " adm-btn--primary" : " adm-btn--sec"}`} onClick={() => setPage(n)}>{n}</button>
                )}
              <button className="adm-btn adm-btn--sec adm-btn--sm" disabled={currentPage === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                <Icon name="chevron-right" size={14} />
              </button>
            </div>
          </div>
        )}

        <Modal open={!!selectedUser} onClose={() => setSelectedUser(null)}
          title={selectedUser ? `Chi tiết — ${selectedUser.full_name}` : ""}
          width={620}
        >
          {selectedUser && <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} />}
        </Modal>

        <Modal open={syncModal} onClose={() => setSyncModal(false)} title="Đồng bộ Users từ CSV" width={520}>
          <SyncUsersForm onClose={() => { setSyncModal(false); apiFetch("/admin/api/users").then(data => { if (data.users?.length) setUsers(data.users); }).catch(() => {}); }} />
        </Modal>
      </div>
    );
  }

  export const ADMScreensUsers = { UsersScreen };
