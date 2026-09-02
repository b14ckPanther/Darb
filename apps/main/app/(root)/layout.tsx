import type { ReactNode } from "react";

import { getTextDirection } from "@darb/i18n";
import { SkipLink } from "@darb/ui";

import { cairo, heebo, ubuntu } from "../fonts";
import { mainSiteCopy } from "../../lib/copy";
import "../globals.css";

export default function RootRedirectLayout({ children }: Readonly<{ children: ReactNode }>) {
  const locale = "ar" as const;

  return (
    <html
      lang={locale}
      dir={getTextDirection(locale)}
      data-scroll-behavior="smooth"
      className={`${cairo.variable} ${heebo.variable} ${ubuntu.variable}`}
    >
      <body>
        <SkipLink href="#main-content">{mainSiteCopy[locale].skipLink}</SkipLink>
        {children}
      </body>
    </html>
  );
}
