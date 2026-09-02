import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import { SkipLink } from "@darb/ui";

import { cairo, heebo, ubuntu } from "../../fonts";
import { mainSiteCopy } from "../../../lib/copy";
import { getPublicLocaleDirection, resolvePublicLocale } from "../../../lib/site";
import "../../globals.css";

export default async function PublicLocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = resolvePublicLocale(localeParam);
  if (!locale) notFound();

  return (
    <html
      lang={locale}
      dir={getPublicLocaleDirection(locale)}
      className={`${cairo.variable} ${heebo.variable} ${ubuntu.variable}`}
    >
      <body>
        <SkipLink href="#main-content">{mainSiteCopy[locale].skipLink}</SkipLink>
        {children}
      </body>
    </html>
  );
}
