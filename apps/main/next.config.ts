import type { NextConfig } from "next";

import { createDarbSecurityHeaders } from "@darb/config/http";

const nextConfig: NextConfig = {
  agentRules: false,
  async headers() {
    return [
      {
        headers: createDarbSecurityHeaders({
          allowIndexing: true,
          enablePlatformHsts: true,
          environment: runtimeEnvironment(),
        }),
        source: "/:path*",
      },
    ];
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
