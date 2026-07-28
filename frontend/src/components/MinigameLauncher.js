"use client";

import React from "react";

const DISMISSED_DATE_KEY = "minigame_launcher_dismissed_date";
const LAUNCHER_POSITION_KEY = "minigame_launcher_position_v2";
const LAUNCHER_SIZE = 150;

function localDateKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function clampLauncherPosition(position) {
  if (typeof window === "undefined") return position;
  return {
    left: Math.min(Math.max(0, Number(position?.left) || 0), Math.max(0, window.innerWidth - LAUNCHER_SIZE)),
    top: Math.min(Math.max(0, Number(position?.top) || 0), Math.max(0, window.innerHeight - LAUNCHER_SIZE)),
  };
}

function readLauncherPosition(userKey) {
  if (typeof window === "undefined") return { left: 0, top: 0 };
  try {
    const saved = JSON.parse(window.localStorage.getItem(`${LAUNCHER_POSITION_KEY}:${userKey}`) || "null");
    if (saved && Number.isFinite(Number(saved.left)) && Number.isFinite(Number(saved.top))) return clampLauncherPosition(saved);
  } catch (_) { /* ignore malformed local preferences */ }
  return clampLauncherPosition({ left: window.innerWidth - 174, top: (window.innerHeight - LAUNCHER_SIZE) / 2 });
}

