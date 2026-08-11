"use client";

// Course data layer. The filename is kept to avoid import churn, but live
// course surfaces are DB-backed only and never fall back to static samples.

import { pickUpcoming, mapCourseToCard, mapSessionToCourse } from "./courseMap.mjs";

export async function getUpcomingCourses() {
  try {
    const res = await fetch("/api/sessions", { credentials: "include" });
    if (!res.ok) return [];
    const { sessions } = await res.json();
    return pickUpcoming(sessions || []);
  } catch {
    return [];
  }
}

export async function getRecommendedCourses() {
  try {
    const res = await fetch("/api/courses?limit=100", { credentials: "include" });
    if (!res.ok) return [];
    const { courses } = await res.json();
    return (courses || []).map((course) => mapCourseToCard(course));
  } catch {
    return [];
  }
}

export async function getRecommendations() {
  try {
    const res = await fetch("/api/courses/recommendations", { credentials: "include" });
    if (!res.ok) return { quiz_skill_courses: [], hr_recommended_courses: [], fallback_courses: [], courses: [] };
    const data = await res.json();
    const map = (items) => (items || []).map((course) => mapCourseToCard(course));
    return {
      quiz_skill_courses: map(data.quiz_skill_courses),
      hr_recommended_courses: map(data.hr_recommended_courses),
      fallback_courses: map(data.fallback_courses),
      courses: map(data.courses),
    };
  } catch {
    return { quiz_skill_courses: [], hr_recommended_courses: [], fallback_courses: [], courses: [] };
  }
}

export async function getCalendarEvents() {
  try {
    const res = await fetch("/api/sessions", { credentials: "include" });
    if (!res.ok) return [];
    const { sessions } = await res.json();
    return (sessions || [])
      .map((session) => mapSessionToCourse(session))
      .filter((course) => course.start_date);
  } catch {
    return [];
  }
}
