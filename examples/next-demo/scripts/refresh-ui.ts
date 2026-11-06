/**
 * Reinstall the DataView registry UI into this demo.
 *
 * By default it builds the registry from ../../apps/web and serves it locally,
 * so the demo tests the current registry source against the published npm
 * packages. Pass a registry base URL to install from a deployed registry.
 *
 * Usage: bun scripts/refresh-ui.ts [registry-base-url]
 */
import { join } from "node:path";
import { $, file, serve } from "bun";

const ITEMS = [
  "table-view",
  "list-view",
  "gallery-view",
  "notion-toolbar",
  "dataview-skeletons",
];
const DEMO = join(import.meta.dir, "..");
const WEB = join(DEMO, "../../apps/web");

let baseUrl = process.argv[2];
let server: ReturnType<typeof serve> | undefined;

if (!baseUrl) {
  server = serve({
    port: 0,
    fetch(request) {
      const path = new URL(request.url).pathname;
      const asset = file(join(WEB, "public", path));
      return asset.size > 0
        ? new Response(asset)
        : new Response("Not found", { status: 404 });
    },
  });
  baseUrl = `http://localhost:${server.port}`;
  console.log(`Building registry for ${baseUrl}…`);
  await $`bun scripts/build-registry.ts --base-url ${baseUrl}`.cwd(WEB);
}

try {
  const urls = ITEMS.map((item) => `${baseUrl}/r/${item}.json`);
  console.log(`shadcn add ${ITEMS.join(" ")}`);
  await $`bunx shadcn@latest add ${urls} --yes --overwrite`.cwd(DEMO);
} finally {
  server?.stop(true);
}
