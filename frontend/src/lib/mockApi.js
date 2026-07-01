"use client";

// Dashboard data layer. Signatures unchanged from the mock era; bodies now hit
// the real backend (Next rewrites /api -> server). Shape-mapping lives in courseMap.
// When the API has no data (e.g. no DB configured), we fall back to the same
// static content glhData serves to Catalog/Calendar — so the Dashboard stays
// consistent with the rest of the app instead of showing empty sections.

import { pickUpcoming, pickRecommended, mapSessionToCourse } from "./courseMap.mjs";
import { GLH_DATA } from "@/data/glhData";

const STATIC_CALENDAR_COURSE = {
  "EV-001": "LC-001",
  "EV-002": "LC-005",
  "EV-003": "LC-003",
  "EV-004": "LC-006",
  "EV-005": "LC-007",
  "EV-006": "LC-004",
  "EV-007": "LC-012",
  "EV-008": "LC-010",
  "EV-009": "LC-009",
  "EV-010": "LC-008",
};

function staticCourseForCalendarEvent(e) {
  const courseId = e.course_id || STATIC_CALENDAR_COURSE[e.event_id];
  return (GLH_DATA.COURSES || []).find((c) => c.course_id === courseId) || null;
}

function staticCourseById(id) {
  return (GLH_DATA.COURSES || []).find((c) => c.course_id === id || c._id === id) || null;
}

function enrichSessionWithStaticCourse(s) {
  const courseId = s.course_code || s.course_id;
  const course = staticCourseById(courseId);
  if (!course) return s;
  return {
    ...s,
    course_id: course.course_id || courseId,
    title: s.title || course.title,
    format: s.format || course.format,
    trainer: s.trainer || course.trainer,
    description: s.description || course.description,
    duration_hours: s.duration_hours ?? (course.duration_minutes ? course.duration_minutes / 60 : null),
    xp_reward: s.xp_reward ?? course.xp_reward,
    rating: s.rating ?? course.rating ?? GLH_DATA.COURSE_META?.[course.course_id]?.rating ?? null,
    material_url: s.material_url ?? course.material_url ?? null,
    course_status: s.course_status ?? course.course_status ?? course.status ?? null,
    skill_tags: s.skill_tags?.length ? s.skill_tags : (course.skill_tags || []),
    registration_url: s.registration_url || course.url || "#",
    audience: s.audience || course.audience || "Mọi cấp độ",
  };
}

// Calendar events -> session-shaped objects pickUpcoming understands.
function calendarAsSessions() {
  return (GLH_DATA.CALENDAR || []).map((e) => {
    const course = staticCourseForCalendarEvent(e);
    return {
      id: e.event_id,
      course_id: course?.course_id || e.event_id,
      title: course?.title || e.title,
      format: course?.format || e.type,
      location: e.location,
      trainer: course?.trainer || e.host || "",
      audience: course?.audience || e.audience || "Mọi cấp độ",
      description: course?.description || "",
      duration_hours: course?.duration_minutes ? course.duration_minutes / 60 : null,
      xp_reward: course?.xp_reward,
      rating: course?.rating ?? GLH_DATA.COURSE_META?.[course?.course_id]?.rating ?? null,
      material_url: course?.material_url || null,
      course_status: course?.course_status || course?.status || null,
      skill_tags: course?.skill_tags || e.skill_tags || [],
      session_date: e.start_date,
      session_time: e.time,
      registration_url: course?.url || e.url || "#",
      status: "open",
    };
  });
}

export function getStaticCalendarCourses() {
  return calendarAsSessions().map(mapSessionToCourse).filter((c) => c.start_date);
}

export async function getUpcomingCourses() {
  try {
    const res = await fetch("/api/sessions", { credentials: "include" });
    if (res.ok) {
      const { sessions } = await res.json();
      const mapped = pickUpcoming((sessions || []).map(enrichSessionWithStaticCourse));
      if (mapped.length) return mapped;
    }
  } catch {
    // fall through to static fallback
  }
  return pickUpcoming(calendarAsSessions());
}

export async function getRecommendedCourses() {
  try {
    const res = await fetch("/api/courses?limit=100", { credentials: "include" });
    if (res.ok) {
      const { courses } = await res.json();
      const mapped = pickRecommended(courses || []);
      if (mapped.length) return mapped;
    }
  } catch {
    // fall through to static fallback
  }
  // glhData.COURSES is already in card shape (course_id/format/duration_minutes/...).
  return (GLH_DATA.COURSES || []).slice(0, 6);
}

export async function getCalendarEvents() {
  try {
    const res = await fetch("/api/sessions", { credentials: "include" });
    if (res.ok) {
      const { sessions } = await res.json();
      const mapped = (sessions || []).map(enrichSessionWithStaticCourse).map(mapSessionToCourse).filter((c) => c.start_date);
      if (mapped.length) return mapped;
    }
  } catch {
    // fall through to static fallback
  }
  return getStaticCalendarCourses();
}
