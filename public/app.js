const sections = {
  courses: {
    label: "Courses",
    hint: "Prepare course catalog rows before publishing them to the learner site.",
    columns: [
      "course_id",
      "title",
      "description",
      "trainer",
      "format",
      "duration_hours",
      "skill_tags",
      "rank_targets",
      "role_targets",
      "type",
      "min_participants",
      "registration_url",
      "xp_reward",
      "is_active",
    ],
  },
  sessions: {
    label: "Sessions",
    hint: "Prepare scheduled class dates and connect each session to an existing draft/live course_id.",
    columns: [
      "course_id",
      "session_date",
      "session_time",
      "location",
      "trainer",
      "min_participants",
      "max_participants",
      "status",
    ],
  },
  policies: {
    label: "Policies",
    hint: "Prepare policy content as CSV or pasted markdown text. DOCX/PDF import comes later.",
    columns: ["category", "title", "content", "is_active", "order_index"],
  },
  "admin-accounts": {
    label: "Admin Accounts",
    hint: "Prepare admin whitelist rows. Emails must use @garena.vn.",
    columns: ["email", "full_name", "role", "is_active"],
  },
};

let currentType = "courses";
let previewRows = [];
let validationResults = [];

const loginPanel = document.querySelector("#loginPanel");
const appPanel = document.querySelector("#appPanel");
const loginForm = document.querySelector("#loginForm");
const emailInput = document.querySelector("#emailInput");
const userEmail = document.querySelector("#userEmail");
const logoutButton = document.querySelector("#logoutButton");
const tabs = document.querySelector("#tabs");
const sectionTitle = document.querySelector("#sectionTitle");
const sectionHint = document.querySelector("#sectionHint");
const templateLink = document.querySelector("#templateLink");
const exportLink = document.querySelector("#exportLink");
const fileInput = document.querySelector("#fileInput");
const pasteInput = document.querySelector("#pasteInput");
const parseButton = document.querySelector("#parseButton");
const saveButton = document.querySelector("#saveButton");
const statusText = document.querySelector("#statusText");
const summaryText = document.querySelector("#summaryText");
const columnsList = document.querySelector("#columnsList");
const tableWrap = document.querySelector("#tableWrap");

async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: "include",
    headers: { "content-type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) {
    const error = new Error(data.error || "REQUEST_FAILED");
    error.data = data;
    throw error;
  }
  return data;
}

function setStatus(message, tone = "") {
  statusText.textContent = message;
  statusText.className = `status ${tone}`.trim();
}

function showApp(user) {
  loginPanel.classList.add("hidden");
  appPanel.classList.remove("hidden");
  userEmail.textContent = user.email;
  loadDraft();
}

function showLogin() {
  loginPanel.classList.remove("hidden");
  appPanel.classList.add("hidden");
  userEmail.textContent = "Not signed in";
}

async function bootstrap() {
  renderTabs();
  setSection("courses");
  try {
    const data = await api("/api/me");
    showApp(data.user);
  } catch {
    showLogin();
  }
}

function renderTabs() {
  tabs.innerHTML = "";
  for (const [type, section] of Object.entries(sections)) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = section.label;
    button.addEventListener("click", () => setSection(type));
    tabs.append(button);
  }
}

function setSection(type) {
  currentType = type;
  const section = sections[type];
  sectionTitle.textContent = section.label;
  sectionHint.textContent = section.hint;
  templateLink.href = `/admin/api/data-prep/templates/${type}`;
  exportLink.href = `/admin/api/data-prep/${type}/export`;
  fileInput.value = "";
  pasteInput.value = "";
  previewRows = [];
  validationResults = [];
  saveButton.disabled = true;
  setStatus("");
  renderColumns();
  renderPreview();
  for (const button of tabs.querySelectorAll("button")) {
    button.classList.toggle("active", button.textContent === section.label);
  }
  if (!appPanel.classList.contains("hidden")) loadDraft();
}

function renderColumns() {
  columnsList.innerHTML = "";
  for (const column of sections[currentType].columns) {
    const chip = document.createElement("span");
    chip.textContent = column;
    columnsList.append(chip);
  }
}

function parseDelimited(text) {
  const delimiter = text.includes("\t") ? "\t" : ",";
  const rows = [];
  let cell = "";
  let row = [];
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  row.push(cell);
  if (row.some((value) => value.trim())) rows.push(row);

  const headers = rows.shift()?.map((header) => header.trim()) || [];
  return rows.map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, (values[index] || "").trim()]))
  );
}

