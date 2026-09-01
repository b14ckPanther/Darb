import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
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

export default nextConfig;
