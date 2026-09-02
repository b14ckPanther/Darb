import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { localizeRestaurantPublication, resolvePublicRestaurantLocale } from "@darb/restaurant";
import { RestaurantExperience } from "../../../../components/restaurant-experience";
import { resolvePrimaryRestaurantHostname } from "../../../../lib/domains";
import { getPublicSupabaseConfig } from "../../../../lib/config";
import { getPublicRestaurantPublication } from "../../../../lib/publication";
import {
  parseLocaleSegments,
  readSingleSearchParameter,
  type RestaurantRouteContext,
} from "../../../../lib/routes";
import { createRestaurantMetadata } from "../../../../lib/seo";

interface RestaurantPageProps {
  params: Promise<{ businessSlug: string; locale?: string[] }>;
  searchParams: Promise<{ location?: string | string[] }>;
}

async function loadRoute(params: RestaurantPageProps["params"]) {
  const route = await params;
  const [publication, primaryHostname] = await Promise.all([
    getPublicRestaurantPublication(route.businessSlug),
    resolvePrimaryRestaurantHostname(route.businessSlug),
  ]);
  if (!publication) return null;
  const locale = resolvePublicRestaurantLocale(
    parseLocaleSegments(route.locale),
    publication.locales,
    publication.business.defaultLocale,
  );
  if (!locale) return null;
  return {
    publication,
    locale,
    route: { kind: "platform", primaryHostname } satisfies RestaurantRouteContext,
  };
}

export async function generateMetadata({ params }: RestaurantPageProps): Promise<Metadata> {
  const loaded = await loadRoute(params);
  return loaded
    ? createRestaurantMetadata(
        loaded.publication,
        localizeRestaurantPublication(loaded.publication, loaded.locale),
        loaded.route,
        getPublicSupabaseConfig().url,
      )
    : {};
}

export default async function RestaurantPage({ params, searchParams }: RestaurantPageProps) {
  const [loaded, query] = await Promise.all([loadRoute(params), searchParams]);
  if (!loaded) notFound();
  const requestedLocation = readSingleSearchParameter(query.location);
  if (requestedLocation && !loaded.publication.locations.some(({ id }) => id === requestedLocation))
    notFound();
  const localized = localizeRestaurantPublication(
    loaded.publication,
    loaded.locale,
    requestedLocation,
  );
  return <RestaurantExperience publication={localized} route={loaded.route} />;
}
