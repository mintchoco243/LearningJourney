import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { config } from "./config.js";
import { setAuthCookie, signToken, verifyToken } from "./auth.js";

test("new auth tokens carry the current version and 30-day lifetime", () => {
  const token = signToken({ id: "user-1", email: "user@garena.vn" });
  const payload = verifyToken(token);
  assert.equal(payload.ver, config.authTokenVersion);
  assert.ok(payload.exp - payload.iat >= config.authSessionDays * 24 * 60 * 60 - 2);
});

test("legacy tokens remain verifiable during the transition window", () => {
  const token = jwt.sign({ userId: "user-1", email: "user@garena.vn" }, config.jwtSecret, { expiresIn: "30d" });
  const payload = verifyToken(token);
  assert.equal(payload.ver, undefined);
  assert.equal(config.authAcceptLegacyTokens, true);
});

test("auth cookie uses the configured session lifetime", () => {
  const headers = [];
  const response = { cookie: (name, value, options) => headers.push({ name, value, options }) };
  setAuthCookie(response, "token");
  assert.equal(headers[0].name, "glh_token");
  assert.equal(headers[0].options.maxAge, config.authSessionMs);
  assert.equal(headers[0].options.httpOnly, true);
  assert.equal(headers[0].options.sameSite, "lax");
});

