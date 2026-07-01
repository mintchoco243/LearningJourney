"use client";

// Dashboard data layer. Signatures unchanged from the mock era; bodies now hit
// the real backend (Next rewrites /api -> server). Shape-mapping lives in courseMap.
// When the API has no data (e.g. no DB configured), we fall back to the same
// static content glhData serves to Catalog/Calendar — so the Dashboard stays
// consistent with the rest of the app instead of showing empty sections.

import { pickUpcoming, pickRecommended, mapSessionToEvent } from "./courseMap.mjs";
import { GLH_DATA } from "@/data/glhData";

// Calendar events -> session-shaped objects pickUpcoming understands.
function calendarAsSessions() {
  return (GLH_DATA.CALENDAR || []).map((e) => ({
    course_id: e.event_id,
    title: e.title,
    format: e.type,
    location: e.location,
    session_date: e.start_date,
    session_time: e.time,
    status: "open",
  }));
}

export async function getUpcomingCourses() {
  try {
    const res = await fetch("/api/sessions", { credentials: "include" });
    if (res.ok) {
      const { sessions } = await res.json();
      const mapped = pickUpcoming(sessions || []);
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
      const mapped = (sessions || []).map(mapSessionToEvent);
      if (mapped.length) return mapped;
    }
  } catch {
    // fall through to static fallback
  }
  return GLH_DATA.CALENDAR || [];
}
