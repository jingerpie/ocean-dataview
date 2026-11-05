/**
 * Build the DataView shadcn registry from apps/web/registry.metadata.json.
 *
 * 1. Expand each item's file list and assign every registry file to exactly
 *    one item.
 * 2. Follow each file's imports:
 *    - `@/registry/base-nova/...` in another item -> registry dependency URL
 *    - `@sparkyidea/ui/components/x` -> stock shadcn item `x`, rewritten to
 *      `@/registry/base-nova/ui/x` so the CLI maps it to the user's ui alias
 *    - `@/lib/utils` -> stock `utils`
 *    - npm packages -> `dependencies` with pinned ranges; workspace package
 *      imports must match a public package export
 *    Relative imports, other aliases, and workspace-only packages fail.
 * 3. Write rewritten sources and registry.json to a staging directory, then run
 *    `shadcn build` for the latest URLs (public/r) and for the versioned URLs
 *    (public/r/<version>).
 *
 * Usage (from apps/web): bun scripts/build-registry.ts [--base-url http://localhost:4000]
 */

import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { $ } from "bun";
import { registryItemSchema, registrySchema } from "shadcn/schema";
import ts from "typescript";

const ROOT = resolve(import.meta.dir, "../../..");
const WEB = join(ROOT, "apps/web");
const ALIAS = "@/registry/base-nova/";
const STOCK_PREFIX = "@sparkyidea/ui/components/";
const SOURCE_FILE = /\.(ts|tsx)$/;
const EXACT_VERSION = /^\d/;
const JSON_SUFFIX = /\.json$/;

interface MetadataItem {
  css?: boolean;
  description: string;
  files: string[];
  name: string;
  title: string;
  type: string;
}

interface Metadata {
  homepage: string;
  items: MetadataItem[];
  name: string;
  registryRoot: string;
  stylesSource: string;
  version: string;
}

const args = process.argv.slice(2);
const baseUrlArg = args.indexOf("--base-url");
const metadata: Metadata = JSON.parse(
  readFileSync(join(WEB, "registry.metadata.json"), "utf8")
);
const baseUrl = (
  baseUrlArg >= 0 ? args[baseUrlArg + 1] : metadata.homepage
)?.replace(/\/$/, "");
if (!baseUrl) {
  throw new Error("--base-url needs a value");
}

const registryRoot = join(WEB, metadata.registryRoot);
const rootManifest = JSON.parse(
  readFileSync(join(ROOT, "package.json"), "utf8")
);
const catalog: Record<string, string> = rootManifest.workspaces.catalog;

/** Packages the consumer app already provides. */
const PROVIDED = new Set(["react", "react-dom"]);

const errors: string[] = [];

// ---------------------------------------------------------------------------
// File ownership
// ---------------------------------------------------------------------------

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      return name === "__tests__" ? [] : listFiles(path);
    }
    return SOURCE_FILE.test(name) ? [path] : [];
  });
}

const allFiles = listFiles(registryRoot).map((file) =>
  relative(registryRoot, file)
);

function matches(pattern: string, file: string): boolean {
  if (pattern.endsWith("/")) {
    return file.startsWith(pattern);
  }
  if (pattern.endsWith("/*.tsx") || pattern.endsWith("/*.ts")) {
    const dir = pattern.slice(0, pattern.lastIndexOf("/") + 1);
    const ext = pattern.slice(pattern.lastIndexOf("."));
    return (
      file.startsWith(dir) &&
      !file.slice(dir.length).includes("/") &&
      file.endsWith(ext)
    );
  }
  return file === pattern;
}

const owner = new Map<string, string>();
const itemFiles = new Map<string, string[]>();
for (const item of metadata.items) {
  const files = allFiles.filter((file) =>
    item.files.some((pattern) => matches(pattern, file))
  );
  if (item.files.length > 0 && files.length === 0) {
    errors.push(`${item.name}: no files match ${item.files.join(", ")}`);
  }
  for (const file of files) {
    const previous = owner.get(file);
    if (previous) {
      errors.push(`${file} is owned by both ${previous} and ${item.name}`);
    }
    owner.set(file, item.name);
  }
  itemFiles.set(item.name, files);
}
for (const file of allFiles) {
  if (!owner.has(file)) {
    errors.push(`${file} is not owned by any registry item`);
  }
}

// ---------------------------------------------------------------------------
// Import analysis
// ---------------------------------------------------------------------------

function resolveRegistryImport(spec: string): string | undefined {
  const base = spec.slice(ALIAS.length);
  for (const candidate of [`${base}.ts`, `${base}.tsx`]) {
    if (owner.has(candidate)) {
      return candidate;
    }
  }
}

