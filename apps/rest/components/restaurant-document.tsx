import type { CSSProperties, ReactNode } from "react";
import { getTextDirection, type SupportedLocale } from "@darb/i18n";
import type { PublicRestaurantPublication } from "@darb/restaurant";
import { SkipLink } from "@darb/ui";
import { cairo, heebo, ubuntu } from "../app/fonts";
import "../app/globals.css";
import { getRestaurantCopy } from "../lib/copy";
import { resolveRestaurantTheme } from "../lib/theme";

export function RestaurantDocument({
  children,
  locale,
  publication,
}: {
  children: ReactNode;
  locale: SupportedLocale;
  publication: PublicRestaurantPublication;
}) {
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
