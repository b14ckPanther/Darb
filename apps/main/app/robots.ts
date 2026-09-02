import type { MetadataRoute } from "next";

import { darbApplications } from "@darb/config/platform";

export default function robots(): MetadataRoute.Robots {
  return {
    host: `https://${darbApplications.main.productionHost}`,
    rules: {
      allow: ["/ar", "/he", "/en"],
      disallow: "/health",
      userAgent: "*",
    },
    sitemap: `https://${darbApplications.main.productionHost}/sitemap.xml`,
  };
}
