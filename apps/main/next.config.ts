import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: ["@darb/config", "@darb/i18n", "@darb/types", "@darb/ui"],
};

export default nextConfig;
