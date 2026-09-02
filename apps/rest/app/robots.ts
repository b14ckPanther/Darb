import type { MetadataRoute } from "next";
import { headers } from "next/headers";

import { darbApplications } from "@darb/config/platform";

import { resolvePublicDomain } from "../lib/domains";
import { resolveHostRouting } from "../lib/host-routing";
import { getPublicRestaurantPublication } from "../lib/publication";
import { createRestaurantRobots } from "../lib/seo";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const requestHeaders = await headers();
  const routing = resolveHostRouting(
    requestHeaders.get("host"),
    requestHeaders.get("x-forwarded-host"),
    process.env,
  );

  if (routing.kind === "invalid") return createRestaurantRobots(false, "https://darb.co.il");
  if (routing.kind === "platform") {
    return createRestaurantRobots(true, `https://${darbApplications.rest.productionHost}`);
  }

  const resolution = await resolvePublicDomain(routing.hostname);
  if (!resolution) return createRestaurantRobots(false, "https://darb.co.il");
  const publication = await getPublicRestaurantPublication(resolution.businessSlug);
  if (!publication) return createRestaurantRobots(false, "https://darb.co.il");

  const sitemapOrigin = resolution.primaryHostname
    ? `https://${resolution.primaryHostname}`
    : `https://${darbApplications.rest.productionHost}`;
  return createRestaurantRobots(publication.menus.length > 0, sitemapOrigin);
}
