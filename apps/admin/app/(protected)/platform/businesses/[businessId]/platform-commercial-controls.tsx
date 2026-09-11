"use client";

import { useActionState, useState } from "react";

import { ModulesIcon } from "@darb/icons";

import { ConfirmationDialog } from "../../../../_components/confirmation-dialog";
import { updatePlatformCommercialAction } from "../../../../actions/platform-commercial";
import type { PlatformMutationState } from "../../../../actions/platform";
import { useAdminI18n } from "../../../../../lib/i18n-client";
import type { PlatformBusinessCommercial, PlatformPlan } from "../../../../../lib/platform";

type PendingChange =
  | { operation: "plan"; planKey: string; label: string }
  | { decision: string; moduleKey: string; operation: "override"; reason: string }
  | { operation: "setup"; status: string };

const initialState = { message: "", status: "idle" } as const;

export function PlatformCommercialControls({
  businessId,
  businessName,
  commercial,
  plans,
}: {
  businessId: string;
  businessName: string;
  commercial: PlatformBusinessCommercial;
  plans: PlatformPlan[];
}) {
  const { t } = useAdminI18n();
  const [change, setChange] = useState<PendingChange | null>(null);
  const [state, action, pending] = useActionState(
    async (previousState: PlatformMutationState, formData: FormData) => {
      const nextState = await updatePlatformCommercialAction(previousState, formData);
      setChange(null);
      return nextState;
    },
    initialState,
  );

  return (
    <section className="platform-detail-section" aria-labelledby="commercial-access-heading">
      <div className="platform-section-heading">
        <div>
          <p className="eyebrow">{t("Platform controlled")}</p>
          <h2 id="commercial-access-heading">{t("Plans and entitlements")}</h2>
          <p>
            {t(
              "Plan inclusion, explicit overrides, tenant enablement, and effective access remain separate.",
            )}
          </p>
        </div>
      </div>

      <div className="platform-commercial-grid">
        <article className="platform-detail-card">
          <span>
            <ModulesIcon size={21} />
          </span>
          <div>
            <p className="eyebrow">{t("Current plan")}</p>
            <h3>{t(commercial.summary.planDisplayName)}</h3>
            <div className="platform-commercial-actions">
              {plans
                .filter((plan) => plan.isAvailable && plan.status === "active")
                .map((plan) => (
                  <button
                    type="button"
                    className={
                      plan.key === commercial.summary.planKey
                        ? "primary-button"
                        : "secondary-button"
                    }
                    disabled={pending || plan.key === commercial.summary.planKey}
                    key={plan.key}
                    onClick={() =>
                      setChange({ operation: "plan", planKey: plan.key, label: plan.displayName })
                    }
                  >
                    {t(plan.displayName)}
                  </button>
                ))}
            </div>
          </div>
        </article>

        <div className="platform-commercial-modules">
          {commercial.modules.map((module) => {
            const override = commercial.overrides.find((item) => item.moduleKey === module.key);
            return (
              <form
                className="platform-commercial-module"
                key={module.key}
                onSubmit={(event) => {
                  event.preventDefault();
                  const data = new FormData(event.currentTarget);
                  setChange({
                    decision: String(data.get("decision") ?? ""),
                    moduleKey: module.key,
                    operation: "override",
                    reason: String(data.get("reason") ?? ""),
                  });
                }}
              >
                <div>
                  <strong>{t(module.displayName)}</strong>
                  <p>
                    {t(
                      module.effective
                        ? "Effective access"
                        : module.entitled
                          ? "Included, not effective"
                          : "Not entitled",
                    )}
                  </p>
                  {override ? (
                    <small>
                      {t("Override")}: {t(override.decision)} · {override.reason}
                    </small>
                  ) : null}
                </div>
                <label>
                  <span>{t("Override decision")}</span>
                  <select name="decision" defaultValue={override?.decision ?? ""}>
                    <option value="">{t("Use plan")}</option>
                    <option value="grant">{t("Grant")}</option>
                    <option value="deny">{t("Deny")}</option>
                  </select>
                </label>
                <label>
                  <span>{t("Operator reason")}</span>
                  <input name="reason" defaultValue={override?.reason ?? ""} maxLength={500} />
                </label>
                <button type="submit" className="secondary-button" disabled={pending}>
                  {t("Review change")}
                </button>
              </form>
            );
          })}
        </div>

        {commercial.summary.initialSetupStatus !== "not_requested" ? (
          <article className="platform-detail-card platform-detail-card--wide">
            <div>
              <p className="eyebrow">{t("Initial setup service")}</p>
              <h3>{t(statusLabel(commercial.summary.initialSetupStatus))}</h3>
              <div className="platform-commercial-actions">
                {nextSetupStates(commercial.summary.initialSetupStatus).map((status) => (
                  <button
                    className="secondary-button"
                    type="button"
                    key={status}
                    onClick={() => setChange({ operation: "setup", status })}
                  >
                    {t(statusLabel(status))}
                  </button>
                ))}
              </div>
            </div>
          </article>
        ) : null}
      </div>

      {state.message ? (
        <p className={state.status === "error" ? "inline-error" : "inline-success"} role="status">
          {t(state.message)}
        </p>
      ) : null}

      <ConfirmationDialog
        open={change !== null}
        pending={pending}
        onClose={() => setChange(null)}
        title={t("Confirm commercial access change")}
        description={t(
          "This changes platform-controlled access for {businessName}. Existing product data is retained and the action is audited.",
          { businessName },
        )}
      >
        <button
          className="secondary-button"
          type="button"
          disabled={pending}
          onClick={() => setChange(null)}
        >
          {t("Cancel")}
        </button>
        {change ? (
          <form action={action}>
            <input type="hidden" name="businessId" value={businessId} />
            <input type="hidden" name="operation" value={change.operation} />
            {change.operation === "plan" ? (
              <input type="hidden" name="planKey" value={change.planKey} />
            ) : null}
            {change.operation === "override" ? (
              <>
                <input type="hidden" name="moduleKey" value={change.moduleKey} />
                <input type="hidden" name="decision" value={change.decision} />
                <input type="hidden" name="reason" value={change.reason} />
              </>
            ) : null}
            {change.operation === "setup" ? (
              <input type="hidden" name="status" value={change.status} />
            ) : null}
            <button className="danger-button" type="submit" disabled={pending}>
              {pending ? t("Applying…") : t("Confirm change")}
            </button>
          </form>
        ) : null}
      </ConfirmationDialog>
    </section>
  );
}

function statusLabel(status: string) {
  return status === "in_progress"
    ? "In progress"
    : `${status.charAt(0).toUpperCase()}${status.slice(1)}`;
}

function nextSetupStates(status: string): string[] {
  if (status === "requested") return ["accepted", "cancelled"];
  if (status === "accepted") return ["in_progress", "cancelled"];
  if (status === "in_progress") return ["completed", "cancelled"];
  return [];
}
