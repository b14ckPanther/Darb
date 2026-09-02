import type { SupportedLocale } from "@darb/i18n";

export type RestaurantRouteContext =
  | { kind: "platform"; primaryHostname: string | null }
  | { hostname: string; kind: "custom"; primaryHostname: string | null };

export function restaurantPath(
  businessSlug: string,
  locale: SupportedLocale,
  defaultLocale: SupportedLocale,
  locationId?: string | null,
  route: RestaurantRouteContext = { kind: "platform", primaryHostname: null },
): string {
  const basePath =
    route.kind === "custom"
      ? locale === defaultLocale
        ? "/"
        : `/${locale}`
      : locale === defaultLocale
        ? `/${businessSlug}`
        : `/${businessSlug}/${locale}`;
  if (!locationId) return basePath;

  const query = new URLSearchParams({ location: locationId });
  return `${basePath}?${query.toString()}`;
}

export function restaurantCanonicalUrl(
  businessSlug: string,
  locale: SupportedLocale,
  defaultLocale: SupportedLocale,
  route: RestaurantRouteContext,
): URL {
  if (route.primaryHostname) {
    return new URL(
      restaurantPath(businessSlug, locale, defaultLocale, null, {
        hostname: route.primaryHostname,
        kind: "custom",
        primaryHostname: route.primaryHostname,
      }),
      `https://${route.primaryHostname}`,
    );
  }
  return new URL(restaurantPath(businessSlug, locale, defaultLocale), "https://rest.darb.co.il");
}

export function parseLocaleSegments(segments: readonly string[] | undefined): string | null {
  if (!segments || segments.length === 0) return null;
  return segments.length === 1 ? (segments[0] ?? null) : "__invalid__";
}

export function readSingleSearchParameter(value: string | string[] | undefined): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}
