"use client";

import { useEffect } from "react";

import { reportOperationalError } from "@darb/config/observability";

import { AdminState } from "../../_components/admin-state";

export default function PlatformError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportOperationalError({
      application: "admin",
      digest: error.digest,
      event: "admin.platform_control_plane_failed",
    });
  }, [error.digest]);

  return (
    <AdminState
      tone="error"
      eyebrow="Platform operations"
      title="The control plane could not be loaded."
      description="No platform data was changed. Retry the request, or return to a business workspace while the issue is investigated."
      action={
        <button className="secondary-button" type="button" onClick={reset}>
          Retry platform request
        </button>
      }
    />
  );
}