function packageName(spec: string): string {
  const parts = spec.split("/");
  return spec.startsWith("@") ? `${parts[0]}/${parts[1]}` : (parts[0] ?? spec);
}

const workspaceExports = new Map<
  string,
  { exports: string[]; version: string }
>();
for (const dir of readdirSync(join(ROOT, "packages"))) {
  const manifestPath = join(ROOT, "packages", dir, "package.json");
  if (!existsSync(manifestPath)) {
    continue;
  }
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  workspaceExports.set(manifest.name, {
    exports: Object.keys(manifest.exports ?? {}),
    version: manifest.private ? "" : manifest.version,
  });
}

function npmRange(name: string): string | undefined {
  const workspace = workspaceExports.get(name);
  if (workspace) {
    return workspace.version || undefined;
  }
  const version = catalog[name];
  if (!version) {
    return;
  }
  return EXACT_VERSION.test(version) ? `^${version}` : version;
}

interface Analysis {
  content: string;
  dependencies: Set<string>;
  itemDependencies: Set<string>;
  stockDependencies: Set<string>;
}

/** Record an npm import; workspace packages must use a public export. */
function addPackage(file: string, spec: string, result: Analysis) {
  const name = packageName(spec);
  const workspace = workspaceExports.get(name);
  if (workspace) {
    const subpath = `.${spec.slice(name.length)}`;
    if (!workspace.version) {
      errors.push(`${file}: imports private workspace package "${name}"`);
    } else if (!workspace.exports.includes(subpath)) {
      errors.push(`${file}: "${spec}" is not a public export of ${name}`);
    }
  }
  if (PROVIDED.has(name)) {
    return;
  }
  const range = npmRange(name);
  if (range) {
    result.dependencies.add(`${name}@${range}`);
  } else {
    errors.push(`${file}: no pinned version for "${name}"`);
  }
}

/** Classify one import; returns the specifier to write in the payload. */
function addImport(
  file: string,
  item: string,
  spec: string,
  result: Analysis
): string {
  if (spec.startsWith(".")) {
    errors.push(`${file}: relative import "${spec}"; use "${ALIAS}..."`);
    return spec;
  }
  if (spec.startsWith(ALIAS)) {
    const target = resolveRegistryImport(spec);
    const targetOwner = target ? owner.get(target) : undefined;
    if (!targetOwner) {
      errors.push(`${file}: unresolved registry import "${spec}"`);
    } else if (targetOwner !== item) {
      result.itemDependencies.add(targetOwner);
    }
    return spec;
  }
  if (spec.startsWith(STOCK_PREFIX)) {
    const name = spec.slice(STOCK_PREFIX.length);
    result.stockDependencies.add(name);
    return `${ALIAS}ui/${name}`;
  }
  if (spec === "@/lib/utils" || spec === "@sparkyidea/ui/lib/utils") {
    result.stockDependencies.add("utils");
    return "@/lib/utils";
  }
  if (spec.startsWith("@/")) {
    errors.push(`${file}: app-only import "${spec}"`);
    return spec;
  }
  addPackage(file, spec, result);
  return spec;
}

