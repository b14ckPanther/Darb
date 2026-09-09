"use client";

import { useEffect } from "react";

import { reportOperationalError } from "@darb/config/observability";
import { ResetIcon } from "@darb/icons";

import { AdminState } from "../../../_components/admin-state";
import { useAdminI18n } from "../../../../lib/i18n-client";

interface BusinessErrorProps {
  error: Error & { digest?: string };
  retry: () => void;
}

export default function BusinessError({ error, retry }: BusinessErrorProps) {
  const { t } = useAdminI18n();
  useEffect(() => {
    reportOperationalError({
      application: "admin",
      digest: error.digest,
      event: "admin.business_workspace_failed",
    });
  }, [error.digest]);

  return (
    <AdminState
      tone="error"
      eyebrow="Workspace interrupted"
      title="This section could not be loaded."
      description="Your business context is still protected. Try loading the section again; no internal error details have been exposed."
      action={
        <button type="button" className="primary-button primary-button--fit" onClick={retry}>
          <ResetIcon size={18} />
          {t("Try again")}
        </button>
      }
    />
  );
}
