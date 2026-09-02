"use client";

import { noOpRestaurantAnalyticsAdapter, type RestaurantAnalyticsAdapter } from "@darb/restaurant";

// Provider activation belongs here. Product components emit only the typed Darb taxonomy and the
// production default intentionally performs no network or persistence work.
export function getRestaurantAnalyticsAdapter(): RestaurantAnalyticsAdapter {
  return noOpRestaurantAnalyticsAdapter;
}
