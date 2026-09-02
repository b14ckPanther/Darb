import type { MetadataRoute } from "next";

import { supportedLocales } from "@darb/i18n";

import { getPublicAlternates, getPublicLocaleUrl } from "../lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return supportedLocales.map((locale) => ({
    alternates: {
      languages: getPublicAlternates(),
    },
    changeFrequency: "monthly",
    priority: locale === "ar" ? 1 : 0.9,
    url: getPublicLocaleUrl(locale),
  }));
}
