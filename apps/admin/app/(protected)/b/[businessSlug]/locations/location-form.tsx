"use client";

import { useAdminI18n } from "../../../../../lib/i18n-client";

import { useActionState } from "react";

import { CheckmarkCircleIcon, LocationIcon } from "@darb/icons";

import { createLocationAction, updateLocationAction } from "../../../../actions/core-admin";
import type { AccessibleBusiness, AccessibleLocation } from "../../../../../lib/auth";
import { initialFormState } from "../../../../../lib/forms";

interface LocationFormProps {
  business: AccessibleBusiness;
  editable: boolean;
  location?: AccessibleLocation;
  timezones: string[];
}

export function LocationForm({ business, editable, location, timezones }: LocationFormProps) {
  const { t } = useAdminI18n();
  const action = location
    ? updateLocationAction.bind(null, business.id, business.slug, location.id)
    : createLocationAction.bind(null, business.id, business.slug);
  const [state, formAction, pending] = useActionState(action, initialFormState);

  return (
    <form className="settings-form" action={formAction}>
      {state.message ? (
        <p
          className={state.status === "success" ? "form-success" : "form-alert"}
          role={state.status === "success" ? "status" : "alert"}
        >
          {state.status === "success" ? <CheckmarkCircleIcon size={18} /> : null}
          {t(state.message)}
        </p>
      ) : null}

      <section className="form-section" aria-labelledby="location-details-heading">
        <div className="form-section__heading">
          <span>
            <LocationIcon size={19} />
          </span>
          <div>
            <h2 id="location-details-heading">{t("Location details")}</h2>
            <p>
              {t("Reusable core details only—no engine-specific schedules or operational fields.")}
            </p>
          </div>
        </div>

        <div className="form-grid form-grid--two">
          <div className="field-group form-grid__wide">
            <label htmlFor="location-display-name">{t("Display name")}</label>
            <div className="field-control">
              <input
                id="location-display-name"
                name="displayName"
                defaultValue={location?.display_name ?? ""}
                maxLength={160}
                required
                disabled={!editable}
                aria-describedby={
                  state.fieldErrors?.displayName ? "location-display-name-error" : undefined
                }
              />
            </div>
            {state.fieldErrors?.displayName ? (
              <p id="location-display-name-error" className="field-error">
                {t(state.fieldErrors.displayName)}
              </p>
            ) : null}
          </div>

          <div className="field-group form-grid__wide">
            <label htmlFor="location-address-line">{t("Address line")}</label>
            <div className="field-control">
              <input
                id="location-address-line"
                name="addressLine"
                defaultValue={location?.address_line ?? ""}
                maxLength={500}
                disabled={!editable}
                dir="auto"
              />
            </div>
            {state.fieldErrors?.addressLine ? (
              <p className="field-error">{t(state.fieldErrors.addressLine)}</p>
            ) : null}
          </div>

          <div className="field-group">
            <label htmlFor="location-locality">{t("Locality / city")}</label>
            <div className="field-control">
              <input
                id="location-locality"
                name="locality"
                defaultValue={location?.locality ?? ""}
                maxLength={160}
                disabled={!editable}
                dir="auto"
              />
            </div>
            {state.fieldErrors?.locality ? (
              <p className="field-error">{t(state.fieldErrors.locality)}</p>
            ) : null}
          </div>

          <div className="form-grid form-grid--split">
            <div className="field-group">
              <label htmlFor="location-postal-code">{t("Postal code")}</label>
              <div className="field-control">
                <input
                  id="location-postal-code"
                  name="postalCode"
                  defaultValue={location?.postal_code ?? ""}
                  maxLength={32}
                  disabled={!editable}
                  dir="ltr"
                />
              </div>
              {state.fieldErrors?.postalCode ? (
                <p className="field-error">{t(state.fieldErrors.postalCode)}</p>
              ) : null}
            </div>
            <div className="field-group">
              <label htmlFor="location-country-code">{t("Country")}</label>
              <div className="field-control">
                <input
                  id="location-country-code"
                  name="countryCode"
                  defaultValue={location?.country_code ?? "IL"}
                  minLength={2}
                  maxLength={2}
                  pattern="[A-Za-z]{2}"
                  disabled={!editable}
                  dir="ltr"
                />
              </div>
              {state.fieldErrors?.countryCode ? (
                <p className="field-error">{t(state.fieldErrors.countryCode)}</p>
              ) : null}
            </div>
          </div>

          <div className="field-group">
            <label htmlFor="location-timezone">{t("Timezone")}</label>
            <div className="select-control">
              <select
                id="location-timezone"
                name="timezone"
                defaultValue={location?.timezone ?? ""}
                disabled={!editable}
                dir="ltr"
              >
                <option value="">
                  {t("Use business timezone ({timezone})", { timezone: business.timezone })}
                </option>
                {timezones.map((timezone) => (
                  <option key={timezone} value={timezone}>
                    {timezone}
                  </option>
                ))}
              </select>
            </div>
            {state.fieldErrors?.timezone ? (
              <p className="field-error">{t(state.fieldErrors.timezone)}</p>
            ) : null}
          </div>

          {location ? (
            <div className="field-group">
              <label htmlFor="location-status">{t("Operational status")}</label>
              <div className="select-control">
                <select
                  id="location-status"
                  name="status"
                  defaultValue={location.status === "archived" ? "inactive" : location.status}
                  disabled={!editable}
                >
                  <option value="active">{t("Active")}</option>
                  <option value="inactive">{t("Inactive")}</option>
                </select>
              </div>
              <p className="field-hint">
                {t("Inactive is temporary; archive is a separate retirement action.")}
              </p>
            </div>
          ) : null}
        </div>
      </section>

      {editable ? (
        <div className="form-actions">
          <button className="primary-button primary-button--fit" type="submit" disabled={pending}>
            {pending
              ? location
                ? t("Saving location…")
                : t("Creating location…")
              : location
                ? t("Save location")
                : t("Create location")}
          </button>
        </div>
      ) : null}
    </form>
  );
}
