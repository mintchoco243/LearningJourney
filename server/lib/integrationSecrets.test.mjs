import test from "node:test";
import assert from "node:assert/strict";
import { encryptSecret, decryptSecret } from "./integrationSecrets.js";

test("integration keys are encrypted at rest and never returned as ciphertext", () => {
  const previous = process.env.INTEGRATION_ENCRYPTION_KEY;
  process.env.INTEGRATION_ENCRYPTION_KEY = "test-only-integration-key";
  try {
    const first = encryptSecret("sample-client-key");
    const second = encryptSecret("sample-client-key");
    assert.ok(first.startsWith("enc:v1:"));
    assert.notEqual(first, second);
    assert.equal(decryptSecret(first), "sample-client-key");
    assert.equal(decryptSecret("legacy-key"), "legacy-key");
  } finally {
    if (previous === undefined) delete process.env.INTEGRATION_ENCRYPTION_KEY;
    else process.env.INTEGRATION_ENCRYPTION_KEY = previous;
  }
});
