"use client";

// Course data layer. The filename is kept to avoid import churn, but live
// course surfaces are DB-backed only and never fall back to static samples.

import { pickUpcoming, mapCourseToCard, mapSessionToCourse } from "./courseMap.mjs";
import { apiGet } from "./apiClient";

export async function getUpcomingCourses() {
  try {
    const { sessions } = await apiGet("/api/sessions");
    return pickUpcoming(sessions || []);
  } catch {
    throw new Error("COURSE_DATA_UNAVAILABLE");
  }
}

export async function getRecommendedCourses() {
  try {
    const { courses } = await apiGet("/api/courses?limit=100");
    return (courses || []).map((course) => mapCourseToCard(course));
  } catch {
    throw new Error("COURSE_DATA_UNAVAILABLE");
  }
}

export async function getRecommendations() {
  try {
    const data = await apiGet("/api/courses/recommendations");
    const map = (items) => (items || []).map((course) => mapCourseToCard(course));
    return {
      quiz_skill_courses: map(data.quiz_skill_courses),
      hr_recommended_courses: map(data.hr_recommended_courses),
      fallback_courses: map(data.fallback_courses),
      courses: map(data.courses),
    };
  } catch {
    throw new Error("COURSE_DATA_UNAVAILABLE");
  }
}

export async function getCalendarEvents() {
  try {
    const { sessions } = await apiGet("/api/sessions");
    return (sessions || [])
      .map((session) => mapSessionToCourse(session))
      .filter((course) => course.start_date);
  } catch {
    throw new Error("COURSE_DATA_UNAVAILABLE");
  }
}
