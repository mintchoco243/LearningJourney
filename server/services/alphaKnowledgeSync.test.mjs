import test from "node:test";
import assert from "node:assert/strict";
import { findRemote } from "./alphaKnowledgeSync.js";

test("adopts the existing Alpha document by filename before creating anything", () => {
  const document = { sourceType: "courses", sourceKey: "LC-001", filename: "course-LC-001.md" };
  assert.equal(findRemote(document, [{ id: 123, name: document.filename, tags: [] }], null).item.id, 123);
});

test("stable mapping wins after a user email and filename change", () => {
  const document = { sourceType: "users", sourceKey: "user-1", filename: "user-new-garena-vn.md" };
  assert.equal(findRemote(document, [{ id: 456, name: "user-old-garena-vn.md", tags: [] }], { knowledge_id: 456 }).item.id, 456);
});

test("adopts an existing user document by its email tag", () => {
  const document = { sourceType: "users", sourceKey: "user-1", filename: "user-a-garena-vn.md", tags: ["email-a-garena-vn"] };
  assert.equal(findRemote(document, [{ id: 456, name: "legacy-user.md", tags: ["email-a-garena-vn"] }], null).item.id, 456);
});

test("ambiguous remote identity stops an upload", () => {
  const document = { sourceType: "users", sourceKey: "user-1", filename: "user-a-garena-vn.md" };
  const remote = [{ id: 1, name: document.filename, tags: [] }, { id: 2, name: "other.md", tags: ["lc-user-user-1"] }];
  assert.equal(findRemote(document, remote, null).conflict, "DUPLICATE_REMOTE_DOCUMENTS");
  assert.equal(findRemote(document, remote, { knowledge_id: 1 }).conflict, "DUPLICATE_REMOTE_DOCUMENTS");
});

test("a previously mapped document missing remotely never becomes an automatic create", () => {
  const document = { sourceType: "users", sourceKey: "user-1", filename: "user-new-garena-vn.md" };
  assert.equal(findRemote(document, [], { knowledge_id: 456 }).conflict, "MAPPED_REMOTE_MISSING");
});
