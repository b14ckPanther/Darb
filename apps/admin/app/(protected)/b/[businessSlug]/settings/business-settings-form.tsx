"use client";

import { useActionState } from "react";

import { CheckmarkCircleIcon, InformationCircleIcon, SettingsIcon } from "@darb/icons";
import { getTextDirection, supportedLocales } from "@darb/i18n";

import { updateBusinessSettingsAction } from "../../../../actions/core-admin";
import type { AccessibleBusiness } from "../../../../../lib/auth";
import { initialFormState, isValidCurrencyCode } from "../../../../../lib/forms";

interface BusinessSettingsFormProps {
  business: AccessibleBusiness;
  editable: boolean;
  timezones: string[];
}

const localeNames = { ar: "العربية", en: "English", he: "עברית" } as const;

export function BusinessSettingsForm({ business, editable, timezones }: BusinessSettingsFormProps) {
  const action = updateBusinessSettingsAction.bind(null, business.id, business.slug);
  const [state, formAction, pending] = useActionState(action, initialFormState);

  return (
    <form className="settings-form" action={formAction}>
      {state.message ? (
        <p
          className={state.status === "success" ? "form-success" : "form-alert"}
          role={state.status === "success" ? "status" : "alert"}
        >
          {state.status === "success" ? <CheckmarkCircleIcon size={18} /> : null}
          {state.message}
        </p>
      ) : null}

      <section className="form-section" aria-labelledby="business-identity-heading">
        <div className="form-section__heading">
          <span>
            <SettingsIcon size={19} />
          </span>
          <div>
            <h2 id="business-identity-heading">Business identity</h2>
            <p>The core name and URL identifier used across Darb administration.</p>
          </div>
        </div>
        <div className="form-grid form-grid--two">
          <div className="field-group">
            <label htmlFor="business-display-name">Display name</label>
            <div className="field-control">
              <input
                id="business-display-name"
                name="displayName"
                defaultValue={business.display_name}
                maxLength={160}
                required
                disabled={!editable}
                aria-describedby={
                  state.fieldErrors?.displayName ? "business-display-name-error" : undefined
                }
              />
            </div>
            {state.fieldErrors?.displayName ? (
              <p id="business-display-name-error" className="field-error">
                {state.fieldErrors.displayName}
              </p>
            ) : null}
          </div>
          <div className="field-group">
            <label htmlFor="business-slug">Business slug</label>
            <div className="field-control field-control--prefix">
              <span className="field-prefix">admin.darb.co.il/b/</span>
              <input
                id="business-slug"
                name="slug"
                defaultValue={business.slug}
                minLength={3}
                maxLength={63}
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                dir="ltr"
                required
                disabled={!editable}
                aria-describedby="business-slug-hint business-slug-error"
              />
            </div>
            <p id="business-slug-hint" className="field-hint">
              Changing this updates the canonical admin URL.
            </p>
            {state.fieldErrors?.slug ? (
              <p id="business-slug-error" className="field-error">
                {state.fieldErrors.slug}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="form-section" aria-labelledby="business-regional-heading">
        <div className="form-section__heading">
          <span>
            <InformationCircleIcon size={19} />
          </span>
          <div>
            <h2 id="business-regional-heading">Regional defaults</h2>
            <p>
              Defaults for future Darb experiences; individual locations may use another timezone.
            </p>
          </div>
        </div>
        <div className="form-grid form-grid--three">
          <div className="field-group">
            <label htmlFor="business-default-locale">Default language</label>
            <div className="select-control">
              <select
                id="business-default-locale"
                name="defaultLocale"
                defaultValue={business.default_locale}
                disabled={!editable}
              >
                {supportedLocales.map((locale) => (
                  <option key={locale} value={locale} lang={locale} dir={getTextDirection(locale)}>
                    {localeNames[locale]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="field-group">
            <label htmlFor="business-timezone">Timezone</label>
            <div className="select-control">
              <select
                id="business-timezone"
                name="timezone"
                defaultValue={business.timezone}
                disabled={!editable}
                dir="ltr"
              >
                {timezones.map((timezone) => (
                  <option key={timezone} value={timezone}>
                    {timezone}
                  </option>
                ))}
              </select>
            </div>
            {state.fieldErrors?.timezone ? (
              <p className="field-error">{state.fieldErrors.timezone}</p>
            ) : null}
          </div>
          <div className="field-group">
            <label htmlFor="business-currency">Currency</label>
            <div className="field-control field-control--readonly">
              <input
                id="business-currency"
                value={isValidCurrencyCode(business.currency_code) ? business.currency_code : "—"}
                readOnly
                disabled
              />
            </div>
            <p className="field-hint">
              Currency changes are deferred until monetary workflows exist.
            </p>
          </div>
        </div>
      </section>

      <section
        className="form-section form-section--lifecycle"
        aria-labelledby="business-lifecycle-heading"
      >
        <div className="form-section__heading">
          <span>
            <InformationCircleIcon size={19} />
          </span>
          <div>
            <h2 id="business-lifecycle-heading">Lifecycle</h2>
            <p>
              Archived businesses retain their data and can be reactivated. Suspension is controlled
              by Darb platform administration.
            </p>
          </div>
        </div>
        <div className="field-group field-group--compact">
          <label htmlFor="business-status">Business status</label>
          <div className="select-control">
            <select
              id="business-status"
              name="status"
              defaultValue={business.status === "suspended" ? "active" : business.status}
              disabled={!editable}
            >
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          {business.status === "suspended" ? (
            <p className="field-error">
              This business is suspended by Darb platform administration.
            </p>
          ) : null}
        </div>
      </section>

      {editable ? (
        <div className="form-actions">
          <button className="primary-button primary-button--fit" type="submit" disabled={pending}>
            {pending ? "Saving settings…" : "Save business settings"}
          </button>
        </div>
      ) : null}
    </form>
  );
}
