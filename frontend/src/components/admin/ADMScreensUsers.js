"use client";

import React from "react";
import { GLHUI } from "../GLHUI";
import { ADMComponents } from "./ADMComponents";
import { ADM_DATA } from "@/data/admData";
import { apiFetch as sharedApiFetch, apiFetchResponse } from "@/lib/apiClient";

const { Icon } = GLHUI;
const { Badge, PageHeader, StatCard, Modal, SearchInput } = ADMComponents;
const D = ADM_DATA;

const RANKS = ["Associate", "Senior Associate", "Assistant Manager", "Manager", "Senior Manager", "rank_01", "rank_02", "rank_03", "rank_04", "rank_05"];
const ROLES = ["General", "Individual Contributor", "People Manager", "Product", "Operations", "Marketing", "Finance", "HR", "Engineering"];
const RESERVATION_STATUSES = ["pending", "confirmed", "cancelled"];
const RECORD_STATUSES = ["completed", "not_completed"];

async function apiFetch(path, opts = {}) {
  return sharedApiFetch(path, opts);
}

function asList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (value === null || value === undefined || value === "") return [];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch (_) {}
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [String(value)];
}

function displayValue(value) {
  const list = asList(value);
  if (list.length > 1) return list.join(", ");
  return list[0] || "-";
}

function formatDate(value) {
  if (!value) return "-";
  return String(value).slice(0, 10);
}

function dataStatusLabel(value) {
  if (value === "inactive") return "inactive";
  if (value === "missing_profile") return "missing profile";
  return "ready";
}

function Avatar({ name }) {
  const initials = (name || "?").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
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

function Field({ label, value }) {
  return (
    <div style={{ background: "rgba(255,255,255,.03)", border: "1px solid var(--rpg-border)", borderRadius: 8, padding: "10px 12px", minWidth: 0 }}>
      <div style={{ fontSize: 10, color: "var(--rpg-muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", lineHeight: 1.35, overflowWrap: "anywhere" }}>{value || "-"}</div>
    </div>
  );
}

function SyncUsersForm({ onClose }) {
  const [fileName, setFileName] = React.useState(null);
  const [csvText, setCsvText] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState("");

  function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    const reader = new FileReader();
    reader.onload = (ev) => setCsvText(ev.target.result);
    reader.readAsText(f);
  }

  async function handleSync() {
    setLoading(true);
    setMessage("");
    try {
      const imported = await apiFetch("/admin/api/data-prep/users/import-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvText, source: `CSV upload - ${fileName}` }),
      });
      if (!imported.ok) throw new Error("CSV validation failed");
      await apiFetch("/admin/api/data-prep/users/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId: imported.batchId }),
      });
      setMessage(`Synced ${imported.savedRows || 0} users.`);
      onClose?.();
    } catch (e) {
      setMessage(e.message || "Sync failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <label className="adm-upload-zone" style={{ cursor: "pointer" }}>
        <input type="file" accept=".csv" style={{ display: "none" }} onChange={handleFile} />
        <Icon name="file-plus" size={30} color="var(--rpg-muted)" style={{ margin: "0 auto 10px", display: "block" }} />
        <div style={{ fontWeight: 700, color: "#fff", marginBottom: 5 }}>{fileName || "Choose CSV file"}</div>
        <div style={{ fontSize: 12, color: "var(--rpg-muted)" }}>Required columns follow the current user import template.</div>
      </label>
      {message && <div style={{ color: message.includes("failed") ? "#ff6b6b" : "#2BB6A3", fontSize: 13, marginTop: 10 }}>{message}</div>}
      <div style={{ display: "flex", gap: 9, justifyContent: "flex-end", marginTop: 18 }}>
        <button className="adm-btn adm-btn--sec" onClick={onClose} disabled={loading}>Cancel</button>
        <button className="adm-btn adm-btn--primary" onClick={handleSync} disabled={!csvText || loading}>
          {loading ? "Syncing..." : <><Icon name="upload" size={13} /> Sync CSV</>}
        </button>
      </div>
    </div>
  );
}

