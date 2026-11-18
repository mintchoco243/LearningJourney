import test from "node:test";
import assert from "node:assert/strict";
import { encryptSecret, decryptSecret } from "./integrationSecrets.js";

test("integration keys are encrypted at rest and never returned as ciphertext", () => {
  const previous = {
    integration: process.env.INTEGRATION_ENCRYPTION_KEY,
    database: process.env.DATABASE_URL,
    jwt: process.env.JWT_SECRET,
  };
  process.env.INTEGRATION_ENCRYPTION_KEY = "test-only-integration-key";
  try {
    const first = encryptSecret("sample-client-key");
    const second = encryptSecret("sample-client-key");
    assert.ok(first.startsWith("enc:v1:"));
    assert.notEqual(first, second);
    assert.equal(decryptSecret(first), "sample-client-key");
    assert.equal(decryptSecret("legacy-key"), "legacy-key");

    delete process.env.INTEGRATION_ENCRYPTION_KEY;
    process.env.DATABASE_URL = "mysql://integration-test:db-secret@localhost/test";
    process.env.JWT_SECRET = "jwt-secret-may-rotate";
    const databaseDerived = encryptSecret("database-derived-key");
    assert.equal(decryptSecret(databaseDerived), "database-derived-key");
  } finally {
    if (previous.integration === undefined) delete process.env.INTEGRATION_ENCRYPTION_KEY;
    else process.env.INTEGRATION_ENCRYPTION_KEY = previous.integration;
    if (previous.database === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previous.database;
    if (previous.jwt === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previous.jwt;
  }
});
