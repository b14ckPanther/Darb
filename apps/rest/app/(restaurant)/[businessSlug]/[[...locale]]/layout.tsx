import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { resolvePublicRestaurantLocale } from "@darb/restaurant";
import { RestaurantDocument } from "../../../../components/restaurant-document";
import { getPublicRestaurantPublication } from "../../../../lib/publication";
import { parseLocaleSegments } from "../../../../lib/routes";

export default async function RestaurantLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ businessSlug: string; locale?: string[] }>;
}) {
  const route = await params;
  const publication = await getPublicRestaurantPublication(route.businessSlug);
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
