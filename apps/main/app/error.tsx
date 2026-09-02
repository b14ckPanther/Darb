"use client";

import { useEffect } from "react";

import { reportOperationalError } from "@darb/config/observability";

export default function MainError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    reportOperationalError({ application: "main", event: "main.render_failed" });
  }, [error]);

  return (
    <main id="main-content" className="foundation">
      <section className="foundation__content" aria-labelledby="error-title">
        <p className="foundation__brand">Darb</p>
        <h1 id="error-title">This page could not be loaded</h1>
        <p className="foundation__description">
          Please try again. No internal details were exposed.
        </p>
        <button type="button" className="foundation__action" onClick={reset}>
          Try again
        </button>
      </section>
    </main>
  );
}
