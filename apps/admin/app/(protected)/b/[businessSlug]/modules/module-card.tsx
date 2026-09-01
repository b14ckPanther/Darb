"use client";

import { useActionState, useState } from "react";

import { CheckmarkCircleIcon, ModulesIcon } from "@darb/icons";

import { ConfirmationDialog } from "../../../../_components/confirmation-dialog";
import { StatusBadge } from "../../../../_components/status-badge";
import { setBusinessModuleEnabledAction } from "../../../../actions/modules";
import { initialFormState } from "../../../../../lib/forms";
import type { BusinessModuleState } from "../../../../../lib/module-state";

interface ModuleCardProps {
  businessId: string;
  businessSlug: string;
  editable: boolean;
  module: BusinessModuleState;
}

export function ModuleCard({ businessId, businessSlug, editable, module }: ModuleCardProps) {
  const [confirmingDisable, setConfirmingDisable] = useState(false);
  const action = setBusinessModuleEnabledAction.bind(null, businessId, businessSlug);
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const canEnable = editable && module.isAvailable;
  const canDisable = editable && module.isEnabled;
  const statusLabel = !module.isAvailable
    ? module.isEnabled
      ? "Stored on · unavailable"
      : "Unavailable"
    : module.isEnabled
      ? "Enabled"
      : "Disabled";

  return (
    <article
      className={`module-card${module.isEffectivelyEnabled ? " is-enabled" : ""}${!module.isAvailable ? " is-unavailable" : ""}`}
      aria-labelledby={`module-${module.key}-heading`}
    >
      <div className="module-card__topline">
        <span className="module-card__icon">
          <ModulesIcon size={22} />
        </span>
        <StatusBadge
          status={
            module.isEffectivelyEnabled
              ? "enabled"
              : module.isAvailable
                ? "disabled"
                : "unavailable"
          }
          label={statusLabel}
        />
      </div>

      <div className="module-card__copy">
        <p className="module-card__key" dir="ltr">
          {module.key}
        </p>
        <h2 id={`module-${module.key}-heading`}>{module.displayName}</h2>
        <p>{module.description}</p>
      </div>

      <div className="module-card__footer">
        <p className="module-card__boundary">
          {module.isEnabled && !module.isAvailable
            ? "Stored state is retained, but the capability is inactive while platform-unavailable."
            : "No engine route or product workflow is created by this setting."}
        </p>

        {state.message ? (
          <p
            className={
              state.status === "success" ? "module-feedback is-success" : "module-feedback is-error"
            }
            role={state.status === "success" ? "status" : "alert"}
          >
            {state.status === "success" ? <CheckmarkCircleIcon size={17} /> : null}
            {state.message}
          </p>
        ) : null}

        {canDisable ? (
          <button
            type="button"
            className="secondary-button module-card__action"
            onClick={() => setConfirmingDisable(true)}
          >
            Disable capability
          </button>
        ) : canEnable ? (
          <form action={formAction}>
            <input type="hidden" name="moduleKey" value={module.key} />
            <input type="hidden" name="enabled" value="true" />
            <button type="submit" className="primary-button module-card__action" disabled={pending}>
              {pending ? "Enabling…" : "Enable capability"}
            </button>
          </form>
        ) : null}
      </div>

      <ConfirmationDialog
        open={canDisable && confirmingDisable}
        pending={pending}
        onClose={() => setConfirmingDisable(false)}
        title={`Disable ${module.displayName}?`}
        description="Disable this capability for the current business? Existing retained foundation data is not deleted, and no engine route is created or removed."
      >
        <button
          type="button"
          className="secondary-button"
          onClick={() => setConfirmingDisable(false)}
          disabled={pending}
        >
          Keep enabled
        </button>
        <form action={formAction}>
          <input type="hidden" name="moduleKey" value={module.key} />
          <input type="hidden" name="enabled" value="false" />
          <button type="submit" className="danger-button" disabled={pending}>
            {pending ? "Disabling…" : "Confirm disable"}
          </button>
        </form>
      </ConfirmationDialog>
    </article>
  );
}
