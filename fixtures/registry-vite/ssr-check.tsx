import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderToString } from "react-dom/server";
import { App } from "./src/app";

const html = renderToString(<App />);
const [table, gallery] = html.split('data-view="gallery"');
assert.ok(
  table?.includes('data-view="table"') && table.includes("Lamp"),
  "table view renders rows"
);
assert.ok(gallery?.includes("Desk"), "gallery view renders cards");

// dataview-styles injected the badge and chart tokens for light and dark
const css = readFileSync("src/index.css", "utf8");
for (const token of [
  "--badge-blue:",
  "--badge-yellow-subtle:",
  "--chart-blue-1:",
]) {
  assert.ok(css.split(token).length >= 3, `${token} missing in light or dark`);
}
assert.match(css, /--color-badge-blue:/);

console.log("registry-vite fixture ok");
