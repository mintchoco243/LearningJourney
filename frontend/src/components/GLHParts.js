"use client";

import React from "react";
import { GLHUI } from './GLHUI';
import { GLHEngine } from '@/context/GameContext';
import { GLH_DATA } from '@/data/glhData';
import { getCourseCta } from '@/lib/courseMap.mjs';
import { trackEvent } from '@/lib/analytics';
import { FaceScale, RATING_FACES } from './ratings/EmojiScale';

const { Icon, fmtDate, fmtDuration, FORMAT_LABEL } = GLHUI;
const { useGame, isRecommended } = GLHEngine;
const D = GLH_DATA;


  
  

  /* ---------- Skill pill ---------- */
  export function SkillPill(props) {
    const meta = (D.SKILL_META || {})[props.id] || { color: "#8A93A8", label: props.id };
    const size = props.size || "sm";
    const p = size === "sm" ? "3px 8px" : "5px 12px";
    const fs = size === "sm" ? 11 : 13;
    return React.createElement("span", {
      style: { display: "inline-flex", alignItems: "center", gap: 5, background: meta.color + "1a", border: "1px solid " + meta.color + "4d", color: meta.color, borderRadius: 999, padding: p, fontSize: fs, fontWeight: 700, whiteSpace: "nowrap", lineHeight: 1.2 },
    },
      React.createElement("span", { style: { width: 6, height: 6, borderRadius: "50%", background: meta.color, flexShrink: 0 } }),
      meta.label);
  }

  /* ---------- Star rating ---------- */
  export function Stars(props) {
    const v = Number(props.value);
    if (!v) return null;
    return React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 700, color: "var(--amber)" } },
      "★ ", v.toFixed(1),
      React.createElement("span", { style: { color: "var(--rpg-faint)", fontWeight: 400 } }, "/5"));
  }

  /* ---------- MetaChip ---------- */
  function MetaChip(props) {
    return React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--garena-grey)" } },
      React.createElement(Icon, { name: props.icon, size: 13, color: "var(--garena-grey)" }),
      props.children);
  }

  /* ---------- Detail item ---------- */
  export function DetailItem(props) {
    return React.createElement("div", { style: { display: "flex", gap: 10, alignItems: "flex-start" } },
      React.createElement("div", { style: { background: "rgba(255,255,255,0.06)", borderRadius: 8, padding: 8 } },
        React.createElement(Icon, { name: props.icon, size: 16, color: "var(--garena-grey)" })),
      React.createElement("div", null,
        React.createElement("div", { style: { fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--garena-grey)" } }, props.label),
        React.createElement("div", { style: { fontSize: 14, color: "var(--ui-heading)", fontWeight: 500, marginTop: 2 } }, props.value)));
  }

  const FORMAT_COLOR = {
    online:   { bg: "rgba(43,182,163,0.18)", color: "#2BB6A3" },
    offline:  { bg: "rgba(228,30,38,0.18)",  color: "#FF8A8E" },
    elearning:{ bg: "rgba(122,92,255,0.18)", color: "#A38BFF" },
  };

  function ctaColor(cta) {
    return ({
      accent: "var(--glh-accent)",
      warning: "#FF9E00",
      purple: "#A38BFF",
      success: "var(--garena-positive)",
      muted: "var(--rpg-muted)",
    })[cta?.tone] || "var(--rpg-muted)";
  }

  function scheduleTime(c) {
    if (!c?.start_time) return null;
    return c.end_time ? `${c.start_time} - ${c.end_time}` : c.start_time;
  }

  function ConfirmPopup({ dialog, busy, onCancel, onConfirm }) {
    if (!dialog) return null;
    return React.createElement("div", {
      className: "modal-bg",
      onClick: onCancel,
      style: { zIndex: 120, background: "rgba(13,17,23,0.68)" },
    },
      React.createElement("div", {
        className: "modal",
        onClick: (e) => e.stopPropagation(),
        style: { maxWidth: 420, overflow: "hidden" },
      },
        React.createElement("div", { style: { padding: "22px 24px" } },
          React.createElement("h3", { style: { margin: "0 0 10px", fontSize: 18, lineHeight: 1.3, color: "var(--ui-heading)" } }, dialog.title || "Xác nhận"),
          React.createElement("p", { style: { margin: 0, fontSize: 14, lineHeight: 1.6, color: "var(--ui-text)" } }, dialog.message),
          React.createElement("div", { style: { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 22, flexWrap: "wrap" } },
            dialog.cancelText ? React.createElement("button", { className: "u-btn u-btn--sec", onClick: onCancel, disabled: busy }, dialog.cancelText) : null,
            dialog.confirmText ? React.createElement("button", { className: "u-btn u-btn--primary", onClick: onConfirm, disabled: busy }, busy ? "Đang xử lý..." : dialog.confirmText) : null))));
  }

  const COURSE_RATING_ASPECTS = [
    { key: "content", label: "Mức độ hài lòng với nội dung" },
    { key: "trainer", label: "Mức độ hài lòng với giảng viên" },
    { key: "organization_support", label: "Mức độ hài lòng với công tác tổ chức và hỗ trợ của bộ phận đào tạo?" },
  ];

  function CourseRatingPopup({ course, onClose, onSubmitted }) {
    const [ratings, setRatings] = React.useState({ overall: 0, content: 0, trainer: 0, organization_support: 0 });
    const [appliedLearning, setAppliedLearning] = React.useState("");
    const [improvementFeedback, setImprovementFeedback] = React.useState("");
    const [submitting, setSubmitting] = React.useState(false);
    const [error, setError] = React.useState("");
    const [confirming, setConfirming] = React.useState(false);
    const [submitted, setSubmitted] = React.useState(false);

    const setRating = (key, value) => {
      setRatings((prev) => ({ ...prev, [key]: value }));
      setError("");
    };
    const missingRating = () => {
      if (!ratings.overall) return "Vui lòng đánh giá trải nghiệm tổng thể.";
      const missingAspect = COURSE_RATING_ASPECTS.find((aspect) => !ratings[aspect.key]);
      return missingAspect ? "Vui lòng đánh giá: " + missingAspect.label : "";
    };
    const requestSubmit = () => {
      const missing = missingRating();
      if (missing) {
        setError(missing);
        return;
      }
      setConfirming(true);
    };
    const submit = async () => {
      setSubmitting(true);
      setError("");
      try {
        const courseId = course._id || course.id || course.course_row_id || course.course_id || course.course_code;
        const res = await fetch(`/api/courses/${encodeURIComponent(courseId)}/testimonials`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rating: ratings.overall,
            overall_rating: ratings.overall,
            aspect_ratings: ratings,
            applied_learning: appliedLearning.trim() || null,
            improvement_feedback: improvementFeedback.trim() || null,
            content: improvementFeedback.trim() || appliedLearning.trim() || null,
          }),
        });
        if (!res.ok) throw new Error("SUBMIT_FAILED");
        const data = await res.json().catch(() => null);
        onSubmitted(data?.testimonial || null);
        setConfirming(false);
        setSubmitted(true);
      } catch {
        setConfirming(false);
        setError("Không thể gửi đánh giá. Vui lòng thử lại.");
      } finally {
        setSubmitting(false);
      }
    };

    if (submitted) {
      return (
        <div className="modal-bg" style={{ zIndex: 130 }} onClick={onClose}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460, textAlign: "center", padding: 42 }}>
            <div style={{ width: 54, height: 54, borderRadius: "50%", margin: "0 auto 16px", display: "grid", placeItems: "center", background: "rgba(43,182,163,0.16)", color: "var(--garena-positive)", fontSize: 28, fontWeight: 900 }}>✓</div>
            <h3 style={{ margin: "0 0 8px", color: "var(--ui-heading)", fontSize: 20 }}>Gửi thành công</h3>
            <p style={{ margin: "0 0 22px", color: "var(--ui-text)", lineHeight: 1.6 }}>Cảm ơn bạn đã gửi đánh giá</p>
            <button className="u-btn u-btn--primary" onClick={onClose}>Đóng</button>
          </div>
        </div>
      );
    }

    return (
      <div className="modal-bg" style={{ zIndex: 130 }} onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 660, padding: 0, maxHeight: "88vh", overflow: "auto" }}>
          <div style={{ padding: "22px 24px 18px", borderBottom: "1px solid var(--ui-box-border)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
              <div>
                <h3 style={{ margin: "0 0 5px", color: "var(--ui-heading)", fontSize: 19 }}>Đánh giá khóa học</h3>
                <div style={{ color: "var(--ui-muted)", fontSize: 13, lineHeight: 1.5 }}>{course.title}</div>
              </div>
              <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--ui-muted)", cursor: "pointer", padding: 4 }}>
                <Icon name="x" size={18} />
              </button>
            </div>
          </div>
          <div style={{ padding: "22px 28px 28px" }}>
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--ui-muted)", marginBottom: 14, textTransform: "uppercase", letterSpacing: ".05em" }}>1. Trải nghiệm tổng thể</div>
              <FaceScale value={ratings.overall} onChange={(value) => setRating("overall", value)} faces={RATING_FACES} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--ui-muted)", marginBottom: 18, textTransform: "uppercase", letterSpacing: ".05em" }}>2. Từng khía cạnh</div>
              {COURSE_RATING_ASPECTS.map((aspect) => (
                <div key={aspect.key} style={{ marginBottom: 22 }}>
                  <div style={{ color: "var(--ui-heading)", fontSize: 14, fontWeight: 800, marginBottom: 10 }}>{aspect.label}</div>
                  <FaceScale value={ratings[aspect.key]} onChange={(value) => setRating(aspect.key, value)} faces={RATING_FACES} compact />
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--ui-muted)", marginBottom: 12, textTransform: "uppercase", letterSpacing: ".05em" }}>3. Thông tin khác</div>
              <label style={{ display: "block", color: "var(--ui-heading)", fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Vui lòng chia sẻ một điều mà bạn học được và có thể áp dụng trong thực tế công việc thông qua khóa học này?</label>
              <textarea className="u-input" value={appliedLearning} onChange={(e) => setAppliedLearning(e.target.value)} placeholder="Tùy chọn trả lời" rows={3} style={{ width: "100%", boxSizing: "border-box", resize: "vertical", marginBottom: 16, padding: 12 }} />
              <label style={{ display: "block", color: "var(--ui-heading)", fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Vui lòng chia sẻ thêm các phản hồi /gợi ý khác của bạn để cải thiện chất lượng đào tạo?</label>
              <textarea className="u-input" value={improvementFeedback} onChange={(e) => setImprovementFeedback(e.target.value)} placeholder="Tùy chọn trả lời" rows={3} style={{ width: "100%", boxSizing: "border-box", resize: "vertical", padding: 12 }} />
            </div>
            {error ? <div style={{ color: "var(--glh-accent)", fontWeight: 800, fontSize: 13, marginBottom: 14 }}>{error}</div> : null}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
              <button className="u-btn u-btn--sec" onClick={onClose} disabled={submitting}>Để sau</button>
              <button className="u-btn u-btn--primary" onClick={requestSubmit} disabled={submitting}>{submitting ? "Đang gửi..." : "Gửi đánh giá"}</button>
            </div>
          </div>
        </div>
        {confirming ? (
          <div className="modal-bg" style={{ zIndex: 150, background: "rgba(13,17,23,0.72)" }} onClick={() => !submitting && setConfirming(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420, padding: "22px 24px" }}>
              <h3 style={{ margin: "0 0 10px", color: "var(--ui-heading)", fontSize: 18 }}>Xác nhận gửi đánh giá</h3>
              <p style={{ margin: 0, color: "var(--ui-text)", fontSize: 14, lineHeight: 1.6 }}>Bạn muốn gửi đánh giá cho khóa học này?</p>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 22, flexWrap: "wrap" }}>
                <button className="u-btn u-btn--sec" onClick={() => setConfirming(false)} disabled={submitting}>Hủy</button>
                <button className="u-btn u-btn--primary" onClick={submit} disabled={submitting}>{submitting ? "Đang gửi..." : "Gửi đánh giá"}</button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  export function CourseCard({ course: c, onClick, showDate }) {
    const { user } = useGame();
    const fc = FORMAT_COLOR[c.format] || { bg: "rgba(255,255,255,0.07)", color: "var(--ui-muted)" };
    const isEnded = c.course_status === "ended";
    const rowId = c._id || c.id || c.course_row_id;
    const done = rowId ? (user.completed_courses || []).includes(rowId) : (user.completed_courses || []).includes(c.course_id);
    const cta = getCourseCta(c, user);
    const statusChipText = done ? "Đã hoàn thành" : isEnded ? "Đã kết thúc" : null;
    const desc = c.description_short || c.description;
    const timeText = scheduleTime(c);

    return React.createElement("button", {
      className: "u-card u-card--hover",
      style: { textAlign: "left", padding: 0, display: "flex", flexDirection: "column", cursor: "pointer", background: "var(--rpg-panel)", overflow: "hidden", opacity: done ? 0.72 : 1 },
      onClick: () => {
        onClick && onClick(c);
      },
    },
      React.createElement("div", { style: { padding: "18px 20px", display: "flex", flexDirection: "column", gap: 8, flex: 1 } },
        // format chip + status
        React.createElement("div", { style: { display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" } },
          React.createElement("span", { style: { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", padding: "3px 10px", borderRadius: 999, background: fc.bg, color: fc.color } },
            FORMAT_LABEL[c.format] || c.format),
          statusChipText && React.createElement("span", { style: { fontSize: 11, fontWeight: 600, textTransform: "none", letterSpacing: 0, padding: "3px 9px", borderRadius: 999, background: "rgba(138,147,168,0.14)", color: done ? "var(--garena-positive)" : "var(--rpg-muted)", border: "1px solid rgba(138,147,168,0.22)" } },
            statusChipText)),
        c.rating ? React.createElement(Stars, { value: c.rating }) : null,
        // countdown (dashboard recommended only)
        showDate && c.countdown_days != null && React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: c.countdown_days <= 5 ? "#E41E26" : c.countdown_days <= 14 ? "#FF9E00" : "var(--rpg-muted)" } },
          c.countdown_days === 0 ? "Hôm nay" : "Còn " + c.countdown_days + " ngày"),
        // title
        React.createElement("h3", { className: "u-h3", style: { fontSize: 15, lineHeight: 1.3, margin: 0 } }, c.title),
        (c.start_date || timeText) && React.createElement("div", { style: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", fontSize: 12, fontWeight: 600, color: "var(--ui-muted)" } },
          c.start_date && React.createElement(MetaChip, { icon: "calendar" }, fmtDate(c.start_date)),
          timeText && React.createElement(MetaChip, { icon: "clock" }, timeText)),
        // description
        desc && React.createElement("p", { className: "rec-desc", style: { fontSize: 12, color: "var(--ui-muted)", margin: 0, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } }, desc),
        // skill tags
        (c.skill_tags || []).length > 0 && React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" } },
          (c.skill_tags || []).slice(0, 2).map(sid => React.createElement(SkillPill, { key: sid, id: sid }))),
        // meta row
        React.createElement("div", { style: { display: "flex", gap: 12, marginTop: "auto", paddingTop: 6, flexWrap: "wrap", alignItems: "center" } },
          c.trainer && React.createElement(MetaChip, { icon: "user" }, c.trainer),
          c.duration_minutes && React.createElement(MetaChip, { icon: "clock" }, fmtDuration(c.duration_minutes)),
          cta && React.createElement("span", { style: { marginLeft: "auto", fontSize: 12, fontWeight: 800, color: ctaColor(cta) } }, cta.text))));
  }

  /* ---------- Course modal ---------- */
  export function CourseModal(props) {
    const { user, actions } = useGame();
    const c = props.course;
    const meta = (D.COURSE_META || {})[c?.course_id] || {};
    const [testimonials, setTestimonials] = React.useState(null);
    const [completedCourseId, setCompletedCourseId] = React.useState(null);
    const [uncompletedCourseId, setUncompletedCourseId] = React.useState(null);
    const [ratingFormCourseId, setRatingFormCourseId] = React.useState(null);
    const [ratingSubmittedCourseId, setRatingSubmittedCourseId] = React.useState(null);
    const [busyAction, setBusyAction] = React.useState(null);
    const [reservedSessionId, setReservedSessionId] = React.useState(null);
    const [confirmDialog, setConfirmDialog] = React.useState(null);

    React.useEffect(() => {
      if (!c) return;
      let active = true;
      const rowId = c._id || c.course_id;
      fetch(`/api/courses/${encodeURIComponent(rowId)}/testimonials`, { credentials: "include" })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => { if (active) setTestimonials(data?.testimonials?.length ? data.testimonials : null); })
        .catch(() => {});
      return () => { active = false; };
    }, [c]);

    React.useEffect(() => {
      if (!c) return;
      trackEvent("course_view", {
        course_id: c._id || c.id || c.course_row_id || c.course_id,
        course_code: c.course_code || c.course_id,
        course_title: c.title,
      });
    }, [c]);

    if (!c) return null;
    const isEnded = c.course_status === "ended";
    const showRatingForm = ratingFormCourseId === c.course_id;
    const ratingSubmitted = ratingSubmittedCourseId === c.course_id;
    const rowId = c._id || c.id || c.course_row_id;
    const courseActionId = rowId || c.course_id;
    const completedNow = completedCourseId === courseActionId;
    const uncompletedNow = uncompletedCourseId === courseActionId;
    const done = !uncompletedNow && (completedNow || (rowId ? (user.completed_courses || []).includes(rowId) : (user.completed_courses || []).includes(c.course_id)));
    const rec = isRecommended(c, user);
    const rating = c.rating || meta.rating;
    const testimonialList = testimonials || (meta.testimonial ? [meta.testimonial] : []);
    const statusChipText = done ? "Đã hoàn thành" : isEnded ? "Đã kết thúc" : null;
    const modalCourse = Object.assign({}, c, {
      session_id: c.session_id || null,
      session_status: c.session_status || null,
      location: c.location || meta.location,
      start_date: c.start_date || null,
      start_time: c.start_time || null,
      max_participants: c.max_participants ?? null,
      min_participants: c.min_participants ?? null,
      current_count: c.current_count ?? null,
    });
    const reservedNow = reservedSessionId === modalCourse.session_id;
    const effectiveUser = Object.assign({}, user, {
      completed_courses: completedNow
        ? Array.from(new Set([...(user.completed_courses || []), rowId || c.course_id]))
        : uncompletedNow
          ? (user.completed_courses || []).filter((id) => id !== courseActionId)
        : user.completed_courses,
      registered_events: reservedNow
        ? Array.from(new Set([...(user.registered_events || []), modalCourse.session_id]))
        : user.registered_events,
    });
    const cta = getCourseCta(modalCourse, effectiveUser);
    const canOpenMaterial = Boolean(modalCourse.material_url) && modalCourse.course_status === "ended" && modalCourse.format !== "elearning";
    const completionButtonStyle = { minWidth: 180 };
    const openMaterial = () => {
      if (modalCourse.material_url) window.open(modalCourse.material_url, "_blank", "noreferrer");
    };
    const showError = () => {
      setConfirmDialog({
        type: "notice",
        title: "Không thể cập nhật",
        message: "Không thể cập nhật trạng thái hoàn thành. Vui lòng thử lại.",
        confirmText: "Đã hiểu",
      });
    };
    const showActionError = (message) => {
      setConfirmDialog({
        type: "notice",
        title: "Không thể cập nhật",
        message,
        confirmText: "Đã hiểu",
      });
    };
    const markComplete = async () => {
      setBusyAction("complete");
      const ok = await actions.completeCourse(c);
      setBusyAction(null);
      if (!ok) {
        showError();
        return;
      }
      setCompletedCourseId(courseActionId);
      setUncompletedCourseId(null);
      setRatingFormCourseId(null);
    };
    const unmarkComplete = async () => {
      setBusyAction("uncomplete");
      const ok = await actions.uncompleteCourse(c);
      setBusyAction(null);
      if (!ok) {
        showError();
        return;
      }
      setUncompletedCourseId(courseActionId);
      setCompletedCourseId(null);
      setRatingFormCourseId(null);
    };
    const reserveCourse = async () => {
      setBusyAction("reserve");
      const ok = await actions.reserveCourseSession(modalCourse);
      setBusyAction(null);
      if (ok) {
        setReservedSessionId(modalCourse.session_id);
        trackEvent("course_reserve_success", {
          course_id: modalCourse._id || modalCourse.id || modalCourse.course_row_id || modalCourse.course_id,
          course_code: modalCourse.course_code || modalCourse.course_id,
          course_title: modalCourse.title,
        });
        return;
      }
      showActionError("Không thể đăng ký khóa học. Vui lòng thử lại.");
    };
    const handleRatingSubmitted = (testimonial) => {
      if (testimonial) {
        setTestimonials((items) => [testimonial, ...((items || []).filter((item) => item.id !== testimonial.id))]);
      }
      setRatingSubmittedCourseId(c.course_id);
    };
    const requestConfirmation = (dialog) => {
      setConfirmDialog(Object.assign({ cancelText: "Hủy" }, dialog));
    };
    const handleConfirm = async () => {
      const dialog = confirmDialog;
      if (!dialog) return;
      if (dialog.type === "notice") {
        setConfirmDialog(null);
        return;
      }
      setConfirmDialog(null);
      if (dialog.type === "complete") await markComplete();
      if (dialog.type === "uncomplete") await unmarkComplete();
      if (dialog.type === "reserve") await reserveCourse();
      if (dialog.type === "register_url") window.open(modalCourse.url, "_blank", "noreferrer");
    };
    const handlePrimary = async () => {
      if (cta.action === "material" && canOpenMaterial) {
        openMaterial();
        return;
      }
      if (cta.action === "url" && modalCourse.url && modalCourse.url !== "#") {
        if (cta.key === "register" || cta.key === "external_register") {
          trackEvent("course_register_click", {
            course_id: modalCourse._id || modalCourse.id || modalCourse.course_row_id || modalCourse.course_id,
            course_code: modalCourse.course_code || modalCourse.course_id,
            course_title: modalCourse.title,
            action: cta.key,
          });
          requestConfirmation({
            type: "register_url",
            title: "Xác nhận đăng ký",
            message: "Bạn muốn đăng ký khóa học này?",
            confirmText: "Xác nhận đăng ký",
          });
          return;
        }
        window.open(modalCourse.url, "_blank", "noreferrer");
        return;
      }
      if (cta.action === "reserve") {
        trackEvent("course_register_click", {
          course_id: modalCourse._id || modalCourse.id || modalCourse.course_row_id || modalCourse.course_id,
          course_code: modalCourse.course_code || modalCourse.course_id,
          course_title: modalCourse.title,
          action: "reserve",
        });
        requestConfirmation({
          type: "reserve",
          title: "Xác nhận đăng ký",
          message: "Bạn muốn đăng ký khóa học này?",
          confirmText: "Xác nhận đăng ký",
        });
        return;
      }
      if (cta.action === "complete") {
        requestConfirmation({
          type: "complete",
          title: "Xác nhận hoàn thành",
          message: "Bạn xác nhận đã hoàn thành khóa học này?",
          confirmText: "Xác nhận hoàn thành",
        });
      }
    };
    const stop = (e) => e.stopPropagation();
    return React.createElement("div", { className: "modal-bg", onClick: props.onClose },
      React.createElement("div", { className: "modal", onClick: stop },
        React.createElement("div", { style: { background: "radial-gradient(600px 240px at 0% -40%, #1a2334, #0d1117)", color: "#fff", padding: "24px 28px 20px", borderRadius: "12px 12px 0 0", position: "relative" } },
          React.createElement("button", { onClick: props.onClose, style: { position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: 8, color: "#fff", cursor: "pointer" } },
            React.createElement(Icon, { name: "x", size: 18, color: "#fff" })),
          React.createElement("div", { style: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 } },
            React.createElement("span", { className: "u-pill", style: { background: "rgba(255,255,255,0.12)", color: "#fff" } }, FORMAT_LABEL[c.format] || c.format),
            statusChipText ? React.createElement("span", { style: { fontSize: 11, fontWeight: 600, letterSpacing: 0, textTransform: "none", padding: "3px 9px", borderRadius: 999, background: "rgba(255,255,255,0.07)", color: done ? "var(--garena-positive)" : "var(--rpg-muted)", border: "1px solid rgba(255,255,255,0.12)" } }, statusChipText) : null,
            rec ? React.createElement("span", { className: "u-pill u-pill--match" }, "Phù hợp với bạn") : null,
            rating ? React.createElement(Stars, { value: rating }) : null),
          React.createElement("h2", { style: { fontSize: 24, fontWeight: 700, margin: 0, lineHeight: 1.2, color: "#fff" } }, c.title)),
        React.createElement("div", { style: { padding: "24px 28px 28px" } },
          React.createElement("p", { style: { fontSize: 15, lineHeight: 1.65, color: "var(--ui-text)", margin: "0 0 18px" } }, c.description),
          (c.skill_tags || []).length ? React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 } },
            (c.skill_tags || []).map((sid) => React.createElement(SkillPill, { key: sid, id: sid, size: "md" }))) : null,
          React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 } },
            c.trainer ? React.createElement(DetailItem, { icon: "user", label: "Trainer", value: c.trainer }) : null,
            c.audience ? React.createElement(DetailItem, { icon: "users", label: "Đối tượng", value: c.audience }) : null,
            c.duration_minutes ? React.createElement(DetailItem, { icon: "clock", label: "Thời lượng", value: fmtDuration(c.duration_minutes) }) : null,
            modalCourse.material_url ? React.createElement(DetailItem, { icon: "book-open", label: "Tài liệu", value: "Có tài liệu / recording" }) : null,
            modalCourse.location ? React.createElement(DetailItem, { icon: "map-pin", label: "Địa điểm", value: modalCourse.location }) : null,
            modalCourse.start_date ? React.createElement(DetailItem, { icon: "calendar", label: "Ngày tổ chức", value: fmtDate(modalCourse.start_date) }) : null,
            modalCourse.start_time ? React.createElement(DetailItem, { icon: "clock", label: "Giờ tổ chức", value: modalCourse.start_time }) : null,
            modalCourse.min_participants && !modalCourse.max_participants ? React.createElement(DetailItem, { icon: "users", label: "Tối thiểu mở lớp", value: (modalCourse.current_count ?? 0) + "/" + modalCourse.min_participants }) : null,
            modalCourse.max_participants ? React.createElement(DetailItem, { icon: "users", label: "Số lượng", value: (modalCourse.current_count ?? 0) + "/" + modalCourse.max_participants }) : null),
          testimonialList.length ? React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 } },
            testimonialList.map((t, i) => React.createElement("div", { key: i, style: { background: "rgba(255,255,255,0.04)", borderLeft: "3px solid var(--amber)", borderRadius: "0 8px 8px 0", padding: "14px 16px" } },
              React.createElement("p", { style: { fontSize: 14, fontStyle: "italic", color: "var(--ui-text)", margin: "0 0 8px", lineHeight: 1.55 } }, "“" + (t.content || t.quote) + "”"),
              React.createElement("div", { style: { fontSize: 12, color: "var(--ui-muted)", fontWeight: 600 } }, "— " + (t.full_name || t.author) + (t.role ? " · " + t.role : ""))))) : null,
          React.createElement(React.Fragment, null,
            cta.disabled
              ? React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, padding: 14, marginBottom: 12, background: "rgba(22,163,74,0.14)", border: "1px solid rgba(22,163,74,0.45)", borderRadius: 8, color: "var(--garena-positive)", fontWeight: 700 } },
                  React.createElement(Icon, { name: "check-circle", size: 18, color: "var(--garena-positive)" }), cta.modalText)
              : null,
            React.createElement("div", { style: { display: "flex", gap: 12, flexWrap: "wrap" } },
              !cta.disabled ? React.createElement("button", {
                className: "u-btn u-btn--primary",
                style: {
                  flex: 1,
                  minWidth: 220,
                  minHeight: 52,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  cursor: busyAction ? "wait" : "pointer",
                  boxShadow: "0 10px 24px rgba(228,30,38,0.22)",
                },
                onClick: handlePrimary,
                disabled: !!busyAction,
              },
                React.createElement(Icon, { name: cta.action === "reserve" ? "check-circle" : "arrow-right", size: 18, color: "#fff" }),
                busyAction === "reserve" ? "Đang đặt chỗ..." : busyAction === "complete" ? "Đang lưu..." : cta.modalText
              ) : null,
              canOpenMaterial && cta.action !== "material" ? React.createElement("button", { className: "u-btn u-btn--sec", onClick: openMaterial }, "Xem tài liệu") : null,
              done
                ? React.createElement(React.Fragment, null,
                    React.createElement("button", {
                      className: "u-btn u-btn--sec",
                      style: completionButtonStyle,
                      onClick: () => requestConfirmation({
                        type: "uncomplete",
                        title: "Xác nhận hoàn tác",
                        message: "Bạn muốn đánh dấu khóa học này là chưa hoàn thành?",
                        confirmText: "Xác nhận",
                      }),
                      disabled: !!busyAction,
                    }, busyAction === "uncomplete" ? "Đang lưu..." : "Hoàn tác hoàn thành"),
                    React.createElement("button", { className: "u-btn u-btn--sec", style: completionButtonStyle, onClick: () => setRatingFormCourseId(c.course_id), disabled: ratingSubmitted }, ratingSubmitted ? "Đã gửi đánh giá" : "Gửi đánh giá"))
                : cta.key !== "complete" ? React.createElement("button", {
                    className: "u-btn u-btn--sec",
                    style: completionButtonStyle,
                    onClick: () => requestConfirmation({
                      type: "complete",
                      title: "Xác nhận hoàn thành",
                      message: "Bạn xác nhận đã hoàn thành khóa học này?",
                      confirmText: "Xác nhận hoàn thành",
                    }),
                  }, "Đánh dấu đã hoàn thành") : null)
          )
        )
      ),
      showRatingForm ? React.createElement(CourseRatingPopup, {
        course: modalCourse,
        onClose: () => setRatingFormCourseId(null),
        onSubmitted: handleRatingSubmitted,
      }) : null,
      React.createElement(ConfirmPopup, {
        dialog: confirmDialog,
        busy: !!busyAction,
        onCancel: () => setConfirmDialog(null),
        onConfirm: handleConfirm,
      })
    );
  }

  export const GLHParts = { CourseCard, CourseModal, DetailItem, SkillPill, Stars };
