import type { ReactNode } from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { resolvePublicRestaurantLocale } from "@darb/restaurant";
import { RestaurantDocument } from "../../../../../components/restaurant-document";
import { resolvePublicDomain } from "../../../../../lib/domains";
import { getPublicRestaurantPublication } from "../../../../../lib/publication";
import { parseLocaleSegments } from "../../../../../lib/routes";

export default async function CustomRestaurantLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ hostname: string; locale?: string[] }>;
}) {
  const route = await params;
  const requestHeaders = await headers();
  if (requestHeaders.get("x-darb-custom-host") !== route.hostname) notFound();
  const resolution = await resolvePublicDomain(route.hostname);
  if (!resolution) notFound();
  const publication = await getPublicRestaurantPublication(resolution.businessSlug);
  if (!publication) notFound();
  const locale = resolvePublicRestaurantLocale(
    parseLocaleSegments(route.locale),
    publication.locales,
    publication.business.defaultLocale,
  );
  if (!locale) notFound();
  return (
    <RestaurantDocument publication={publication} locale={locale}>
      {children}
    </RestaurantDocument>
  );
}
