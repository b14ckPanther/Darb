import type { Metadata } from "next";
import type { ReactNode } from "react";

import { darbApplications } from "@darb/config/platform";
import { getTextDirection } from "@darb/i18n";
import type { DarbSurface } from "@darb/types";
import { SkipLink } from "@darb/ui";

import { AdminLocaleProvider } from "../lib/i18n-client";
import { getAdminI18n } from "../lib/i18n-server";

import { cairo, heebo, ubuntu } from "./fonts";
import "./globals.css";

const surface = "admin" satisfies DarbSurface;
const application = darbApplications[surface];

export const metadata: Metadata = {
  description: "Secure Darb business administration.",
  robots: { follow: false, index: false, nocache: true },
  title: application.name,
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const { locale, messages, t } = await getAdminI18n();
  return (
    <html
      lang={locale}
      dir={getTextDirection(locale)}
      className={`${cairo.variable} ${heebo.variable} ${ubuntu.variable}`}
    >
      <body>
        <AdminLocaleProvider locale={locale} messages={messages}>
          <SkipLink href="#main-content">{t("Skip to content")}</SkipLink>
          {children}
        </AdminLocaleProvider>
      </body>
    </html>
  );
}
