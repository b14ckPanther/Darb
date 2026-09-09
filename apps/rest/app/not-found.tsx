import { RestaurantSystemState } from "../components/restaurant-system-state";

import { cairo, heebo, ubuntu } from "./fonts";
import "./globals.css";

export default function GlobalNotFound() {
  return (
    <html lang="en" dir="ltr" className={`${cairo.variable} ${heebo.variable} ${ubuntu.variable}`}>
      <body>
        <RestaurantSystemState kind="unavailable" />
      </body>
    </html>
  );
}
