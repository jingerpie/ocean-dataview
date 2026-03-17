import "@sparkyidea/env/web";
import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";

const withMDX = createMDX();

const config: NextConfig = {
  typedRoutes: true,
  reactCompiler: true,
  serverExternalPackages: ["@takumi-rs/image-response"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.shopifycdn.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.shopify.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/docs/:path*.mdx",
        destination: "/llms.mdx/docs/:path*",
      },
    ];
  },
};

export default withMDX(config);