function BulkActionModal({ action, selectedCount, teams, onClose, onApply }) {
  const [value, setValue] = React.useState(action === "activate" ? "true" : "");

  const labels = {
    team: "Update team",
    rank: "Update rank",
    role: "Update role",
    activate: "Activate/deactivate",
  };

  function options() {
    if (action === "team") return teams.filter(Boolean);
    if (action === "rank") return RANKS;
    if (action === "role") return ROLES;
    if (action === "activate") return ["true", "false"];
    return [];
  }

  return (
    <Modal open={!!action} onClose={onClose} title={`${labels[action]} for ${selectedCount} users`} width={420}>
      <div className="adm-form-group" style={{ marginBottom: 16 }}>
        <label className="adm-label">{labels[action]}</label>
        {action === "team" ? (
          <input className="adm-input" value={value} onChange={(e) => setValue(e.target.value)} list="team-options" placeholder="Team name" />
        ) : (
          <select className="adm-select" value={value} onChange={(e) => setValue(e.target.value)}>
            <option value="">Select value</option>
            {options().map((item) => (
              <option key={item} value={item}>{action === "activate" ? (item === "true" ? "Activate" : "Deactivate") : item}</option>
            ))}
          </select>
        )}
        <datalist id="team-options">
          {teams.map((team) => <option key={team} value={team} />)}
        </datalist>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 9 }}>
        <button className="adm-btn adm-btn--sec" onClick={onClose}>Cancel</button>
        <button className="adm-btn adm-btn--primary" onClick={() => onApply(action, value)} disabled={!value.trim()}>Apply</button>
      </div>
    </Modal>
  );
}

