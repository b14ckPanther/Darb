import type { Metadata } from "next";

import type { SupportedLocale } from "@darb/i18n";
import {
  restaurantMoneyToDecimalString,
  type LocalizedRestaurantPublication,
  type PublicRestaurantPublication,
} from "@darb/restaurant";

import { restaurantCanonicalUrl, type RestaurantRouteContext } from "./routes";

export function createRestaurantMetadata(
  publication: PublicRestaurantPublication,
  localized: LocalizedRestaurantPublication,
  route: RestaurantRouteContext = { kind: "platform", primaryHostname: null },
): Metadata {
  const title = `${publication.business.displayName} · ${localized.menus[0]?.name ?? "Menu"}`;
  const description =
    localized.menus[0]?.description ?? localized.menus[0]?.categories[0]?.description ?? undefined;
  const canonical = restaurantCanonicalUrl(
    publication.business.slug,
    localized.locale,
    publication.business.defaultLocale,
    route,
  ).toString();
  const languages = Object.fromEntries(
    publication.locales.map((locale) => [
      localeToLanguageTag(locale),
      restaurantCanonicalUrl(
        publication.business.slug,
        locale,
        publication.business.defaultLocale,
        route,
      ).toString(),
    ]),
  );

  return {
    alternates: { canonical, languages },
    description,
    openGraph: {
      description,
      locale: localeToOpenGraphLocale(localized.locale),
      siteName: publication.business.displayName,
      title,
      type: "website",
      url: canonical,
    },
    title,
  };
}

export function createRestaurantJsonLd(
  publication: LocalizedRestaurantPublication,
  route: RestaurantRouteContext = { kind: "platform", primaryHostname: null },
): Record<string, unknown> {
  const url = restaurantCanonicalUrl(
    publication.business.slug,
    publication.locale,
    publication.business.defaultLocale,
    route,
  ).toString();

  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: publication.business.displayName,
    url,
    inLanguage: localeToLanguageTag(publication.locale),
    hasMenu: publication.menus.map((menu) => ({
      "@type": "Menu",
      name: menu.name,
      description: menu.description ?? undefined,
      hasMenuSection: menu.categories.map((category) => ({
        "@type": "MenuSection",
        name: category.name,
        description: category.description ?? undefined,
        hasMenuItem: category.items.map((item) => ({
          "@type": "MenuItem",
          name: item.name,
          description: item.description ?? undefined,
          offers: {
            "@type": "Offer",
            availability:
              item.availabilityStatus === "available"
                ? "https://schema.org/InStock"
                : "https://schema.org/SoldOut",
            price: restaurantMoneyToDecimalString(
              item.basePriceMinor,
              publication.business.currencyCode,
            ),
            priceCurrency: publication.business.currencyCode,
          },
        })),
      })),
    })),
  };
}

export function serializeJsonLd(value: Record<string, unknown>): string {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

function localeToLanguageTag(locale: SupportedLocale): string {
  return { ar: "ar-IL", en: "en-IL", he: "he-IL" }[locale];
}

function localeToOpenGraphLocale(locale: SupportedLocale): string {
  return { ar: "ar_IL", en: "en_IL", he: "he_IL" }[locale];
}
