"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { ArchiveIcon, CheckmarkCircleIcon, ShieldIcon } from "@darb/icons";

import { ConfirmationDialog } from "../../../../_components/confirmation-dialog";
import {
  setPlatformBusinessStatusAction,
  type PlatformMutationState,
} from "../../../../actions/platform";
import type { PlatformBusinessTransition } from "../../../../../lib/platform-model";

const initialPlatformMutationState = {
  message: "",
  status: "idle",
} satisfies PlatformMutationState;

interface PlatformBusinessStatusControlProps {
  businessId: string;
  businessName: string;
  transition: PlatformBusinessTransition;
}

export function PlatformBusinessStatusControl({
  businessId,
  businessName,
  transition,
}: PlatformBusinessStatusControlProps) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(
    setPlatformBusinessStatusAction,
    initialPlatformMutationState,
  );

  const Icon =
    transition.status === "active"
      ? CheckmarkCircleIcon
      : transition.status === "archived"
        ? ArchiveIcon
        : ShieldIcon;

  return (
    <div className="platform-lifecycle-action">
      <button
        type="button"
        className={transition.tone === "danger" ? "danger-button" : "secondary-button"}
        onClick={() => setOpen(true)}
      >
        <Icon size={18} />
        {transition.label}
      </button>
      {state.message ? (
        <p className={state.status === "error" ? "inline-error" : "inline-success"} role="status">
          {state.message}
        </p>
      ) : null}
      <ConfirmationDialog
        open={open}
        onClose={() => setOpen(false)}
        pending={pending}
        title={transition.label}
        description={`${transition.description} This action applies to ${businessName} and will be recorded in platform audit history.`}
      >
        <button
          type="button"
          className="secondary-button"
          disabled={pending}
          onClick={() => setOpen(false)}
        >
          Cancel
        </button>
        <form action={action}>
          <input type="hidden" name="businessId" value={businessId} />
          <input type="hidden" name="status" value={transition.status} />
          <PlatformSubmitButton label={transition.label} tone={transition.tone} />
        </form>
      </ConfirmationDialog>
    </div>
  );
}

function PlatformSubmitButton({
  label,
  tone,
}: {
  label: string;
  tone: PlatformBusinessTransition["tone"];
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={tone === "danger" ? "danger-button" : "primary-button primary-button--fit"}
      disabled={pending}
    >
      {pending ? "Applying…" : label}
    </button>
  );
}