function analyze(file: string, item: string): Analysis {
  const source = readFileSync(join(registryRoot, file), "utf8");
  const result: Analysis = {
    content: source,
    dependencies: new Set(),
    itemDependencies: new Set(),
    stockDependencies: new Set(),
  };
  const { importedFiles } = ts.preProcessFile(source, true, true);
  for (const { fileName: spec } of importedFiles) {
    const rewritten = addImport(file, item, spec, result);
    if (rewritten !== spec) {
      result.content = result.content.replaceAll(`"${spec}"`, `"${rewritten}"`);
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// CSS tokens
// ---------------------------------------------------------------------------

function readVars(css: string, selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) {
    throw new Error(`${selector} block not found in ${metadata.stylesSource}`);
  }
  const block = css.slice(start, css.indexOf("\n}", start));
  const vars: Record<string, string> = {};
  for (const match of block.matchAll(/^\s*--([\w-]+):\s*([^;]+);/gm)) {
    const [, name, value] = match;
    if (name && value) {
      vars[name] = value.trim();
    }
  }
  return vars;
}

function pick(
  vars: Record<string, string>,
  pattern: RegExp
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(vars).filter(([name]) => pattern.test(name))
  );
}

const css = readFileSync(join(WEB, metadata.stylesSource), "utf8");
const TOKEN = /^(badge|chart)-/;
const cssVars = {
  theme: pick(readVars(css, "@theme inline"), /^color-(badge|chart)-/),
  light: pick(readVars(css, ":root"), TOKEN),
  dark: pick(readVars(css, ".dark"), TOKEN),
};

// ---------------------------------------------------------------------------
// Assemble items
// ---------------------------------------------------------------------------

function fileType(file: string): string {
  if (file.startsWith("ui/")) {
    return "registry:ui";
  }
  if (file.startsWith("lib/")) {
    return "registry:lib";
  }
  if (file.startsWith("hooks/")) {
    return "registry:hook";
  }
  return "registry:component";
}

const stageRoot = join(WEB, ".registry-build");
rmSync(stageRoot, { force: true, recursive: true });

function buildRegistry(itemUrl: (name: string) => string) {
  const items = metadata.items.map((meta) => {
    const dependencies = new Set<string>();
    const registryDependencies = new Set<string>();
    const files = (itemFiles.get(meta.name) ?? []).map((file) => {
      const analysis = analyze(file, meta.name);
      for (const dep of analysis.dependencies) {
        dependencies.add(dep);
      }
      for (const dep of analysis.stockDependencies) {
        registryDependencies.add(dep);
      }
      for (const dep of analysis.itemDependencies) {
        registryDependencies.add(itemUrl(dep));
      }
      const stagedPath = join("registry/base-nova", file);
      mkdirSync(dirname(join(stageRoot, stagedPath)), { recursive: true });
      writeFileSync(join(stageRoot, stagedPath), analysis.content);
      return { path: stagedPath, type: fileType(file) };
    });
    // Every item with markup needs the DataView colour tokens.
    if (files.length > 0 && meta.name !== "dataview-styles") {
      registryDependencies.add(itemUrl("dataview-styles"));
    }
    return registryItemSchema.parse({
      $schema: "https://ui.shadcn.com/schema/registry-item.json",
      name: meta.name,
      type: meta.type,
      title: meta.title,
      description: meta.description,
      dependencies: [...dependencies].sort(),
      registryDependencies: [...registryDependencies].sort(),
      files,
      ...(meta.css ? { cssVars } : {}),
    });
  });

  return registrySchema.parse({
    $schema: "https://ui.shadcn.com/schema/registry.json",
    name: metadata.name,
    homepage: metadata.homepage,
    items,
  });
}

function findCycles(
  registry: ReturnType<typeof buildRegistry>,
  prefix: string
) {
  const graph = new Map(
    registry.items.map((item) => [
      item.name,
      (item.registryDependencies ?? [])
        .filter((dep) => dep.startsWith(prefix))
        .map((dep) => dep.slice(prefix.length).replace(JSON_SUFFIX, "")),
    ])
  );
  const state = new Map<string, "visiting" | "done">();
  const visit = (name: string, path: string[]) => {
    if (state.get(name) === "done") {
      return;
    }
    if (state.get(name) === "visiting") {
      errors.push(`dependency cycle: ${[...path, name].join(" -> ")}`);
      return;
    }
    state.set(name, "visiting");
    for (const dep of graph.get(name) ?? []) {
      visit(dep, [...path, name]);
    }
    state.set(name, "done");
  };
  for (const name of graph.keys()) {
    visit(name, []);
  }
}

const outputs = [
  { dir: "public/r", prefix: `${baseUrl}/r/` },
  {
    dir: `public/r/${metadata.version}`,
    prefix: `${baseUrl}/r/${metadata.version}/`,
  },
];

const registries = outputs.map(({ prefix }) =>
  buildRegistry((name) => `${prefix}${name}.json`)
);
findCycles(
  registries[0] as ReturnType<typeof buildRegistry>,
  outputs[0]?.prefix ?? ""
);

if (errors.length > 0) {
  console.error(
    `Registry build failed:\n- ${[...new Set(errors)].join("\n- ")}`
  );
  process.exit(1);
}

rmSync(join(WEB, "public/r"), { force: true, recursive: true });
for (const [index, { dir }] of outputs.entries()) {
  const registryPath = join(stageRoot, "registry.json");
  if (index === 0) {
    // registry.json in apps/web documents the latest registry
    writeFileSync(
      join(WEB, "registry.json"),
      `${JSON.stringify(registries[index], null, 2)}\n`
    );
  }
  writeFileSync(
    registryPath,
    `${JSON.stringify(registries[index], null, 2)}\n`
  );
  const tmpOut = join(stageRoot, "out");
  rmSync(tmpOut, { force: true, recursive: true });
  await $`bunx shadcn build registry.json --output out`.cwd(stageRoot).quiet();
  cpSync(tmpOut, join(WEB, dir), { recursive: true });
}
rmSync(stageRoot, { force: true, recursive: true });

console.log(
  `Built ${metadata.items.length} registry items for ${baseUrl} (latest and ${metadata.version}).`
);
