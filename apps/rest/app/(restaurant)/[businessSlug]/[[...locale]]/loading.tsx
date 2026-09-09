"use client";

import { getRestaurantCopy } from "../../../../lib/copy";
import { useRestaurantLocale } from "../../../../components/restaurant-locale";

export default function RestaurantLoading() {
  const copy = getRestaurantCopy(useRestaurantLocale() ?? "en");
  return (
    <main className="loading-shell" aria-busy="true" aria-label={copy.loading}>
      <div className="loading-header" />
      <div className="loading-hero" />
      <div className="loading-content">
        <div className="loading-title" />
        <div className="loading-grid">
          {Array.from({ length: 4 }, (_, index) => (
            <div className="loading-card" key={index} />
          ))}
        </div>
      </div>
    </main>
  );
}
