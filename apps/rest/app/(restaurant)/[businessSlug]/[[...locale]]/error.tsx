"use client";

import { useEffect } from "react";

import { reportOperationalError } from "@darb/config/observability";
import { RestaurantSystemState } from "../../../../components/restaurant-system-state";

export default function RestaurantError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    reportOperationalError({ application: "rest", event: "restaurant.render_failed" });
  }, [error]);

  return <RestaurantSystemState kind="error" retry={reset} />;
}
