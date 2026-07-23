import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const isWindows = process.platform === "win32";
const npmCmd = isWindows ? "npm.cmd" : "npm";
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Auto-apply DB migrations on startup so dev environment is always up-to-date
try {
  console.log("[dev-local] Checking & running database migrations...");
  spawnSync(process.execPath, [path.join(repoRoot, "server", "migrate.js")], {
    stdio: "inherit",
    cwd: repoRoot,
  });
} catch (err) {
  console.warn("[dev-local] Warning: Could not run automatic migrations:", err.message);
}

const children = [
  spawn(process.execPath, ["--watch", "server/index.js"], {
    stdio: "inherit",
    cwd: repoRoot,
    env: {
      ...process.env,
      API_ONLY: "true",
      PORT: process.env.BACKEND_PORT || "5001",
    },
  }),
  spawn(npmCmd, ["run", "dev:next", "--prefix", "frontend"], {
    stdio: "inherit",
    cwd: repoRoot,
    env: { ...process.env, PORT: process.env.FRONTEND_PORT || "3000" },
    shell: isWindows,
  }),
];

let shuttingDown = false;

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill();
  }
  process.exit(code);
}

for (const child of children) {
  child.on("exit", (code) => {
    if (!shuttingDown && code !== 0 && code !== null) shutdown(code);
  });
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

