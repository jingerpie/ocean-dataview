import "@ocean-dataview/env/web";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  reactCompiler: true,
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
};

export default nextConfig;
