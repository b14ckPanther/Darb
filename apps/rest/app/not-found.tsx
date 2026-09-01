import { RestaurantIcon } from "@darb/icons";

import { cairo, heebo, ubuntu } from "./fonts";
import "./globals.css";

export default function GlobalNotFound() {
  return (
    <html lang="en" dir="ltr" className={`${cairo.variable} ${heebo.variable} ${ubuntu.variable}`}>
      <body>
        <main className="system-state">
          <RestaurantIcon size={34} />
          <h1>Restaurant unavailable</h1>
          <p>This page is not published or is no longer available.</p>
          <a href="https://darb.co.il">Visit Darb</a>
        </main>
      </body>
    </html>
  );
}
