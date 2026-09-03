"use client";

import { useEffect } from "react";

import { reportOperationalError } from "@darb/config/observability";
import { AlertCircleIcon } from "@darb/icons";
import { DarbMark } from "@darb/ui";

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

  return (
    <main className="system-state">
      <DarbMark size={46} />
      <span className="system-state__status-icon" aria-hidden="true">
        <AlertCircleIcon size={19} />
      </span>
      <h1>Restaurant unavailable</h1>
      <p>The menu could not be loaded safely. Please try again.</p>
      <button type="button" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
