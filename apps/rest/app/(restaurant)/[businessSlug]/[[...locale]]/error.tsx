"use client";

import { useEffect } from "react";

import { reportOperationalError } from "@darb/config/observability";
import { AlertCircleIcon } from "@darb/icons";
import { DarbMark } from "@darb/ui";

export default function RestaurantError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    reportOperationalError({ application: "rest", event: "restaurant.render_failed" });
  }, [error]);

  return (
    <main className="system-state">
      <DarbMark size={46} />
      <span className="system-state__status-icon" aria-hidden="true">
        <AlertCircleIcon size={19} />
      </span>
      <h1>We couldn’t load this menu</h1>
      <p>Please try again. No changes were made.</p>
      <button type="button" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
