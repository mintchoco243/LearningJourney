"use client";

import React from "react";
import { GLHUI } from '../GLHUI';
import { GLHEngine } from '@/context/GameContext';
import { SKILL_OPTIONS, getSkillVisual } from '@/lib/skillCatalog';

const { Icon, Starfield } = GLHUI;
const { useGame } = GLHEngine;


  
  

  // Step 4: Learning Style (multi-select tiles, multi-select)
  export function Step4LearningStyle(props) {
    const [selected, setSelected] = React.useState(props.value || []);
    
    const options = [
      { id: "video", icon: "🎬", label: "Video tự học", desc: "Xem và thực hành theo tốc độ của bạn" },
      { id: "workshop", icon: "🙋", label: "Workshop", desc: "Học nhóm có tương tác trực tiếp" },
      { id: "coaching", icon: "🎯", label: "Coaching 1-1", desc: "Được hướng dẫn cá nhân hóa" },
      { id: "reading", icon: "📖", label: "Reading / Tài liệu", desc: "Đọc sâu theo tài liệu & case study" },
    ];

    const toggle = (id) => {
      const next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
      setSelected(next);
      props.onChange(next);
    };

    return React.createElement("div", { className: "qz-step" },
      React.createElement("div", { className: "qz-group" },
        React.createElement(Icon, { name: "book-open", size: 16, color: "var(--amber)" }),
        "LEARNING STYLE"
      ),
      React.createElement("h2", { className: "qz-q" }, "Bạn thích học theo hình thức nào?"),
      React.createElement("p", { style: { fontSize: 13, color: "var(--rpg-muted)", marginBottom: 20, marginTop: -8 } }, "Có thể chọn nhiều hình thức"),
      React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 } },
        options.map((opt) =>
          React.createElement("button", {
            key: opt.id,
            onClick: () => toggle(opt.id),
            style: {
              padding: "20px 16px",
              border: "2px solid",
              borderColor: selected.includes(opt.id) ? "var(--glh-accent)" : "var(--rpg-border)",
              borderRadius: 8,
              background: selected.includes(opt.id) ? "rgba(228,30,38,0.12)" : "rgba(255,255,255,0.04)",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 200ms",
              position: "relative",
            },
          },
            selected.includes(opt.id) ? React.createElement("div", {
              style: {
                position: "absolute", top: 10, right: 10,
                width: 18, height: 18, borderRadius: "50%",
                background: "var(--glh-accent)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, color: "#fff", fontWeight: 700,
              }
            }, "✓") : null,
            React.createElement("div", { style: { fontSize: 24, marginBottom: 10 } }, opt.icon),
            React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 6 } }, opt.label),
            React.createElement("div", { style: { fontSize: 12, color: "var(--rpg-muted)", lineHeight: 1.4 } }, opt.desc)
          )
        )
      )
    );
  }

  // Step 5: Availability (single-select tiles)
  export function Step5Availability(props) {
    const { onChange, value } = props;
    const [selected, setSelected] = React.useState(value || "");
    
    const options = [
      { id: "under1", icon: "⚡", label: "Dưới 1 giờ", desc: "Học nhanh, tập trung" },
      { id: "1to2", icon: "📚", label: "1–2 giờ", desc: "Vừa phải, đều đặn" },
      { id: "3plus", icon: "🔥", label: "3 giờ trở lên", desc: "Học sâu, nghiêm túc" },
    ];

    React.useEffect(() => {
      onChange(selected);
    }, [onChange, selected]);

    return React.createElement("div", { className: "qz-step" },
      React.createElement("div", { className: "qz-group" },
        React.createElement(Icon, { name: "clock", size: 16, color: "var(--amber)" }),
        "AVAILABILITY"
      ),
      React.createElement("h2", { className: "qz-q" }, "Mỗi tuần bạn có thể dành bao nhiêu thời gian cho việc học?"),
      React.createElement("div", { className: "qz-tiles", style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 } },
        options.map((opt) =>
          React.createElement("button", {
            key: opt.id,
            className: "u-tile" + (selected === opt.id ? " is-active" : ""),
            onClick: () => setSelected(opt.id),
            style: {
              padding: 16,
              border: "1px solid",
              borderColor: selected === opt.id ? "var(--glh-accent)" : "var(--rpg-border)",
              borderRadius: 8,
              background: selected === opt.id ? "rgba(255,158,0,0.12)" : "transparent",
              cursor: "pointer",
              transition: "all 200ms",
            },
          },
            React.createElement("div", { style: { fontSize: 28, marginBottom: 8 } }, opt.icon),
            React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 } }, opt.label),
            React.createElement("div", { style: { fontSize: 12, color: "var(--rpg-muted)" } }, opt.desc)
          )
        )
      )
    );
  }

  // Step 6: Trainer Preference (tag input)
  export function Step6TrainerPreference(props) {
    const [input, setInput] = React.useState("");
    const [tags, setTags] = React.useState(props.value || []);

    const addTag = () => {
      const trimmed = input.trim();
      if (trimmed && tags.length < 3 && !tags.includes(trimmed)) {
        const newTags = [...tags, trimmed];
        setTags(newTags);
        setInput("");
        props.onChange(newTags);
      }
    };

    const removeTag = (idx) => {
      const newTags = tags.filter((_, i) => i !== idx);
      setTags(newTags);
      props.onChange(newTags);
    };

    const handleKeyPress = (e) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        addTag();
      }
    };

    return React.createElement("div", { className: "qz-step" },
      React.createElement("div", { className: "qz-group" },
        React.createElement(Icon, { name: "users", size: 16, color: "var(--amber)" }),
        "TRAINER PREFERENCE"
      ),
      React.createElement("h2", { className: "qz-q" }, "Bạn có đặc biệt yêu thích trainer nào không?"),
      React.createElement("p", { style: { fontSize: 13, color: "var(--rpg-muted)", marginBottom: 16, marginTop: -8 } }, "Gợi ý cả trainer nội bộ và bên ngoài nhé · Bước này là tùy chọn"),
      React.createElement("div", { style: { marginBottom: 12 } },
        React.createElement("input", {
          type: "text",
          className: "u-input",
          placeholder: "VD: Nguyễn Văn A, Trainer B...",
          value: input,
          onChange: (e) => setInput(e.target.value),
          onKeyPress: handleKeyPress,
        })
      ),
      tags.length > 0 ? React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 } },
        tags.map((tag, idx) =>
          React.createElement("span", {
            key: idx,
            className: "u-pill",
            style: {
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 12px",
              background: "rgba(255,158,0,0.2)",
              border: "1px solid var(--amber)",
              borderRadius: 999,
              color: "#fff",
              fontSize: 11,
            },
          },
            tag,
            React.createElement("button", {
              onClick: () => removeTag(idx),
              style: { background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 0, fontSize: 16 },
            }, "✕")
          )
        )
      ) : null,
      React.createElement("div", { style: { fontSize: 12, color: "var(--rpg-muted)" } },
        tags.length + " / 3 trainer")
    );
  }

  // Step 7: Focus skills (maximum three selections, persisted to users.focus_skills)
  export function Step7FocusSkills(props) {
    const selected = props.value || [];
    const toggle = (id) => {
      if (selected.includes(id)) {
        props.onChange(selected.filter((item) => item !== id));
        return;
      }
      if (selected.length >= 3) return;
      props.onChange([...selected, id]);
    };

    return React.createElement("div", { className: "qz-step" },
      React.createElement("div", { className: "qz-group" },
        React.createElement(Icon, { name: "target", size: 16, color: "var(--amber)" }),
        "FOCUS SKILLS"
      ),
      React.createElement("h2", { className: "qz-q" }, "Bạn muốn cải thiện kỹ năng nào?"),
      React.createElement("p", { style: { fontSize: 13, color: "var(--rpg-muted)", marginBottom: 20, marginTop: -8 } }, `Chọn tối đa 3 kỹ năng (${selected.length}/3)`),
      React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 } },
        SKILL_OPTIONS.map((skill) => {
          const active = selected.includes(skill);
          const visual = getSkillVisual(skill);
          return React.createElement("button", {
            key: skill,
            onClick: () => toggle(skill),
            disabled: !active && selected.length >= 3,
            style: {
              padding: "14px 12px", border: "1px solid", borderColor: active ? visual.color : "var(--rpg-border)",
              borderRadius: 8, background: active ? visual.color + "24" : "rgba(255,255,255,0.04)",
              color: active ? visual.color : "#fff", cursor: !active && selected.length >= 3 ? "not-allowed" : "pointer", opacity: !active && selected.length >= 3 ? .55 : 1,
              textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
            },
          },
            React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 7 } },
              React.createElement(Icon, { name: visual.icon, size: 15, color: active ? visual.color : "var(--rpg-muted)" }), skill),
            active ? React.createElement("span", { style: { color: visual.color, fontWeight: 800 } }, "✓") : null
          );
        })
      )
    );
  }

  
