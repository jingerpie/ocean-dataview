/**
 * Run `next dev` or `next start` on the first free port from 3000 upward.
 *
 * The chosen port is also exported as PORT, which the tRPC client reads
 * to build its absolute URL during server render.
 *
 * Usage: bun scripts/serve.ts <dev|start>
 */
import { spawn } from "node:child_process";
import { createServer } from "node:net";

const START_PORT = 3000;
const MAX_TRIES = 20;

const mode = process.argv[2];
if (mode !== "dev" && mode !== "start") {
  console.error("Usage: bun scripts/serve.ts <dev|start>");
  process.exit(1);
}

function isFree(port: number) {
  return new Promise<boolean>((resolve) => {
    const server = createServer()
      .once("error", () => resolve(false))
      .once("listening", () => server.close(() => resolve(true)))
      .listen(port);
  });
}

let port: number | undefined;
for (
  let candidate = START_PORT;
  candidate < START_PORT + MAX_TRIES;
  candidate++
) {
  if (await isFree(candidate)) {
    port = candidate;
    break;
  }
  console.log(`Port ${candidate} is in use, trying ${candidate + 1}`);
}
if (port === undefined) {
  console.error(`No free port in ${START_PORT}-${START_PORT + MAX_TRIES - 1}`);
  process.exit(1);
}

const child = spawn("next", [mode, "--port", String(port)], {
  env: { ...process.env, PORT: String(port) },
  stdio: "inherit",
});
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => child.kill(signal));
}
child.on("exit", (code) => process.exit(code ?? 0));
