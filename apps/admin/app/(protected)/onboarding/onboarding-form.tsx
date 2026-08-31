"use client";

import { useActionState } from "react";

import { ArrowRightIcon, BuildingIcon } from "@darb/icons";

import { bootstrapBusinessAction } from "../../actions/onboarding";
import { adminAuthCopy } from "../../../lib/copy";
import { initialFormState } from "../../../lib/forms";

const copy = adminAuthCopy.en.onboarding;

const localeOptions = [
  { label: "العربية", lang: "ar", value: "ar" },
  { label: "עברית", lang: "he", value: "he" },
  { label: "English", lang: "en", value: "en" },
] as const;

export function OnboardingForm() {
  const [state, action, pending] = useActionState(bootstrapBusinessAction, initialFormState);

  return (
    <form action={action} className="auth-form onboarding-form">
      <div className="field-group">
        <label htmlFor="displayName">{copy.nameLabel}</label>
        <div className="field-control">
          <BuildingIcon size={19} />
          <input
            id="displayName"
            name="displayName"
            type="text"
            dir="auto"
            autoComplete="organization"
            maxLength={160}
            aria-invalid={Boolean(state.fieldErrors?.displayName)}
            aria-describedby={
              state.fieldErrors?.displayName ? "display-name-error" : "display-name-hint"
            }
            required
          />
        </div>
        <p className="field-hint" id="display-name-hint">
          {copy.nameHint}
        </p>
        {state.fieldErrors?.displayName ? (
          <p className="field-error" id="display-name-error">
            {state.fieldErrors.displayName}
          </p>
        ) : null}
      </div>

      <div className="field-group">
        <label htmlFor="slug">{copy.slugLabel}</label>
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
            aria-invalid={Boolean(state.fieldErrors?.slug)}
            aria-describedby={state.fieldErrors?.slug ? "slug-error" : "slug-hint"}
            required
          />
        </div>
        <p className="field-hint" id="slug-hint">
          {copy.slugHint}
        </p>
        {state.fieldErrors?.slug ? (
          <p className="field-error" id="slug-error">
            {state.fieldErrors.slug}
          </p>
        ) : null}
      </div>

      <fieldset className="locale-fieldset" aria-describedby="locale-hint">
        <legend>{copy.localeLabel}</legend>
        <p className="field-hint" id="locale-hint">
          {copy.localeHint}
        </p>
        <div className="locale-options">
          {localeOptions.map((locale) => (
            <label key={locale.value} className="locale-option">
              <input
                type="radio"
                name="defaultLocale"
                value={locale.value}
                defaultChecked={locale.value === "en"}
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
          <p className="field-error">{state.fieldErrors.defaultLocale}</p>
        ) : null}
      </fieldset>

      {state.message ? (
        <p className="form-alert" role="alert">
          {state.message}
        </p>
      ) : null}

      <button className="primary-button" type="submit" disabled={pending}>
        <span>{pending ? copy.submitting : copy.submit}</span>
        <ArrowRightIcon size={20} />
      </button>
    </form>
  );
}
