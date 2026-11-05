/**
 * Build the shadcn registry against a local URL and install it with the real
 * shadcn CLI into clean Vite and Next.js fixtures.
 *
 * - registry-vite: default aliases; installs every registry item, then
 *   typechecks, builds, and server-renders two independent views.
 * - registry-next: non-default aliases (`@/shared/...`) and nuqs URL state;
 *   installs the table view and toolbar, then typechecks and builds.
 *
 * The fixture themes start from the app theme with the DataView badge and
 * chart tokens removed, so the `dataview-styles` item must supply them.
 *
 * Usage: bun scripts/verify-registry.ts [fixture...]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { $, file as bunFile, serve } from "bun";
import {
  makeWorkDir,
  packPackages,
  prepareFixture,
  ROOT,
  typecheck,
} from "./lib/fixtures";

const WEB = join(ROOT, "apps/web");
const SHADCN = process.env.SHADCN_CLI ?? "shadcn@latest";

const COMMON_DEPS = [
  "@base-ui/react",
  "@tanstack/react-query",
  "chrono-node",
  "date-fns",
  "lucide-react",
  "react",
  "react-dom",
  "shadcn",
  "tailwindcss",
  "tw-animate-css",
  "typescript",
  "zod",
  "@types/react",
  "@types/react-dom",
];

interface Fixture {
  css: string;
  deps: string[];
  /** Registry items to install; empty means every item. */
  items: string[];
}

const FIXTURES: Record<string, Fixture> = {
  "registry-vite": {
    css: "src/index.css",
    deps: [
      ...COMMON_DEPS,
      "vite",
      "@vitejs/plugin-react",
      "@tailwindcss/vite",
      "@types/bun",
    ],
    items: [],
  },
  "registry-next": {
    css: "app/globals.css",
    deps: [
      ...COMMON_DEPS,
      "next",
      "nuqs",
      "@tailwindcss/postcss",
      "@types/node",
    ],
    items: ["table-view", "notion-toolbar"],
  },
};

const DATAVIEW_TOKEN = /^\s*--(color-)?(badge|chart)-/;

/** The app theme without DataView tokens and without monorepo @source lines. */
function baseTheme(): string {
  const css = readFileSync(
    join(ROOT, "packages/ui/src/styles/globals.css"),
    "utf8"
  );
  return `${css
    .split("\n")
    .filter((line) => !DATAVIEW_TOKEN.test(line))
    .filter((line) => !line.startsWith("@source"))
    .join("\n")
    .replace(
      '@import "tailwindcss";',
      '@import "tailwindcss";\n@import "shadcn/tailwind.css";'
    )}\n`;
}

const only = process.argv.slice(2);
const names = Object.keys(FIXTURES).filter(
  (name) => only.length === 0 || only.includes(name)
);

const work = makeWorkDir("dataview-registry-");
const tarballs = await packPackages(work);

const server = serve({
  port: 0,
  fetch(request) {
    const path = new URL(request.url).pathname;
    const file = bunFile(join(WEB, "public", path));
    return file.size > 0
      ? new Response(file)
      : new Response("Not found", { status: 404 });
  },
});
const baseUrl = `http://localhost:${server.port}`;

try {
  console.log(`Building registry for ${baseUrl}…`);
  await $`bun scripts/build-registry.ts --base-url ${baseUrl}`.cwd(WEB);
  const metadata = JSON.parse(
    readFileSync(join(WEB, "registry.metadata.json"), "utf8")
  );
  const allItems: string[] = metadata.items.map(
    (item: { name: string }) => item.name
  );

  for (const name of names) {
    const fixture = FIXTURES[name] as Fixture;
    const dir = await prepareFixture(name, work, tarballs, fixture.deps);
    writeFileSync(join(dir, fixture.css), baseTheme());
    const items = fixture.items.length > 0 ? fixture.items : allItems;
    const urls = items.map((item) => `${baseUrl}/r/${item}.json`);
    console.log(`shadcn add ${items.length} items…`);
    await $`bunx ${SHADCN} add ${urls} --yes --overwrite`.cwd(dir);
    await typecheck(dir);
    await $`bun run verify`.cwd(dir);
  }
} finally {
  server.stop(true);
  // Restore the registry for the production URL
  await $`bun scripts/build-registry.ts`.cwd(WEB).quiet();
}

console.log(`\nAll registry fixtures passed: ${names.join(", ")}`);
