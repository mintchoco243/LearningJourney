import test from "node:test";
import assert from "node:assert/strict";
import { normalizeTicket, parseTicketCost, summarizeBudget } from "./gigiBudget.js";

test("sums numeric VND course and document costs without reading proposal prose", () => {
  assert.equal(parseTicketCost({ courseFee: 7000000, courseCurrency: "VND" }).amount, 7000000);
  assert.equal(parseTicketCost({ docFee: "3000000", docCurrency: "VND" }).amount, 3000000);
  assert.equal(parseTicketCost({ courseFee: 7000000, courseCurrency: "VND", docFee: 3000000, docCurrency: "VND" }).amount, 10000000);
  assert.equal(parseTicketCost({ courseFeeByRec: "100% - tương đương 10.000.000 VNĐ" }).amount, null);
  assert.equal(parseTicketCost({ courseFee: 399, courseCurrency: "USD" }).amount, null);
  assert.equal(parseTicketCost({ courseFee: 7000000, courseCurrency: "VND", docFee: 30, docCurrency: "USD" }).amount, null);
});

test("only accepts Form 46 tickets with exact requester email", () => {
  assert.equal(normalizeTicket({ id: 1, form_id: 36, email: "a@garena.vn", create_time: "2026-11-17 12:00:00" }), null);
  assert.equal(normalizeTicket({ id: 1, form_id: 46, email: "invalid", create_time: "2026-11-17 12:00:00" }), null);
  assert.equal(normalizeTicket({ id: 1, form_id: 46, email: "A@Garena.vn", create_time: "2026-11-17 12:00:00", status: "closed", form_data: { courseFee: 1000000, courseCurrency: "VND" } }).email, "a@garena.vn");
  assert.equal(normalizeTicket({ id: 1, form_id: 46, email: "A@Garena.vn", create_time: "2025-12-31 23:59:59", status: "closed", form_data: { courseFee: 1000000, courseCurrency: "VND" } }).year, 2025);
});

test("the current-year total includes pending tickets, which are also shown separately", () => {
  assert.deepEqual(summarizeBudget([{ status: "closed", amount_vnd: 7000000 }, { status: "approving", amount_vnd: 3000000 }], 20000000), {
    capVnd: 20000000, usedVnd: 10000000, pendingVnd: 3000000,
    remainingVnd: 10000000, unresolvedTickets: 0,
  });
  assert.equal(summarizeBudget([{ status: "approving", amount_vnd: 6600000 }, { status: "approving", amount_vnd: 2500000 }, { status: "processing", amount_vnd: 1000000 }], 20000000).remainingVnd, 9900000);
  assert.equal(summarizeBudget([{ status: "submited", amount_vnd: 1500000 }], 20000000).pendingVnd, 1500000);
  assert.equal(summarizeBudget([{ status: "closed", amount_vnd: 25000000 }], 20000000).remainingVnd, 0);
  assert.equal(summarizeBudget([{ status: "processing", amount_vnd: null }], 20000000).remainingVnd, null);
  assert.equal(summarizeBudget([{ status: "closed", amount_vnd: 1000000, source_missing: 1 }], 20000000).remainingVnd, null);
});