async function readFileRows(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    if (!window.XLSX) throw new Error("XLSX parser is not loaded. Please use CSV or paste rows.");
    const buffer = await file.arrayBuffer();
    const workbook = window.XLSX.read(buffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return window.XLSX.utils.sheet_to_json(sheet, { defval: "" });
  }
  return parseDelimited(await file.text());
}

async function buildRows() {
  if (fileInput.files[0]) return readFileRows(fileInput.files[0]);
  const text = pasteInput.value.trim();
  if (!text) return [];
  return parseDelimited(text);
}

async function validatePreview() {
  setStatus("Validating...");
  previewRows = await buildRows();
  if (!previewRows.length) {
    validationResults = [];
    saveButton.disabled = true;
    renderPreview();
    setStatus("No rows found. Upload a file or paste spreadsheet rows.", "warn");
    return;
  }
  const data = await api(`/admin/api/data-prep/${currentType}/validate`, {
    method: "POST",
    body: JSON.stringify({ rows: previewRows }),
  });
  validationResults = data.results;
  saveButton.disabled = !data.ok;
  renderPreview();
  setStatus(data.ok ? "Preview looks good. You can save this draft." : "Fix highlighted rows before saving.", data.ok ? "ok" : "warn");
}

async function saveDraft() {
  saveButton.disabled = true;
  const source = fileInput.files[0]?.name || "pasted rows";
  setStatus("Saving draft...");
  const data = await api(`/admin/api/data-prep/${currentType}/save`, {
    method: "POST",
    body: JSON.stringify({ rows: previewRows, source }),
  });
  setStatus(`Saved ${data.savedRows} rows as draft batch.`, "ok");
  await loadDraft();
}

async function loadDraft() {
  try {
    const data = await api(`/admin/api/data-prep/${currentType}`);
    previewRows = data.rows || [];
    validationResults = previewRows.map((row, index) => ({ index, row, errors: [] }));
    saveButton.disabled = true;
    renderPreview();
    if (previewRows.length) setStatus(`Loaded latest draft: ${previewRows.length} rows.`, "ok");
  } catch (error) {
    if (error.message === "ADMIN_REQUIRED") {
      setStatus("This account is not admin-whitelisted.", "warn");
      showLogin();
    } else {
      setStatus(error.message, "warn");
    }
  }
}

function renderPreview() {
  const columns = sections[currentType].columns;
  const rows = validationResults.length
    ? validationResults
    : previewRows.map((row, index) => ({ index, row, errors: [] }));
  const errorCount = rows.reduce((total, item) => total + item.errors.length, 0);
  summaryText.textContent = `${rows.length} rows, ${errorCount} errors`;

  if (!rows.length) {
    tableWrap.innerHTML = '<p class="empty">No preview data yet.</p>';
    return;
  }

  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  for (const column of ["#", ...columns, "errors"]) {
    const th = document.createElement("th");
    th.textContent = column;
    headRow.append(th);
  }
  thead.append(headRow);
  table.append(thead);

  const tbody = document.createElement("tbody");
  for (const item of rows) {
    const tr = document.createElement("tr");
    tr.classList.toggle("invalid", item.errors.length > 0);
    const indexCell = document.createElement("td");
    indexCell.textContent = String(item.index + 1);
    tr.append(indexCell);
    for (const column of columns) {
      const td = document.createElement("td");
      td.textContent = item.row[column] ?? "";
      tr.append(td);
    }
    const errorCell = document.createElement("td");
    errorCell.textContent = item.errors.join("; ");
    tr.append(errorCell);
    tbody.append(tr);
  }
  table.append(tbody);
  tableWrap.replaceChildren(table);
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const data = await api("/auth/dev-login", {
      method: "POST",
      body: JSON.stringify({ email: emailInput.value }),
    });
    showApp(data.user);
  } catch (error) {
    setStatus(error.message, "warn");
  }
});

logoutButton.addEventListener("click", async () => {
  await api("/auth/logout", { method: "POST" }).catch(() => {});
  showLogin();
});

parseButton.addEventListener("click", () => {
  validatePreview().catch((error) => setStatus(error.message, "warn"));
});

saveButton.addEventListener("click", () => {
  saveDraft().catch((error) => {
    validationResults = error.data?.results || validationResults;
    renderPreview();
    setStatus(error.message, "warn");
  });
});

bootstrap();
