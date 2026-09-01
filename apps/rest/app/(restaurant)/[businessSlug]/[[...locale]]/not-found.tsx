import { RestaurantIcon } from "@darb/icons";

export default function RestaurantNotFound() {
  return (
    <main className="system-state">
      <RestaurantIcon size={34} />
      <h1>Restaurant unavailable</h1>
      <p>This page is not published or is no longer available.</p>
      <a href="https://darb.co.il">Visit Darb</a>
    </main>
  );
}
