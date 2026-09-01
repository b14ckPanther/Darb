"use client";

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
  const [confirming, setConfirming] = useState(false);
  const action = archiveLocationAction.bind(null, businessId, businessSlug, locationId);
  const [state, formAction, pending] = useActionState(action, initialFormState);

  return (
    <section className="archive-panel" aria-labelledby="archive-location-heading">
      <div>
        <p className="eyebrow">Lifecycle action</p>
        <h2 id="archive-location-heading">Archive this location</h2>
        <p>
          Archiving retires the location and keeps its history. It cannot be edited or restored in
          this phase.
        </p>
      </div>
      {state.message ? (
        <p className="form-alert" role="alert">
          {state.message}
        </p>
      ) : null}
      <button
        type="button"
        className="danger-button danger-button--quiet"
        onClick={() => setConfirming(true)}
      >
        <ArchiveIcon size={18} />
        Archive location
      </button>
      <ConfirmationDialog
        open={confirming}
        pending={pending}
        onClose={() => setConfirming(false)}
        title="Archive this location?"
        description="The location will become historical and read-only. Darb will retain its identity and audit history, and restoration is not available in this phase."
      >
        <button
          type="button"
          className="secondary-button"
          onClick={() => setConfirming(false)}
          disabled={pending}
        >
          Keep location
        </button>
        <form action={formAction}>
          <button type="submit" className="danger-button" disabled={pending}>
            {pending ? "Archiving…" : "Confirm archive"}
          </button>
        </form>
      </ConfirmationDialog>
    </section>
  );
}
