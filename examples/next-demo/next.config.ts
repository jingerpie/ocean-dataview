import type { NextConfig } from "next";

// Standalone app inside the monorepo: keep Next from treating the repo root
// (with its own lockfile) as the workspace root.
const root = import.meta.dirname;

const config: NextConfig = {
  outputFileTracingRoot: root,
  turbopack: { root },
  typedRoutes: true,
  // PGlite ships WASM and data files; load it from node_modules at runtime.
  serverExternalPackages: ["@electric-sql/pglite"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.shopifycdn.com", pathname: "/**" },
      { protocol: "https", hostname: "*.shopify.com", pathname: "/**" },
    ],
  },
};

export default config;
