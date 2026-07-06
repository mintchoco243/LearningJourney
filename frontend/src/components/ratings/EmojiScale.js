"use client";

import React from "react";
import { IconTerrible, IconBad, IconNeutral, IconGood, IconExcellent } from "../icons/emotions/EmotionIcons";

export const RATING_FACES = [
  { value: 1, face: <IconTerrible size="1em" />, label: "Quá tệ", bg: "#ff5a5f" },
  { value: 2, face: <IconBad size="1em" />, label: "Không hài lòng", bg: "#ff8a4c" },
  { value: 3, face: <IconNeutral size="1em" />, label: "Bình thường", bg: "#f6c84c" },
  { value: 4, face: <IconGood size="1em" />, label: "Hài lòng", bg: "#94d66b" },
  { value: 5, face: <IconExcellent size="1em" />, label: "Tuyệt vời", bg: "#45b866" },
];

export function FaceScale({ value, onChange, faces = RATING_FACES, compact = false }) {
  return React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(5, 1fr)",
      gap: compact ? 8 : 12,
      width: "100%",
      maxWidth: compact ? 460 : 550,
      margin: "0",
      justifyItems: "stretch",
    },
  },
    faces.map((item) =>
      React.createElement("button", {
        key: item.value,
        type: "button",
        onClick: () => onChange(item.value),
        title: item.label,
        style: {
          minWidth: 0,
          border: value === item.value ? "2px solid var(--ui-heading)" : "1px solid var(--ui-box-border)",
          background: value === item.value ? "var(--ui-control-hover)" : "transparent",
          color: "var(--ui-text)",
          borderRadius: 8,
          padding: compact ? "10px 6px" : "12px 8px",
          minHeight: compact ? 52 : 64,
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 5,
        },
      },
        React.createElement("span", {
          style: {
            width: compact ? 30 : 38,
            height: compact ? 30 : 38,
            borderRadius: "50%",
            background: item.bg,
            display: "grid",
            placeItems: "center",
            color: "rgba(0,0,0,0.55)",
            fontSize: compact ? 18 : 22,
            fontWeight: 800,
          },
        }, item.face)
      )
    )
  );
}
