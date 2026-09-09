"use client";

import { useAdminI18n } from "../../../../../lib/i18n-client";

import { useActionState, useState } from "react";

import { ArchiveIcon } from "@darb/icons";

import { ConfirmationDialog } from "../../../../_components/confirmation-dialog";
import { archiveLocationAction } from "../../../../actions/core-admin";
import { initialFormState } from "../../../../../lib/forms";

interface ArchiveLocationControlProps {
  businessId: string;
  businessSlug: string;
  locationId: string;
}

export function ArchiveLocationControl({
  businessId,
  businessSlug,
  locationId,
}: ArchiveLocationControlProps) {
  const { t } = useAdminI18n();
  const [confirming, setConfirming] = useState(false);
  const action = archiveLocationAction.bind(null, businessId, businessSlug, locationId);
  const [state, formAction, pending] = useActionState(action, initialFormState);

  return (
    <section className="archive-panel" aria-labelledby="archive-location-heading">
      <div>
        <p className="eyebrow">{t("Lifecycle action")}</p>
        <h2 id="archive-location-heading">{t("Archive this location")}</h2>
        <p>
          {t(
            "Archiving retires the location and keeps its history. It cannot be edited or restored in this phase.",
          )}
        </p>
      </div>
      {state.message ? (
        <p className="form-alert" role="alert">
          {t(state.message)}
        </p>
      ) : null}
      <button
        type="button"
        className="danger-button danger-button--quiet"
        onClick={() => setConfirming(true)}
      >
        <ArchiveIcon size={18} />
        {t("Archive location")}
      </button>
      <ConfirmationDialog
        open={confirming}
        pending={pending}
        onClose={() => setConfirming(false)}
        title={t("Archive this location?")}
        description={t(
          "The location will become historical and read-only. Darb will retain its identity and audit history, and restoration is not available in this phase.",
        )}
      >
        <button
          type="button"
          className="secondary-button"
          onClick={() => setConfirming(false)}
          disabled={pending}
        >
          {t("Keep location")}
        </button>
        <form action={formAction}>
          <button type="submit" className="danger-button" disabled={pending}>
            {pending ? t("Archiving…") : t("Confirm archive")}
          </button>
        </form>
      </ConfirmationDialog>
    </section>
  );
}
