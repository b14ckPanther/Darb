import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
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

export default nextConfig;
