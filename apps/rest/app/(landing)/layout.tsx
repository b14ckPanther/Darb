import type { Metadata } from "next";
import type { ReactNode } from "react";

import { darbApplications } from "@darb/config/platform";

import { cairo, heebo, ubuntu } from "../fonts";
import "../globals.css";

export const metadata: Metadata = {
  alternates: { canonical: `https://${darbApplications.rest.productionHost}` },
  description: "Customer-facing Restaurant experiences powered by Darb.",
  metadataBase: new URL(`https://${darbApplications.rest.productionHost}`),
  openGraph: {
    description: "Customer-facing Restaurant experiences powered by Darb.",
    siteName: darbApplications.rest.name,
    title: darbApplications.rest.name,
    type: "website",
    url: `https://${darbApplications.rest.productionHost}`,
  },
  robots: { follow: true, index: false },
  title: darbApplications.rest.name,
  twitter: {
    card: "summary",
    description: "Customer-facing Restaurant experiences powered by Darb.",
    title: darbApplications.rest.name,
  },
};

export default function LandingLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" dir="ltr" className={`${cairo.variable} ${heebo.variable} ${ubuntu.variable}`}>
      <body>{children}</body>
    </html>
  );
}
