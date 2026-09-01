"use client";

import { useEffect } from "react";

import { AlertCircleIcon } from "@darb/icons";

export default function RestaurantError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error("Public Restaurant render failed", { name: error.name });
  }, [error]);

  return (
    <main className="system-state">
      <AlertCircleIcon size={34} />
      <h1>We couldn’t load this menu</h1>
      <p>Please try again. No changes were made.</p>
      <button type="button" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
