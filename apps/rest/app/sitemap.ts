import type { MetadataRoute } from "next";
import { headers } from "next/headers";

import { resolvePublicDomain } from "../lib/domains";
import { listPublicRestaurantSitemapEntries } from "../lib/discovery";
import { resolveHostRouting } from "../lib/host-routing";
import { getPublicRestaurantPublication } from "../lib/publication";
import { createRestaurantSitemap } from "../lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const requestHeaders = await headers();
  const routing = resolveHostRouting(
    requestHeaders.get("host"),
    requestHeaders.get("x-forwarded-host"),
    process.env,
  );

  if (routing.kind === "invalid") return [];
  if (routing.kind === "platform") {
    const entries = await listPublicRestaurantSitemapEntries();
    return createRestaurantSitemap(entries.filter((entry) => entry.primaryHostname === null));
  }

  const resolution = await resolvePublicDomain(routing.hostname);
  if (!resolution || resolution.primaryHostname !== routing.hostname) return [];
  const publication = await getPublicRestaurantPublication(resolution.businessSlug);
  if (!publication || publication.menus.length === 0) return [];

  return createRestaurantSitemap([
    {
      businessSlug: publication.business.slug,
      defaultLocale: publication.business.defaultLocale,
      locales: publication.locales,
      primaryHostname: routing.hostname,
    },
  ]);
}
