import { darbApplications } from "@darb/config/platform";
import { DarbBrandLockup } from "@darb/ui";

export default function RestaurantLanding() {
  return (
    <main className="platform-landing">
      <div className="platform-landing__brand">
        <DarbBrandLockup accessibleLabel="Darb — درب" tone="dark" />
        <span aria-hidden="true">Restaurant</span>
      </div>
      <p className="eyebrow">Darb Restaurant</p>
      <h1>Restaurant experiences, thoughtfully served.</h1>
      <p>Use a restaurant’s Darb link to view its published menu.</p>
      <a href={`https://${darbApplications.main.productionHost}`}>Visit Darb</a>
    </main>
  );
}
