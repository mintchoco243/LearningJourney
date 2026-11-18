import { query, withTransaction } from "../db.js";
import { getSecret, getSetting } from "../lib/integrationSecrets.js";

const GIGI_URL = "https://gigi.garena.vn/s2s/ticket/get-tickets-by-form-ids";
const COUNTED = new Set(["submited", "approving", "processing", "closed"]);
const PENDING = new Set(["submited", "approving"]);

function vndAmount(value, currency) {
  if (String(currency || "").trim().toUpperCase() !== "VND") return null;
  if (typeof value === "number") return Number.isSafeInteger(value) && value >= 0 ? value : null;
  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    const number = Number(value.trim());
    return Number.isSafeInteger(number) ? number : null;
  }
  return null;
}

export function parseTicketCost(formData) {
  const fields = [["courseFee", "courseCurrency"], ["docFee", "docCurrency"]];
  const present = fields.filter(([cost]) => formData?.[cost] !== null && formData?.[cost] !== undefined && formData?.[cost] !== "");
  const text = present.map(([cost, currency]) => `${cost}: ${String(formData[cost])} ${String(formData[currency] || "").trim()}`).join("; ").slice(0, 500);
  if (!present.length) return { amount: null, source: null, text };
  const amounts = present.map(([cost, currency]) => vndAmount(formData[cost], formData[currency]));
  if (amounts.some((amount) => amount === null)) return { amount: null, source: null, text };
  const total = amounts.reduce((sum, amount) => sum + amount, 0);
  return { amount: Number.isSafeInteger(total) ? total : null, source: present.map(([cost]) => cost).join("+"), text };
}

export function normalizeTicket(ticket) {
  const id = Number(ticket?.id);
  const email = String(ticket?.email || "").trim().toLowerCase();
  const year = Number(String(ticket?.create_time || "").slice(0, 4));
  if (ticket?.form_id !== 46 || !Number.isSafeInteger(id) || id <= 0 || !/^[^@\s]+@[^@\s]+$/.test(email) || year < 2020 || year > 2100) return null;
  const parsed = parseTicketCost(ticket.form_data);
  return { id, email, year, status: String(ticket.status || "").toLowerCase(), amount: parsed.amount, amountText: parsed.text, amountSource: parsed.source, createdAt: String(ticket.create_time || "") };
}

async function fetchPage(key, offset) {
  const url = new URL(GIGI_URL);
  url.searchParams.set("form_ids", "46");
  url.searchParams.set("limit", "100");
  url.searchParams.set("offset", String(offset));
  const response = await fetch(url, { headers: { "Client-ID": key }, signal: AbortSignal.timeout(20000) });
  const body = await response.json().catch(() => null);
  if (!response.ok || body?.status !== "successful" || !Array.isArray(body?.payload?.tickets)) {
    throw new Error(body?.error_code || `GIGI_HTTP_${response.status}`);
  }
  return body.payload;
}

export async function checkGigiConnection() {
  const key = await getSecret("gigi_client_key", process.env.GIGI_CLIENT_KEY || "");
  if (!key) return { state: "missing" };
  const page = await fetchPage(key, 0);
  return { state: page.tickets.some((ticket) => ticket.form_id === 46) ? "connected" : "unverified_empty", sampleCount: page.tickets.length };
}

