import type { Metadata } from "next";
import type { ReactNode } from "react";

import { darbApplications } from "@darb/config/platform";
import { getTextDirection, type SupportedLocale } from "@darb/i18n";
import type { DarbSurface } from "@darb/types";
import { SkipLink } from "@darb/ui";

import { cairo, heebo, ubuntu } from "./fonts";
import "./globals.css";

const surface = "main" satisfies DarbSurface;
const application = darbApplications[surface];
const documentLocale = "en" satisfies SupportedLocale;

export const metadata: Metadata = {
  alternates: { canonical: `https://${application.productionHost}` },
  description: "Darb public application foundation.",
  metadataBase: new URL(`https://${application.productionHost}`),
  openGraph: {
    description: "Darb public application foundation.",
    siteName: application.name,
    title: application.name,
    type: "website",
    url: `https://${application.productionHost}`,
  },
  robots: { follow: true, index: true },
  title: application.name,
  twitter: {
    card: "summary",
    description: "Darb public application foundation.",
    title: application.name,
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang={documentLocale}
      dir={getTextDirection(documentLocale)}
      className={`${cairo.variable} ${heebo.variable} ${ubuntu.variable}`}
    >
      <body>
        <SkipLink href="#main-content">Skip to content</SkipLink>
        {children}
      </body>
    </html>
  );
}
