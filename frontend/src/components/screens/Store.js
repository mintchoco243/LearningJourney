"use client";

import React from "react";
import { GLHUI } from '../GLHUI';
import { GLHEngine } from '@/context/GameContext';
import { GLH_DATA } from '@/data/glhData';

const D = GLH_DATA;
const { Icon } = GLHUI;
const { useGame } = GLHEngine;


  

  export function Store() {
    useGame();

    return React.createElement("div", { className: "glh-container fade-screen", style: { padding: "28px clamp(16px,4vw,40px) 80px" } },

      /* header */
      React.createElement("div", { style: { marginBottom: 32 } },
        React.createElement("div", { className: "u-eyebrow" }, "Phần thưởng"),
        React.createElement("h1", { className: "u-h2", style: { fontSize: "clamp(26px,4vw,38px)", marginBottom: 8 } }, "Kho Đổi Quà"),
        React.createElement("p", { style: { fontSize: 14, color: "var(--ui-muted)", margin: 0 } },
          "Tính năng đổi quà sẽ được mở ở phase sau.")
      ),

      /* coming soon */
      React.createElement("div", {
        style: {
          display: "flex", alignItems: "flex-start", gap: 14,
          padding: "20px 24px",
          background: "var(--ui-box)",
          border: "1px solid var(--ui-box-border)",
          borderRadius: 8,
        }
      },
        React.createElement("div", {
          style: {
            width: 40, height: 40, borderRadius: 8, flexShrink: 0,
            background: "var(--glh-accent-soft)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }
        }, React.createElement(Icon, { name: "lock", size: 18, color: "var(--glh-accent)" })),
        React.createElement("div", null,
          React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: "var(--ui-box-heading)", marginBottom: 6 } }, "Tính năng đang được phát triển"),
          React.createElement("div", { style: { fontSize: 13, color: "var(--ui-box-muted)", lineHeight: 1.6 } },
            "Danh mục quà tặng và cơ chế đổi thưởng đang được L&D team xây dựng."
          )
        )
      )
    );
  }

  