export function MinigameLauncher({ authenticated, userKey = "guest" }) {
  const [open, setOpen] = React.useState(false);
  const [enabled, setEnabled] = React.useState(false);
  const [dismissedToday, setDismissedToday] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(`${DISMISSED_DATE_KEY}:${userKey}`) === localDateKey();
  });
  const [launcherPosition, setLauncherPosition] = React.useState(() => readLauncherPosition(userKey));
  const [taskNotice, setTaskNotice] = React.useState(null);
  const iframeRef = React.useRef(null);
  const noticeTimerRef = React.useRef(null);
  const dragRef = React.useRef(null);
  const suppressClickRef = React.useRef(false);

  function showTaskNotice(title, reward) {
    setTaskNotice({ title, reward });
    if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = window.setTimeout(() => setTaskNotice(null), 5000);
  }

  React.useEffect(() => {
    if (typeof window === "undefined") return undefined;
    fetch("/api/minigame/status", { cache: "no-store" }).then((response) => response.ok ? response.json() : null).then((data) => setEnabled(Boolean(data?.enabled))).catch(() => setEnabled(false));
    const params = new URLSearchParams(window.location.search);
    if ((params.get("openMinigame") === "1" || window.location.pathname === "/minigame") && authenticated && enabled) {
      // URL intent is external state; mirror it once in the dialog state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(true);
      params.delete("openMinigame");
      const query = params.toString();
      window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
    }
    const onMessage = (event) => {
      if (event.origin !== window.location.origin || !event.data?.type) return;
      if (event.data.type === "GARENA_CLOSE_GAME") setOpen(false);
      if (event.data.type === "GARENA_TASK_COMPLETED") showTaskNotice(event.data.title, event.data.reward);
      if (event.data.type === "GARENA_NAVIGATE" && typeof event.data.path === "string" && event.data.path.startsWith("/")) {
        setOpen(false);
        window.location.href = event.data.path;
      }
    };
    const onTaskCompleted = (event) => {
      const title = event.detail?.title;
      const reward = event.detail?.reward;
      if (typeof title === "string" && Number.isFinite(Number(reward))) showTaskNotice(title, reward);
    };
    const onRestore = () => {
      window.localStorage.removeItem(`${DISMISSED_DATE_KEY}:${userKey}`);
      setDismissedToday(false);
      setOpen(true);
    };
    const onActivity = (event) => {
      const activity = event.detail?.activity;
      const seconds = event.detail?.seconds;
      if (typeof activity !== "string" || !Number.isFinite(Number(seconds))) return;
      iframeRef.current?.contentWindow?.postMessage({ type: "GARENA_ACTIVITY", activity, seconds }, window.location.origin);
    };
    window.addEventListener("message", onMessage);
    window.addEventListener("minigame:restore", onRestore);
    window.addEventListener("minigame:activity", onActivity);
    window.addEventListener("minigame:task-completed", onTaskCompleted);
    return () => {
      window.removeEventListener("message", onMessage);
      window.removeEventListener("minigame:restore", onRestore);
      window.removeEventListener("minigame:activity", onActivity);
      window.removeEventListener("minigame:task-completed", onTaskCompleted);
      if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
    };
  }, [authenticated, enabled, userKey]);

  function dismissForToday() {
    window.localStorage.setItem(`${DISMISSED_DATE_KEY}:${userKey}`, localDateKey());
    setDismissedToday(true);
    setTaskNotice(null);
    window.dispatchEvent(new CustomEvent("minigame:dismissed"));
  }

  function handleLauncherPointerDown(event) {
    if (event.button !== undefined && event.button !== 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    dragRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      moved: false,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handleLauncherPointerMove(event) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const next = clampLauncherPosition({
      left: event.clientX - drag.offsetX,
      top: event.clientY - drag.offsetY,
    });
    drag.position = next;
    if (Math.abs(next.left - launcherPosition.left) > 3 || Math.abs(next.top - launcherPosition.top) > 3) drag.moved = true;
    setLauncherPosition(next);
  }

  function handleLauncherPointerUp(event) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (drag.moved) {
      suppressClickRef.current = true;
      window.localStorage.setItem(`${LAUNCHER_POSITION_KEY}:${userKey}`, JSON.stringify(drag.position || launcherPosition));
    }
    dragRef.current = null;
  }

  function handleLauncherClick() {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    launch();
  }

  function launch() {
    if (!authenticated) {
      const next = `${window.location.pathname}?openMinigame=1`;
      window.location.href = `/auth/google?next=${encodeURIComponent(next)}`;
      return;
    }
    setOpen(true);
  }

  return React.createElement(React.Fragment, null,
    enabled && !dismissedToday ? React.createElement("div", {
      style: { position: "fixed", left: launcherPosition.left, top: launcherPosition.top, zIndex: 101, display: "grid", justifyItems: "end", gap: 8 },
    }, React.createElement("div", {
      role: taskNotice ? "status" : undefined,
      style: { maxWidth: 240, padding: "9px 12px", borderRadius: 14, background: "#172235", border: "1px solid rgba(245,158,11,.72)", color: "#fff", boxShadow: "0 8px 24px rgba(0,0,0,.28)", fontSize: 12, lineHeight: 1.25, fontWeight: 800, textAlign: "right", position: "relative" },
    }, taskNotice ? `✅ ${taskNotice.title} · +${taskNotice.reward} lượt chơi — Chơi tiếp ngay!` : "Săn rương nhận quà ngay!"), React.createElement("div", {
      style: { width: 150, height: 150, position: "relative" },
    }, React.createElement("button", {
      type: "button",
      onClick: dismissForToday,
      title: "Ẩn game trong hôm nay",
      "aria-label": "Ẩn game trong hôm nay",
      style: {
        position: "absolute", top: -2, right: -2, zIndex: 2,
        width: 26, height: 26, borderRadius: "50%",
        border: "1px solid rgba(255,255,255,.72)", background: "#172235", color: "#fff",
        boxShadow: "0 4px 12px rgba(0,0,0,.3)", cursor: "pointer", fontSize: 18,
        lineHeight: "22px", padding: 0,
      },
    }, "×"), React.createElement("button", {
      type: "button",
      onClick: handleLauncherClick,
      onPointerDown: handleLauncherPointerDown,
      onPointerMove: handleLauncherPointerMove,
      onPointerUp: handleLauncherPointerUp,
      onPointerCancel: handleLauncherPointerUp,
      title: "Mở Game rắn săn rương",
      "aria-label": "Săn rương nhận quà ngay!",
      style: {
        width: 150, height: 150, border: 0, borderRadius: 0,
        background: "transparent", color: "#fff",
        boxShadow: "none", padding: 0,
        cursor: "grab", display: "grid", placeItems: "center", touchAction: "none",
      },
    }, React.createElement("img", { src: "/minigame/assets/logo.svg?v=1", alt: "Game rắn săn rương", draggable: false, style: { width: 150, height: 150, objectFit: "contain", pointerEvents: "none" } })))) : null,
    open && authenticated ? React.createElement("div", {
      role: "dialog", "aria-modal": "true", "data-minigame-open": "true", onClick: () => setOpen(false),
      style: { position: "fixed", inset: 0, zIndex: 9999, background: "rgba(11,14,20,.85)", backdropFilter: "blur(8px)", display: "grid", placeItems: "center", padding: 16 },
    }, React.createElement("div", {
      onClick: (event) => event.stopPropagation(),
      style: { width: "min(500px, 95vw)", height: "min(760px, 94vh)", borderRadius: 24, overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,.5)" },
    }, React.createElement("iframe", {
      ref: iframeRef,
      title: "Game rắn săn rương", src: "/minigame/snake.html", frameBorder: "0",
      style: { width: "100%", height: "100%", border: 0, background: "#0b0e14" },
    }))) : null,
  );
}
