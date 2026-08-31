import type { Metadata } from "next";
import type { ReactNode } from "react";

import { darbApplications } from "@darb/config/platform";
import type { DarbSurface } from "@darb/types";

import { cairo, heebo, ubuntu } from "./fonts";
import "./globals.css";

const surface = "admin" satisfies DarbSurface;
const application = darbApplications[surface];

export const metadata: Metadata = {
  title: application.name,
  description: "Darb administration application foundation.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" dir="ltr" className={`${cairo.variable} ${heebo.variable} ${ubuntu.variable}`}>
      <body>{children}</body>
    </html>
  );
}
