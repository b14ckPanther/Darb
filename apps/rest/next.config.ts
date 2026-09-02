import type { NextConfig } from "next";

import { createDarbSecurityHeaders } from "@darb/config/http";

const nextConfig: NextConfig = {
  agentRules: false,
  async headers() {
    return [
      {
        headers: createDarbSecurityHeaders({
          allowIndexing: true,
          environment: runtimeEnvironment(),
          resourceOrigins: [process.env.NEXT_PUBLIC_SUPABASE_URL],
        }),
        source: "/:path*",
      },
    ];
  },
  images: {
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
    maximumRedirects: 0,
    remotePatterns: [
      {
        hostname: "xtuhwpyqxgmsthgumktk.supabase.co",
        pathname: "/storage/v1/object/public/tenant-media-images/**",
        protocol: "https",
        search: "",
      },
      {
        hostname: "127.0.0.1",
        pathname: "/storage/v1/object/public/tenant-media-images/**",
        port: "54321",
        protocol: "http",
        search: "",
      },
      {
        hostname: "localhost",
        pathname: "/storage/v1/object/public/tenant-media-images/**",
        port: "54321",
        protocol: "http",
        search: "",
      },
    ],
  },
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: [
    "@darb/config",
    "@darb/database",
    "@darb/i18n",
    "@darb/icons",
    "@darb/restaurant",
    "@darb/theme",
    "@darb/types",
    "@darb/ui",
  ],
};

function runtimeEnvironment(): "development" | "production" | "test" {
  return process.env.NODE_ENV === "production"
    ? "production"
    : process.env.NODE_ENV === "test"
      ? "test"
      : "development";
}

export default nextConfig;
