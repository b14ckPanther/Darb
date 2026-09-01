import type { Metadata } from "next";

import { darbApplications } from "@darb/config/platform";
import type { SupportedLocale } from "@darb/i18n";
import {
  restaurantMoneyToDecimalString,
  type LocalizedRestaurantPublication,
  type PublicRestaurantPublication,
} from "@darb/restaurant";

import { restaurantPath } from "./routes";

const publicOrigin = `https://${darbApplications.rest.productionHost}`;

export function createRestaurantMetadata(
  publication: PublicRestaurantPublication,
  localized: LocalizedRestaurantPublication,
): Metadata {
  const title = `${publication.business.displayName} · ${localized.menus[0]?.name ?? "Menu"}`;
  const description =
    localized.menus[0]?.description ?? localized.menus[0]?.categories[0]?.description ?? undefined;
  const canonical = new URL(
    restaurantPath(publication.business.slug, localized.locale, publication.business.defaultLocale),
    publicOrigin,
  );
  const languages = Object.fromEntries(
    publication.locales.map((locale) => [
      localeToLanguageTag(locale),
      new URL(
        restaurantPath(publication.business.slug, locale, publication.business.defaultLocale),
        publicOrigin,
      ),
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
): Record<string, unknown> {
  const url = new URL(
    restaurantPath(
      publication.business.slug,
      publication.locale,
      publication.business.defaultLocale,
    ),
    publicOrigin,
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
