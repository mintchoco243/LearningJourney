"use client";

import React from "react";

export function MinigameLauncher({ authenticated }) {
  const [open, setOpen] = React.useState(false);
  const [enabled, setEnabled] = React.useState(false);
  const iframeRef = React.useRef(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return undefined;
    fetch("/api/minigame/status").then((response) => response.ok ? response.json() : null).then((data) => setEnabled(Boolean(data?.enabled))).catch(() => setEnabled(false));
    const params = new URLSearchParams(window.location.search);
    if ((params.get("openMinigame") === "1" || window.location.pathname === "/minigame") && authenticated && enabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(true);
      params.delete("openMinigame");
      const query = params.toString();
      window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
    }
    const onMessage = (event) => {
      if (event.origin !== window.location.origin || !event.data?.type) return;
      if (event.data.type === "GARENA_CLOSE_GAME") setOpen(false);
      if (event.data.type === "GARENA_NAVIGATE" && typeof event.data.path === "string" && event.data.path.startsWith("/")) {
        setOpen(false);
        window.location.href = event.data.path;
      }
    };
    const onActivity = (event) => {
      const activity = event.detail?.activity;
      const seconds = event.detail?.seconds;
      if (typeof activity !== "string" || !Number.isFinite(Number(seconds))) return;
      iframeRef.current?.contentWindow?.postMessage({ type: "GARENA_ACTIVITY", activity, seconds }, window.location.origin);
    };
    window.addEventListener("message", onMessage);
    window.addEventListener("minigame:activity", onActivity);
    return () => {
      window.removeEventListener("message", onMessage);
      window.removeEventListener("minigame:activity", onActivity);
    };
  }, [authenticated, enabled]);

  function launch() {
    if (!authenticated) {
      const next = `${window.location.pathname}?openMinigame=1`;
      window.location.href = `/auth/google?next=${encodeURIComponent(next)}`;
      return;
    }
    setOpen(true);
  }

  return React.createElement(React.Fragment, null,
    enabled ? React.createElement("button", {
      type: "button",
      onClick: launch,
      title: "Mở Mini Game Skill Snake",
      style: {
        position: "fixed", right: 28, bottom: 122, zIndex: 99,
        border: "1px solid rgba(255,190,70,.55)", borderRadius: 999,
        background: "linear-gradient(135deg, #e41e26, #ff8a00)", color: "#fff",
        boxShadow: "0 8px 24px rgba(228,30,38,.32)", padding: "11px 16px",
        fontWeight: 800, fontSize: 12, cursor: "pointer", letterSpacing: ".02em",
      },
    }, "🎮 Chơi Mini Game") : null,
    open && authenticated ? React.createElement("div", {
      role: "dialog", "aria-modal": "true", onClick: () => setOpen(false),
      style: { position: "fixed", inset: 0, zIndex: 9999, background: "rgba(11,14,20,.85)", backdropFilter: "blur(8px)", display: "grid", placeItems: "center", padding: 16 },
    }, React.createElement("div", {
      onClick: (event) => event.stopPropagation(),
      style: { width: "min(500px, 95vw)", height: "min(760px, 94vh)", borderRadius: 24, overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,.5)" },
    }, React.createElement("iframe", {
      ref: iframeRef,
      title: "Garena Skill Snake", src: "/minigame/snake.html", frameBorder: "0",
      style: { width: "100%", height: "100%", border: 0, background: "#0b0e14" },
    }))) : null,
  );
}
