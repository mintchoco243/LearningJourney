"use client";

import React from "react";

export function MinigameAdminScreen() {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [resetId, setResetId] = React.useState("");
  const [enabled, setEnabled] = React.useState(false);

  async function load() {
    setLoading(true);
    const [leaderboardResponse, campaignResponse] = await Promise.all([
      fetch("/admin/api/minigame/leaderboard", { credentials: "include" }),
      fetch("/admin/api/minigame/campaign", { credentials: "include" }),
    ]);
    const data = leaderboardResponse.ok ? await leaderboardResponse.json() : { leaderboard: [] };
    const campaign = campaignResponse.ok ? await campaignResponse.json() : {};
    setRows(data.leaderboard || []);
    setEnabled(Boolean(campaign.enabled));
    setLoading(false);
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => { load(); }, []);

  async function toggle() {
    const response = await fetch("/admin/api/minigame/campaign/toggle", {
      method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !enabled }),
    });
    if (response.ok) setEnabled(!enabled);
  }

  async function resetUser() {
    if (!resetId.trim() || !window.confirm("Reset toàn bộ dữ liệu minigame của user này?")) return;
    const response = await fetch(`/admin/api/minigame/users/${encodeURIComponent(resetId.trim())}/reset`, { method: "POST", credentials: "include" });
    if (response.ok) { setResetId(""); await load(); }
  }

  return React.createElement("section", { style: { padding: 24 } },
    React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 20 } },
      React.createElement("div", null,
        React.createElement("h1", { style: { margin: 0, color: "var(--rpg-text)" } }, "Minigame Launch"),
        React.createElement("p", { style: { color: "var(--rpg-muted)", margin: "6px 0 0" } }, "Leaderboard và công cụ test admin"),
      ),
      React.createElement("button", { className: "adm-btn adm-btn--primary", onClick: toggle }, enabled ? "Tắt campaign" : "Bật campaign"),
      React.createElement("button", { className: "adm-btn adm-btn--sec", onClick: () => window.open("/minigame/snake.html?mode=test", "_blank", "noopener") }, "Mở test vô hạn"),
    ),
    React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" } },
      React.createElement("input", { className: "adm-input", placeholder: "User ID cần reset", value: resetId, onChange: (e) => setResetId(e.target.value) }),
      React.createElement("button", { className: "adm-btn adm-btn--sec", onClick: resetUser }, "Reset user test data"),
    ),
    React.createElement("div", { style: { overflowX: "auto", border: "1px solid var(--rpg-border)", borderRadius: 8 } },
      React.createElement("table", { className: "adm-table", style: { width: "100%" } },
        React.createElement("thead", null, React.createElement("tr", null, ["#", "User", "Email", "Team", "Score", "Lượt chơi", "Suspicious"].map((label) => React.createElement("th", { key: label }, label)))),
        React.createElement("tbody", null, loading ? React.createElement("tr", null, React.createElement("td", { colSpan: 7 }, "Đang tải...")) : rows.map((row, index) => React.createElement("tr", { key: row.id },
          React.createElement("td", null, index + 1), React.createElement("td", null, row.full_name || "-"), React.createElement("td", null, row.email), React.createElement("td", null, row.team || "-"), React.createElement("td", null, row.score || 0), React.createElement("td", null, row.total_runs || 0), React.createElement("td", null, row.suspicious ? "Có" : "Không"),
        ))),
      ),
    ),
  );
}
