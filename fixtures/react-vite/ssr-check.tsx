import { strict as assert } from "node:assert/strict";
import { renderToString } from "react-dom/server";
import { App, initialFilter } from "./src/app";

const html = renderToString(<App />);
assert.match(html, /<li>Lamp<\/li>/);
assert.match(html, /<li>Desk<\/li>/);
assert.ok(
  html.includes(JSON.stringify(initialFilter).replaceAll('"', "&quot;")),
  "controlled filter state was not applied"
);
console.log("react-vite fixture ok");