export async function syncGigiBudget() {
  const key = await getSecret("gigi_client_key", process.env.GIGI_CLIENT_KEY || "");
  if (!key) return { status: "missing_key" };
  const claim = await query(
    `UPDATE gigi_budget_sync SET status = 'running', started_at = NOW(), error_message = NULL
     WHERE id = 1 AND (status <> 'running' OR started_at < DATE_SUB(NOW(), INTERVAL 30 MINUTE))`,
  );
  if (!claim.rowCount) return { status: "already_running" };
  try {
    async function collect() {
      const byId = new Map();
      const seenIds = [];
      let offset = 0;
      for (let pages = 0; pages < 1000; pages++) {
        const page = await fetchPage(key, offset);
        for (const raw of page.tickets) {
          seenIds.push(String(raw.id));
          const ticket = normalizeTicket(raw);
          if (ticket) byId.set(ticket.id, ticket);
        }
        if (!page.has_more) return { byId, seenIds };
        const next = Number(page.offset) + Number(page.limit);
        if (!Number.isSafeInteger(next) || next <= offset) throw new Error("GIGI_PAGINATION_INCOMPLETE");
        offset = next;
      }
      throw new Error("GIGI_PAGINATION_INCOMPLETE");
    }
    const first = await collect();
    const second = await collect();
    // Offset pagination is not a fixed snapshot. Only commit a consistent full scan.
    if (JSON.stringify(first.seenIds) !== JSON.stringify(second.seenIds) ||
        JSON.stringify([...first.byId.values()]) !== JSON.stringify([...second.byId.values()])) {
      throw new Error("GIGI_LIST_CHANGED_DURING_SCAN");
    }
    const byId = second.byId;
    if (byId.size === 0) throw new Error("GIGI_FORM_46_EMPTY_OR_NOT_AUTHORIZED");
    await withTransaction(async (db) => {
      await db.query("UPDATE gigi_budget_tickets SET source_missing=TRUE");
      for (const ticket of byId.values()) {
        await db.query(
          `INSERT INTO gigi_budget_tickets
           (ticket_id, email, ticket_year, status, amount_vnd, amount_text, amount_source, created_at_source, fetched_at, source_missing)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),FALSE)
           ON DUPLICATE KEY UPDATE email=VALUES(email), ticket_year=VALUES(ticket_year), status=VALUES(status),
             amount_vnd=VALUES(amount_vnd), amount_text=VALUES(amount_text), amount_source=VALUES(amount_source),
             created_at_source=VALUES(created_at_source), fetched_at=NOW(), source_missing=FALSE`,
          [ticket.id, ticket.email, ticket.year, ticket.status, ticket.amount, ticket.amountText, ticket.amountSource, ticket.createdAt],
        );
      }
      await db.query("UPDATE gigi_budget_sync SET status='success', succeeded_at=NOW(), ticket_count=$1, error_message=NULL WHERE id=1", [byId.size]);
    });
    return { status: "success", ticketCount: byId.size };
  } catch (error) {
    await query("UPDATE gigi_budget_sync SET status='error', error_message=$1 WHERE id=1", [String(error.message).slice(0, 255)]);
    throw error;
  }
}

export async function budgetForEmail(email, year = Number(new Intl.DateTimeFormat("en", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric" }).format(new Date()))) {
  const normalizedEmail = String(email).trim().toLowerCase();
  const [tickets, state, capRaw] = await Promise.all([
    query("SELECT ticket_id, status, amount_vnd, amount_text, created_at_source, source_missing FROM gigi_budget_tickets WHERE email = $1 AND ticket_year = $2 ORDER BY ticket_id DESC", [normalizedEmail, year]),
    query("SELECT status, succeeded_at, ticket_count, error_message FROM gigi_budget_sync WHERE id=1"),
    getSetting(`learning_budget_cap_${year}`, "20000000"),
  ]);
  const cap = Number(capRaw);
  const totals = summarizeBudget(tickets.rows, cap);
  const sync = state.rows[0] || {};
  return { year, ...totals, ticketCount: tickets.rowCount,
    tickets: tickets.rows.map((ticket) => ({ id: ticket.ticket_id, status: ticket.status, amountVnd: ticket.amount_vnd, createdAt: ticket.created_at_source, sourceMissing: Boolean(ticket.source_missing) })),
    fetchedAt: sync.succeeded_at || null, sourceStatus: sync.status || "never" };
}

export function summarizeBudget(tickets, cap) {
  let used = 0, pending = 0, unresolved = 0;
  for (const ticket of tickets) {
    if (!COUNTED.has(ticket.status)) continue;
    if (ticket.source_missing) { unresolved++; continue; }
    if (ticket.amount_vnd == null) { unresolved++; continue; }
    used += Number(ticket.amount_vnd);
    if (PENDING.has(ticket.status)) pending += Number(ticket.amount_vnd);
  }
  return { capVnd: cap, usedVnd: used, pendingVnd: pending,
    remainingVnd: unresolved ? null : Math.max(0, cap - used),
    unresolvedTickets: unresolved };
}
