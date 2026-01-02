import "@ocean-dataview/env/web";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	typedRoutes: true,
	reactCompiler: true,
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "us-prod5-digitalasset-v2.s3.amazonaws.com",
				port: "",
				pathname: "/**",
			},
		],
	},
};

export default nextConfig;
