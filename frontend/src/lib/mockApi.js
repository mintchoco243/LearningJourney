"use client";

// Dashboard data layer. Signatures unchanged from the mock era; bodies now hit
// the real backend (Next rewrites /api -> server). Shape-mapping lives in courseMap.
// On any failure we return [] — the Dashboard sections are length-guarded and hide.

import { pickUpcoming, pickRecommended } from "./courseMap.mjs";

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
    return pickRecommended(courses || []);
  } catch {
    return [];
  }
}
