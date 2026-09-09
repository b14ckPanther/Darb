"use client";

import { useEffect } from "react";

import { reportOperationalError } from "@darb/config/observability";
import { ResetIcon } from "@darb/icons";

import { AdminState } from "./_components/admin-state";
import { useAdminI18n } from "../lib/i18n-client";

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  const { t } = useAdminI18n();
  useEffect(() => {
    reportOperationalError({ application: "admin", event: "admin.render_failed" });
  }, [error]);

  return (
    <main id="main-content" className="route-state-page">
      <AdminState
        branded
        tone="error"
        eyebrow="Admin interrupted"
        title="Darb Admin could not be loaded."
        description="Try again. Your session and tenant boundaries remain protected."
        action={
          <button type="button" className="primary-button primary-button--fit" onClick={reset}>
            <ResetIcon size={18} />
            {t("Try again")}
          </button>
        }
      />
    </main>
  );
}
