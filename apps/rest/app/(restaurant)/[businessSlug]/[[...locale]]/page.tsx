import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { localizeRestaurantPublication, resolvePublicRestaurantLocale } from "@darb/restaurant";

import { SignatureTemplate } from "../../../../components/signature-template";
import { getPublicRestaurantPublication } from "../../../../lib/publication";
import { parseLocaleSegments, readSingleSearchParameter } from "../../../../lib/routes";
import {
  createRestaurantJsonLd,
  createRestaurantMetadata,
  serializeJsonLd,
} from "../../../../lib/seo";

interface RestaurantPageProps {
  params: Promise<{ businessSlug: string; locale?: string[] }>;
  searchParams: Promise<{ location?: string | string[] }>;
}

export async function generateMetadata({ params }: RestaurantPageProps): Promise<Metadata> {
  const route = await params;
  const publication = await getPublicRestaurantPublication(route.businessSlug);
  if (!publication) return {};
  const locale = resolvePublicRestaurantLocale(
    parseLocaleSegments(route.locale),
    publication.locales,
    publication.business.defaultLocale,
  );
  if (!locale) return {};
  return createRestaurantMetadata(publication, localizeRestaurantPublication(publication, locale));
}

export default async function RestaurantPage({ params, searchParams }: RestaurantPageProps) {
  const [route, query] = await Promise.all([params, searchParams]);
  const publication = await getPublicRestaurantPublication(route.businessSlug);
  if (!publication) notFound();
  const locale = resolvePublicRestaurantLocale(
    parseLocaleSegments(route.locale),
    publication.locales,
    publication.business.defaultLocale,
  );
  if (!locale) notFound();
  const requestedLocation = readSingleSearchParameter(query.location);
  if (requestedLocation && !publication.locations.some(({ id }) => id === requestedLocation)) {
    notFound();
  }
  const localized = localizeRestaurantPublication(publication, locale, requestedLocation);
  const jsonLd = serializeJsonLd(createRestaurantJsonLd(localized));

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <SignatureTemplate publication={localized} />
    </>
  );
}
