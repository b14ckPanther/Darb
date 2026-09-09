"use client";

import { useAdminI18n } from "../../../../../lib/i18n-client";

import { useActionState } from "react";

import { DomainIcon } from "@darb/icons";

import { addBusinessDomainAction } from "../../../../actions/domains";
import { initialFormState } from "../../../../../lib/forms";

interface AddDomainFormProps {
  businessId: string;
  businessSlug: string;
}

export function AddDomainForm({ businessId, businessSlug }: AddDomainFormProps) {
  const { t } = useAdminI18n();
  const action = addBusinessDomainAction.bind(null, businessId, businessSlug);
  const [state, formAction, pending] = useActionState(action, initialFormState);

  return (
    <section className="domain-add-panel" aria-labelledby="add-domain-heading">
      <div>
        <span>
          <DomainIcon size={23} />
        </span>
        <div>
          <h2 id="add-domain-heading">{t("Claim a hostname")}</h2>
          <p>{t("Enter only the hostname. Darb will normalize it and generate DNS proof.")}</p>
        </div>
      </div>
      <form action={formAction}>
        <div className="field-group">
          <label htmlFor="domain-hostname">{t("Hostname")}</label>
          <input
            id="domain-hostname"
            name="hostname"
            type="text"
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            placeholder="www.example.com"
            aria-describedby="domain-hostname-hint domain-hostname-error"
            disabled={pending}
            required
          />
          <p id="domain-hostname-hint" className="field-hint">
            {t("No https://, path, or port.")}
          </p>
          {state.fieldErrors?.hostname ? (
            <p id="domain-hostname-error" className="field-error">
              {t(state.fieldErrors.hostname)}
            </p>
          ) : null}
        </div>
        <button type="submit" className="primary-button" disabled={pending}>
          {pending ? t("Adding securely…") : t("Add domain")}
        </button>
      </form>
      {state.message ? (
        <p className={state.status === "success" ? "success-alert" : "form-alert"} role="status">
          {t(state.message)}
        </p>
      ) : null}
    </section>
  );
}
