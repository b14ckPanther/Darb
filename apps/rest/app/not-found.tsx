import { darbApplications } from "@darb/config/platform";
import { DarbMark } from "@darb/ui";

import { cairo, heebo, ubuntu } from "./fonts";
import "./globals.css";

export default function GlobalNotFound() {
  return (
    <html lang="en" dir="ltr" className={`${cairo.variable} ${heebo.variable} ${ubuntu.variable}`}>
      <body>
        <main className="system-state">
          <DarbMark size={46} />
          <h1>Restaurant unavailable</h1>
          <p>This page is not published or is no longer available.</p>
          <a href={`https://${darbApplications.main.productionHost}`}>Visit Darb</a>
        </main>
      </body>
    </html>
  );
}
