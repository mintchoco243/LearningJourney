"use client";

import React from "react";
import { GLHUI } from '../GLHUI';
import { GLHEngine } from '@/context/GameContext';
import { GLH_DATA } from '@/data/glhData';

const D = GLH_DATA;
const { Icon } = GLHUI;
const { useGame } = GLHEngine;


  

  export function Store() {
    const { user } = useGame();
    const xp = user.xp || 0;

    return React.createElement("div", { className: "glh-container fade-screen", style: { padding: "28px clamp(16px,4vw,40px) 80px" } },

      /* header */
      React.createElement("div", { style: { marginBottom: 32 } },
        React.createElement("div", { className: "u-eyebrow" }, "Phần thưởng"),
        React.createElement("h1", { className: "u-h2", style: { fontSize: "clamp(26px,4vw,38px)", marginBottom: 8 } }, "Kho Đổi Quà"),
        React.createElement("p", { style: { fontSize: 14, color: "var(--rpg-muted)", margin: 0 } },
          "Dùng XP tích lũy từ học tập để đổi quà và đặc quyền.")
      ),

      /* XP balance */
      React.createElement("div", {
        style: {
          display: "flex", alignItems: "center", gap: 16,
          padding: "20px 24px", marginBottom: 28,
          background: "linear-gradient(135deg, rgba(228,30,38,0.1) 0%, rgba(255,186,0,0.07) 100%)",
          border: "1px solid var(--rpg-border)", borderRadius: 10,
        }
      },
        React.createElement("div", {
          style: {
            width: 48, height: 48, borderRadius: 10,
            background: "rgba(255,186,0,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }
        }, React.createElement(Icon, { name: "zap", size: 24, color: "var(--amber)" })),
        React.createElement("div", null,
          React.createElement("div", { style: { fontSize: 12, color: "var(--rpg-muted)", fontWeight: 600, marginBottom: 2 } }, "XP hiện tại của bạn"),
          React.createElement("div", {
            style: { fontSize: 28, fontWeight: 700, color: "var(--amber)", fontFamily: "var(--glh-display)", lineHeight: 1 }
          }, xp + " XP")
        )
      ),

      /* coming soon */
      React.createElement("div", {
        style: {
          display: "flex", alignItems: "flex-start", gap: 14,
          padding: "20px 24px",
          background: "rgba(124,92,255,0.08)",
          border: "1px solid rgba(124,92,255,0.3)",
          borderRadius: 8,
        }
      },
        React.createElement("div", {
          style: {
            width: 40, height: 40, borderRadius: 8, flexShrink: 0,
            background: "rgba(124,92,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }
        }, React.createElement(Icon, { name: "lock", size: 18, color: "#A38BFF" })),
        React.createElement("div", null,
          React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 6 } }, "Tính năng đang được phát triển"),
          React.createElement("div", { style: { fontSize: 13, color: "var(--rpg-muted)", lineHeight: 1.6 } },
            "Danh mục quà tặng và cơ chế đổi thưởng đang được L&D team xây dựng. ",
            "Tiếp tục tích lũy XP — khi ra mắt bạn có thể dùng ngay số XP đã có."
          )
        )
      )
    );
  }

  