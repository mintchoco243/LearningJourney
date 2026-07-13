"use client";

import React from "react";
import { GLHUI } from '../GLHUI';
import { GLHEngine } from '@/context/GameContext';
import { GLHAvatar } from '../GLHAvatar';
import { GLH_DATA } from '@/data/glhData';
import { trackEvent } from '@/lib/analytics';

const D = GLH_DATA;
const { Icon, Starfield } = GLHUI;
const { useGame } = GLHEngine;
const { Avatar } = GLHAvatar;


  
  
  

  /* ---------------- Onboarding ---------------- */
  export function Onboarding(props) {
    const { user, actions } = useGame();
    const returning = !!user.quiz_result;
    return React.createElement("div", { className: "glh-screen glh-dark glh-center glh-pad fade-screen" },
      React.createElement(Starfield),
      React.createElement("div", { className: "ob-wrap" },
        React.createElement("img", { className: "ob-logo", src: ((typeof window !== "undefined" && window.__resources) && (typeof window !== "undefined" && window.__resources).logo) || "assets/logo_horizontal.png", alt: "Garena" }),
        React.createElement("div", { className: "ob-eyebrow" }, "Learning Compass"),
        React.createElement("div", { className: "ob-hero-avatar" },
          React.createElement(Avatar, { opts: user.character, size: 160, crisp: props.crisp })),
        React.createElement("h1", { className: "ob-title" },
          "Hành trình học tập của bạn ", React.createElement("span", { className: "accent" }, "bắt đầu từ đây")),
        React.createElement("p", { className: "ob-sub" },
          "Tạo nhân vật của riêng bạn, bắt đầu với la bàn nội dung đào tạo và tích lũy những kỹ năng, kiến thức giúp bạn chiến đấu mạnh mẽ hơn!"),
        React.createElement("button", {
          className: "glh-btn glh-btn--primary glh-btn--lg",
          onClick: () => { trackEvent("onboarding_start", { returning }); props.onStart(returning); },
        },
          returning ? "Tiếp tục hành trình" : "Bắt đầu hành trình",
          React.createElement(Icon, { name: "arrow-right", size: 20, color: "#fff" })),
        returning
          ? React.createElement("div", { className: "ob-returning" }, "Chào mừng trở lại!")
          : null
      )
    );
  }

  /* ---------------- Character Creation ---------------- */
  function OptionRow(props) {
    return React.createElement("div", { className: "cc-group" },
      React.createElement("div", { className: "cc-group__label" }, props.label),
      React.createElement("div", { className: "cc-opts" }, props.children));
  }

  export function CharacterCreation(props) {
    const { user, actions } = useGame();
    const [c, setC] = React.useState(user.character || { hair: "short", outfit: "red", accessory: "none", skin: "s1" });
    const set = (k, v) => setC((p) => Object.assign({}, p, { [k]: v }));

    const randomize = () => {
      const pick = (arr) => arr[Math.floor(Math.random() * arr.length)].id;
      setC({
        hair: pick(D.CHAR_OPTIONS.hair),
        outfit: pick(D.CHAR_OPTIONS.outfit),
        accessory: pick(D.CHAR_OPTIONS.accessory),
        skin: pick(D.CHAR_OPTIONS.skin),
      });
    };
    const cont = () => {
      trackEvent("character_creation_complete", { hair: c.hair, outfit: c.outfit, skin: c.skin });
      actions.setCharacter(c);
      props.onNext();
    };

    return React.createElement("div", { className: "glh-screen glh-dark glh-center glh-pad fade-screen", style: { position: "relative" } },
      React.createElement(Starfield),
      React.createElement("button", { className: "glh-back", onClick: props.onBack },
        React.createElement(Icon, { name: "arrow-left", size: 16 }), "Quay lại"),
      React.createElement("div", { style: { position: "relative", zIndex: 1, width: "100%", maxWidth: 1040 } },
        React.createElement("div", { style: { textAlign: "center", marginBottom: 28 } },
          React.createElement("div", { className: "qz-group glh-display", style: { justifyContent: "center" } }, "Bước 1 · Tạo nhân vật"),
        React.createElement("h2", { className: "glh-display", style: { fontSize: "clamp(28px,5vw,44px)", color: "#fff", margin: 0 } }, "Đây là bạn trong Learning Compass")),
        React.createElement("div", { className: "cc-grid" },
          React.createElement("div", { className: "cc-stage" },
            React.createElement(Avatar, { opts: c, size: 220, crisp: props.crisp })),
          React.createElement("div", { className: "cc-controls" },
            React.createElement(OptionRow, { label: "Kiểu tóc" },
              D.CHAR_OPTIONS.hair.map((o) => React.createElement("button", {
                key: o.id, className: "cc-chip" + (c.hair === o.id ? " is-active" : ""), onClick: () => set("hair", o.id),
              }, o.name))),
            React.createElement(OptionRow, { label: "Tông da" },
              D.CHAR_OPTIONS.skin.map((o) => React.createElement("button", {
                key: o.id, className: "cc-swatch" + (c.skin === o.id ? " is-active" : ""),
                style: { background: o.color }, onClick: () => set("skin", o.id), "aria-label": o.name,
              }))),
            React.createElement(OptionRow, { label: "Màu trang phục" },
              D.CHAR_OPTIONS.outfit.map((o) => React.createElement("button", {
                key: o.id, className: "cc-swatch" + (c.outfit === o.id ? " is-active" : ""),
                style: { background: o.color }, onClick: () => set("outfit", o.id), "aria-label": o.name,
              }))),
            React.createElement(OptionRow, { label: "Phụ kiện" },
              D.CHAR_OPTIONS.accessory.map((o) => React.createElement("button", {
                key: o.id, className: "cc-chip" + (c.accessory === o.id ? " is-active" : ""), onClick: () => set("accessory", o.id),
              }, o.name))),
            React.createElement("div", { style: { display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" } },
              React.createElement("button", { className: "glh-btn glh-btn--ghost", onClick: randomize },
                React.createElement(Icon, { name: "rotate-ccw", size: 16 }), "Ngẫu nhiên"),
              React.createElement("button", { className: "glh-btn glh-btn--primary", style: { flex: 1 }, onClick: cont },
                "Tiếp tục", React.createElement(Icon, { name: "arrow-right", size: 18, color: "#fff" })))
          )
        )
      )
    );
  }

  
