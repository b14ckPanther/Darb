import type { CSSProperties, ReactNode } from "react";
import { notFound } from "next/navigation";

import { getTextDirection, type SupportedLocale } from "@darb/i18n";
import { resolvePublicRestaurantLocale, type PublicRestaurantPublication } from "@darb/restaurant";
import { SkipLink } from "@darb/ui";

import { cairo, heebo, ubuntu } from "../../../fonts";
import "../../../globals.css";
import { getRestaurantCopy } from "../../../../lib/copy";
import { getPublicRestaurantPublication } from "../../../../lib/publication";
import { parseLocaleSegments } from "../../../../lib/routes";
import { resolveRestaurantTheme } from "../../../../lib/theme";

interface RestaurantLayoutProps {
  children: ReactNode;
  params: Promise<{ businessSlug: string; locale?: string[] }>;
}

export default async function RestaurantLayout({ children, params }: RestaurantLayoutProps) {
  const route = await params;
  const publication = await getPublicRestaurantPublication(route.businessSlug);
  if (!publication) notFound();
  const locale = resolveRouteLocale(publication, parseLocaleSegments(route.locale));
  if (!locale) notFound();
  const theme = resolveRestaurantTheme(publication.appearance, locale);
  const copy = getRestaurantCopy(locale);

  return (
    <html
      lang={locale}
      dir={getTextDirection(locale)}
      className={`${cairo.variable} ${heebo.variable} ${ubuntu.variable}`}
      data-scroll-behavior="smooth"
      style={theme as CSSProperties}
    >
      <body>
        <SkipLink href="#menu-content">{copy.skipToMenu}</SkipLink>
        {children}
      </body>
    </html>
  );
}

function resolveRouteLocale(
  publication: PublicRestaurantPublication,
  requestedLocale: string | null,
): SupportedLocale | null {
  return resolvePublicRestaurantLocale(
    requestedLocale,
    publication.locales,
    publication.business.defaultLocale,
  );
}
