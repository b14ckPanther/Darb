"use client";

import { useActionState, useState } from "react";

import { ArrowRightIcon, BuildingIcon } from "@darb/icons";

import { bootstrapBusinessAction } from "../../actions/onboarding";
import { initialFormState } from "../../../lib/forms";
import { useAdminI18n } from "../../../lib/i18n-client";

const localeOptions = [
  { label: "العربية", lang: "ar", value: "ar" },
  { label: "עברית", lang: "he", value: "he" },
  { label: "English", lang: "en", value: "en" },
] as const;

export function OnboardingForm() {
  const { locale: interfaceLocale, t } = useAdminI18n();
  const [state, action, pending] = useActionState(bootstrapBusinessAction, initialFormState);
  const [displayName, setDisplayName] = useState("");
  const [slug, setSlug] = useState("");
  const [defaultLocale, setDefaultLocale] = useState(interfaceLocale);

  return (
    <form action={action} className="auth-form onboarding-form">
      <div className="field-group">
        <label htmlFor="displayName">{t("Business name")}</label>
        <div className="field-control">
          <BuildingIcon size={19} />
          <input
            id="displayName"
            name="displayName"
            type="text"
            dir="auto"
            autoComplete="organization"
            maxLength={160}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            aria-invalid={Boolean(state.fieldErrors?.displayName)}
            aria-describedby={
              state.fieldErrors?.displayName ? "display-name-error" : "display-name-hint"
            }
            required
          />
        </div>
        <p className="field-hint" id="display-name-hint">
          {t("The name your team will recognize.")}
        </p>
        {state.fieldErrors?.displayName ? (
          <p className="field-error" id="display-name-error">
            {t(state.fieldErrors.displayName)}
          </p>
        ) : null}
      </div>

      <div className="field-group">
        <label htmlFor="slug">{t("Business slug")}</label>
        <div className="field-control field-control--prefix">
          <span className="field-prefix" aria-hidden="true">
            darb.co.il/
          </span>
          <input
            id="slug"
            name="slug"
            type="text"
            dir="ltr"
            autoCapitalize="none"
            autoCorrect="off"
            minLength={3}
            maxLength={63}
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            aria-invalid={Boolean(state.fieldErrors?.slug)}
            aria-describedby={state.fieldErrors?.slug ? "slug-error" : "slug-hint"}
            required
          />
        </div>
        <p className="field-hint" id="slug-hint">
          {t("Lowercase letters, numbers, and hyphens. This must be unique on Darb.")}
        </p>
        {state.fieldErrors?.slug ? (
          <p className="field-error" id="slug-error">
            {t(state.fieldErrors.slug)}
          </p>
        ) : null}
      </div>

      <fieldset className="locale-fieldset" aria-describedby="locale-hint">
        <legend>{t("Default language")}</legend>
        <p className="field-hint" id="locale-hint">
          {t("This establishes a starting preference and can be changed later.")}
        </p>
        <div className="locale-options">
          {localeOptions.map((locale) => (
            <label key={locale.value} className="locale-option">
              <input
                type="radio"
                name="defaultLocale"
                value={locale.value}
                checked={locale.value === defaultLocale}
                onChange={() => setDefaultLocale(locale.value)}
                required
              />
              <span lang={locale.lang} dir={locale.lang === "en" ? "ltr" : "rtl"}>
                {locale.label}
              </span>
              <small>{locale.value.toUpperCase()}</small>
            </label>
          ))}
        </div>
        {state.fieldErrors?.defaultLocale ? (
          <p className="field-error">{t(state.fieldErrors.defaultLocale)}</p>
        ) : null}
      </fieldset>

      {state.message ? (
        <p className="form-alert" role="alert">
          {t(state.message)}
        </p>
      ) : null}

      <button className="primary-button" type="submit" disabled={pending}>
        <span>{t(pending ? "Creating securely…" : "Create business")}</span>
        <ArrowRightIcon size={20} />
      </button>
    </form>
  );
}
