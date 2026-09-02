import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { localizeRestaurantPublication, resolvePublicRestaurantLocale } from "@darb/restaurant";
import { RestaurantExperience } from "../../../../../components/restaurant-experience";
import { getPublicSupabaseConfig } from "../../../../../lib/config";
import { resolvePublicDomain } from "../../../../../lib/domains";
import { getPublicRestaurantPublication } from "../../../../../lib/publication";
import {
  parseLocaleSegments,
  readSingleSearchParameter,
  type RestaurantRouteContext,
} from "../../../../../lib/routes";
import { createRestaurantMetadata } from "../../../../../lib/seo";

interface CustomRestaurantPageProps {
  params: Promise<{ hostname: string; locale?: string[] }>;
  searchParams: Promise<{ location?: string | string[] }>;
}

async function loadCustomRoute(params: CustomRestaurantPageProps["params"]) {
  const routeParams = await params;
  const requestHeaders = await headers();
  if (requestHeaders.get("x-darb-custom-host") !== routeParams.hostname) return null;
  const resolution = await resolvePublicDomain(routeParams.hostname);
  if (!resolution) return null;
  const publication = await getPublicRestaurantPublication(resolution.businessSlug);
  if (!publication) return null;
  const locale = resolvePublicRestaurantLocale(
    parseLocaleSegments(routeParams.locale),
    publication.locales,
    publication.business.defaultLocale,
  );
  if (!locale) return null;
  const route = {
    hostname: resolution.hostname,
    kind: "custom",
    primaryHostname: resolution.primaryHostname,
  } satisfies RestaurantRouteContext;
  return { locale, publication, route };
}

export async function generateMetadata({ params }: CustomRestaurantPageProps): Promise<Metadata> {
  const loaded = await loadCustomRoute(params);
  return loaded
    ? createRestaurantMetadata(
        loaded.publication,
        localizeRestaurantPublication(loaded.publication, loaded.locale),
        loaded.route,
        getPublicSupabaseConfig().url,
      )
    : {};
}

export default async function CustomRestaurantPage({
  params,
  searchParams,
}: CustomRestaurantPageProps) {
  const [loaded, query] = await Promise.all([loadCustomRoute(params), searchParams]);
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
