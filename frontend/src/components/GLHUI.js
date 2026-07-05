"use client";

import React from "react";

// Minimal Lucide-style icon paths (24x24, stroke, round caps)
  const PATHS = {
    "arrow-right": "M5 12h14M13 5l7 7-7 7",
    "arrow-left": "M19 12H5M11 19l-7-7 7-7",
    "chevron-left": "M15 18l-6-6 6-6",
    "chevron-right": "M9 18l6-6-6-6",
    "chevron-down": "M6 9l6 6 6-6",
    search: "M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3",
    x: "M18 6L6 18M6 6l12 12",
    check: "M20 6L9 17l-5-5",
    "check-circle": "M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3",
    calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z",
    clock: "M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2",
    "map-pin": "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 13a3 3 0 100-6 3 3 0 000 6z",
    users: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
    user: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z",
    sparkles: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z",
    compass: "M12 22a10 10 0 100-20 10 10 0 000 20zM16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z",
    star: "M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z",
    zap: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
    book: "M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5V5a2 2 0 012-2h12a2 2 0 012 2v14M4 19.5A2.5 2.5 0 006.5 22H20v-5",
    target: "M12 22a10 10 0 100-20 10 10 0 000 20zM12 18a6 6 0 100-12 6 6 0 000 12zM12 14a2 2 0 100-4 2 2 0 000 4z",
    building: "M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M15 9h.01M9 13h.01M15 13h.01M9 17h.01M15 17h.01",
    puzzle: "M19.439 7.85c-.049.322.059.648.289.878l.494.494c.448.448.448 1.174 0 1.622l-1.062 1.062a3.088 3.088 0 00-3.62 4.95l-.494.494a1.147 1.147 0 01-1.622 0l-.494-.494a3.088 3.088 0 00-4.95-3.62l-1.062-1.062a1.147 1.147 0 010-1.622l.494-.494a3.088 3.088 0 00-3.62-4.95",
    hammer: "M15 12l-8.5 8.5a2.12 2.12 0 01-3-3L12 9M17.64 15L22 10.64M20.91 11.7l-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 4.6a5.56 5.56 0 00-3.94-1.64H9l.92.82A6.18 6.18 0 0112 8.4v1.56l2 2h.86c.85 0 1.65.33 2.25.93l1.25 1.25",
    link: "M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71",
    gear: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z",
    spark: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z",
    filter: "M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
    trophy: "M6 9H4.5a2.5 2.5 0 010-5H6M18 9h1.5a2.5 2.5 0 000-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0012 0V2z",
    lock: "M5 11h14a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2v-7a2 2 0 012-2zM7 11V7a5 5 0 0110 0v4",
    map: "M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3zM9 3v15M15 6v15",
    grid: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
    "rotate-ccw": "M1 4v6h6M3.51 15a9 9 0 102.13-9.36L1 10",
    play: "M5 3l14 9-14 9V3z",
    sliders: "M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6",
    "sliders-horizontal": "M21 4H8M6 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M6 2v4M12 10v4M16 18v4",
    "help-circle": "M12 22a10 10 0 100-20 10 10 0 000 20zM9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01",
    sun: "M12 17a5 5 0 100-10 5 5 0 000 10zM12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42",
    moon: "M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z",
    "send": "M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z",
    "message-square": "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z",
    "edit-3": "M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z",
    "layers": "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
    "file-plus": "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM14 2v6h6M12 18v-6M9 15h6",
    "refresh-cw": "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15",
    "log-in": "M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3",
    "bar-chart-2": "M18 20V10M12 20V4M6 20v-6",
    briefcase: "M10 6V5a2 2 0 012-2h0a2 2 0 012 2v1M3 7h18v11a2 2 0 01-2 2H5a2 2 0 01-2-2V7zM3 12h18M10 12v2h4v-2",
    cpu: "M9 3H5a2 2 0 00-2 2v4m6-6h6m-6 0v18m6-18h4a2 2 0 012 2v4m-6-6v18m0 0H9m6 0h4a2 2 0 002-2v-4M3 9v6m0 0v4a2 2 0 002 2h4M3 15h18M21 9v6",
    "trending-up": "M23 6l-9.5 9.5-5-5L1 18M17 6h6v6",
    "graduation-cap": "M22 10v6M2 10l10-5 10 5-10 5-10-5z",
    presentation: "M2 3h20v14H2zM8 21l4-4 4 4M12 17v-4",
    "building-2": "M6 22V4a2 2 0 012-2h8a2 2 0 012 2v18zM6 12H4a2 2 0 00-2 2v6h4M18 9h2a2 2 0 012 2v9h-4M10 6h4M10 10h4M10 14h4M10 18h4",
    "book-open": "M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z",
    "user-check": "M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM17 11l2 2 4-4",
    "layout-dashboard": "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10",
    "home": "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10",
    "message-circle": "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z",
    "party-popper": "M5.8 11.3L2 22l10.7-3.79M4 3h.01M22 8h.01M15 2l-1.5 3L11 6l3 1.5L15 11l1.5-3L20 6.5l-3-1-2-3.5zM20 17l-1 2-2-1 1-2 2 1zM9 8l-1 2-2-1 1-2 2 1z",
    info: "M12 22a10 10 0 100-20 10 10 0 000 20zM12 8h.01M11 12h1v4h1",
    "circle-help": "M12 22a10 10 0 100-20 10 10 0 000 20zM9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01",
  };

  export function Icon(props) {
    const { name, size = 20, color = "currentColor", stroke = 1.75, style = {}, fill = "none" } = props;
    const d = PATHS[name];
    if (!d) return null;
    return React.createElement("svg", {
      width: size, height: size, viewBox: "0 0 24 24", fill: fill,
      stroke: color, strokeWidth: stroke, strokeLinecap: "round", strokeLinejoin: "round",
      style: Object.assign({ flex: "none", display: "block" }, style),
      dangerouslySetInnerHTML: { __html: `<path d="${d}"/>` },
    });
  }

  export const MONTHS_VI = ["Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6","Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"];
  export const DOW_VI = ["T2","T3","T4","T5","T6","T7","CN"];
  function fmtDate(iso) {
    const d = new Date(iso);
    return `${d.getDate()} ${MONTHS_VI[d.getMonth()]}, ${d.getFullYear()}`;
  }
  function fmtDuration(min) {
    if (min < 60) return `${min} phút`;
    const h = Math.floor(min / 60), m = min % 60;
    return m ? `${h}g ${m}p` : `${h} giờ`;
  }
  export const FORMAT_LABEL = { online: "Online", offline: "Offline", elearning: "E-learning", webinar: "Webinar", workshop: "Workshop", bootcamp: "Bootcamp", talk: "Talk" };

  // simple deterministic starfield as inline SVG circles
  function Starfield() {
    const stars = React.useMemo(() => {
      const arr = []; let seed = 7;
      const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
      for (let i = 0; i < 60; i++) arr.push({ x: rnd() * 100, y: rnd() * 100, r: rnd() * 0.9 + 0.25, o: rnd() * 0.5 + 0.12 });
      return arr;
    }, []);
    return React.createElement("svg", { className: "glh-stars", viewBox: "0 0 100 100", preserveAspectRatio: "xMidYMid slice" },
      stars.map((s, i) => React.createElement("circle", { key: i, cx: s.x, cy: s.y, r: s.r, fill: "#fff", opacity: s.o })));
  }

  export const GLHUI = { Icon, Starfield, fmtDate, fmtDuration, MONTHS_VI, DOW_VI, FORMAT_LABEL };
