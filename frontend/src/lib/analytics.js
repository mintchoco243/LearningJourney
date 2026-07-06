"use client";

export let GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";

export function setDynamicGaId(id) {
  if (id) GA_MEASUREMENT_ID = id;
}

export function trackEvent(name, params = {}) {
  if (!GA_MEASUREMENT_ID) return;
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", name, params);
}

export function trackPageView(path, title) {
  trackEvent("page_view", {
    page_path: path,
    page_title: title || (typeof document !== "undefined" ? document.title : undefined),
  });
}