function ReservationEditor({ userId, item, onSaved, onClose }) {
  const [status, setStatus] = React.useState(item.reservation_status || "pending");
  const [reservedAt, setReservedAt] = React.useState(formatDate(item.reservation_reserved_at) === "-" ? "" : formatDate(item.reservation_reserved_at));
  const [saving, setSaving] = React.useState(false);

  async function save() {
    setSaving(true);
    try {
      const data = await apiFetch(`/admin/api/users/${userId}/reservations/${item.reservation_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reserved_at: reservedAt || null }),
      });
      onSaved(data);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="adm-form-group">
        <label className="adm-label">Reservation status</label>
        <select className="adm-select" value={status} onChange={(e) => setStatus(e.target.value)}>
          {RESERVATION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="adm-form-group">
        <label className="adm-label">Reserved date</label>
        <input className="adm-input" type="date" value={reservedAt} onChange={(e) => setReservedAt(e.target.value)} />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 9 }}>
        <button className="adm-btn adm-btn--sec" onClick={onClose} disabled={saving}>Cancel</button>
        <button className="adm-btn adm-btn--primary" onClick={save} disabled={saving}>Save reservation</button>
      </div>
    </div>
  );
}

function RecordEditor({ userId, item, onSaved, onClose }) {
  const [status, setStatus] = React.useState(item.user_course_status || "not_completed");
  const [completedAt, setCompletedAt] = React.useState(formatDate(item.completed_at) === "-" ? "" : formatDate(item.completed_at));
  const [xp, setXp] = React.useState(item.xp_earned ?? 0);
  const [hours, setHours] = React.useState(item.hours_earned ?? 0);
  const [saving, setSaving] = React.useState(false);

  async function save() {
    setSaving(true);
    try {
      const data = await apiFetch(`/admin/api/users/${userId}/records`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_id: item.course_id,
          status,
          completed_at: completedAt || null,
          xp_earned: xp,
          hours_earned: hours,
          source: "admin_edit",
        }),
      });
      onSaved(data);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="adm-form-group">
        <label className="adm-label">Course status</label>
        <select className="adm-select" value={status} onChange={(e) => setStatus(e.target.value)}>
          {RECORD_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div className="adm-form-group">
          <label className="adm-label">Completion date</label>
          <input className="adm-input" type="date" value={completedAt} onChange={(e) => setCompletedAt(e.target.value)} disabled={status !== "completed"} />
        </div>
        <div className="adm-form-group">
          <label className="adm-label">Hours earned</label>
          <input className="adm-input" type="number" min="0" step="0.5" value={hours} onChange={(e) => setHours(e.target.value)} disabled={status !== "completed"} />
        </div>
      </div>
      <div className="adm-form-group">
        <label className="adm-label">XP earned</label>
        <input className="adm-input" type="number" min="0" value={xp} onChange={(e) => setXp(e.target.value)} disabled={status !== "completed"} />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 9 }}>
        <button className="adm-btn adm-btn--sec" onClick={onClose} disabled={saving}>Cancel</button>
        <button className="adm-btn adm-btn--primary" onClick={save} disabled={saving}>Save record</button>
      </div>
    </div>
  );
}

function EditUserModal({ user, onClose, onSaved }) {
  const [detail, setDetail] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({ team: user.team || "", rank: user.rank || "", role: user.role || "", notes: user.notes || "" });
  const [reservationItem, setReservationItem] = React.useState(null);
  const [recordItem, setRecordItem] = React.useState(null);

  React.useEffect(() => {
    apiFetch(`/admin/api/users/${user.id}`)
      .then((data) => {
        setDetail(data);
        setForm({
          team: data.user?.team || "",
          rank: data.user?.rank || "",
          role: data.user?.role || "",
          notes: data.user?.notes || "",
        });
      })
      .finally(() => setLoading(false));
  }, [user.id]);

  function set(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function saveUser() {
    setSaving(true);
    try {
      const data = await apiFetch(`/admin/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setDetail(data);
      onSaved(data.user);
    } finally {
      setSaving(false);
    }
  }

  function handleHistorySaved(data) {
    setDetail(data);
    onSaved(data.user);
  }

  const current = detail?.user || user;
  const history = detail?.learning_history || [];

  return (
    <Modal open={!!user} onClose={onClose} title={`Edit User - ${user.full_name || user.email}`} width={860}>
      {loading ? (
        <div style={{ color: "var(--rpg-muted)", padding: 28, textAlign: "center" }}>Loading user...</div>
      ) : (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 10, marginBottom: 16 }}>
            <Field label="Name" value={current.full_name} />
            <Field label="Email" value={current.email} />
            <Field label="Weekly hours" value={current.weekly_hours} />
            <Field label="Preferred trainer" value={displayValue(current.preferred_trainers)} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 12, marginBottom: 12 }}>
            <div className="adm-form-group">
              <label className="adm-label">Team</label>
              <input className="adm-input" value={form.team} onChange={(e) => set("team", e.target.value)} />
            </div>
            <div className="adm-form-group">
              <label className="adm-label">Rank</label>
              <input className="adm-input" value={form.rank} onChange={(e) => set("rank", e.target.value)} list="rank-options" />
            </div>
            <div className="adm-form-group">
              <label className="adm-label">Role</label>
              <input className="adm-input" value={form.role} onChange={(e) => set("role", e.target.value)} list="role-options" />
            </div>
          </div>
          <datalist id="rank-options">{RANKS.map((rank) => <option key={rank} value={rank} />)}</datalist>
          <datalist id="role-options">{ROLES.map((role) => <option key={role} value={role} />)}</datalist>

          <div className="adm-form-group" style={{ marginBottom: 16 }}>
            <label className="adm-label">Notes</label>
            <textarea className="adm-input" rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} style={{ resize: "vertical" }} />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
            <button className="adm-btn adm-btn--primary" onClick={saveUser} disabled={saving}>
              {saving ? "Saving..." : <><Icon name="check" size={13} /> Save user</>}
            </button>
          </div>

          <div style={{ borderTop: "1px solid var(--rpg-border)", paddingTop: 16 }}>
            <h3 className="adm-section-card__title" style={{ marginBottom: 12 }}>Learning History</h3>
            {history.length === 0 ? (
              <div className="adm-empty">No learning history yet.</div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {history.map((item) => (
                  <div key={item.id} style={{ border: "1px solid var(--rpg-border)", borderRadius: 8, background: "rgba(255,255,255,.025)", padding: 12 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                      <div style={{ minWidth: 0 }}>
                        <a href={`/admin#course-${item.course_id}`} style={{ color: "#fff", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
                          {item.course_title || item.course_code || item.course_id}
                        </a>
                        <div style={{ color: "var(--rpg-muted)", fontSize: 11, marginTop: 3 }}>{item.course_code || item.course_id}</div>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                        <Badge status={item.reservation_status || "no_reservation"} />
                        <Badge status={item.user_course_status || "not_completed"} />
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr)) auto", gap: 10, alignItems: "center", marginTop: 12 }}>
                      <div style={{ color: "var(--rpg-muted)", fontSize: 12 }}>Session date: <strong style={{ color: "#fff" }}>{formatDate(item.session_date)}</strong></div>
                      <div style={{ color: "var(--rpg-muted)", fontSize: 12 }}>Completion date: <strong style={{ color: "#fff" }}>{formatDate(item.completed_at)}</strong></div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="adm-btn adm-btn--sec adm-btn--sm" onClick={() => setReservationItem(item)} disabled={!item.reservation_id}>Edit reservation</button>
                        <button className="adm-btn adm-btn--sec adm-btn--sm" onClick={() => setRecordItem(item)}>Edit record</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Modal open={!!reservationItem} onClose={() => setReservationItem(null)} title="Edit reservation" width={460}>
            {reservationItem && <ReservationEditor userId={user.id} item={reservationItem} onSaved={handleHistorySaved} onClose={() => setReservationItem(null)} />}
          </Modal>
          <Modal open={!!recordItem} onClose={() => setRecordItem(null)} title="Edit record" width={460}>
            {recordItem && <RecordEditor userId={user.id} item={recordItem} onSaved={handleHistorySaved} onClose={() => setRecordItem(null)} />}
          </Modal>
        </div>
      )}
    </Modal>
  );
}

export function UsersScreen() {
  const [users, setUsers] = React.useState(D.ADMIN_USERS);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [teamFilter, setTeamFilter] = React.useState("all");
  const [rankFilter, setRankFilter] = React.useState("all");
  const [selected, setSelected] = React.useState(new Set());
  const [selectedUser, setSelectedUser] = React.useState(null);
  const [bulkAction, setBulkAction] = React.useState(null);
  const [syncModal, setSyncModal] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const PER_PAGE = 10;

  function reloadUsers() {
    return apiFetch("/admin/api/users")
      .then((data) => {
        if (data.users) setUsers(data.users);
      })
      .finally(() => setLoading(false));
  }

  React.useEffect(() => {
    reloadUsers().catch(() => setLoading(false));
  }, []);

  const teams = Array.from(new Set(users.map((u) => u.team).filter(Boolean))).sort();
  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const haystack = [
      u.full_name,
      u.email,
      u.team,
      u.rank,
      u.role,
      u.weekly_hours,
      displayValue(u.preferred_trainers),
      u.data_status,
    ].join(" ").toLowerCase();
    return (!q || haystack.includes(q)) &&
      (teamFilter === "all" || u.team === teamFilter) &&
      (rankFilter === "all" || u.rank === rankFilter);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);
  const allPagedSelected = paged.length > 0 && paged.every((u) => selected.has(u.id));

  function toggleUser(id) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function togglePage() {
    setSelected((current) => {
      const next = new Set(current);
      if (allPagedSelected) paged.forEach((u) => next.delete(u.id));
      else paged.forEach((u) => next.add(u.id));
      return next;
    });
  }

  async function applyBulk(action, value) {
    const field = action === "activate" ? "is_active" : action;
    await apiFetch("/admin/api/users/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected), updates: { [field]: action === "activate" ? value === "true" : value } }),
    });
    setBulkAction(null);
    setSelected(new Set());
    await reloadUsers();
  }

  async function exportSelected() {
    const res = await apiFetchResponse("/admin/api/users/export", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected) }),
    });
    if (!res.ok) return alert("Export failed");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "selected-users.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function mergeSavedUser(user) {
    if (!user) return;
    setUsers((current) => current.map((item) => item.id === user.id ? { ...item, ...user } : item));
  }

  const activeUsers = users.filter((u) => u.is_active !== false).length;
  const readyUsers = users.filter((u) => u.data_status === "ready").length;
  const withTrainer = users.filter((u) => asList(u.preferred_trainers).length).length;

  return (
    <div data-screen-label="Users">
      <PageHeader
        title="Users"
        subtitle={`${users.length} total users`}
        action={
          <button className="adm-btn adm-btn--sec" onClick={() => setSyncModal(true)}>
            <Icon name="refresh-cw" size={14} /> Sync CSV
          </button>
        }
      />

      <div className="adm-stat-grid" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        <StatCard label="Total users" value={users.length} icon="users" color="#6aa3e0" iconBg="rgba(59,111,176,.14)" />
        <StatCard label="Active" value={activeUsers} icon="user-check" color="#2BB6A3" iconBg="rgba(43,182,163,.14)" />
        <StatCard label="Data ready" value={readyUsers} icon="check-circle" color="#9b7fff" iconBg="rgba(124,92,255,.14)" />
        <StatCard label="With trainer pref" value={withTrainer} icon="book-open" color="#FFBA00" iconBg="rgba(255,186,0,.14)" />
      </div>

      <div className="adm-filter-row">
        <SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search name, email, team, role..." />
        <select className="adm-select" style={{ minWidth: 150 }} value={teamFilter} onChange={(e) => { setTeamFilter(e.target.value); setPage(1); }}>
          <option value="all">All teams</option>
          {teams.map((team) => <option key={team} value={team}>{team}</option>)}
        </select>
        <select className="adm-select" style={{ minWidth: 150 }} value={rankFilter} onChange={(e) => { setRankFilter(e.target.value); setPage(1); }}>
          <option value="all">All ranks</option>
          {Array.from(new Set(users.map((u) => u.rank).filter(Boolean))).sort().map((rank) => <option key={rank} value={rank}>{rank}</option>)}
        </select>
      </div>

      {selected.size > 0 && (
        <div className="adm-info-banner adm-info-banner--blue" style={{ marginBottom: 12, justifyContent: "space-between" }}>
          <span><strong>{selected.size}</strong> users selected</span>
          <span style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="adm-btn adm-btn--sec adm-btn--sm" onClick={() => setBulkAction("team")}>Update team</button>
            <button className="adm-btn adm-btn--sec adm-btn--sm" onClick={() => setBulkAction("rank")}>Update rank</button>
            <button className="adm-btn adm-btn--sec adm-btn--sm" onClick={() => setBulkAction("role")}>Update role</button>
            <button className="adm-btn adm-btn--sec adm-btn--sm" onClick={() => setBulkAction("activate")}>Activate/deactivate</button>
            <button className="adm-btn adm-btn--sec adm-btn--sm" onClick={exportSelected}><Icon name="download" size={13} /> Export selected</button>
          </span>
        </div>
      )}

      <div className="adm-table-wrap adm-table-wrap--scroll adm-users-table-wrap">
        <table className="adm-table adm-users-table">
          <thead>
            <tr>
              <th style={{ width: 36 }}><input type="checkbox" checked={allPagedSelected} onChange={togglePage} /></th>
              <th style={{ minWidth: 230 }}>Name/Email</th>
              <th style={{ minWidth: 120 }}>Team</th>
              <th style={{ minWidth: 110 }}>Rank</th>
              <th style={{ minWidth: 120 }}>Role</th>
              <th style={{ width: 110 }}>Weekly hours</th>
              <th style={{ minWidth: 150 }}>Preferred trainer</th>
              <th style={{ width: 150 }}>Enrollments/Completed</th>
              <th style={{ width: 110 }}>Reservations</th>
              <th style={{ width: 120 }}>Last activity</th>
              <th style={{ width: 130 }}>Data status</th>
              <th className="adm-table-sticky-action" style={{ width: 96 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={12} style={{ textAlign: "center", color: "var(--rpg-muted)", padding: 32 }}>Loading...</td></tr>}
            {!loading && paged.map((u) => (
              <tr key={u.id}>
                <td><input type="checkbox" checked={selected.has(u.id)} onChange={() => toggleUser(u.id)} /></td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar name={u.full_name || u.email} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ color: "#fff", fontWeight: 700, fontSize: 13, overflowWrap: "anywhere" }}>{u.full_name || "-"}</div>
                      <div style={{ color: "var(--rpg-muted)", fontSize: 11, overflowWrap: "anywhere" }}>{u.email || "-"}</div>
                    </div>
                  </div>
                </td>
                <td style={{ color: "var(--rpg-muted)", fontSize: 12 }}>{u.team || "-"}</td>
                <td style={{ color: "var(--rpg-muted)", fontSize: 12 }}>{u.rank || "-"}</td>
                <td style={{ color: "var(--rpg-muted)", fontSize: 12 }}>{u.role || "-"}</td>
                <td style={{ color: "var(--rpg-muted)", fontSize: 12 }}>{u.weekly_hours || "-"}</td>
                <td style={{ color: "var(--rpg-muted)", fontSize: 12, maxWidth: 190, overflowWrap: "anywhere" }}>{displayValue(u.preferred_trainers)}</td>
                <td style={{ fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>{u.enrollments_count || 0}/{u.completed_courses_count || 0}</td>
                <td style={{ fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>{u.reservations_count || 0}</td>
                <td style={{ color: "var(--rpg-muted)", fontSize: 12 }}>{formatDate(u.last_activity)}</td>
                <td><Badge status={u.data_status === "ready" ? "active" : u.data_status === "inactive" ? "inactive" : "pending"} /> <span style={{ display: "none" }}>{dataStatusLabel(u.data_status)}</span></td>
                <td className="adm-table-sticky-action">
                  <button className="adm-btn adm-btn--sec adm-btn--sm" onClick={() => setSelectedUser(u)}>
                    <Icon name="edit-3" size={13} /> Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && filtered.length === 0 && <div className="adm-empty">No users found.</div>}
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, color: "var(--rpg-muted)", fontSize: 13 }}>
          <span>{filtered.length} results - page {currentPage}/{totalPages}</span>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="adm-btn adm-btn--sec adm-btn--sm" disabled={currentPage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}><Icon name="chevron-left" size={14} /></button>
            <button className="adm-btn adm-btn--sec adm-btn--sm" disabled={currentPage === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}><Icon name="chevron-right" size={14} /></button>
          </div>
        </div>
      )}

      {selectedUser && <EditUserModal user={selectedUser} onClose={() => setSelectedUser(null)} onSaved={mergeSavedUser} />}
      {bulkAction && <BulkActionModal action={bulkAction} selectedCount={selected.size} teams={teams} onClose={() => setBulkAction(null)} onApply={applyBulk} />}
      <Modal open={syncModal} onClose={() => setSyncModal(false)} title="Sync Users from CSV" width={520}>
        <SyncUsersForm onClose={() => { setSyncModal(false); reloadUsers().catch(() => {}); }} />
      </Modal>
    </div>
  );
}

export const ADMScreensUsers = { UsersScreen };
