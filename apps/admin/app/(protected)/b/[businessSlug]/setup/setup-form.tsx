"use client";

import { useActionState, useState } from "react";
import { BuildingIcon, CheckmarkCircleIcon, LocationIcon, RestaurantIcon } from "@darb/icons";
import { supportedLocales } from "@darb/i18n";

import { completeFirstBusinessSetupAction } from "../../../../actions/onboarding";
import { useAdminI18n } from "../../../../../lib/i18n-client";
import { initialFormState } from "../../../../../lib/forms";
import type { AccessibleBusiness } from "../../../../../lib/auth";

const localeNames = { ar: "العربية", he: "עברית", en: "English" } as const;

export function FirstBusinessSetupForm({
  business,
  restaurantAvailable,
}: {
  business: AccessibleBusiness;
  restaurantAvailable: boolean;
}) {
  const { t } = useAdminI18n();
  const action = completeFirstBusinessSetupAction.bind(
    null,
    business.id,
    business.slug,
    business.default_locale,
  );
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const [businessType, setBusinessType] = useState("restaurant");
  const [moduleKey, setModuleKey] = useState<"" | "restaurant">(
    restaurantAvailable ? "restaurant" : "",
  );
  const [createLocation, setCreateLocation] = useState(restaurantAvailable);
  const [enabledLocales, setEnabledLocales] = useState(() => new Set([business.default_locale]));
  const [locationName, setLocationName] = useState("");
  const [locationLocality, setLocationLocality] = useState("");
  const [locationAddress, setLocationAddress] = useState("");

  return (
    <form action={formAction} className="setup-form" aria-busy={pending}>
      <section className="setup-section" aria-labelledby="business-type-heading">
        <span className="setup-section__icon">
          <BuildingIcon size={22} />
        </span>
        <div>
          <h2 id="business-type-heading">{t("What kind of business are you setting up?")}</h2>
          <p>
            {t(
              "This guides the recommendation only; it does not lock your business into a category.",
            )}
          </p>
          <div className="select-control">
            <select
              name="businessType"
              value={businessType}
              onChange={(event) => {
                const value = event.target.value;
                setBusinessType(value);
                if (value === "restaurant" && restaurantAvailable) {
                  setModuleKey("restaurant");
                  setCreateLocation(true);
                }
              }}
            >
              <option value="restaurant">{t("Restaurant, café, bakery or food business")}</option>
              <option value="beauty">{t("Salon, barber or beauty")}</option>
              <option value="professional">{t("Clinic or professional services")}</option>
              <option value="retail">{t("Retail")}</option>
              <option value="other">{t("Other")}</option>
            </select>
          </div>
        </div>
      </section>
      <section className="setup-section" aria-labelledby="product-choice-heading">
        <span className="setup-section__icon">
          <RestaurantIcon size={22} />
        </span>
        <div>
          <h2 id="product-choice-heading">{t("Choose your starting product")}</h2>
          <p>
            {t(
              "Restaurant is ready today. Other Darb products will appear only when they are genuinely available.",
            )}
          </p>
          <div className="setup-choice-grid">
            <label className={`setup-choice${moduleKey === "restaurant" ? " is-selected" : ""}`}>
              <input
                type="radio"
                name="moduleKey"
                value="restaurant"
                checked={moduleKey === "restaurant"}
                disabled={!restaurantAvailable}
                onChange={() => {
                  setModuleKey("restaurant");
                  setCreateLocation(true);
                }}
              />
              <RestaurantIcon size={24} />
              <strong>{t("Restaurant")}</strong>
              <small>{t("Available now")}</small>
            </label>
            <label className={`setup-choice${moduleKey === "" ? " is-selected" : ""}`}>
              <input
                type="radio"
                name="moduleKey"
                value=""
                checked={moduleKey === ""}
                onChange={() => setModuleKey("")}
              />
              <BuildingIcon size={24} />
              <strong>{t("Business workspace only")}</strong>
              <small>{t("Start with the core tools and enable products later.")}</small>
            </label>
          </div>
          {state.fieldErrors?.moduleKey ? (
            <p className="field-error">{t(state.fieldErrors.moduleKey)}</p>
          ) : null}
        </div>
      </section>
      <section className="setup-section" aria-labelledby="public-languages-heading">
        <span className="setup-section__icon">
          <CheckmarkCircleIcon size={22} />
        </span>
        <div>
          <h2 id="public-languages-heading">{t("Which languages should customers see?")}</h2>
          <p>
            {t(
              "Your Admin language stays personal. These choices belong to the business public experience.",
            )}
          </p>
          <div className="setup-locale-grid">
            {supportedLocales.map((locale) => (
              <label key={locale} lang={locale} dir={locale === "en" ? "ltr" : "rtl"}>
                <input
                  type="checkbox"
                  name="enabledLocales"
                  value={locale}
                  checked={enabledLocales.has(locale)}
                  disabled={locale === business.default_locale}
                  onChange={(event) => {
                    setEnabledLocales((current) => {
                      const next = new Set(current);
                      if (event.target.checked) next.add(locale);
                      else next.delete(locale);
                      return next;
                    });
                  }}
                />
                {localeNames[locale]}
                {locale === business.default_locale ? (
                  <input type="hidden" name="enabledLocales" value={locale} />
                ) : null}
              </label>
            ))}
          </div>
          {state.fieldErrors?.enabledLocales ? (
            <p className="field-error">{t(state.fieldErrors.enabledLocales)}</p>
          ) : null}
        </div>
      </section>
      <section className="setup-section" aria-labelledby="first-location-heading">
        <span className="setup-section__icon">
          <LocationIcon size={22} />
        </span>
        <div>
          <h2 id="first-location-heading">{t("Add your first location")}</h2>
          <p>
            {moduleKey === "restaurant"
              ? t("Restaurant needs one location so availability has a clear home.")
              : t("Add a location now, or continue and create one later.")}
          </p>
          <label className="setup-location-toggle">
            <input
              type="checkbox"
              name="createLocation"
              value="true"
              checked={createLocation}
              disabled={moduleKey === "restaurant"}
              onChange={(event) => setCreateLocation(event.target.checked)}
            />
            {t("Create a location now")}
            {moduleKey === "restaurant" ? (
              <input type="hidden" name="createLocation" value="true" />
            ) : null}
          </label>
          {createLocation ? (
            <div className="form-grid form-grid--two">
              <div className="field-group">
                <label htmlFor="setup-location-name">{t("Location name")}</label>
                <div className="field-control">
                  <input
                    id="setup-location-name"
                    name="locationName"
                    required
                    maxLength={160}
                    placeholder={t("Main location")}
                    value={locationName}
                    onChange={(event) => setLocationName(event.target.value)}
                  />
                </div>
                {state.fieldErrors?.locationName ? (
                  <p className="field-error">{t(state.fieldErrors.locationName)}</p>
                ) : null}
              </div>
              <div className="field-group">
                <label htmlFor="setup-location-city">{t("Locality / city")}</label>
                <div className="field-control">
                  <input
                    id="setup-location-city"
                    name="locationLocality"
                    maxLength={160}
                    dir="auto"
                    value={locationLocality}
                    onChange={(event) => setLocationLocality(event.target.value)}
                  />
                </div>
              </div>
              <div className="field-group form-grid__wide">
                <label htmlFor="setup-location-address">{t("Address line")}</label>
                <div className="field-control">
                  <input
                    id="setup-location-address"
                    name="locationAddress"
                    maxLength={500}
                    dir="auto"
                    value={locationAddress}
                    onChange={(event) => setLocationAddress(event.target.value)}
                  />
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>
      {state.message ? (
        <p className="form-alert" role="alert">
          {t(state.message)}
        </p>
      ) : null}
      <footer className="setup-form__footer">
        <div>
          <strong dir="auto">{business.display_name}</strong>
          <span>
            {t("ILS · Asia/Jerusalem · {locale}", { locale: localeNames[business.default_locale] })}
          </span>
        </div>
        <button className="primary-button primary-button--fit" type="submit" disabled={pending}>
          {t(pending ? "Finishing setup…" : "Finish setup")}
        </button>
      </footer>
    </form>
  );
}
