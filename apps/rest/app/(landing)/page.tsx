import { RestaurantIcon } from "@darb/icons";

export default function RestaurantLanding() {
  return (
    <main className="platform-landing">
      <div className="platform-landing__mark">
        <RestaurantIcon size={28} />
      </div>
      <p className="eyebrow">Darb Restaurant</p>
      <h1>Restaurant experiences, thoughtfully served.</h1>
      <p>Use a restaurant’s Darb link to view its published menu.</p>
      <a href="https://darb.co.il">Visit Darb</a>
    </main>
  );
}
