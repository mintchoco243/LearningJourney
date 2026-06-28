"use client";

import React from "react";
import { GLHUI } from '../GLHUI';
import { GLHEngine } from '@/context/GameContext';
import { GLH_DATA } from '@/data/glhData';

const D = GLH_DATA;
const { Icon, Starfield } = GLHUI;
const { useGame } = GLHEngine;



  export function Login(props) {
    const [error, setError] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const [devEmail, setDevEmail] = React.useState("");
    const [showDev, setShowDev] = React.useState(false);

    const handleGoogleLogin = () => {
      setError("");
      setLoading(true);
      window.location.href = "/auth/google";
    };

    const handleDevLogin = async () => {
      if (!devEmail.trim()) return;
      setLoading(true);
      try {
        const res = await fetch("/auth/dev-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email: devEmail.trim() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Login failed");
        props.onLogin(data.user.email);
      } catch (e) {
        setError(e.message);
        setLoading(false);
      }
    };

    return React.createElement("div", { className: "glh-screen glh-dark glh-center glh-pad fade-screen" },
      React.createElement(Starfield),
      React.createElement("div", { className: "ob-wrap", style: { maxWidth: 380 } },
        React.createElement("img", { className: "ob-logo", src: ((typeof window !== "undefined" && window.__resources) && (typeof window !== "undefined" && window.__resources).logo) || "assets/logo_horizontal.png", alt: "Garena", style: { marginBottom: 12 } }),
        React.createElement("div", { className: "ob-eyebrow", style: { marginBottom: 24 } }, "Learning Hub"),

        React.createElement("h1", { className: "ob-title", style: { marginBottom: 8, fontSize: "clamp(28px, 5vw, 40px)", whiteSpace: "nowrap" } },
          "Chào mừng bạn"),
        React.createElement("p", { className: "ob-sub", style: { marginBottom: 32, fontSize: 14 } },
          "Đăng nhập để bắt đầu hành trình học tập của bạn và mở dần bản đồ kỹ năng."),

        React.createElement("div", { style: { marginBottom: 20 } },
          React.createElement("button", {
            className: "glh-btn glh-btn--primary glh-btn--lg",
            onClick: handleGoogleLogin,
            disabled: loading,
            style: { width: "100%", opacity: loading ? 0.7 : 1 },
          },
            React.createElement(Icon, { name: "log-in", size: 18, color: "#fff" }),
            loading ? "Đang chuyển hướng..." : "Đăng nhập bằng Google"
          )
        ),

        showDev ? React.createElement("div", { style: { marginTop: 12 } },
          React.createElement("input", {
            type: "email",
            placeholder: "email@garena.vn",
            value: devEmail,
            onChange: (e) => setDevEmail(e.target.value),
            onKeyDown: (e) => e.key === "Enter" && handleDevLogin(),
            style: { width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--rpg-border)", background: "var(--rpg-panel)", color: "var(--rpg-text)", fontSize: 13, marginBottom: 8, boxSizing: "border-box" },
          }),
          React.createElement("button", {
            className: "glh-btn glh-btn--lg",
            onClick: handleDevLogin,
            disabled: loading,
            style: { width: "100%", opacity: loading ? 0.7 : 1 },
          }, "Dev Login")
        ) : React.createElement("div", { style: { textAlign: "center", marginTop: 8 } },
          React.createElement("button", {
            onClick: () => setShowDev(true),
            style: { background: "none", border: "none", color: "var(--rpg-muted)", fontSize: 11, cursor: "pointer", opacity: 0.4 },
          }, "dev")
        ),

        error ? React.createElement("div", { style: { color: "var(--glh-accent)", fontSize: 13, marginTop: 8, marginBottom: 0, textAlign: "center" } },
          "⚠ " + error) : null
      )
    );
  }

  