import type { Metadata, MetadataRoute } from "next";

import type { SupportedLocale } from "@darb/i18n";
import {
  restaurantMoneyToDecimalString,
  type LocalizedRestaurantPublication,
  type PublicRestaurantImage,
  type PublicRestaurantPublication,
  type PublicRestaurantSitemapEntry,
} from "@darb/restaurant";

import { buildRestaurantImageUrl } from "./media";
import { restaurantCanonicalUrl, type RestaurantRouteContext } from "./routes";

export function createRestaurantMetadata(
  publication: PublicRestaurantPublication,
  localized: LocalizedRestaurantPublication,
  route: RestaurantRouteContext = { kind: "platform", primaryHostname: null },
  publicMediaBaseUrl?: string,
): Metadata {
  const title = localized.menus[0]?.name
    ? `${publication.business.displayName} · ${localized.menus[0].name}`
    : publication.business.displayName;
  const description =
    localized.menus[0]?.description ?? localized.menus[0]?.categories[0]?.description ?? undefined;
  const canonical = restaurantCanonicalUrl(
    publication.business.slug,
    localized.locale,
    publication.business.defaultLocale,
    route,
  ).toString();
  const languages = createRestaurantLanguageAlternates(
    publication.business.slug,
    publication.locales,
    publication.business.defaultLocale,
    route,
  );
  const image = findFirstPublicImage(localized);
  const socialImages =
    image && publicMediaBaseUrl
      ? [
          {
            url: buildRestaurantImageUrl(publicMediaBaseUrl, image),
            ...(image.altText ? { alt: image.altText } : {}),
            ...(image.width ? { width: image.width } : {}),
            ...(image.height ? { height: image.height } : {}),
          },
        ]
      : undefined;
  const indexable = localized.menus.length > 0;

  return {
    alternates: { canonical, languages },
    description,
    openGraph: {
      description,
      images: socialImages,
      locale: localeToOpenGraphLocale(localized.locale),
      alternateLocale: publication.locales
        .filter((locale) => locale !== localized.locale)
        .map(localeToOpenGraphLocale),
      siteName: publication.business.displayName,
      title,
      type: "website",
      url: canonical,
    },
    robots: { follow: true, index: indexable },
    title,
    twitter: {
      card: socialImages ? "summary_large_image" : "summary",
      description,
      images: socialImages?.map(({ url }) => url),
      title,
    },
  };
}

export function createRestaurantJsonLd(
  publication: LocalizedRestaurantPublication,
  route: RestaurantRouteContext = { kind: "platform", primaryHostname: null },
  publicMediaBaseUrl?: string,
): Record<string, unknown> {
  const url = restaurantCanonicalUrl(
    publication.business.slug,
    publication.locale,
    publication.business.defaultLocale,
    route,
  ).toString();

  const image = findFirstPublicImage(publication);
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": `${url}#restaurant`,
    name: publication.business.displayName,
    url,
    inLanguage: localeToLanguageTag(publication.locale),
    image:
      image && publicMediaBaseUrl ? buildRestaurantImageUrl(publicMediaBaseUrl, image) : undefined,
    hasMenu: publication.menus.map((menu) => ({
      "@type": "Menu",
      name: menu.name,
      description: menu.description ?? undefined,
      inLanguage: localeToLanguageTag(menu.locale),
      hasMenuSection: menu.categories.map((category) => ({
        "@type": "MenuSection",
        name: category.name,
        description: category.description ?? undefined,
        inLanguage: localeToLanguageTag(category.locale),
        image:
          category.image && publicMediaBaseUrl
            ? buildRestaurantImageUrl(publicMediaBaseUrl, category.image)
            : undefined,
        hasMenuItem: category.items.map((item) => ({
          "@type": "MenuItem",
          name: item.name,
          description: item.description ?? undefined,
          inLanguage: localeToLanguageTag(item.locale),
          image:
            item.image && publicMediaBaseUrl
              ? buildRestaurantImageUrl(publicMediaBaseUrl, item.image)
              : undefined,
          offers: [
            createOffer(
              item.basePriceMinor,
              publication.business.currencyCode,
              item.availabilityStatus,
            ),
            ...item.variants.map((variant) => ({
              ...createOffer(
                variant.priceMinor,
                publication.business.currencyCode,
                item.availabilityStatus === "sold_out" ? "sold_out" : variant.availabilityStatus,
              ),
              name: variant.name,
            })),
          ],
        })),
      })),
    })),
  };
}

export function serializeJsonLd(value: Record<string, unknown>): string {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}

export function createRestaurantSitemap(
  entries: readonly PublicRestaurantSitemapEntry[],
): MetadataRoute.Sitemap {
  return entries.flatMap((entry) => {
    const route: RestaurantRouteContext = entry.primaryHostname
      ? {
          hostname: entry.primaryHostname,
          kind: "custom",
          primaryHostname: entry.primaryHostname,
        }
      : { kind: "platform", primaryHostname: null };
    const alternates = createRestaurantLanguageAlternates(
      entry.businessSlug,
      entry.locales,
      entry.defaultLocale,
      route,
    );
    return entry.locales.map((locale) => ({
      url: restaurantCanonicalUrl(
        entry.businessSlug,
        locale,
        entry.defaultLocale,
        route,
      ).toString(),
      alternates: { languages: alternates },
      changeFrequency: "weekly" as const,
      priority: locale === entry.defaultLocale ? 0.8 : 0.7,
    }));
  });
}

export function createRestaurantLanguageAlternates(
  businessSlug: string,
  locales: readonly SupportedLocale[],
  defaultLocale: SupportedLocale,
  route: RestaurantRouteContext,
): Record<string, string> {
  const entries = locales.map(
    (locale) =>
      [
        localeToLanguageTag(locale),
        restaurantCanonicalUrl(businessSlug, locale, defaultLocale, route).toString(),
      ] as const,
  );
  return Object.fromEntries([
    ...entries,
    [
      "x-default",
      restaurantCanonicalUrl(businessSlug, defaultLocale, defaultLocale, route).toString(),
    ],
  ]);
}

export function createRestaurantRobots(
  indexable: boolean,
  sitemapOrigin: string,
): MetadataRoute.Robots {
  return {
    rules: indexable
      ? { allow: "/", disallow: "/darb-host-internal/", userAgent: "*" }
      : { disallow: "/", userAgent: "*" },
    ...(indexable ? { sitemap: new URL("/sitemap.xml", sitemapOrigin).toString() } : {}),
  };
}

function localeToLanguageTag(locale: SupportedLocale): string {
  return { ar: "ar-IL", en: "en-IL", he: "he-IL" }[locale];
}

function localeToOpenGraphLocale(locale: SupportedLocale): string {
  return { ar: "ar_IL", en: "en_IL", he: "he_IL" }[locale];
}

function findFirstPublicImage(
  publication: LocalizedRestaurantPublication,
): PublicRestaurantImage | null {
  for (const menu of publication.menus) {
    for (const category of menu.categories) {
      if (category.image) return category.image;
      const itemImage = category.items.find((item) => item.image)?.image;
      if (itemImage) return itemImage;
    }
  }
  return null;
}

function createOffer(
  priceMinor: number,
  currencyCode: string,
  availability: "available" | "sold_out",
) {
  return {
    "@type": "Offer",
    availability:
      availability === "available" ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
    price: restaurantMoneyToDecimalString(priceMinor, currencyCode),
    priceCurrency: currencyCode,
  };
}
