"use client";

import React from "react";
import { GLHUI } from '../GLHUI';
import { ADMComponents } from './ADMComponents';
import { ADM_DATA } from '@/data/admData';
import { TRAINER_TYPE_OPTIONS, normalizeTrainerType } from '@/lib/trainerCatalog.mjs';
import { SKILL_OPTIONS } from '@/lib/skillCatalog';
import { buildCourseDeepLink } from '@/lib/courseLinks.mjs';

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
    const itemValue = item => {
      if (item && typeof item === "object") return item.id ?? item.value ?? item.name ?? item.label ?? "";
      return item;
    };
    if (Array.isArray(value)) return value.map(itemValue).map(item => String(item).trim()).filter(Boolean);
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
      if (Array.isArray(parsed)) return parsed.map(itemValue).map(item => String(item).trim()).filter(Boolean);
    }
    return raw.split(/[,;\n]/).map(item => item.trim()).filter(Boolean);
  }

  function catalogOptions(courses, key, list = false) {
    const values = (courses || []).flatMap((course) => list ? toList(course[key]) : [course[key]]);
    return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  }

  function courseFilterValues(course, field) {
    return ["rank_targets", "role_targets", "skill_tags"].includes(field) ? toList(course[field]) : [String(course[field] ?? "")];
  }

  function matchesCourseFilter(course, field, filter) {
    if (Array.isArray(filter)) return !filter.length || filter.some(value => courseFilterValues(course, field).includes(String(value)));
    return !String(filter || "").trim() || courseFilterValues(course, field).some(value => value.toLowerCase().includes(String(filter).trim().toLowerCase()));
  }

  function courseSortValue(course, field) {
    const value = course[field];
    if (["rank_targets", "role_targets", "skill_tags"].includes(field)) return toList(value).join(", ").toLowerCase();
    if (typeof value === "boolean") return value ? 1 : 0;
    if (value == null) return "";
    return typeof value === "number" ? value : String(value).toLowerCase();
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
      trainer_type: normalizeTrainerType(c.trainer_type),
      format: c.format,
      duration: Math.round((parseFloat(c.duration_hours) || 0) * 60),
      duration_hours: parseFloat(c.duration_hours) || 0,
      rating: c.rating == null ? "" : parseFloat(c.rating),
      rank_targets: toList(c.rank_targets),
      role_targets: toList(c.role_targets),
      // Keep legacy course tags as stored; admins can migrate them deliberately.
      skill_tags: [...new Set(toList(c.skill_tags).filter(Boolean))],
      xp: c.xp_reward || 0,
      xp_reward: c.xp_reward || 0,
      is_active: Boolean(c.is_active),
      is_hr_recommended: Boolean(c.is_hr_recommended),
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
      total_learners: c.total_learners ?? "",
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
    "Senior Associate I": "Senior Associate I",
    "Senior Associate II": "Senior Associate II",
    "Assistant Manager": "Assistant Manager",
    Manager: "Manager",
    "Senior Manager": "Senior Manager",
    Engineer: "Engineer",
    "Engineer I": "Engineer I",
    "Engineer II": "Engineer II",
    "Expert Engineer": "Expert Engineer",
    "Senior Engineer": "Senior Engineer",
    "Senior Engineer I": "Senior Engineer I",
    "Senior Engineer II": "Senior Engineer II",
    "Senior Engineer III": "Senior Engineer III",
    "Senior Designer I": "Senior Designer I",
    "Senior Designer II": "Senior Designer II",
    "Senior Product Management Associate II": "Senior Product Management Associate II",
    "Senior Product Management Associate III": "Senior Product Management Associate III",
  };
  const RANKS_ALL  = [
    { id: "Associate", name: "Associate" },
    { id: "Senior Associate", name: "Senior Associate" },
    { id: "Senior Associate I", name: "Senior Associate I" },
    { id: "Senior Associate II", name: "Senior Associate II" },
    { id: "Assistant Manager", name: "Assistant Manager" },
    { id: "Manager", name: "Manager" },
    { id: "Senior Manager", name: "Senior Manager" },
    { id: "Director", name: "Director" },
    { id: "Engineer", name: "Engineer" },
    { id: "Engineer I", name: "Engineer I" },
    { id: "Engineer II", name: "Engineer II" },
    { id: "Expert Engineer", name: "Expert Engineer" },
    { id: "Senior Engineer", name: "Senior Engineer" },
    { id: "Senior Engineer I", name: "Senior Engineer I" },
    { id: "Senior Engineer II", name: "Senior Engineer II" },
    { id: "Senior Engineer III", name: "Senior Engineer III" },
    { id: "Senior Designer I", name: "Senior Designer I" },
    { id: "Senior Designer II", name: "Senior Designer II" },
    { id: "Senior Product Management Associate II", name: "Senior Product Management Associate II" },
    { id: "Senior Product Management Associate III", name: "Senior Product Management Associate III" },
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
    const [copiedCourseId, setCopiedCourseId] = React.useState("");
    const [inlineEdit, setInlineEdit] = React.useState(null);
    const [inlineSaving, setInlineSaving] = React.useState(false);
    const [columnFilters, setColumnFilters] = React.useState({});
    const [sortConfig, setSortConfig] = React.useState({ field: "", direction: "asc" });

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
      const matchColumns = Object.entries(columnFilters).every(([field, filter]) => matchesCourseFilter(c, field, filter));
      return matchQ && matchS && matchColumns;
    });
    const trainerOptions = catalogOptions(courses, "trainer");
    const locationOptions = catalogOptions(courses, "location");
    const rankOptions = [...new Set(["All", ...RANKS_ALL.map(rank => rank.id), ...catalogOptions(courses, "rank_targets", true)])];
    const roleOptions = catalogOptions(courses, "role_targets", true);
    const skillOptions = SKILL_OPTIONS;

    const sorted = [...filtered].sort((a, b) => {
      if (!sortConfig.field) return 0;
      const left = courseSortValue(a, sortConfig.field);
      const right = courseSortValue(b, sortConfig.field);
      const result = typeof left === "number" && typeof right === "number" ? left - right : String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: "base" });
      return sortConfig.direction === "desc" ? -result : result;
    });
    const totalPages = Math.ceil(sorted.length / rowsPerPage);
    const validPage = Math.max(1, Math.min(currentPage, totalPages || 1));
    const paginatedRows = sorted.slice((validPage - 1) * rowsPerPage, validPage * rowsPerPage);

    function openEdit(c) { setEditTarget(c); setError(""); setEditModal(true); }
    function openCreate() { setEditTarget(null); setError(""); setEditModal(true); }

    async function saveInlineField(course, field, value) {
      const listFields = ["rank_targets", "role_targets", "skill_tags"];
      const numberFields = ["duration_hours", "xp_reward", "rating"];
      const nullableNumberFields = ["min_participants", "max_participants", "total_learners"];
      let nextValue = value;
      if (listFields.includes(field)) nextValue = toList(value);
      if (numberFields.includes(field)) nextValue = parseFloat(value) || 0;
      if (field === "duration_hours" && nextValue <= 0) nextValue = 0.5;
      if (nullableNumberFields.includes(field)) nextValue = value === "" ? "" : (parseInt(value) || "");
      if (["title", "course_code", "trainer"].includes(field) && !String(nextValue || "").trim()) return;
      const previous = course[field];
      const nextCourse = { ...course, [field]: nextValue };
      setInlineSaving(true);
      setCourses(cs => cs.map(item => item.id === course.id ? nextCourse : item));
      try {
        const payload = {
          title: nextCourse.title,
          course_code: nextCourse.course_code,
          trainer: nextCourse.trainer,
          trainer_type: nextCourse.trainer_type,
          format: nextCourse.format,
          duration_hours: nextCourse.duration_hours,
          rank_targets: nextCourse.rank_targets,
          role_targets: nextCourse.role_targets,
          skill_tags: nextCourse.skill_tags,
          type: nextCourse.type,
          xp_reward: nextCourse.xp_reward,
          rating: nextCourse.rating || 0,
          description: nextCourse.description,
          registration_url: nextCourse.registration_url,
          status: nextCourse.status,
          material_url: nextCourse.material_url,
          min_participants: nextCourse.min_participants || null,
          session_date: nextCourse.session_date || null,
          session_time: nextCourse.session_time || null,
          location: nextCourse.location || null,
          max_participants: nextCourse.max_participants || null,
          total_learners: nextCourse.total_learners || null,
          is_active: nextCourse.is_active,
          is_hr_recommended: nextCourse.is_hr_recommended,
        };
        const data = await apiFetch(`/admin/api/courses/${course.id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        });
        const saved = mapCourse(data.course);
        setCourses(cs => cs.map(item => item.id === saved.id ? saved : item));
        setInlineEdit(null);
      } catch (e) {
        setCourses(cs => cs.map(item => item.id === course.id ? { ...item, [field]: previous } : item));
        alert("Cập nhật thất bại: " + e.message);
      } finally {
        setInlineSaving(false);
      }
    }
    function openImport(c = null) { setImportTarget(c); setImportModal(true); }
    async function copyCourseLink(c) {
      const link = buildCourseDeepLink(c.id, window.location.origin);
      try {
        if (navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(link);
        } else {
          const input = document.createElement("textarea");
          input.value = link;
          input.style.position = "fixed";
          input.style.opacity = "0";
          document.body.appendChild(input);
          input.select();
          document.execCommand("copy");
          document.body.removeChild(input);
        }
        setCopiedCourseId(c.id);
        window.setTimeout(() => setCopiedCourseId((id) => (id === c.id ? "" : id)), 1600);
      } catch {
        alert("Không thể copy link. Vui lòng thử lại.");
      }
    }
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
            total_learners: course.total_learners || null,
            is_active: newVal,
            is_hr_recommended: course.is_hr_recommended,
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
          total_learners: parseInt(formData.total_learners) || null,
          is_hr_recommended: formData.is_hr_recommended === true,
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
            total_learners: course.total_learners || null,
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

    function renderInline(course, field, display, editorProps = {}) {
      const editing = inlineEdit?.id === course.id && inlineEdit.field === field;
      if (editing) {
        return <InlineEditor key={`${course.id}:${field}`} value={course[field]} {...editorProps} onSave={value => saveInlineField(course, field, value)} onCancel={() => setInlineEdit(null)} saving={inlineSaving} />;
      }
      return (
        <div onClick={() => setInlineEdit({ id: course.id, field })} style={{ cursor: "text", minHeight: 20 }} title="Click để sửa">
          {display === "" || display == null ? <span style={{ color: "var(--rpg-muted)" }}>-</span> : display}
        </div>
      );
    }

    function setColumnFilter(field, value) {
      setColumnFilters(current => {
        const next = { ...current };
        if ((Array.isArray(value) && value.length === 0) || (!Array.isArray(value) && !String(value || "").trim())) delete next[field];
        else next[field] = value;
        return next;
      });
      setCurrentPage(1);
    }

    function toggleSort(field) {
      setSortConfig(current => current.field === field
        ? { field, direction: current.direction === "asc" ? "desc" : "asc" }
        : { field, direction: "asc" });
      setCurrentPage(1);
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
          <table className="adm-table adm-courses-table">
            <thead>
              <tr>
                <th className="adm-course-sticky-left adm-course-col-select">
                  <input type="checkbox" checked={paginatedRows.length > 0 && paginatedRows.every(c => selected.has(c.id))} onChange={() => paginatedRows.every(c => selected.has(c.id)) ? setSelected(s => { const next = new Set(s); paginatedRows.forEach(c => next.delete(c.id)); return next; }) : setSelected(s => { const next = new Set(s); paginatedRows.forEach(c => next.add(c.id)); return next; })} />
                </th>
                <CourseTableHeader className="adm-course-sticky-left adm-course-col-code" label="Mã" field="course_code" sortConfig={sortConfig} onSort={toggleSort} filterValue={columnFilters.course_code} onFilter={value => setColumnFilter("course_code", value)} />
                <CourseTableHeader className="adm-course-sticky-left adm-course-col-title" label="Tên khóa học" field="title" sortConfig={sortConfig} onSort={toggleSort} filterValue={columnFilters.title} onFilter={value => setColumnFilter("title", value)} />
                <CourseTableHeader label="Trainer" field="trainer" sortConfig={sortConfig} onSort={toggleSort} filterValue={columnFilters.trainer} onFilter={value => setColumnFilter("trainer", value)} options={trainerOptions} />
                <CourseTableHeader label="Loại trainer" field="trainer_type" sortConfig={sortConfig} onSort={toggleSort} filterValue={columnFilters.trainer_type} onFilter={value => setColumnFilter("trainer_type", value)} options={[{ id: "internal", label: "Internal" }, { id: "external", label: "External" }]} />
                <CourseTableHeader label="Type" field="type" sortConfig={sortConfig} onSort={toggleSort} filterValue={columnFilters.type} onFilter={value => setColumnFilter("type", value)} options={COURSE_TYPES} />
                <CourseTableHeader label="Format" field="format" sortConfig={sortConfig} onSort={toggleSort} filterValue={columnFilters.format} onFilter={value => setColumnFilter("format", value)} options={["online", "offline", "elearning", "webinar", "workshop", "bootcamp", "talk"]} />
                <CourseTableHeader label="Thời lượng" field="duration_hours" sortConfig={sortConfig} onSort={toggleSort} filterValue={columnFilters.duration_hours} onFilter={value => setColumnFilter("duration_hours", value)} />
                <CourseTableHeader label="Rating" field="rating" sortConfig={sortConfig} onSort={toggleSort} filterValue={columnFilters.rating} onFilter={value => setColumnFilter("rating", value)} />
                <CourseTableHeader label="Status" field="status" sortConfig={sortConfig} onSort={toggleSort} filterValue={columnFilters.status} onFilter={value => setColumnFilter("status", value)} options={COURSE_STATUSES} />
                <CourseTableHeader label="Rank targets" field="rank_targets" sortConfig={sortConfig} onSort={toggleSort} filterValue={columnFilters.rank_targets} onFilter={value => setColumnFilter("rank_targets", value)} options={rankOptions} />
                <CourseTableHeader label="Role targets" field="role_targets" sortConfig={sortConfig} onSort={toggleSort} filterValue={columnFilters.role_targets} onFilter={value => setColumnFilter("role_targets", value)} options={roleOptions} />
                <CourseTableHeader label="Skill tags" field="skill_tags" sortConfig={sortConfig} onSort={toggleSort} filterValue={columnFilters.skill_tags} onFilter={value => setColumnFilter("skill_tags", value)} options={skillOptions} />
                <CourseTableHeader label="Mô tả" field="description" sortConfig={sortConfig} onSort={toggleSort} filterValue={columnFilters.description} onFilter={value => setColumnFilter("description", value)} />
                <CourseTableHeader label="Link đăng ký" field="registration_url" sortConfig={sortConfig} onSort={toggleSort} filterValue={columnFilters.registration_url} onFilter={value => setColumnFilter("registration_url", value)} />
                <CourseTableHeader label="Link tài liệu" field="material_url" sortConfig={sortConfig} onSort={toggleSort} filterValue={columnFilters.material_url} onFilter={value => setColumnFilter("material_url", value)} />
                <CourseTableHeader label="Min participants" field="min_participants" sortConfig={sortConfig} onSort={toggleSort} filterValue={columnFilters.min_participants} onFilter={value => setColumnFilter("min_participants", value)} />
                <CourseTableHeader label="Ngày" field="session_date" sortConfig={sortConfig} onSort={toggleSort} filterValue={columnFilters.session_date} onFilter={value => setColumnFilter("session_date", value)} />
                <CourseTableHeader label="Giờ" field="session_time" sortConfig={sortConfig} onSort={toggleSort} filterValue={columnFilters.session_time} onFilter={value => setColumnFilter("session_time", value)} />
                <CourseTableHeader label="Địa điểm" field="location" sortConfig={sortConfig} onSort={toggleSort} filterValue={columnFilters.location} onFilter={value => setColumnFilter("location", value)} options={locationOptions} />
                <CourseTableHeader label="Max participants" field="max_participants" sortConfig={sortConfig} onSort={toggleSort} filterValue={columnFilters.max_participants} onFilter={value => setColumnFilter("max_participants", value)} />
                <CourseTableHeader label="Đã học (nhập tay)" field="total_learners" sortConfig={sortConfig} onSort={toggleSort} filterValue={columnFilters.total_learners} onFilter={value => setColumnFilter("total_learners", value)} />
                <CourseTableHeader label="XP" field="xp_reward" sortConfig={sortConfig} onSort={toggleSort} filterValue={columnFilters.xp_reward} onFilter={value => setColumnFilter("xp_reward", value)} />
                <CourseTableHeader label="Đăng ký" field="active_reservation_count" sortConfig={sortConfig} onSort={toggleSort} filterValue={columnFilters.active_reservation_count} onFilter={value => setColumnFilter("active_reservation_count", value)} />
                <CourseTableHeader label="Hoàn thành" field="enrollment_count" sortConfig={sortConfig} onSort={toggleSort} filterValue={columnFilters.enrollment_count} onFilter={value => setColumnFilter("enrollment_count", value)} />
                <th>Thao tác</th>
                <CourseTableHeader className="adm-course-sticky-right adm-course-col-hr" label="HR đề xuất" field="is_hr_recommended" sortConfig={sortConfig} onSort={toggleSort} filterValue={columnFilters.is_hr_recommended} onFilter={value => setColumnFilter("is_hr_recommended", value)} options={[{ id: "true", label: "Có" }, { id: "false", label: "Không" }]} />
                <CourseTableHeader className="adm-course-sticky-right adm-course-col-visible" label="Hiển thị" field="is_active" sortConfig={sortConfig} onSort={toggleSort} filterValue={columnFilters.is_active} onFilter={value => setColumnFilter("is_active", value)} options={[{ id: "true", label: "Hiện" }, { id: "false", label: "Ẩn" }]} />
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map(c => (
                <tr key={c.id}>
                  <td className="adm-course-sticky-left adm-course-col-select">
                    <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelectCourse(c.id)} />
                  </td>
                  <td className="adm-course-sticky-left adm-course-col-code">{renderInline(c, "course_code", <code style={{ fontSize: 11 }}>{c.course_code}</code>)}</td>
                  <td className="adm-course-sticky-left adm-course-col-title">{renderInline(c, "title", <strong style={{ color: "#fff" }}>{c.title}</strong>)}</td>
                  <td>{renderInline(c, "trainer", c.trainer, { creatable: true, options: trainerOptions })}</td>
                  <td>{renderInline(c, "trainer_type", c.trainer_type, { type: "select", options: [{ id: "internal", label: "Internal" }, { id: "external", label: "External" }] })}</td>
                  <td>{renderInline(c, "type", <Badge status={c.type} />, { type: "select", options: COURSE_TYPES })}</td>
                  <td>{renderInline(c, "format", <Badge status={c.format} />, { type: "select", options: ["online", "offline", "elearning", "webinar", "workshop", "bootcamp", "talk"] })}</td>
                  <td>{renderInline(c, "duration_hours", `${c.duration_hours} giờ`, { type: "number" })}</td>
                  <td>{renderInline(c, "rating", c.rating, { type: "number" })}</td>
                  <td>{renderInline(c, "status", <Badge status={c.status} />, { type: "select", options: COURSE_STATUSES })}</td>
                  <td>{renderInline(c, "rank_targets", (c.rank_targets || []).join(", "), { multi: true, options: rankOptions })}</td>
                  <td>{renderInline(c, "role_targets", (c.role_targets || []).join(", "), { multi: true, options: roleOptions })}</td>
                  <td>{renderInline(c, "skill_tags", (c.skill_tags || []).join(", "), { multi: true, options: skillOptions, allowCustom: false })}</td>
                  <td>{renderInline(c, "description", <span title={c.description} className="adm-inline-truncate">{c.description}</span>)}</td>
                  <td>{renderInline(c, "registration_url", <span title={c.registration_url} className="adm-inline-truncate">{c.registration_url}</span>, { type: "url" })}</td>
                  <td>{renderInline(c, "material_url", <span title={c.material_url} className="adm-inline-truncate">{c.material_url}</span>, { type: "url" })}</td>
                  <td>{renderInline(c, "min_participants", c.min_participants, { type: "number" })}</td>
                  <td>{renderInline(c, "session_date", c.session_date, { type: "date" })}</td>
                  <td>{renderInline(c, "session_time", c.session_time)}</td>
                  <td>{renderInline(c, "location", c.location, { creatable: true, options: locationOptions })}</td>
                  <td>{renderInline(c, "max_participants", c.max_participants, { type: "number" })}</td>
                  <td>{renderInline(c, "total_learners", c.total_learners, { type: "number" })}</td>
                  <td>{renderInline(c, "xp_reward", c.xp_reward, { type: "number" })}</td>
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
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {canReserve(c) && bookingCount(c) > 0 && c.status !== "confirmed" && c.status !== "cancelled" && (
                        <button className="adm-btn adm-btn--primary adm-btn--sm adm-btn--icon" onClick={() => setConfirmTarget(c)} title="Xác nhận mở lớp">
                          <Icon name="send" size={14} />
                        </button>
                      )}
                      <button className="adm-btn adm-btn--sec adm-btn--sm adm-btn--icon" onClick={() => openImport(c)} title="Import participants">
                        <Icon name="users" size={14} />
                      </button>
                      <button className="adm-btn adm-btn--sec adm-btn--sm adm-btn--icon" onClick={() => copyCourseLink(c)} title={copiedCourseId === c.id ? "Đã copy link khóa học" : "Copy link khóa học"}>
                        <Icon name={copiedCourseId === c.id ? "check" : "link"} size={14} />
                      </button>
                      <button className="adm-btn adm-btn--sec adm-btn--sm adm-btn--icon" onClick={() => openEdit(c)} title="Sửa">
                        <Icon name="edit-3" size={14} />
                      </button>
                      <button className="adm-btn adm-btn--sec adm-btn--sm adm-btn--icon" onClick={() => handleDelete(c.id)} title="Xóa" style={{ color: "#E41E26" }}>
                        <Icon name="trash-2" size={14} />
                      </button>
                    </div>
                  </td>
                  <td className="adm-course-sticky-right adm-course-col-hr">
                    <Toggle value={c.is_hr_recommended} onChange={() => saveInlineField(c, "is_hr_recommended", !c.is_hr_recommended)} />
                  </td>
                  <td className="adm-course-sticky-right adm-course-col-visible">
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Toggle value={c.is_active} onChange={() => toggleActive(c.id)} />
                      <span style={{ fontSize: 11, color: "var(--rpg-muted)" }}>{c.is_active ? "Hiện" : "Ẩn"}</span>
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
                        padding: "5px 13px", borderRadius: 999, fontSize: 11, fontWeight: 600,
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

  function TickList({ options, value, onChange, multi = false, allowCustom = true }) {
    const [open, setOpen] = React.useState(false);
    const [term, setTerm] = React.useState("");
    const wrapRef = React.useRef(null);
    const selected = multi ? toList(value) : (value ? [String(value)] : []);
    const allOptions = [...new Set([...(options || []), ...selected].map(String).map(item => item.trim()).filter(Boolean))];
    const visible = allOptions.filter(option => !term.trim() || option.toLowerCase().includes(term.trim().toLowerCase()));
    const exactMatch = allOptions.find(option => option.toLowerCase() === term.trim().toLowerCase());
    const selectedLabel = multi
      ? (selected.length ? `${selected.length} lựa chọn` : "Chọn nhiều giá trị")
      : (selected[0] || "Chọn giá trị");

    React.useEffect(() => {
      if (!open) return undefined;
      const close = (event) => {
        if (wrapRef.current && !wrapRef.current.contains(event.target)) setOpen(false);
      };
      document.addEventListener("mousedown", close);
      return () => document.removeEventListener("mousedown", close);
    }, [open]);

    const pick = (option) => {
      if (multi) {
        onChange(selected.includes(option) ? selected.filter(item => item !== option) : [...selected, option]);
      } else {
        onChange(selected.includes(option) ? "" : option);
        setOpen(false);
      }
      setTerm("");
    };

    const addTypedOption = () => {
      const next = term.trim();
      if (!next) return;
      if (!allowCustom && !exactMatch) return;
      const option = exactMatch || next;
      if (!multi) {
        onChange(option);
        setOpen(false);
      } else if (!selected.includes(option)) {
        onChange([...selected, option]);
      }
      setTerm("");
    };

    return (
      <div ref={wrapRef} style={{ position: "relative", width: "100%" }}>
        <button
          type="button"
          className={`adm-select${selected.length ? " is-active" : ""}`}
          onClick={() => setOpen(current => !current)}
          style={{ width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "space-between", gap: 8, textAlign: "left", cursor: "pointer" }}
        >
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedLabel}</span>
          <span style={{ color: "var(--ui-muted)", fontSize: 12 }}>⌄</span>
        </button>
        {open && (
          <div style={{ position: "absolute", zIndex: 40, top: "calc(100% + 5px)", left: 0, right: 0, minWidth: 220, background: "var(--rpg-panel)", border: "1px solid var(--rpg-border)", borderRadius: 8, boxShadow: "0 16px 40px rgba(0,0,0,.24)", padding: 6 }}>
            <input
              className="adm-input"
              value={term}
              onChange={event => setTerm(event.target.value)}
              onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); addTypedOption(); } }}
              autoFocus
              placeholder={allowCustom ? "Gõ để tìm hoặc thêm option..." : "Gõ để tìm..."}
              style={{ width: "100%", boxSizing: "border-box", height: 34, marginBottom: 5, fontSize: 12 }}
            />
            <div style={{ maxHeight: 220, overflowY: "auto" }}>
              {visible.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => pick(option)}
                  style={{ width: "100%", border: 0, background: selected.includes(option) ? "var(--glh-accent-soft)" : "transparent", color: "var(--ui-heading)", borderRadius: 6, padding: "8px 10px", textAlign: "left", cursor: "pointer", fontSize: 12, fontWeight: selected.includes(option) ? 700 : 600, display: "flex", justifyContent: "space-between", gap: 8 }}
                >
                  <span>{option}</span><span>{selected.includes(option) ? "✓" : ""}</span>
                </button>
              ))}
              {allowCustom && term.trim() && !exactMatch && (
                <button type="button" onClick={addTypedOption} style={{ width: "100%", border: 0, background: "transparent", color: "var(--glh-accent)", borderRadius: 6, padding: "8px 10px", textAlign: "left", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                  + Thêm “{term.trim()}”
                </button>
              )}
              {!visible.length && (
                <span style={{ display: "block", padding: "8px 10px", color: "var(--ui-muted)", fontSize: 12 }}>
                  {term.trim() ? "Không tìm thấy giá trị phù hợp." : (allowCustom ? "Chưa có option. Gõ để thêm mới." : "Chưa có giá trị để chọn.")}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  function InlineEditor({ value, type = "text", options = [], multi = false, creatable = false, allowCustom = true, onSave, onCancel, saving }) {
    const [draft, setDraft] = React.useState(value);
    const inputRef = React.useRef(null);

    React.useEffect(() => {
      if (!multi && !creatable) inputRef.current?.focus();
    }, [multi, creatable]);

    return (
      <div onClick={event => event.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: 4, minWidth: multi ? 170 : 110 }}>
        {multi || creatable ? (
          <TickList options={options} value={draft} multi={multi} allowCustom={allowCustom} onChange={setDraft} />
        ) : type === "select" ? (
          <select className="adm-select" value={draft || ""} onChange={event => setDraft(event.target.value)} style={{ minWidth: 92, height: 32, padding: "4px 7px" }}>
            {options.map(option => <option key={option.id || option} value={option.id || option}>{option.label || option}</option>)}
          </select>
        ) : (
          <input ref={inputRef} className="adm-input" type={type} value={draft || ""} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === "Enter") onSave(draft); if (event.key === "Escape") onCancel(); }} style={{ minWidth: 88, height: 32, padding: "5px 7px", fontSize: 12 }} />
        )}
        <button type="button" className="adm-btn adm-btn--primary adm-btn--sm adm-btn--icon" onClick={() => onSave(draft)} disabled={saving} title="Lưu">✓</button>
        <button type="button" className="adm-btn adm-btn--sec adm-btn--sm adm-btn--icon" onClick={onCancel} disabled={saving} title="Hủy">×</button>
      </div>
    );
  }

  function CourseTableHeader({ className = "", label, field, sortConfig, onSort, filterValue, onFilter, options = [] }) {
    const [open, setOpen] = React.useState(false);
    const ref = React.useRef(null);
    const isMulti = options.length > 0;
    const selected = Array.isArray(filterValue) ? filterValue : [];
    const active = Array.isArray(filterValue) ? filterValue.length > 0 : Boolean(String(filterValue || "").trim());

    React.useEffect(() => {
      if (!open) return undefined;
      const close = event => { if (ref.current && !ref.current.contains(event.target)) setOpen(false); };
      document.addEventListener("mousedown", close);
      return () => document.removeEventListener("mousedown", close);
    }, [open]);

    const toggleOption = value => {
      const next = selected.includes(value) ? selected.filter(item => item !== value) : [...selected, value];
      onFilter(next);
    };

    return (
      <th ref={ref} className={className} style={{ position: "relative" }}>
        <span>{label}</span>
        <button type="button" onClick={() => onSort(field)} aria-label={`Sort ${label}`} style={{ border: 0, background: "transparent", color: sortConfig.field === field ? "var(--glh-accent)" : "var(--rpg-muted)", cursor: "pointer", marginLeft: 5, padding: 0 }}>
          {sortConfig.field === field ? (sortConfig.direction === "asc" ? "↑" : "↓") : "↕"}
        </button>
        <button type="button" onClick={() => setOpen(value => !value)} aria-label={`Filter ${label}`} style={{ border: 0, background: "transparent", color: active ? "var(--glh-accent)" : "var(--rpg-muted)", cursor: "pointer", marginLeft: 3, padding: 0 }}>⌕</button>
        {open && (
          <div style={{ position: "absolute", zIndex: 50, top: "calc(100% + 4px)", left: 8, minWidth: 190, background: "var(--rpg-panel)", border: "1px solid var(--rpg-border)", borderRadius: 8, padding: 8, boxShadow: "0 16px 40px rgba(0,0,0,.28)", textTransform: "none", letterSpacing: 0 }}>
            {isMulti ? (
              <div style={{ maxHeight: 210, overflowY: "auto" }}>
                {options.map(option => {
                  const item = typeof option === "object" ? option : { id: option, label: option };
                  return <label key={item.id} style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 2px", color: "var(--ui-text)", fontSize: 12, cursor: "pointer" }}><input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggleOption(item.id)} />{item.label}</label>;
                })}
              </div>
            ) : (
              <input className="adm-input" autoFocus value={filterValue || ""} onChange={event => onFilter(event.target.value)} placeholder={`Lọc ${label.toLowerCase()}...`} style={{ width: "100%", boxSizing: "border-box", height: 32, fontSize: 12 }} />
            )}
            {active && <button type="button" onClick={() => onFilter(isMulti ? [] : "")} style={{ marginTop: 7, border: 0, background: "transparent", color: "var(--glh-accent)", cursor: "pointer", fontSize: 11, padding: 0 }}>Xóa bộ lọc</button>}
          </div>
        )}
      </th>
    );
  }

  function CourseForm({ course, courses, onSave, onClose, saving, error }) {
    const trainerOptions = catalogOptions(courses, "trainer");
    const locationOptions = catalogOptions(courses, "location");
    const rankOptions = [...new Set([
      ...RANKS_ALL.map(rank => rank.id),
      ...catalogOptions(courses, "rank_targets", true),
    ])];
    const roleOptions = catalogOptions(courses, "role_targets", true);
    const skillOptions = SKILL_OPTIONS;
    const [form, setForm] = React.useState({
      id: course?.course_code || nextCourseCode(courses),
      title: course?.title || "",
      trainer: course?.trainer || "",
      trainer_type: normalizeTrainerType(course?.trainer_type),
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
      total_learners: course?.total_learners || "",
      is_hr_recommended: Boolean(course?.is_hr_recommended),
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
            <TickList options={trainerOptions} value={form.trainer} onChange={value => set("trainer", value)} />
          </div>
          <div className="adm-form-group">
            <label className="adm-label">Loại trainer</label>
            <select className="adm-select" value={form.trainer_type} onChange={e => set("trainer_type", e.target.value)}>
              {TRAINER_TYPE_OPTIONS.map(option => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
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
          <TickList options={rankOptions} value={form.rank_targets} multi onChange={value => set("rank_targets", value)} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div className="adm-form-group">
            <label className="adm-label">Role targets</label>
            <TickList options={roleOptions} value={form.role_targets} multi onChange={value => set("role_targets", value)} />
          </div>
          <div className="adm-form-group">
            <label className="adm-label">Skill tags</label>
            <TickList options={skillOptions} value={form.skill_tags} multi allowCustom={false} onChange={value => set("skill_tags", value)} />
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
            <TickList options={locationOptions} value={form.location} onChange={value => set("location", value)} />
          </div>
          <div className="adm-form-group">
            <label className="adm-label">Số người tối đa</label>
            <input className="adm-input" type="number" min="1" value={form.max_participants} onChange={e => set("max_participants", e.target.value)} placeholder="Không bắt buộc" />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div className="adm-form-group">
            <label className="adm-label">Số người đã học (nhập tay)</label>
            <input className="adm-input" type="number" min="0" value={form.total_learners} onChange={e => set("total_learners", e.target.value)} placeholder="Không bắt buộc" />
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

        <div className="adm-form-group" style={{ marginBottom: 18 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <Toggle value={form.is_hr_recommended} onChange={v => set("is_hr_recommended", v)} />
            <span style={{ fontSize: 13, color: "var(--rpg-muted)" }}>HR Recommend trên trang chủ</span>
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
