"use client";

import { useActionState } from "react";

import { CheckmarkCircleIcon, InformationCircleIcon } from "@darb/icons";

import { requestInitialSetupAction } from "../../../../actions/commercial";
import { useAdminI18n } from "../../../../../lib/i18n-client";
import { initialFormState } from "../../../../../lib/forms";
import type { BusinessCommercialSummary } from "../../../../../lib/modules";

export function CommercialSummary({
  businessId,
  businessSlug,
  canRequestSetup,
  summary,
}: {
  businessId: string;
  businessSlug: string;
  canRequestSetup: boolean;
  summary: BusinessCommercialSummary;
}) {
  const { t } = useAdminI18n();
  const [state, action, pending] = useActionState(
    requestInitialSetupAction.bind(null, businessId, businessSlug),
    initialFormState,
  );
  const setupRequested = summary.initialSetupStatus !== "not_requested";

  return (
    <section className="commercial-summary" aria-labelledby="commercial-summary-heading">
      <div className="commercial-summary__heading">
        <span aria-hidden="true">
          <InformationCircleIcon size={21} />
        </span>
        <div>
          <p className="eyebrow">{t("Current access")}</p>
          <h2 id="commercial-summary-heading">{t(summary.planDisplayName)}</h2>
          <p>{t(summary.planDescription)}</p>
        </div>
      </div>
      <dl className="commercial-summary__facts">
        <div>
          <dt>{t("Location allowance")}</dt>
          <dd>
            {summary.maxLocations === null
              ? t("Unlimited for this arrangement")
              : t("{current} of {maximum} locations", {
                  current: summary.currentLocations,
                  maximum: summary.maxLocations,
                })}
          </dd>
        </div>
        <div>
          <dt>{t("Initial setup service")}</dt>
          <dd>{t(setupStatusLabel(summary.initialSetupStatus))}</dd>
        </div>
      </dl>
      {!setupRequested && canRequestSetup ? (
        <form action={action}>
          <button className="secondary-button" type="submit" disabled={pending}>
            {pending ? t("Sending request…") : t("Request initial setup")}
          </button>
        </form>
      ) : null}
      {state.message ? (
        <p className={state.status === "error" ? "inline-error" : "inline-success"} role="status">
          {state.status === "success" ? <CheckmarkCircleIcon size={17} /> : null}
          {t(state.message)}
        </p>
      ) : null}
    </section>
  );
}

function setupStatusLabel(status: string): string {
  if (status === "requested") return "Requested";
  if (status === "accepted") return "Accepted";
  if (status === "in_progress") return "In progress";
  if (status === "completed") return "Completed";
  if (status === "cancelled") return "Cancelled";
  return "Not requested";
}
