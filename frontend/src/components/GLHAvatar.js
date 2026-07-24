"use client";

import React from "react";

export const OUTFIT = {
    red:    { base: "#E41E26", dark: "#A8141A", light: "#F4787C" },
    indigo: { base: "#7C5CFF", dark: "#5538D6", light: "#A88BFF" },
    teal:   { base: "#2BB6A3", dark: "#1C8576", light: "#5FD9C8" },
    navy:   { base: "#3B6FB0", dark: "#284E80", light: "#6F9FD8" },
    amber:  { base: "#F5A623", dark: "#C47C0A", light: "#FFC65C" },
    pink:   { base: "#EC4899", dark: "#BE185D", light: "#F472B6" },
    emerald:{ base: "#10B981", dark: "#047857", light: "#34D399" },
    orange: { base: "#F97316", dark: "#C2410C", light: "#FB923C" },
    purple: { base: "#8B5CF6", dark: "#6D28D9", light: "#A78BFA" },
    black:  { base: "#2D3748", dark: "#1A202C", light: "#4A5568" },
  };
  export const SKIN = {
    s1: { base: "#F2C9A0", dark: "#D9A678" },
    s2: { base: "#E0A878", dark: "#C2855A" },
    s3: { base: "#B97A4E", dark: "#965C36" },
  };
  export const HAIR_COLORS = {
    espresso: { base: "#2B2330", dark: "#171219", light: "#4A3D52" },
    black:    { base: "#151318", dark: "#08070A", light: "#38333D" },
    auburn:   { base: "#7A3528", dark: "#4D211A", light: "#A9503B" },
    blonde:   { base: "#D9A441", dark: "#9C6E20", light: "#F2C969" },
    blue:     { base: "#285A86", dark: "#183A5A", light: "#4E83B0" },
    pink:     { base: "#E85D9E", dark: "#A92F68", light: "#FF91C2" },
    white:    { base: "#F1F1F4", dark: "#B9BBC5", light: "#FFFFFF" },
  };

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
          r(28, 22, 44, 18, c.base, 8) +      // base covers head top
          `<polygon points="30,40 34,16 40,38" fill="${c.base}"/>` +
          `<polygon points="40,38 46,12 52,38" fill="${c.base}"/>` +
          `<polygon points="50,38 56,14 62,38" fill="${c.base}"/>` +
          `<polygon points="60,38 66,18 70,40" fill="${c.base}"/>` +
          r(28, 28, 44, 12, c.base, 4)
        );
      case "bun":
        return (
          r(46, 12, 12, 12, c.base, 6) +     // bun
          r(28, 22, 44, 16, c.base, 8) +     // cap starts at head top y:22
          r(28, 30, 7, 22, c.base, 4) +
          r(65, 30, 7, 22, c.base, 4)
        );
      case "long":
        return (
          r(28, 22, 44, 18, c.base, 9) +
          r(28, 30, 8, 32, c.base, 4) +  // left side long hair
          r(64, 30, 8, 32, c.base, 4) +  // right side long hair
          r(28, 34, 5, 26, c.dark, 3) +  // left shading
          r(67, 34, 5, 26, c.dark, 3) +  // right shading
          r(34, 24, 32, 7, c.light, 4)   // top highlight
        );
      case "curly":
        return (
          `<circle cx="29" cy="31" r="9" fill="${c.base}"/>` +
          `<circle cx="31" cy="22" r="9" fill="${c.base}"/>` +
          `<circle cx="39" cy="17" r="9" fill="${c.base}"/>` +
          `<circle cx="49" cy="15" r="10" fill="${c.base}"/>` +
          `<circle cx="59" cy="17" r="9" fill="${c.base}"/>` +
          `<circle cx="68" cy="22" r="9" fill="${c.base}"/>` +
          `<circle cx="71" cy="31" r="9" fill="${c.base}"/>` +
          `<circle cx="27" cy="40" r="8" fill="${c.base}"/>` +
          `<circle cx="73" cy="40" r="8" fill="${c.base}"/>` +
          `<circle cx="36" cy="25" r="5" fill="${c.light}"/>` +
          `<circle cx="53" cy="21" r="5" fill="${c.light}"/>` +
          `<circle cx="64" cy="29" r="5" fill="${c.dark}"/>` +
          `<circle cx="31" cy="38" r="4" fill="${c.dark}"/>`
        );
      case "bald":
        return (
          r(32, 22, 36, 4, c.dark, 2) + // very subtle hair shade/line at top of head
          r(29, 30, 4, 8, c.dark, 2) +  // sideburns shading
          r(67, 30, 4, 8, c.dark, 2)
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
          r(34, 42, 13, 10, "rgba(255,255,255,.12)", 3).replace("/>", ` stroke="#F7FAFC" stroke-width="2.5"/>`) +
          r(53, 42, 13, 10, "rgba(255,255,255,.12)", 3).replace("/>", ` stroke="#F7FAFC" stroke-width="2.5"/>`) +
          r(47, 45, 6, 2.5, "#F7FAFC", 1)
        );
      case "headset":
        return (
          `<path d="M30 40 Q30 18 50 18 Q70 18 70 40" fill="none" stroke="#DDE7FF" stroke-width="4"/>` +
          r(26, 38, 9, 16, "#B9C8E8", 3) +
          r(65, 38, 9, 16, "#B9C8E8", 3) +
          r(28, 41, 4, 10, accent, 2) +
          r(67, 41, 4, 10, accent, 2)
        );
      case "visor":
        return (
          r(31, 40, 38, 11, accent, 4).replace("/>", ` opacity="0.55"/>`) +
          r(31, 40, 38, 11, "none", 4).replace("/>", ` stroke="${accent}" stroke-width="2"/>`)
        );
      case "earrings":
        return (
          `<circle cx="30" cy="46" r="3" fill="none" stroke="#F5A623" stroke-width="2"/>` +
          `<circle cx="70" cy="46" r="3" fill="none" stroke="#F5A623" stroke-width="2"/>`
        );
      case "cap":
        return (
          r(28, 22, 44, 16, "#DDE7F8", 8) +  // cap starts at head top y:22
          r(26, 36, 48, 7, "#B9C8E8", 3) +   // brim full-width symmetric
          r(36, 24, 28, 6, "#F7FAFC", 3)
        );
      case "backpack":
        return (
          `<path d="M35 61 Q39 55 44 58 L44 83" fill="none" stroke="${accent}" stroke-width="3"/>` +
          `<path d="M65 61 Q61 55 56 58 L56 83" fill="none" stroke="${accent}" stroke-width="3"/>`
        );
      case "pencil":
        return (
          `<g transform="rotate(-18 28 82)">` +
          r(26.5, 72, 3.5, 16, "#F5C542", 1) +
          r(26.5, 72, 3.5, 3, "#E97B76", 1) +
          `<polygon points="26.5,88 30,88 28.25,92" fill="#E8C9A0"/>` +
          `<polygon points="27.65,90.4 28.85,90.4 28.25,92" fill="#2B2330"/>` +
          `</g>`
        );
      case "controller":
        return (
          r(41, 77, 18, 11, "#DDE7F8", 4) + // main body
          r(39, 81, 6, 8, "#B9C8E8", 2) +   // left grip extension
          r(55, 81, 6, 8, "#B9C8E8", 2) +   // right grip extension
          // D-pad (gray cross)
          r(42.5, 81.5, 4, 1.5, "#A0AEC0") +
          r(43.75, 80.25, 1.5, 4, "#A0AEC0") +
          // Action buttons (red and green dots)
          `<circle cx="52.5" cy="81" r="1.2" fill="#E53E3E"/>` +
          `<circle cx="55.5" cy="83" r="1.2" fill="#38A169"/>`
        );
      case "sword":
        return (
          // Sword is held in the character's left hand (right side of screen)
          r(68.5, 78, 3, 9, "#718096", 1) +  // handle (darker metal/leather)
          r(63, 76, 14, 3, "#ECC94B", 1) +   // crossguard (gold)
          `<circle cx="70" cy="87.5" r="2" fill="#ECC94B"/>` + // pommel (gold)
          r(66.5, 30, 7, 46, "#E2E8F0", 1) + // blade (silver-white)
          r(69.5, 30, 1, 46, "#CBD5E0") +    // central groove/line (light gray shadow)
          `<polygon points="66.5,30 70,23 73.5,30" fill="#E2E8F0"/>` + // tip
          `<polygon points="69.5,30 70,23 73.5,30" fill="#CBD5E0"/>`   // tip shadow split
        );
      case "keyboard":
        return (
          r(34, 75, 32, 12, "#DDE7F8", 2) + // keyboard frame
          r(35.5, 76.5, 29, 9, "#879CC0", 1) + // plate
          // keycaps grid pattern or simple key clusters
          r(37, 78, 22, 2.2, "#EDF2F7", 0.5) + // upper row
          r(39, 81.5, 20, 2.2, "#EDF2F7", 0.5) + // lower row
          // colored accent keys
          r(37, 78, 2.5, 2.2, "#E53E3E", 0.5) + // ESC key (red)
          r(60, 81.5, 4, 2.2, "#3182CE", 0.5)    // Enter key (blue)
        );
      case "mouse":
        return (
          // Mouse is held/near the character's right hand (left side of screen)
          r(25, 77, 9, 12, "#DDE7F8", 4) + // mouse body
          r(25, 77, 4.2, 5, "#A7B8D5", 1.5) + // left button
          r(29.8, 77, 4.2, 5, "#A7B8D5", 1.5) + // right button
          r(29.2, 78.5, 0.6, 2, accent) + // glowing scroll wheel
          r(24.5, 81, 0.5, 5, accent) + // glowing side strip left
          r(34, 81, 0.5, 5, accent)    // glowing side strip right
        );
      case "laptop":
        return (
          // screen portion
          r(32, 63, 36, 15, "#DDE7F8", 2) + // screen lid frame
          r(33.5, 64.5, 33, 12, "#526987") + // display background
          // coding screen text lines or chart mockups
          r(36, 67, 10, 2, "#4FD1C5") + // teal code block/title
          r(36, 70, 18, 1.5, "#E2E8F0") + // text line 1
          r(36, 72.5, 14, 1.5, "#E2E8F0") + // text line 2
          r(58, 67, 6, 8, "#3182CE") + // a small blue bar graph/chart
          r(52, 69, 4, 6, "#DD6B20") + // a orange bar
          // base keyboard portion
          r(28, 77, 44, 9, "#B9C8E8", 1.5) + // bottom laptop body
          r(45, 82, 10, 2.5, "#F7FAFC", 0.5) // trackpad
        );
      default:
        return "";
    }
  }

  function accessoryBack(kind, accent) {
    if (kind !== "backpack") return "";
    return (
      r(23, 58, 54, 31, "#B9C8E8", 9) +
      r(26, 62, 48, 8, accent, 4) +
      r(20, 68, 8, 16, "#E5EDFA", 4) +
      r(72, 68, 8, 16, "#E5EDFA", 4)
    );
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
      { hair: "short", hairColor: "espresso", outfit: "red", accessory: "none", skin: "s1", rank: 1, classColor: null },
      opts || {}
    );
    const oc = OUTFIT[o.outfit] || OUTFIT.red;
    const sc = SKIN[o.skin] || SKIN.s1;
    const hc = HAIR_COLORS[o.hairColor] || HAIR_COLORS.espresso;
    const accent = o.classColor || oc.light;
    const accessoryAccent = "#7DD3FC";
    const rank = o.rank || 1;

    const parts = [];
    // soft ground shadow
    parts.push(`<ellipse cx="50" cy="95" rx="22" ry="4" fill="rgba(0,0,0,0.18)"/>`);
    parts.push(accessoryBack(o.accessory, accessoryAccent));
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
    parts.push(hair(o.hair, hc));
    // accessory
    parts.push(accessory(o.accessory, accessoryAccent));
    // crown for top ranks
    parts.push(crown(rank, accent));

    return `<svg width="100%" height="100%" viewBox="0 8 100 100" xmlns="http://www.w3.org/2000/svg" shape-rendering="geometricPrecision">${parts.join("")}</svg>`;
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

  export const GLHAvatar = { svg, Avatar, OUTFIT, SKIN, HAIR_COLORS };
