import type { Metadata } from "next";
import type { ReactNode } from "react";

import { darbApplications } from "@darb/config/platform";

import { cairo, heebo, ubuntu } from "../fonts";
import "../globals.css";

export const metadata: Metadata = {
  description: "Customer-facing Restaurant experiences powered by Darb.",
  title: darbApplications.rest.name,
};

export default function LandingLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" dir="ltr" className={`${cairo.variable} ${heebo.variable} ${ubuntu.variable}`}>
      <body>{children}</body>
    </html>
  );
}
