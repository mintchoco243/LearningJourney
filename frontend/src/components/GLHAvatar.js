"use client";

import React from "react";

export const OUTFIT = {
    red:    { base: "#E41E26", dark: "#A8141A", light: "#F4787C" },
    indigo: { base: "#7C5CFF", dark: "#5538D6", light: "#A88BFF" },
    teal:   { base: "#2BB6A3", dark: "#1C8576", light: "#5FD9C8" },
    navy:   { base: "#3B6FB0", dark: "#284E80", light: "#6F9FD8" },
    amber:  { base: "#F5A623", dark: "#C47C0A", light: "#FFC65C" },
  };
  export const SKIN = {
    s1: { base: "#F2C9A0", dark: "#D9A678" },
    s2: { base: "#E0A878", dark: "#C2855A" },
    s3: { base: "#B97A4E", dark: "#965C36" },
  };
  const HAIR_COLOR = { base: "#2B2330", dark: "#171219", light: "#4A3D52" };

  function r(x, y, w, h, fill, rad) {
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rad || 0}" fill="${fill}"/>`;
  }

  // hair drawn ON TOP of a head occupying x 30–70, y 20–58
  function hair(style, c) {
    switch (style) {
      case "ponytail":
        return (
          r(28, 22, 44, 16, c.base, 8) +
          r(28, 30, 8, 26, c.base, 4) +      // left side
          r(64, 30, 8, 22, c.base, 4) +      // right side
          r(70, 30, 12, 30, c.base, 6) +     // ponytail
          r(72, 34, 8, 22, c.dark, 4)
        );
      case "spiky":
        return (
          `<polygon points="30,40 34,16 40,38" fill="${c.base}"/>` +
          `<polygon points="40,38 46,12 52,38" fill="${c.base}"/>` +
          `<polygon points="50,38 56,14 62,38" fill="${c.base}"/>` +
          `<polygon points="60,38 66,18 70,40" fill="${c.base}"/>` +
          r(30, 30, 40, 10, c.base, 4)
        );
      case "bun":
        return (
          r(46, 12, 12, 12, c.base, 6) +     // bun
          r(28, 24, 44, 14, c.base, 8) +
          r(28, 30, 7, 22, c.base, 4) +
          r(65, 30, 7, 22, c.base, 4)
        );
      case "cap":
        return (
          r(28, 24, 44, 14, "#222831", 8) +
          r(26, 34, 30, 7, "#222831", 3) +   // brim
          r(36, 26, 28, 6, "#3A4250", 3)
        );
      case "short":
      default:
        return (
          r(28, 22, 44, 18, c.base, 9) +
          r(28, 30, 7, 16, c.base, 4) +
          r(65, 30, 7, 16, c.base, 4) +
          r(34, 24, 32, 7, c.light, 4)
        );
    }
  }

  function accessory(kind, accent) {
    switch (kind) {
      case "glasses":
        return (
          r(34, 42, 13, 10, "none", 3).replace("/>", ` stroke="#1c1c1c" stroke-width="2.5"/>`) +
          r(53, 42, 13, 10, "none", 3).replace("/>", ` stroke="#1c1c1c" stroke-width="2.5"/>`) +
          r(47, 45, 6, 2.5, "#1c1c1c", 1)
        );
      case "headset":
        return (
          `<path d="M30 40 Q30 18 50 18 Q70 18 70 40" fill="none" stroke="#1c1c1c" stroke-width="4"/>` +
          r(26, 38, 9, 16, "#1c1c1c", 3) +
          r(65, 38, 9, 16, "#1c1c1c", 3) +
          r(28, 41, 4, 10, accent, 2) +
          r(67, 41, 4, 10, accent, 2)
        );
      case "visor":
        return (
          r(31, 40, 38, 11, accent, 4).replace("/>", ` opacity="0.55"/>`) +
          r(31, 40, 38, 11, "none", 4).replace("/>", ` stroke="${accent}" stroke-width="2"/>`)
        );
      default:
        return "";
    }
  }

  // rank-based gear layered over the body (x 30–70, torso y 56–94)
  function gear(rank, o) {
    let g = "";
    if (rank >= 2) g += r(46, 66, 8, 8, o.light, 2); // chest emblem
    if (rank >= 3) { // shoulder pads
      g += r(26, 58, 12, 9, o.dark, 3);
      g += r(62, 58, 12, 9, o.dark, 3);
    }
    if (rank >= 5) { // cape behind
      g = `<path d="M30 60 L22 96 L40 92 Z" fill="${o.dark}"/>` +
          `<path d="M70 60 L78 96 L60 92 Z" fill="${o.dark}"/>` + g;
    }
    return g;
  }

  // small floating crown/aura mark for top ranks (drawn above head)
  function crown(rank, accent) {
    if (rank >= 4) {
      return `<polygon points="42,14 46,8 50,13 54,8 58,14" fill="${accent}"/>` +
             r(42, 13, 16, 3, accent, 1);
    }
    return "";
  }

  export function svg(opts) {
    const o = Object.assign(
      { hair: "short", outfit: "red", accessory: "none", skin: "s1", rank: 1, classColor: null },
      opts || {}
    );
    const oc = OUTFIT[o.outfit] || OUTFIT.red;
    const sc = SKIN[o.skin] || SKIN.s1;
    const accent = o.classColor || oc.light;
    const rank = o.rank || 1;

    const parts = [];
    // soft ground shadow
    parts.push(`<ellipse cx="50" cy="95" rx="22" ry="4" fill="rgba(0,0,0,0.18)"/>`);
    // cape (rank 5) sits behind body, handled in gear with prepend
    // body / torso
    parts.push(r(32, 56, 36, 38, oc.base, 8));
    parts.push(r(32, 56, 36, 10, oc.light, 8)); // collar highlight
    parts.push(r(32, 84, 36, 10, oc.dark, 6));  // belt/lower
    // arms
    parts.push(r(26, 60, 9, 26, oc.dark, 4));
    parts.push(r(65, 60, 9, 26, oc.dark, 4));
    parts.push(r(27, 82, 7, 7, sc.base, 3));    // hands
    parts.push(r(66, 82, 7, 7, sc.base, 3));
    // gear
    parts.push(gear(rank, oc));
    // neck
    parts.push(r(44, 52, 12, 8, sc.dark, 3));
    // head
    parts.push(r(32, 22, 36, 34, sc.base, 12));
    parts.push(r(32, 22, 36, 8, sc.dark, 12).replace(/rx="12"/, 'rx="10"') ); // subtle top shade -> overwritten by hair anyway
    // face — eyes + cheeks + mouth
    parts.push(r(40, 44, 5, 6, "#2b2330", 2));
    parts.push(r(55, 44, 5, 6, "#2b2330", 2));
    parts.push(r(41, 45, 2, 2, "#fff", 1));
    parts.push(r(56, 45, 2, 2, "#fff", 1));
    parts.push(`<rect x="46" y="51" width="8" height="2.5" rx="1.2" fill="${sc.dark}"/>`);
    parts.push(`<ellipse cx="38" cy="50" rx="3" ry="2" fill="${oc.light}" opacity="0.45"/>`);
    parts.push(`<ellipse cx="62" cy="50" rx="3" ry="2" fill="${oc.light}" opacity="0.45"/>`);
    // hair on top
    parts.push(hair(o.hair, HAIR_COLOR));
    // accessory
    parts.push(accessory(o.accessory, accent));
    // crown for top ranks
    parts.push(crown(rank, accent));

    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" shape-rendering="geometricPrecision">${parts.join("")}</svg>`;
  }

  export function Avatar(props) {
    const { opts, size = 96, crisp = false, className = "", style = {} } = props;
    const markup = svg(opts);
    return React.createElement("div", {
      className: "glh-avatar " + (crisp ? "is-crisp " : "") + className,
      style: Object.assign(
        { width: size, height: size, imageRendering: crisp ? "pixelated" : "auto", lineHeight: 0 },
        style
      ),
      dangerouslySetInnerHTML: { __html: markup },
    });
  }

  export const GLHAvatar = { svg, Avatar, OUTFIT, SKIN };