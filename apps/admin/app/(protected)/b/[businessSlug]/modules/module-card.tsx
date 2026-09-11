"use client";

import { useAdminI18n } from "../../../../../lib/i18n-client";

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

const moduleDescriptions: Readonly<Record<string, string>> = {
  booking: "Appointments and reservations when this service becomes available.",
  commerce: "Digital selling tools when this service becomes available.",
  pages: "Managed pages and publishing when this service becomes available.",
  restaurant: "Manage your Restaurant presence and public menu.",
};

export function ModuleCard({ businessId, businessSlug, editable, module }: ModuleCardProps) {
  const { t } = useAdminI18n();
  const [confirmingDisable, setConfirmingDisable] = useState(false);
  const action = setBusinessModuleEnabledAction.bind(null, businessId, businessSlug);
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const canEnable = editable && module.isAvailable && module.isEntitled;
  const canDisable = editable && module.isEnabled;
  const statusLabel = !module.isAvailable
    ? module.isEnabled
      ? "Stored on · unavailable"
      : "Unavailable"
    : !module.isEntitled
      ? module.isEnabled
        ? "Stored on · not included"
        : "Not included"
      : module.isEnabled
        ? "Enabled"
        : "Disabled";

  return (
    <article
      className={`module-card${module.isEffectivelyEnabled ? " is-enabled" : ""}${!module.isAvailable || !module.isEntitled ? " is-unavailable" : ""}`}
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
              : module.isAvailable && module.isEntitled
                ? "disabled"
                : "unavailable"
          }
          label={t(statusLabel)}
        />
      </div>

      <div className="module-card__copy">
        <p className="module-card__key" dir="ltr">
          {module.key}
        </p>
        <h2 id={`module-${module.key}-heading`}>{t(module.displayName)}</h2>
        <p>{t(moduleDescriptions[module.key] ?? module.description)}</p>
      </div>

      <div className="module-card__footer">
        <p className="module-card__boundary">
          {module.isEnabled && (!module.isAvailable || !module.isEntitled)
            ? t(
                "Stored state is retained, but this capability is inactive while access is unavailable.",
              )
            : !module.isEntitled
              ? t("This capability is not included in the current arrangement.")
              : t("Included access still requires this business-level switch to be enabled.")}
        </p>

        {state.message ? (
          <p
            className={
              state.status === "success" ? "module-feedback is-success" : "module-feedback is-error"
            }
            role={state.status === "success" ? "status" : "alert"}
          >
            {state.status === "success" ? <CheckmarkCircleIcon size={17} /> : null}
            {t(state.message)}
          </p>
        ) : null}

        {canDisable ? (
          <button
            type="button"
            className="secondary-button module-card__action"
            onClick={() => setConfirmingDisable(true)}
          >
            {t("Disable capability")}
          </button>
        ) : canEnable ? (
          <form action={formAction}>
            <input type="hidden" name="moduleKey" value={module.key} />
            <input type="hidden" name="enabled" value="true" />
            <button type="submit" className="primary-button module-card__action" disabled={pending}>
              {pending ? t("Enabling…") : t("Enable capability")}
            </button>
          </form>
        ) : null}
      </div>

      <ConfirmationDialog
        open={canDisable && confirmingDisable}
        pending={pending}
        onClose={() => setConfirmingDisable(false)}
        title={t("Disable {name}?", { name: t(module.displayName) })}
        description={t(
          "Disable this capability for the current business? Existing retained foundation data is not deleted, and no engine route is created or removed.",
        )}
      >
        <button
          type="button"
          className="secondary-button"
          onClick={() => setConfirmingDisable(false)}
          disabled={pending}
        >
          {t("Keep enabled")}
        </button>
        <form action={formAction}>
          <input type="hidden" name="moduleKey" value={module.key} />
          <input type="hidden" name="enabled" value="false" />
          <button type="submit" className="danger-button" disabled={pending}>
            {pending ? t("Disabling…") : t("Confirm disable")}
          </button>
        </form>
      </ConfirmationDialog>
    </article>
  );
}
