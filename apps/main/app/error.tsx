"use client";

import { useEffect } from "react";

import { reportOperationalError } from "@darb/config/observability";

import { SiteErrorState } from "../components/site-state";

export default function MainError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    reportOperationalError({ application: "main", event: "main.render_failed" });
  }, [error]);

  return <SiteErrorState reset={reset} />;
}
