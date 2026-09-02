import type { MetadataRoute } from "next";

import { darbApplications } from "@darb/config/platform";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { allow: "/", userAgent: "*" },
    sitemap: `https://${darbApplications.main.productionHost}/sitemap.xml`,
  };
}
