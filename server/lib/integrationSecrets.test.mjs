import test from "node:test";
import assert from "node:assert/strict";
import { encryptSecret, decryptSecret } from "./integrationSecrets.js";

test("integration keys are encrypted at rest and never returned as ciphertext", async () => {
  const previous = process.env.INTEGRATION_ENCRYPTION_KEY;
  process.env.INTEGRATION_ENCRYPTION_KEY = "test-only-integration-key";
  try {
    const first = await encryptSecret("sample-client-key");
    const second = await encryptSecret("sample-client-key");
    assert.ok(first.startsWith("enc:v2:env:"));
    assert.notEqual(first, second);
    assert.equal(await decryptSecret(first), "sample-client-key");
    assert.equal(await decryptSecret("legacy-key"), "legacy-key");
  } finally {
    if (previous === undefined) delete process.env.INTEGRATION_ENCRYPTION_KEY;
    else process.env.INTEGRATION_ENCRYPTION_KEY = previous;
  }
});
