import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/**/*.{ts,tsx}", "!src/**/__tests__/**"],
  format: "esm",
  platform: "neutral",
  unbundle: true,
  dts: true,
  clean: true,
});
