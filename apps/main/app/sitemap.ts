import type { MetadataRoute } from "next";

import { darbApplications } from "@darb/config/platform";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      changeFrequency: "monthly",
      priority: 1,
      url: `https://${darbApplications.main.productionHost}`,
    },
  ];
}
