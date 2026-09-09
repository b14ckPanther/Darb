"use client";

import { useEffect } from "react";

import { reportOperationalError } from "@darb/config/observability";
import { RestaurantSystemState } from "../components/restaurant-system-state";

export default function PublicRestaurantError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    reportOperationalError({ application: "rest", event: "restaurant.public_render_failed" });
  }, [error]);

  return <RestaurantSystemState kind="error" retry={reset} />;
}
