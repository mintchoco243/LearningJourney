import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

test("production never accepts dev-login, even when DEV_AUTH_ENABLED is true", () => {
  const code = `
    import express from "express";
    import { authRouter } from "./server/routes/auth.js";
    const app = express();
    app.use(express.json());
    app.use("/auth", authRouter);
    const server = app.listen(0, "127.0.0.1", async () => {
      const response = await fetch("http://127.0.0.1:" + server.address().port + "/auth/dev-login", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "anyone@garena.vn" }),
      });
      console.log(response.status);
      server.close();
    });
  `;
  const result = spawnSync(process.execPath, ["--input-type=module", "-e", code], {
    encoding: "utf8", env: { ...process.env, NODE_ENV: "production", DEV_AUTH_ENABLED: "true" },
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), "404");
});
