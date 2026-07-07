"use client";

import React from "react";
import { GLHUI } from '../GLHUI';
import { ADMComponents } from './ADMComponents';
import { ADM_DATA } from '@/data/admData';

const { Icon } = GLHUI;
const { Badge, PageHeader, StatCard, SectionCard, Modal, Toggle, SearchInput } = ADMComponents;
const D = ADM_DATA;

const COURSE_TYPES = [
  { id: "scheduled", label: "Khóa có lịch" },
  { id: "interest", label: "Đặt chỗ / gom nhu cầu" },
  { id: "elearning", label: "E-learning" },
  { id: "external", label: "Khóa bên ngoài" },
  { id: "material_only", label: "Tài liệu / recording" },
];

const COURSE_STATUSES = [
  { id: "draft", label: "Nháp" },
  { id: "open", label: "Đang mở" },
  { id: "full", label: "Đã đủ slot / nhu cầu" },
  { id: "ended", label: "Đã tổ chức xong" },
  { id: "cancelled", label: "Đã hủy" },
];


  
  

  async function apiFetch(path, opts = {}) {
    const res = await fetch(path, { credentials: "include", ...opts });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || res.status); }
    return res.json();
  }

  function toList(value) {
    if (Array.isArray(value)) return value.map(item => String(item).trim()).filter(Boolean);
    if (!value) return [];
    const raw = String(value).trim();
    if (!raw) return [];
    if (raw.startsWith("[")) {
      let parsed = null;
      try {
        parsed = JSON.parse(raw);
      } catch (_) {
        parsed = null;
      }
      if (Array.isArray(parsed)) return parsed.map(item => String(item).trim()).filter(Boolean);
    }
    return raw.split(/[,;\n]/).map(item => item.trim()).filter(Boolean);
  }

  function formatListInput(value) {
    return Array.isArray(value) ? value.join(", ") : (value || "");
  }

  function nextCourseCode(courses) {
    const max = (courses || []).reduce((current, course) => {
      const match = String(course.course_code || "").match(/^LC-(\d+)$/i);
      return match ? Math.max(current, Number(match[1])) : current;
    }, 0);
    return `LC-${String(max + 1).padStart(3, "0")}`;
  }

  function mapCourse(c) {
    return {
      id: c.id,
      course_code: c.course_code || c.id,
      title: c.title,
      trainer: c.trainer || "",
      trainer_type: c.trainer_type || "internal",
      format: c.format,
      duration: Math.round((parseFloat(c.duration_hours) || 0) * 60),
      duration_hours: parseFloat(c.duration_hours) || 0,
      rating: c.rating == null ? "" : parseFloat(c.rating),
      rank_targets: toList(c.rank_targets),
      role_targets: toList(c.role_targets),
      skill_tags: toList(c.skill_tags),
      xp: c.xp_reward || 0,
      xp_reward: c.xp_reward || 0,
      is_active: Boolean(c.is_active),
      status: c.status || "open",
      material_url: c.material_url || "",
      enrollments: Number(c.enrollment_count ?? c.enrolled_count ?? 0),
      description: c.description || "",
      type: c.type || "scheduled",
      min_participants: c.min_participants ?? "",
      registration_url: c.registration_url || "",
      session_date: c.session_date ? String(c.session_date).split("T")[0] : "",
      session_time: c.session_time || "",
      location: c.location || "",
      max_participants: c.max_participants ?? "",
      current_count: Number(c.active_reservation_count ?? c.current_count ?? 0),
      active_reservation_count: Number(c.active_reservation_count ?? c.current_count ?? 0),
      reservation_count: Number(c.reservation_count ?? c.current_count ?? 0),
      enrollment_count: Number(c.enrollment_count ?? c.enrolled_count ?? 0),
    };
  }

  /* ===================== DASHBOARD ===================== */
  export function Dashboard({ onNavigate }) {
    const [stats, setStats] = React.useState(D.ADMIN_STATS);
    const [pendingReqs, setPendingReqs] = React.useState(D.ADMIN_REQUESTS.filter(r => r.status === "pending"));
    const [analytics, setAnalytics] = React.useState(null);

    React.useEffect(() => {
      apiFetch("/admin/api/stats").then(data => {
        setStats(prev => ({
          ...prev,
          total_users: data.total_users ?? prev.total_users,
          enrollments_this_month: data.enrollments_this_month ?? prev.enrollments_this_month,
          pending_ld_requests: data.pending_ld_requests ?? prev.pending_ld_requests,
          active_courses: data.active_courses ?? prev.active_courses,
          top_courses: data.top_courses?.length
            ? data.top_courses.map(c => ({ name: c.title, code: c.id, enrollments: c.enrolled_count || 0 }))
            : prev.top_courses,
        }));
      }).catch(() => {});
      apiFetch("/admin/api/ld-requests?status=pending").then(data => {
        setPendingReqs((data.requests || []).map(r => ({
          id: r.id,
          user_name: r.full_name || r.email,
          dept: "",
          title: r.description?.slice(0, 60) || "L&D Request",
          submitted_at: (r.created_at || "").slice(0, 10),
          status: "pending",
        })));
      }).catch(() => {});
      apiFetch("/admin/api/analytics").then(data => setAnalytics(data)).catch(() => setAnalytics(null));
    }, []);

    const s = stats;
    const maxE  = Math.max(...(s.top_courses || []).map(c => c.enrollments), 1);
    const metrics = analytics?.metrics || {};
    const topGaPages = analytics?.top_pages || [];
    const maxGaViews = Math.max(...topGaPages.map(page => Number(page.views) || 0), 1);
    const courseViews = Number(metrics.course_views) || 0;
    const registerClicks = Number(metrics.register_clicks) || 0;
    const maxGaEvent = Math.max(courseViews, registerClicks, 1);

    return (
      <div data-screen-label="Dashboard">
        <PageHeader
          title="Dashboard"
          subtitle={`Tổng quan hệ thống · ${new Date().toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}`}
        />

        <div className="adm-stat-grid">
          <StatCard label="Người dùng onboard"        value={(s.total_users || 0).toLocaleString("vi-VN")} icon="users"          color="#6aa3e0" iconBg="rgba(59,111,176,.14)" />
          <StatCard label="Enrollments tháng này"     value={s.enrollments_this_month || 0}                icon="trending-up"    color="#2BB6A3" iconBg="rgba(43,182,163,.14)" delta={s.enrollments_delta} />
          <StatCard label="L&D Requests chờ duyệt"   value={s.pending_ld_requests || 0}                   icon="message-square" color="#E41E26" iconBg="rgba(228,30,38,.12)" />
          <StatCard label="Khóa học đang hoạt động"  value={s.active_courses || 0}                        icon="book-open"      color="#9b7fff" iconBg="rgba(124,92,255,.14)" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <SectionCard title="Top 5 khóa học · Enrollments tháng này">
              <div className="adm-bar-chart">
                {(s.top_courses || []).map((c, i) => (
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

            <SectionCard title="Site Analytics">
              {analytics?.implemented ? (
                <div className="adm-ga-dashboard">
                  <div className="adm-ga-metrics">
                    {[
                      ["Users", metrics.users],
                      ["Sessions", metrics.sessions],
                      ["Pageviews", metrics.pageviews],
                      ["Active today", metrics.active_users_today],
                      ["Course views", metrics.course_views],
                      ["Register clicks", metrics.register_clicks],
                      ["Conversion rate", metrics.conversion_rate],
                    ].map(([label, value]) => (
                      <div key={label} className="adm-ga-metric">
                        <div className="adm-ga-metric__label">{label}</div>
                        <div className="adm-ga-metric__value">{value ?? "-"}</div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <div className="adm-ga-title">Course funnel</div>
                    <div className="adm-bar-chart">
                      {[
                        ["Course views", courseViews],
                        ["Register clicks", registerClicks],
                      ].map(([label, value]) => (
                        <div key={label} className="adm-bar-row">
                          <span className="adm-bar-name" title={label}>{label}</span>
                          <div className="adm-bar-track">
                            <div className="adm-bar-fill adm-bar-fill--teal" style={{ width: `${(value / maxGaEvent) * 100}%` }} />
                          </div>
                          <span className="adm-bar-val">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {topGaPages.length > 0 && (
                    <div>
                      <div className="adm-ga-title">Top pages</div>
                      <div className="adm-bar-chart">
                        {topGaPages.map((page, i) => (
                          <div key={`${page.path || page.title}-${i}`} className="adm-bar-row">
                            <span className="adm-bar-name" title={page.path || page.title}>{page.path || page.title}</span>
                            <div className="adm-bar-track">
                              <div className="adm-bar-fill" style={{ width: `${((Number(page.views) || 0) / maxGaViews) * 100}%` }} />
                            </div>
                            <span className="adm-bar-val">{page.views}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="adm-empty" style={{ margin: 0, display: "grid", gap: 14, justifyItems: "center", textAlign: "center", padding: "24px 16px" }}>
                  {analytics?.empty_reason === "GA_DATA_API_FAILED" && String(analytics?.message || "").includes("403") ? (
                    <div style={{ background: "rgba(255, 158, 0, 0.1)", border: "1px solid var(--amber)", borderRadius: 8, padding: "16px", maxWidth: 580, textAlign: "left", color: "#fff", fontSize: 13, lineHeight: 1.5 }}>
                      <div style={{ fontWeight: 700, color: "var(--amber)", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                        <span>⚠️ Google Analytics Data API chưa được bật</span>
                      </div>
                      <div>
                        Project Google Cloud của bạn chưa bật API hoặc vừa mới bật nên chưa có hiệu lực. Vui lòng nhấn vào liên kết bên dưới để bật <b>Google Analytics Data API</b>, sau đó đợi 2-3 phút rồi làm mới trang:
                      </div>
                      <div style={{ marginTop: 10 }}>
                        <a
                          href="https://console.developers.google.com/apis/api/analyticsdata.googleapis.com/overview"
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "var(--glh-accent)", textDecoration: "underline", fontWeight: 600 }}
                        >
                          👉 Mở Google Cloud Console để bật API ngay
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div style={{ maxWidth: 500, fontSize: 13, color: "var(--rpg-muted)", lineHeight: 1.5 }}>
                      {analytics?.message || "Chưa cấu hình Google Analytics Data API cho hệ thống. Hãy cấu hình Property ID và Key JSON để xem báo cáo trực tiếp tại đây."}
                    </div>
                  )}
                  {onNavigate && (
                    <button
                      type="button"
                      className="adm-btn adm-btn--primary"
                      onClick={() => onNavigate("bot_settings")}
                      style={{ fontSize: 12, padding: "8px 18px" }}
                    >
                      ⚙️ Cấu hình Analytics ngay
                    </button>
                  )}
                </div>
              )}
            </SectionCard>
          </div>

          <SectionCard title="L&D Requests chờ duyệt">
            {pendingReqs.length === 0 && <div style={{ color: "var(--rpg-muted)", fontSize: 13 }}>Không có request nào đang chờ.</div>}
            {pendingReqs.slice(0, 5).map((r, i) => (
              <div key={r.id} style={{ padding: "11px 0", borderBottom: i < Math.min(pendingReqs.length, 5) - 1 ? "1px solid var(--rpg-border)" : "none" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#fff", marginBottom: 2 }}>{r.user_name}</div>
                <div style={{ fontSize: 12, color: "var(--rpg-muted)", marginBottom: 6, lineHeight: 1.4 }}>{r.title}</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  {r.dept && <span style={{ fontSize: 11, background: "rgba(255,255,255,.05)", borderRadius: 4, padding: "2px 7px", color: "var(--rpg-muted)" }}>{r.dept}</span>}
                  <span style={{ fontSize: 11, color: "var(--rpg-faint)" }}>{(r.submitted_at || "").slice(5).replace("-", "/")}</span>
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
  const RANK_NAMES = {
    rank_01: "Associate",
    rank_02: "Senior Associate",
    rank_03: "Assistant Manager",
    rank_04: "Manager",
    rank_05: "Senior Manager",
    Associate: "Associate",
    "Senior Associate": "Senior Associate",
    "Assistant Manager": "Assistant Manager",
    Manager: "Manager",
    "Senior Manager": "Senior Manager",
  };
  const RANKS_ALL  = [
    { id: "Associate", name: "Associate" },
    { id: "Senior Associate", name: "Senior Associate" },
    { id: "Assistant Manager", name: "Assistant Manager" },
    { id: "Manager", name: "Manager" },
    { id: "Senior Manager", name: "Senior Manager" },
  ];

  export function CoursesScreen() {
    const [courses, setCourses]   = React.useState(D.ADMIN_COURSES.map(mapCourse));
    const [loading, setLoading]   = React.useState(true);
    const [search, setSearch]     = React.useState("");
    const [statusFilter, setStatusFilter] = React.useState("all");
    const [selected, setSelected] = React.useState(new Set());
    const [currentPage, setCurrentPage] = React.useState(1);
    const [rowsPerPage, setRowsPerPage] = React.useState(20);
    const [editModal, setEditModal]   = React.useState(false);
    const [importModal, setImportModal] = React.useState(false);
    const [importTarget, setImportTarget] = React.useState(null);
    const [attendeesModal, setAttendeesModal] = React.useState(null);
    const [completionsModal, setCompletionsModal] = React.useState(null);
    const [confirmTarget, setConfirmTarget] = React.useState(null);
    const [confirming, setConfirming] = React.useState(false);
    const [syncModal, setSyncModal] = React.useState(false);
    const [batchActionModal, setBatchActionModal] = React.useState(null); // null | {type, title} where type = 'format'|'is_active'|'rank_targets'|'xp_reward'|'status'|'type'
    const [batchValue, setBatchValue] = React.useState("");
    const [batchRanks, setBatchRanks] = React.useState([]);
    const [editTarget, setEditTarget] = React.useState(null);
    const [saving, setSaving]     = React.useState(false);
    const [error, setError]       = React.useState("");

    function reloadCourses() {
      return apiFetch("/admin/api/courses")
        .then(data => { if (data.courses) setCourses(data.courses.map(mapCourse)); })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
    React.useEffect(() => { reloadCourses(); }, []);

    const filtered = courses.filter(c => {
      const q = search.toLowerCase();
      const matchQ = !search || c.title.toLowerCase().includes(q) || c.id.toLowerCase().includes(q) || c.course_code.toLowerCase().includes(q);
      const matchS = statusFilter === "all" || (statusFilter === "active" ? c.is_active : !c.is_active);
      return matchQ && matchS;
    });

    const totalPages = Math.ceil(filtered.length / rowsPerPage);
    const validPage = Math.max(1, Math.min(currentPage, totalPages || 1));
    const paginatedRows = filtered.slice((validPage - 1) * rowsPerPage, validPage * rowsPerPage);

    function openEdit(c) { setEditTarget(c); setError(""); setEditModal(true); }
    function openCreate() { setEditTarget(null); setError(""); setEditModal(true); }
    function openImport(c = null) { setImportTarget(c); setImportModal(true); }
    const canReserve = (c) => ["scheduled", "interest"].includes(c.type) || Boolean(c.session_date);
    const bookingCount = (c) => Number(c.active_reservation_count ?? c.current_count ?? 0);
    const completionCount = (c) => Number(c.enrollment_count ?? c.enrollments ?? 0);
    const bookingTarget = (c) => c.max_participants || (c.type === "interest" ? c.min_participants : null);

    async function confirmCourse(c) {
      setConfirming(true);
      try {
        await apiFetch(`/admin/api/courses/${c.id}/confirm`, { method: "POST" });
        await reloadCourses();
        setConfirmTarget(null);
      } catch (e) {
        alert("Xac nhan that bai: " + e.message);
      } finally {
        setConfirming(false);
      }
    }

    async function toggleActive(id) {
      const course = courses.find(c => c.id === id);
      if (!course) return;
      const newVal = !course.is_active;
      setCourses(cs => cs.map(c => c.id === id ? { ...c, is_active: newVal } : c));
      try {
        // PUT requires the full course payload (title/trainer/format/duration_hours/type/xp_reward) -
        // sending only is_active gets rejected with 400 MISSING_REQUIRED_FIELDS.
        await apiFetch(`/admin/api/courses/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: course.title,
            trainer: course.trainer,
            trainer_type: course.trainer_type,
            course_code: course.course_code,
            format: course.format,
            duration_hours: course.duration_hours,
            rank_targets: course.rank_targets,
            role_targets: course.role_targets,
            skill_tags: course.skill_tags,
            type: course.type,
            xp_reward: course.xp_reward,
            rating: course.rating || 0,
            description: course.description,
            registration_url: course.registration_url,
            status: course.status,
            material_url: course.material_url,
            min_participants: course.min_participants ?? null,
            session_date: course.session_date || null,
            session_time: course.session_time || null,
            location: course.location || null,
            max_participants: course.max_participants || null,
            is_active: newVal,
          }),
        });
      } catch (e) {
        setCourses(cs => cs.map(c => c.id === id ? { ...c, is_active: !newVal } : c));
      }
    }

    async function handleSave(formData) {
      setSaving(true); setError("");
      try {
        const isEdit = Boolean(editTarget);
        const payload = {
          title: formData.title,
          course_code: formData.id,
          trainer: formData.trainer,
          trainer_type: formData.trainer_type || "internal",
          format: formData.format,
          duration_hours: parseFloat(formData.duration_hours) || 1,
          rank_targets: toList(formData.rank_targets),
          role_targets: toList(formData.role_targets),
          skill_tags: toList(formData.skill_tags),
          type: formData.type || "scheduled",
          xp_reward: parseInt(formData.xp_reward) || 100,
          rating: formData.rating === "" ? 0 : parseFloat(formData.rating) || 0,
          description: formData.description || "",
          registration_url: formData.registration_url || "",
          is_active: formData.is_active !== false,
          status: formData.status || "open",
          material_url: formData.material_url || "",
          min_participants: parseInt(formData.min_participants) || null,
          session_date: formData.session_date || null,
          session_time: formData.session_time || null,
          location: formData.location || null,
          max_participants: parseInt(formData.max_participants) || null,
        };
        if (!isEdit) payload.id = formData.id;
        const data = await apiFetch(
          isEdit ? `/admin/api/courses/${editTarget.id}` : "/admin/api/courses",
          { method: isEdit ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
        );
        const saved = mapCourse(data.course);
        setCourses(cs => isEdit ? cs.map(c => c.id === saved.id ? saved : c) : [saved, ...cs]);
        setEditModal(false);
      } catch (e) {
        setError(e.message || "Lưu thất bại");
      } finally {
        setSaving(false);
      }
    }

    async function handleDelete(id) {
      if (!confirm(`Xoá khoá học ${id}? Hành động này không thể hoàn tác.`)) return;
      try {
        await apiFetch(`/admin/api/courses/${id}`, { method: "DELETE" });
        setCourses(cs => cs.filter(c => c.id !== id));
      } catch (e) {
        alert("Xoá thất bại: " + e.message);
      }
    }

    function toggleSelectCourse(id) {
      setSelected(s => {
        const next = new Set(s);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    }

    function selectAllFiltered() {
      setSelected(new Set(filtered.map(c => c.id)));
    }

    function clearSelection() {
      setSelected(new Set());
    }

    async function handleBatchDelete() {
      if (!confirm(`Xóa ${selected.size} khóa học? Hành động này không thể hoàn tác.`)) return;
      try {
        setSaving(true);
        for (const id of selected) {
          await apiFetch(`/admin/api/courses/${id}`, { method: "DELETE" });
        }
        setCourses(cs => cs.filter(c => !selected.has(c.id)));
        setSelected(new Set());
        alert(`Đã xóa ${selected.size} khóa học.`);
      } catch (e) {
        alert("Xóa thất bại: " + e.message);
      } finally {
        setSaving(false);
      }
    }

    async function handleBatchUpdate() {
      if (!batchActionModal) return;
      const { type } = batchActionModal;

      try {
        setSaving(true);
        for (const id of selected) {
          const course = courses.find(c => c.id === id);
          if (!course) continue;

          const payload = {
            title: course.title,
            trainer: course.trainer,
            trainer_type: course.trainer_type,
            course_code: course.course_code,
            format: course.format,
            duration_hours: course.duration_hours,
            rank_targets: type === 'rank_targets' ? batchRanks : course.rank_targets,
            role_targets: course.role_targets,
            skill_tags: course.skill_tags,
            type: course.type,
            xp_reward: type === 'xp_reward' ? parseInt(batchValue) || course.xp_reward : course.xp_reward,
            rating: course.rating || 0,
            description: course.description,
            registration_url: course.registration_url,
            status: course.status,
            material_url: course.material_url,
            min_participants: course.min_participants ?? null,
            session_date: course.session_date || null,
            session_time: course.session_time || null,
            location: course.location || null,
            max_participants: course.max_participants || null,
            is_active: type === 'is_active' ? batchValue === 'true' : course.is_active,
            format: type === 'format' ? batchValue : course.format,
          };

          await apiFetch(`/admin/api/courses/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        }
        await reloadCourses();
        setBatchActionModal(null);
        setBatchValue("");
        setBatchRanks([]);
        setSelected(new Set());
        alert(`Cập nhật thành công cho ${selected.size} khóa học.`);
      } catch (e) {
        alert("Cập nhật thất bại: " + e.message);
      } finally {
        setSaving(false);
      }
    }

    async function handleRollbackLastSync() {
      if (!confirm("Hoàn tác lần đồng bộ CSV gần nhất? Chỉ áp dụng được trong vòng 24h sau khi đẩy lên live.")) return;
      try {
        await apiFetch("/admin/api/data-prep/catalog/rollback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        await reloadCourses();
        alert("Đã hoàn tác lần đồng bộ gần nhất.");
      } catch (e) {
        alert("Hoàn tác thất bại: " + e.message);
      }
    }

    return (
      <div data-screen-label="Courses">
        <PageHeader
          title="Quản lý Khóa học"
          subtitle={`${courses.filter(c => c.is_active).length} hoạt động · ${courses.filter(c => !c.is_active).length} ẩn`}
          action={
            <div style={{ display: "flex", gap: 8 }}>
              <button className="adm-btn adm-btn--sec" onClick={() => setSyncModal(true)}>
                <Icon name="refresh-cw" size={14} /> Import khóa học CSV
              </button>
              <button className="adm-btn adm-btn--sec" style={{ display: "none" }} onClick={handleRollbackLastSync}>
                <Icon name="rotate-ccw" size={14} /> Hoàn tác đồng bộ gần nhất
              </button>
              <button className="adm-btn adm-btn--sec" onClick={() => openImport(null)}>
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

        {loading && <div style={{ color: "var(--rpg-muted)", textAlign: "center", padding: 32 }}>Đang tải...</div>}

        {selected.size > 0 && (
          <div style={{ background: "rgba(43,182,163,.1)", border: "1px solid rgba(43,182,163,.3)", borderRadius: 8, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 16, justifyContent: "space-between" }}>
            <div style={{ color: "var(--rpg-text)", fontSize: 13 }}>
              Đã chọn <strong>{selected.size}</strong>/{filtered.length} khóa học
              {selected.size < filtered.length && (
                <button onClick={selectAllFiltered} style={{ marginLeft: 12, background: "none", border: "none", color: "#2BB6A3", cursor: "pointer", fontSize: 12, fontWeight: 600, textDecoration: "underline" }}>Chọn tất cả {filtered.length}</button>
              )}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="adm-btn adm-btn--sec adm-btn--sm" onClick={() => setBatchActionModal({ type: 'format', title: 'Chọn format' })}>
                <Icon name="layers" size={13} /> Format
              </button>
              <button className="adm-btn adm-btn--sec adm-btn--sm" onClick={() => setBatchActionModal({ type: 'status', title: 'Chọn status' })}>
                <Icon name="check-circle" size={13} /> Status
              </button>
              <button className="adm-btn adm-btn--sec adm-btn--sm" onClick={() => setBatchActionModal({ type: 'type', title: 'Chọn type' })}>
                <Icon name="layers" size={13} /> Type
              </button>
              <button className="adm-btn adm-btn--sec adm-btn--sm" onClick={() => setBatchActionModal({ type: 'is_active', title: 'Chọn hiển thị' })}>
                <Icon name="eye" size={13} /> Hiển thị
              </button>
              <button className="adm-btn adm-btn--sec adm-btn--sm" onClick={() => setBatchActionModal({ type: 'rank_targets', title: 'Chọn rank target' })}>
                <Icon name="award" size={13} /> Rank
              </button>
              <button className="adm-btn adm-btn--sec adm-btn--sm" style={{ display: "none" }} onClick={() => setBatchActionModal({ type: 'xp_reward', title: 'Chọn XP' })}>
                <Icon name="zap" size={13} /> XP
              </button>
              <button className="adm-btn adm-btn--sec adm-btn--sm" onClick={handleBatchDelete} style={{ color: "#E41E26" }}>
                <Icon name="trash-2" size={13} /> Xóa
              </button>
              <button className="adm-btn adm-btn--sec adm-btn--sm" onClick={clearSelection}>Bỏ chọn</button>
            </div>
          </div>
        )}

        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input type="checkbox" checked={paginatedRows.length > 0 && paginatedRows.every(c => selected.has(c.id))} onChange={() => paginatedRows.every(c => selected.has(c.id)) ? setSelected(s => { const next = new Set(s); paginatedRows.forEach(c => next.delete(c.id)); return next; }) : setSelected(s => { const next = new Set(s); paginatedRows.forEach(c => next.add(c.id)); return next; })} />
                </th>
                <th style={{ width: 110 }}>Mã</th>
                <th>Tên khóa học</th>
                <th style={{ width: 104 }}>Type</th>
                <th style={{ width: 120 }}>Ngày</th>
                <th style={{ width: 108 }}>Format</th>
                <th style={{ width: 118 }}>Status</th>
                <th>Rank targets</th>
                <th style={{ width: 104 }}>Đăng ký</th>
                <th style={{ width: 92 }}>Hoàn thành</th>
                <th style={{ width: 110 }}>Hiển thị</th>
                <th style={{ width: 190 }}></th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map(c => (
                <tr key={c.id}>
                  <td>
                    <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelectCourse(c.id)} />
                  </td>
                  <td><code style={{ fontSize: 11 }}>{c.course_code}</code></td>
                  <td>
                    <div style={{ fontWeight: 600, color: "#fff" }}>{c.title}</div>
                    <div style={{ fontSize: 11, color: "var(--rpg-muted)" }}>{c.trainer} · {c.duration} phút · row {String(c.id).slice(0, 8)}</div>
                  </td>
                  <td><Badge status={c.type} /></td>
                  <td>
                    <div style={{ fontSize: 12, color: c.session_date ? "#fff" : "var(--rpg-muted)", fontWeight: 600 }}>{c.session_date || "-"}</div>
                    {c.session_time && <div style={{ fontSize: 11, color: "var(--rpg-muted)" }}>{c.session_time}</div>}
                  </td>
                  <td><Badge status={c.format} /></td>
                  <td><Badge status={c.status} /></td>
                  <td>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {(c.rank_targets || []).map(r => (
                        <span key={r} style={{ fontSize: 10, background: "rgba(255,255,255,.05)", border: "1px solid var(--rpg-border)", borderRadius: 4, padding: "2px 6px", color: "var(--rpg-muted)" }}>
                          {RANK_NAMES[r] || r}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
                    {canReserve(c) ? (
                      <button className="adm-btn adm-btn--sec adm-btn--sm" onClick={() => setAttendeesModal(c)} title="Danh sach dat cho">
                        {bookingCount(c)}{bookingTarget(c) ? `/${bookingTarget(c)}` : ""}
                      </button>
                    ) : "-"}
                  </td>
                  <td style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
                    {completionCount(c) > 0 ? (
                      <button className="adm-btn adm-btn--sec adm-btn--sm" onClick={() => setCompletionsModal(c)} title="Danh sach hoan thanh">
                        {completionCount(c)}
                      </button>
                    ) : "0"}
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Toggle value={c.is_active} onChange={() => toggleActive(c.id)} />
                      <span style={{ fontSize: 11, color: "var(--rpg-muted)" }}>{c.is_active ? "Hiện" : "Ẩn"}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {canReserve(c) && bookingCount(c) > 0 && c.status !== "confirmed" && c.status !== "cancelled" && (
                        <button className="adm-btn adm-btn--primary adm-btn--sm adm-btn--icon" onClick={() => setConfirmTarget(c)} title="Xác nhận mở lớp">
                          <Icon name="send" size={14} />
                        </button>
                      )}
                      <button className="adm-btn adm-btn--sec adm-btn--sm adm-btn--icon" onClick={() => openImport(c)} title="Import participants">
                        <Icon name="users" size={14} />
                      </button>
                      <button className="adm-btn adm-btn--sec adm-btn--sm adm-btn--icon" onClick={() => openEdit(c)} title="Sửa">
                        <Icon name="edit-3" size={14} />
                      </button>
                      <button className="adm-btn adm-btn--sec adm-btn--sm adm-btn--icon" onClick={() => handleDelete(c.id)} title="Xóa" style={{ color: "#E41E26" }}>
                        <Icon name="trash-2" size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && paginatedRows.length === 0 && filtered.length === 0 && (
            <div className="adm-empty">Không tìm thấy khóa học nào phù hợp</div>
          )}
        </div>

        {!loading && filtered.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", fontSize: 13, color: "var(--rpg-muted)" }}>
            <div>
              Hiển thị {(validPage - 1) * rowsPerPage + 1}-{Math.min(validPage * rowsPerPage, filtered.length)} của {filtered.length} khóa học
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select className="adm-select" value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }} style={{ width: 80 }}>
                <option value={10}>10 dòng</option>
                <option value={20}>20 dòng</option>
                <option value={50}>50 dòng</option>
              </select>

              <div style={{ display: "flex", gap: 4 }}>
                <button className="adm-btn adm-btn--sec adm-btn--sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={validPage === 1}>← Trước</button>
                <div style={{ display: "flex", gap: 2 }}>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = validPage > 3 ? validPage - 2 + i : i + 1;
                    return page <= totalPages ? (
                      <button
                        key={page}
                        className={`adm-btn adm-btn--sm ${validPage === page ? "adm-btn--primary" : "adm-btn--sec"}`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    ) : null;
                  })}
                </div>
                {totalPages > 5 && validPage < totalPages - 2 && <span style={{ color: "var(--rpg-muted)" }}>...</span>}
                <button className="adm-btn adm-btn--sec adm-btn--sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={validPage === totalPages}>Sau →</button>
              </div>
            </div>
          </div>
        )}

        {batchActionModal && (
          <Modal open={!!batchActionModal} onClose={() => setBatchActionModal(null)} title={`Cập nhật ${batchActionModal.title} cho ${selected.size} khóa học`} width={400}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {batchActionModal.type === 'format' && (
                <div className="adm-form-group">
                  <label className="adm-label">Format</label>
                  <select className="adm-select" value={batchValue} onChange={e => setBatchValue(e.target.value)}>
                    <option value="">-- Chọn format --</option>
                    {["online","offline","elearning","webinar","workshop","bootcamp","talk"].map(f => (
                      <option key={f} value={f}>{f.charAt(0).toUpperCase()+f.slice(1)}</option>
                    ))}
                  </select>
                </div>
              )}

              {batchActionModal.type === 'status' && (
                <div className="adm-form-group">
                  <label className="adm-label">Status</label>
                  <select className="adm-select" value={batchValue} onChange={e => setBatchValue(e.target.value)}>
                    <option value="">-- Chọn status --</option>
                    {COURSE_STATUSES.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {batchActionModal.type === 'type' && (
                <div className="adm-form-group">
                  <label className="adm-label">Type</label>
                  <select className="adm-select" value={batchValue} onChange={e => setBatchValue(e.target.value)}>
                    <option value="">-- Chọn type --</option>
                    {COURSE_TYPES.map(t => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {batchActionModal.type === 'is_active' && (
                <div className="adm-form-group">
                  <label className="adm-label">Hiển thị cho người dùng</label>
                  <select className="adm-select" value={batchValue} onChange={e => setBatchValue(e.target.value)}>
                    <option value="">-- Chọn --</option>
                    <option value="true">Hiển thị</option>
                    <option value="false">Ẩn</option>
                  </select>
                </div>
              )}

              {batchActionModal.type === 'rank_targets' && (
                <div className="adm-form-group">
                  <label className="adm-label">Rank targets</label>
                  <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                    {RANKS_ALL.map(r => (
                      <button key={r.id} type="button" onClick={() => setBatchRanks(prev => prev.includes(r.id) ? prev.filter(x => x !== r.id) : [...prev, r.id])} style={{
                        padding: "5px 13px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                        background: batchRanks.includes(r.id) ? "rgba(228,30,38,.15)" : "rgba(255,255,255,.04)",
                        border: `1px solid ${batchRanks.includes(r.id) ? "var(--glh-accent)" : "var(--rpg-border)"}`,
                        color: batchRanks.includes(r.id) ? "#E41E26" : "var(--rpg-muted)",
                        cursor: "pointer", transition: "all .12s",
                      }}>{r.name}</button>
                    ))}
                  </div>
                </div>
              )}

              {batchActionModal.type === 'xp_reward' && (
                <div className="adm-form-group">
                  <label className="adm-label">XP reward</label>
                  <input className="adm-input" type="number" min="0" value={batchValue} onChange={e => setBatchValue(e.target.value)} placeholder="Nhập giá trị XP" />
                </div>
              )}

              <div style={{ display: "flex", gap: 9, justifyContent: "flex-end" }}>
                <button className="adm-btn adm-btn--sec" onClick={() => setBatchActionModal(null)} disabled={saving}>Huỷ</button>
                <button className="adm-btn adm-btn--primary" onClick={handleBatchUpdate} disabled={saving || (!batchValue && batchActionModal.type !== 'rank_targets') || (batchActionModal.type === 'rank_targets' && batchRanks.length === 0)}>
                  {saving ? "Đang cập nhật..." : "Cập nhật"}
                </button>
              </div>
            </div>
          </Modal>
        )}

        <Modal open={editModal} onClose={() => setEditModal(false)} title={editTarget ? `Chỉnh sửa - ${editTarget.course_code}` : "Tạo khóa học mới"} width={660}>
          <CourseForm course={editTarget} courses={courses} onSave={handleSave} onClose={() => setEditModal(false)} saving={saving} error={error} />
        </Modal>

        <Modal open={importModal} onClose={() => setImportModal(false)} title="Import Participants" width={520}>
          <ImportForm onClose={() => { setImportModal(false); setImportTarget(null); reloadCourses(); }} courses={courses} initialCourse={importTarget} />
        </Modal>

        <Modal open={!!attendeesModal} onClose={() => setAttendeesModal(null)} title={attendeesModal ? `Danh sách đăng ký - ${attendeesModal.course_code}` : ""} width={680}>
          {attendeesModal && <AttendeesView course={attendeesModal} />}
        </Modal>

        <Modal open={!!completionsModal} onClose={() => setCompletionsModal(null)} title={completionsModal ? `Danh sách hoàn thành - ${completionsModal.course_code}` : ""} width={720}>
          {completionsModal && <CompletionsView course={completionsModal} />}
        </Modal>

        <Modal open={!!confirmTarget} onClose={() => setConfirmTarget(null)} title="Xác nhận mở lớp" width={440}>
          {confirmTarget && (
            <div>
              <p style={{ color: "var(--rpg-text)", lineHeight: 1.6, fontSize: 14, marginBottom: 18 }}>
                Xác nhận <strong style={{ color: "#fff" }}>{confirmTarget.title}</strong> và gửi email cho {bookingCount(confirmTarget)} người đã đặt chỗ.
              </p>
              <div style={{ display: "flex", gap: 9, justifyContent: "flex-end" }}>
                <button className="adm-btn adm-btn--sec" onClick={() => setConfirmTarget(null)} disabled={confirming}>Hủy</button>
                <button className="adm-btn adm-btn--primary" onClick={() => confirmCourse(confirmTarget)} disabled={confirming}>
                  {confirming ? "Đang xử lý..." : <><Icon name="send" size={13} /> Xác nhận</>}
                </button>
              </div>
            </div>
          )}
        </Modal>

        <Modal open={syncModal} onClose={() => setSyncModal(false)} title="Đồng bộ khóa học từ CSV" width={640}>
          <SyncCoursesForm onClose={() => setSyncModal(false)} onSynced={reloadCourses} />
        </Modal>
      </div>
    );
  }

  function CourseForm({ course, courses, onSave, onClose, saving, error }) {
    const [form, setForm] = React.useState({
      id: course?.course_code || nextCourseCode(courses),
      title: course?.title || "",
      trainer: course?.trainer || "",
      trainer_type: course?.trainer_type || "internal",
      format: course?.format || "online",
      duration_hours: course ? (course.duration_hours || (course.duration / 60) || 1) : 1,
      rank_targets: course?.rank_targets || [],
      role_targets: course?.role_targets || [],
      skill_tags: course?.skill_tags || [],
      type: course?.type || "scheduled",
      xp_reward: course?.xp_reward || course?.xp || 100,
      rating: course?.rating ?? "",
      description: course?.description || "",
      registration_url: course?.registration_url || "",
      is_active: course ? course.is_active : true,
      status: course?.status || "open",
      material_url: course?.material_url || "",
      min_participants: course?.min_participants || "",
      session_date: course?.session_date || "",
      session_time: course?.session_time || "",
      location: course?.location || "",
      max_participants: course?.max_participants || "",
    });

    function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

    const isEdit = Boolean(course);
    const canSave = form.title.trim() && form.trainer.trim() && form.id.trim();

    return (
      <div>
        {error && <div style={{ background: "rgba(228,30,38,.1)", border: "1px solid rgba(228,30,38,.3)", borderRadius: 6, padding: "10px 14px", marginBottom: 14, color: "#ff6b6b", fontSize: 13 }}>{error}</div>}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div className="adm-form-group">
            <label className="adm-label">Mã khoá học <span style={{color:"#E41E26"}}>*</span></label>
            <input className="adm-input" value={form.id} onChange={e => set("id", e.target.value.toUpperCase())} placeholder="VD: LC-013" />
          </div>
          <div className="adm-form-group">
            <label className="adm-label">Tên khóa học <span style={{color:"#E41E26"}}>*</span></label>
            <input className="adm-input" value={form.title} onChange={e => set("title", e.target.value)} placeholder="VD: Kỹ nĒng thuyết trình nâng cao" />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div className="adm-form-group">
            <label className="adm-label">Trainer <span style={{color:"#E41E26"}}>*</span></label>
            <input className="adm-input" value={form.trainer} onChange={e => set("trainer", e.target.value)} placeholder="Tên trainer" />
          </div>
          <div className="adm-form-group">
            <label className="adm-label">Loại trainer</label>
            <select className="adm-select" value={form.trainer_type} onChange={e => set("trainer_type", e.target.value)}>
              <option value="internal">Internal</option>
              <option value="external">External</option>
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div className="adm-form-group">
            <label className="adm-label">Format</label>
            <select className="adm-select" value={form.format} onChange={e => set("format", e.target.value)}>
              {["online","offline","elearning","webinar","workshop","bootcamp","talk"].map(f => (
                <option key={f} value={f}>{f.charAt(0).toUpperCase()+f.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="adm-form-group">
            <label className="adm-label">Thời lượng (giờ)</label>
            <input className="adm-input" type="number" min="0.5" step="0.5" value={form.duration_hours} onChange={e => set("duration_hours", e.target.value)} />
          </div>
          <div className="adm-form-group" style={{ display: "none" }}>
            <label className="adm-label">XP reward</label>
            <input className="adm-input" type="number" min="0" value={form.xp_reward} onChange={e => set("xp_reward", e.target.value)} />
          </div>
          <div className="adm-form-group">
            <label className="adm-label">Rating</label>
            <input className="adm-input" type="number" min="0" max="5" step="0.1" value={form.rating} onChange={e => set("rating", e.target.value)} placeholder="VD: 4.5" />
          </div>
        </div>

        <div className="adm-form-group" style={{ marginBottom: 14 }}>
          <label className="adm-label">Loại khóa</label>
          <select className="adm-select" value={form.type} onChange={e => set("type", e.target.value)}>
            {COURSE_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>

        <div className="adm-form-group" style={{ marginBottom: 14 }}>
          <label className="adm-label">Rank targets</label>
          <input
            className="adm-input"
            value={formatListInput(form.rank_targets)}
            onChange={e => set("rank_targets", e.target.value)}
            placeholder="VD: Associate, Senior Associate, Manager"
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div className="adm-form-group">
            <label className="adm-label">Role targets</label>
            <input
              className="adm-input"
              value={formatListInput(form.role_targets)}
              onChange={e => set("role_targets", e.target.value)}
              placeholder="VD: General, People Manager, Product"
            />
          </div>
          <div className="adm-form-group">
            <label className="adm-label">Skill tags</label>
            <input
              className="adm-input"
              value={formatListInput(form.skill_tags)}
              onChange={e => set("skill_tags", e.target.value)}
              placeholder="VD: Communication, Leadership, AI"
            />
          </div>
        </div>

        <div className="adm-form-group" style={{ marginBottom: 14 }}>
          <label className="adm-label">Mô tả</label>
          <textarea className="adm-input" rows={2} value={form.description} onChange={e => set("description", e.target.value)} placeholder="Mô tả ngắn về khoá học..." style={{ resize: "vertical" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div className="adm-form-group">
            <label className="adm-label">Link đăng ký</label>
            <input className="adm-input" value={form.registration_url} onChange={e => set("registration_url", e.target.value)} placeholder="https://..." />
          </div>
          <div className="adm-form-group">
            <label className="adm-label">Số người tối thiểu</label>
            <input className="adm-input" type="number" min="1" value={form.min_participants} onChange={e => set("min_participants", e.target.value)} placeholder="Không bắt buộc" />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div className="adm-form-group">
            <label className="adm-label">Ngày tổ chức</label>
            <input className="adm-input" type="date" value={form.session_date} onChange={e => set("session_date", e.target.value)} />
          </div>
          <div className="adm-form-group">
            <label className="adm-label">Giờ tổ chức</label>
            <input className="adm-input" type="time" value={form.session_time} onChange={e => set("session_time", e.target.value)} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div className="adm-form-group">
            <label className="adm-label">Địa điểm</label>
            <input className="adm-input" value={form.location} onChange={e => set("location", e.target.value)} placeholder="Tên phòng học hoặc link online" />
          </div>
          <div className="adm-form-group">
            <label className="adm-label">Số người tối đa</label>
            <input className="adm-input" type="number" min="1" value={form.max_participants} onChange={e => set("max_participants", e.target.value)} placeholder="Không bắt buộc" />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div className="adm-form-group">
            <label className="adm-label">Trạng thái</label>
            <select className="adm-select" value={form.status} onChange={e => set("status", e.target.value)}>
              <option value="draft">Nháp</option>
              <option value="open">Đang mở</option>
              <option value="full">Đã đủ slot / nhu cầu</option>
              <option value="ended">Đã tổ chức xong</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>
          <div className="adm-form-group">
            <label className="adm-label">Link tài liệu</label>
            <input className="adm-input" value={form.material_url} onChange={e => set("material_url", e.target.value)} placeholder="https://..." />
          </div>
        </div>

        <div className="adm-form-group" style={{ marginBottom: 18 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <Toggle value={form.is_active} onChange={v => set("is_active", v)} />
            <span style={{ fontSize: 13, color: "var(--rpg-muted)" }}>Hiển thị cho người dùng</span>
          </label>
        </div>

        <div style={{ display: "flex", gap: 9, justifyContent: "flex-end" }}>
          <button className="adm-btn adm-btn--sec" onClick={onClose} disabled={saving}>Huỷ</button>
          <button className="adm-btn adm-btn--primary" onClick={() => onSave(form)} disabled={saving || !canSave}>
            {saving ? <><Icon name="loader" size={13} /> Đang lưu...</> : <><Icon name="check" size={13} /> {isEdit ? "Lưu thay đổi" : "Tạo khóa học"}</>}
          </button>
        </div>
      </div>
    );
  }

  function AttendeesView({ course }) {
    const [list, setList] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
      apiFetch(`/admin/api/courses/${course.id}/reservations`)
        .then(data => { if (data.reservations) setList(data.reservations); })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, [course.id]);

    function exportReservations() {
      window.location.href = `/admin/api/courses/${course.id}/reservations/export`;
    }

    if (loading) return <div style={{ color: "var(--rpg-muted)", padding: 24, textAlign: "center" }}>Dang tai...</div>;
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ color: "var(--rpg-muted)", fontSize: 13 }}>{list.length} nguoi dang ky / dat cho</div>
          <button className="adm-btn adm-btn--sec adm-btn--sm" onClick={exportReservations} disabled={list.length === 0}>
            <Icon name="download" size={13} /> Xuat CSV
          </button>
        </div>
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Ten</th><th>Email</th><th>Ngay dat</th><th>Status</th></tr></thead>
            <tbody>
              {list.length === 0 && <tr><td colSpan={4} style={{ textAlign: "center", color: "var(--rpg-muted)" }}>Chua co ai dat cho</td></tr>}
              {list.map((a, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{a.full_name || a.email}</td>
                  <td style={{ fontSize: 12, color: "var(--rpg-muted)" }}>{a.email}</td>
                  <td style={{ fontSize: 12, color: "var(--rpg-muted)" }}>{(a.reserved_at || "").slice(0, 10)}</td>
                  <td><Badge status={a.status || "reserved"} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function CompletionsView({ course }) {
    const [list, setList] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
      apiFetch(`/admin/api/courses/${course.id}/completions`)
        .then(data => { if (data.completions) setList(data.completions); })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, [course.id]);

    function exportCompletions() {
      window.location.href = `/admin/api/courses/${course.id}/completions/export`;
    }

    if (loading) return <div style={{ color: "var(--rpg-muted)", padding: 24, textAlign: "center" }}>Dang tai...</div>;
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ color: "var(--rpg-muted)", fontSize: 13 }}>{list.length} nguoi da hoan thanh</div>
          <button className="adm-btn adm-btn--sec adm-btn--sm" onClick={exportCompletions} disabled={list.length === 0}>
            <Icon name="download" size={13} /> Xuat CSV
          </button>
        </div>
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Ten</th><th>Email</th><th>Ngay hoan thanh</th><th>Nguon</th></tr></thead>
            <tbody>
              {list.length === 0 && <tr><td colSpan={4} style={{ textAlign: "center", color: "var(--rpg-muted)" }}>Chua co ai hoan thanh</td></tr>}
              {list.map((a, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{a.full_name || a.email}</td>
                  <td style={{ fontSize: 12, color: "var(--rpg-muted)" }}>{a.email}</td>
                  <td style={{ fontSize: 12, color: "var(--rpg-muted)" }}>{(a.completed_at || "").slice(0, 10)}</td>
                  <td style={{ fontSize: 12, color: "var(--rpg-muted)" }}>{a.source || "admin_import"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function ImportForm({ onClose, courses, initialCourse }) {
    const [courseId, setCourseId] = React.useState(initialCourse?.id || "");
    const [fileName, setFileName] = React.useState(null);
    const [result, setResult]     = React.useState(null);
    const [loading, setLoading]   = React.useState(false);
    const [fileData, setFileData] = React.useState(null);

    function handleFile(e) {
      const f = e.target.files?.[0];
      if (!f) return;
      setFileName(f.name);
      const reader = new FileReader();
      reader.onload = ev => setFileData(ev.target.result);
      reader.readAsText(f);
    }

    async function handleImport() {
      if (!courseId || !fileData) return;
      setLoading(true);
      try {
        const res = await fetch(`/admin/api/courses/${courseId}/import-participants`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ csv: fileData }),
        });
        const data = await res.json();
        setResult(data);
      } catch (e) {
        setResult({ error: e.message });
      } finally {
        setLoading(false);
      }
    }

    if (result && !result.error) return (
      <div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 18 }}>
          {[
            { l: "Enrolled",   v: result.enrolled || 0,   c: "#2BB6A3" },
            { l: "Not found",  v: result.not_found || 0,  c: "#F5A623" },
            { l: "Đã tồn tại", v: result.already_enrolled || 0, c: "#8A93A8" },
          ].map(i => (
            <div key={i.l} style={{ background: "rgba(255,255,255,.03)", border: "1px solid var(--rpg-border)", borderRadius: 8, padding: "14px", textAlign: "center" }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: i.c, marginBottom: 3 }}>{i.v}</div>
              <div style={{ fontSize: 11, color: "var(--rpg-muted)" }}>{i.l}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 9, justifyContent: "flex-end" }}>
          <button className="adm-btn adm-btn--primary" onClick={onClose}><Icon name="check" size={13} /> Xong</button>
        </div>
      </div>
    );

    return (
      <div>
        <div className="adm-form-group" style={{ marginBottom: 14 }}>
          <label className="adm-label">Khóa học</label>
          <select className="adm-select" value={courseId} onChange={e => setCourseId(e.target.value)} disabled={!!initialCourse}>
            <option value="">-- Chọn khóa học --</option>
            {courses.filter(c => c.is_active).map(c => (
              <option key={c.id} value={c.id}>{c.course_code} - {c.title}{c.session_date ? ` - ${c.session_date}` : ""}</option>
            ))}
          </select>
        </div>
        <label className="adm-upload-zone" style={{ cursor: "pointer" }}>
          <input type="file" accept=".csv,.txt" style={{ display: "none" }} onChange={handleFile} />
          <Icon name="file-plus" size={30} color="var(--rpg-muted)" style={{ margin: "0 auto 10px", display: "block" }} />
          <div style={{ fontWeight: 700, color: "#fff", marginBottom: 5 }}>{fileName || "Click để chọn file CSV"}</div>
          <div style={{ fontSize: 12, color: "var(--rpg-muted)" }}>Cột email: <code>email</code></div>
        </label>
        {result?.error && <div style={{ color: "#ff6b6b", fontSize: 13, marginTop: 10 }}>{result.error}</div>}
        <div style={{ display: "flex", gap: 9, justifyContent: "flex-end", marginTop: 18 }}>
          <button className="adm-btn adm-btn--sec" onClick={onClose}>Huỷ</button>
          <button className="adm-btn adm-btn--primary" onClick={handleImport} disabled={!courseId || !fileData || loading}>
            {loading ? "Đang xử lý..." : <><Icon name="refresh-cw" size={13} /> Import</>}
          </button>
        </div>
      </div>
    );
  }

  function SyncCoursesForm({ onClose, onSynced }) {
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
        const res = await fetch("/admin/api/data-prep/catalog/import-csv", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ csvText, source: `CSV upload - ${fileName}` }),
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
        const res = await fetch("/admin/api/data-prep/catalog/promote", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ batchId: batch.id }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Promote thất bại");
        setStep("done");
        onSynced?.();
      } catch (e) {
        setError(e.message || "Promote thất bại");
      } finally {
        setLoading(false);
      }
    }

    if (step === "done") return (
      <div>
        <div style={{ background: "rgba(43,182,163,.1)", border: "1px solid rgba(43,182,163,.3)", borderRadius: 8, padding: "14px 16px", marginBottom: 18, color: "#2BB6A3", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="check-circle" size={16} /> Đã đồng bộ {batch.savedRows} khóa học lên hệ thống.
        </div>
        <div style={{ display: "flex", gap: 9, justifyContent: "flex-end" }}>
          <button className="adm-btn adm-btn--primary" onClick={onClose}><Icon name="check" size={13} /> Xong</button>
        </div>
      </div>
    );

    if (step === "errors") return (
      <div>
        <div style={{ color: "var(--rpg-muted)", fontSize: 13, marginBottom: 12 }}>
          {errorRows.length} dòng có lỗi - sửa trong Sheet rồi tải lại CSV, chưa có gì được lưu.
        </div>
        <div style={{ maxHeight: 320, overflowY: "auto", border: "1px solid var(--rpg-border)", borderRadius: 8 }}>
          {errorRows.map(r => (
            <div key={r.index} style={{ padding: "10px 14px", borderBottom: "1px solid var(--rpg-border)", fontSize: 12 }}>
              <div style={{ fontWeight: 700, color: "#fff", marginBottom: 4 }}>Dòng {r.index + 2} - {r.row.course_code || "(không có mã)"}</div>
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
          Đã lưu nháp {batch.savedRows} khóa học, chưa hiển thị cho người dùng. Bấm &quot;Đẩy lên live&quot; để áp dụng.
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
          Cột cần có: <code>course_code, title, trainer, format, duration_hours, type, is_active</code> - <code>rating</code> là tuỳ chọn (0-5, ví dụ 4.5). <code>type</code> dùng scheduled/interest/elearning/external/material_only. Các cột khác tuỳ chọn (description, skill_tags, rank_targets, role_targets, min_participants, registration_url, trainer_type, rating, status, material_url, session_date, session_time, location, max_participants). Điền lặp lại <code>course_code</code> ở nhiều dòng để tạo nhiều buổi cho cùng 1 khóa.
        </div>
        <label className="adm-upload-zone" style={{ cursor: "pointer" }}>
          <input type="file" accept=".csv" style={{ display: "none" }} onChange={handleFile} />
          <Icon name="file-plus" size={30} color="var(--rpg-muted)" style={{ margin: "0 auto 10px", display: "block" }} />
          <div style={{ fontWeight: 700, color: "#fff", marginBottom: 5 }}>{fileName || "Click để chọn file CSV"}</div>
          <div style={{ fontSize: 12, color: "var(--rpg-muted)" }}>Export từ Google Sheet: File - Download - Comma Separated Values</div>
        </label>
        {error && <div style={{ color: "#ff6b6b", fontSize: 13, marginTop: 10 }}>{error}</div>}
        <div style={{ display: "flex", gap: 9, justifyContent: "flex-end", marginTop: 18 }}>
          <button className="adm-btn adm-btn--sec" onClick={onClose}>Huỷ</button>
          <button className="adm-btn adm-btn--primary" onClick={handleCheck} disabled={!csvText || loading}>
            {loading ? "Đang kiểm tra..." : <><Icon name="refresh-cw" size={13} /> Kiểm tra & Lưu nháp</>}
          </button>
        </div>
      </div>
    );
  }

  export const ADMScreens1 = { Dashboard, CoursesScreen };
