import type { NextConfig } from "next";

const config: NextConfig = {
  devIndicators: false,
  allowedDevOrigins: ["*.e2b.app"],
  async rewrites() {
    const backend = process.env.AFRICONNECT_API_PROXY_TARGET?.replace(/\/$/, "");
    if (!backend) return [];
    return [
      { source: "/api/v1/:path*", destination: `${backend}/api/v1/:path*` },
      { source: "/sanctum/:path*", destination: `${backend}/sanctum/:path*` },
      { source: "/broadcasting/auth", destination: `${backend}/broadcasting/auth` },
    ];
  },
};

export default config;
