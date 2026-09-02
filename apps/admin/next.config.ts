import type { NextConfig } from "next";

import { createDarbSecurityHeaders } from "@darb/config/http";

const nextConfig: NextConfig = {
  agentRules: false,
  async headers() {
    return [
      {
        headers: createDarbSecurityHeaders({
          allowIndexing: false,
          enablePlatformHsts: true,
          environment: runtimeEnvironment(),
          resourceOrigins: [process.env.NEXT_PUBLIC_SUPABASE_URL],
        }),
        source: "/:path*",
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        hostname: "xtuhwpyqxgmsthgumktk.supabase.co",
        pathname: "/storage/v1/object/public/tenant-media-images/**",
        protocol: "https",
      },
      {
        hostname: "127.0.0.1",
        pathname: "/storage/v1/object/public/tenant-media-images/**",
        port: "54321",
        protocol: "http",
      },
      {
        hostname: "localhost",
        pathname: "/storage/v1/object/public/tenant-media-images/**",
        port: "54321",
        protocol: "http",
      },
    ],
  },
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: ["@darb/config", "@darb/i18n", "@darb/types", "@darb/ui"],
};

function runtimeEnvironment(): "development" | "production" | "test" {
  return process.env.NODE_ENV === "production"
    ? "production"
    : process.env.NODE_ENV === "test"
      ? "test"
      : "development";
}

export default nextConfig;
