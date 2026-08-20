import test from "node:test";
import assert from "node:assert/strict";
import { apiGet, ApiError } from "./apiClient.js";

function installWindow() {
  const window = new EventTarget();
  window.__glhAuthRequiredPending = false;
  globalThis.window = window;
  globalThis.CustomEvent = globalThis.CustomEvent || class extends Event {
    constructor(type, init = {}) { super(type); this.detail = init.detail; }
  };
  return window;
}

test("401 raises an auth error and emits one session event", async () => {
  const window = installWindow();
  let events = 0;
  window.addEventListener("glh:auth-required", () => { events += 1; });
  globalThis.fetch = async () => new Response(JSON.stringify({ error: "AUTH_REQUIRED" }), { status: 401 });

  await assert.rejects(() => apiGet("/api/courses"), (error) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.code, "AUTH_REQUIRED");
    assert.equal(error.status, 401);
    return true;
  });
  await assert.rejects(() => apiGet("/api/sessions"), /AUTH_REQUIRED/);
  assert.equal(events, 1);
});

test("server errors are not converted to empty data", async () => {
  installWindow();
  globalThis.fetch = async () => new Response(JSON.stringify({ error: "DB_UNAVAILABLE" }), { status: 503 });
  await assert.rejects(() => apiGet("/api/courses"), (error) => {
    assert.equal(error.code, "DB_UNAVAILABLE");
    assert.equal(error.status, 503);
    return true;
  });
});

