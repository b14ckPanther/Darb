import { darbApplications } from "@darb/config/platform";
import { DarbMark } from "@darb/ui";

export default function RestaurantNotFound() {
  return (
    <main className="system-state">
      <DarbMark size={46} />
      <h1>Restaurant unavailable</h1>
      <p>This page is not published or is no longer available.</p>
      <a href={`https://${darbApplications.main.productionHost}`}>Visit Darb</a>
    </main>
  );
}
