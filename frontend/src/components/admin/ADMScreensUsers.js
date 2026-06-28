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

  function RankBadge({ rank }) {
    const m = RANK_META[rank] || RANK_META.rank_01;
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
    const nextRank    = Object.entries(RANK_META).find(([, m]) => m.min > rm.max);
    const xpToNext    = nextRank ? nextRank[1].min - (user.xp || 0) : null;
    const xp          = user.xp || 0;
    const xpPct       = Math.min(100, ((xp - rm.min) / (rm.max - rm.min + 1)) * 100);

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
            <div style={{ fontSize: 13, color: "var(--rpg-muted)", marginBottom: 8 }}>{user.email}{user.dept ? ` · ${user.dept}` : ""}</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <RankBadge rank={user.rank} />
              <span style={{ fontSize: 13, color: rm.color, fontWeight: 700 }}>{xp.toLocaleString("vi-VN")} XP</span>
              {xpToNext !== null && (
                <span style={{ fontSize: 11, color: "var(--rpg-muted)" }}>còn {xpToNext} XP lên rank tiếp</span>
              )}
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

        {/* XP progress bar */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 11, color: "var(--rpg-muted)" }}>
            <span>Tiến độ rank — {rm.name}</span>
            <span>{xp} / {rm.max} XP</span>
          </div>
          <div style={{ height: 6, background: "rgba(255,255,255,.06)", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${xpPct}%`, background: rm.color, borderRadius: 999, transition: "width .6s" }} />
          </div>
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
                      {e.xp_earned > 0 && <span style={{ color: "#FFBA00", marginLeft: 8 }}>+{e.xp_earned} XP</span>}
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
  export function UsersScreen() {
    const [users, setUsers]               = React.useState(D.ADMIN_USERS);
    const [loading, setLoading]           = React.useState(true);
    const [search, setSearch]             = React.useState("");
    const [deptFilter, setDeptFilter]     = React.useState("all");
    const [rankFilter, setRankFilter]     = React.useState("all");
    const [statusFilter, setStatusFilter] = React.useState("all");
    const [selectedUser, setSelectedUser] = React.useState(null);
    const [page, setPage]                 = React.useState(1);
    const PER_PAGE = 10;

    React.useEffect(() => {
      apiFetch("/admin/api/users")
        .then(data => { if (data.users?.length) setUsers(data.users); })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, []);

    const depts = ["all", ...Array.from(new Set(users.map(u => u.dept).filter(Boolean))).sort()];

    const filtered = users.filter(u => {
      const q = search.toLowerCase();
      const matchQ = !search || (u.full_name||"").toLowerCase().includes(q) || (u.email||"").toLowerCase().includes(q) || (u.dept||"").toLowerCase().includes(q);
      const matchD = deptFilter === "all" || u.dept === deptFilter;
      const matchR = rankFilter === "all" || u.rank === rankFilter;
      const matchS = statusFilter === "all" || u.status === statusFilter;
      return matchQ && matchD && matchR && matchS;
    });

    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    React.useEffect(() => { setPage(1); }, [search, deptFilter, rankFilter, statusFilter]);

    const active    = users.filter(u => u.status === "active").length;
    const totalEnr  = users.reduce((a, u) => a + (u.enrollment_count || 0), 0);
    const completed = users.reduce((a, u) => a + (u.completed_count || 0), 0);

    return (
      <div data-screen-label="Users">
        <PageHeader
          title="Quản lý Users"
          subtitle={`${users.length} người dùng · ${active} đang hoạt động`}
        />

        <div className="adm-stat-grid" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
          <StatCard label="Tổng người dùng"       value={users.length}  icon="users"        color="#6aa3e0" iconBg="rgba(59,111,176,.14)" />
          <StatCard label="Đang hoạt động"         value={active}        icon="user-check"   color="#2BB6A3" iconBg="rgba(43,182,163,.14)" />
          <StatCard label="Tổng enrollments"       value={totalEnr}      icon="book-open"    color="#9b7fff" iconBg="rgba(124,92,255,.14)" />
          <StatCard label="Khóa học hoàn thành"    value={completed}     icon="check-circle" color="#FFBA00" iconBg="rgba(255,186,0,.14)"  />
        </div>

        <div className="adm-filter-row" style={{ flexWrap: "wrap", gap: 8 }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Tìm tên, email, phòng ban..." />
          <select className="adm-select" style={{ minWidth: 150 }} value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
            <option value="all">Tất cả phòng ban</option>
            {depts.filter(d => d !== "all").map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select className="adm-select" style={{ minWidth: 140 }} value={rankFilter} onChange={e => setRankFilter(e.target.value)}>
            <option value="all">Tất cả rank</option>
            {Object.entries(RANK_META).map(([k, m]) => <option key={k} value={k}>{m.name}</option>)}
          </select>
          <div className="adm-tab-filter">
            {[["all","Tất cả"],["active","Hoạt động"],["inactive","Không hoạt động"]].map(([v,l]) => (
              <button key={v} className={`adm-tab-filter__item${statusFilter===v?" is-active":""}`} onClick={()=>setStatusFilter(v)}>{l}</button>
            ))}
          </div>
        </div>

        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}>#</th>
                <th>Người dùng</th>
                <th style={{ width: 130 }}>Phòng ban</th>
                <th style={{ width: 120 }}>Rank</th>
                <th style={{ width: 80 }}>XP</th>
                <th style={{ width: 90 }}>Enrollments</th>
                <th style={{ width: 90 }}>Hoàn thành</th>
                <th style={{ width: 90 }}>Hoạt động</th>
                <th style={{ width: 90 }}>Trạng thái</th>
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
                const rm     = RANK_META[u.rank] || RANK_META.rank_01;
                const rowNum = (page - 1) * PER_PAGE + idx + 1;
                return (
                  <tr key={u.id} style={{ cursor: "pointer" }} onClick={() => setSelectedUser(u)}>
                    <td style={{ color: "var(--rpg-faint)", fontSize: 11 }}>{rowNum}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar name={u.full_name || u.email} />
                        <div>
                          <div style={{ fontWeight: 600, color: "#fff", fontSize: 13 }}>{u.full_name || "—"}</div>
                          <div style={{ fontSize: 11, color: "var(--rpg-muted)" }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, color: "var(--rpg-muted)", background: "rgba(255,255,255,.04)", border: "1px solid var(--rpg-border)", borderRadius: 4, padding: "2px 7px" }}>
                        {u.dept || "—"}
                      </span>
                    </td>
                    <td><RankBadge rank={u.rank || "rank_01"} /></td>
                    <td>
                      <span style={{ fontWeight: 700, color: rm.color, fontSize: 13 }}>{(u.xp||0).toLocaleString("vi-VN")}</span>
                    </td>
                    <td style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600, color: "#fff" }}>
                      {u.enrollment_count || 0}
                    </td>
                    <td>
                      {(u.completed_count || 0) > 0
                        ? <span style={{ fontWeight: 700, color: "#2BB6A3" }}>{u.completed_count}</span>
                        : <span style={{ color: "var(--rpg-faint)" }}>—</span>}
                    </td>
                    <td style={{ fontSize: 12, color: "var(--rpg-muted)" }}>
                      {u.last_active ? (u.last_active||"").slice(5).replace("-", "/") : "—"}
                    </td>
                    <td>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        padding: "2px 9px", borderRadius: 999, fontSize: 11, fontWeight: 700,
                        background: u.status === "active" ? "rgba(43,182,163,.12)" : "rgba(138,147,168,.10)",
                        color: u.status === "active" ? "#2BB6A3" : "#8A93A8",
                        border: `1px solid ${u.status === "active" ? "rgba(43,182,163,.3)" : "rgba(138,147,168,.22)"}`,
                      }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor" }} />
                        {u.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
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
              {filtered.length} kết quả · trang {page}/{totalPages}
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="adm-btn adm-btn--sec adm-btn--sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                <Icon name="chevron-left" size={14} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                .reduce((acc, n, i, arr) => {
                  if (i > 0 && n - arr[i-1] > 1) acc.push("…");
                  acc.push(n);
                  return acc;
                }, [])
                .map((n, i) => n === "…"
                  ? <span key={`e${i}`} style={{ padding: "0 4px", color: "var(--rpg-muted)" }}>…</span>
                  : <button key={n} className={`adm-btn adm-btn--sm${page === n ? " adm-btn--primary" : " adm-btn--sec"}`} onClick={() => setPage(n)}>{n}</button>
                )}
              <button className="adm-btn adm-btn--sec adm-btn--sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
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
      </div>
    );
  }

  export const ADMScreensUsers = { UsersScreen };