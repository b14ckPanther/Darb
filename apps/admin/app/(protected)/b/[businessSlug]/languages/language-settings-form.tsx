"use client";

import { useActionState, useState } from "react";

import { CheckmarkCircleIcon } from "@darb/icons";
import { getTextDirection, type SupportedLocale } from "@darb/i18n";

import { updateBusinessLanguagesAction } from "../../../../actions/languages";
import type { BusinessLocaleState } from "../../../../../lib/business-locales";
import { initialFormState } from "../../../../../lib/forms";

const languageOptions: ReadonlyArray<{
  code: SupportedLocale;
  englishName: string;
  nativeName: string;
}> = [
  { code: "ar", englishName: "Arabic", nativeName: "العربية" },
  { code: "he", englishName: "Hebrew", nativeName: "עברית" },
  { code: "en", englishName: "English", nativeName: "English" },
];

interface LanguageSettingsFormProps {
  businessId: string;
  businessSlug: string;
  editable: boolean;
  initialState: BusinessLocaleState;
}

export function LanguageSettingsForm({
  businessId,
  businessSlug,
  editable,
  initialState,
}: LanguageSettingsFormProps) {
  const action = updateBusinessLanguagesAction.bind(null, businessId, businessSlug);
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const [defaultLocale, setDefaultLocale] = useState(initialState.defaultLocale);
  const [enabledLocales, setEnabledLocales] = useState<SupportedLocale[]>(
    initialState.enabledLocales,
  );

  function setDefault(locale: SupportedLocale) {
    setDefaultLocale(locale);
    setEnabledLocales((current) => (current.includes(locale) ? current : [...current, locale]));
  }

  function setEnabled(locale: SupportedLocale, enabled: boolean) {
    if (locale === defaultLocale && !enabled) return;
    setEnabledLocales((current) =>
      enabled ? [...new Set([...current, locale])] : current.filter((value) => value !== locale),
    );
  }

  return (
    <form action={formAction} className="language-settings-form">
      <fieldset disabled={!editable || pending}>
        <legend className="visually-hidden">Supported business languages</legend>
        <div className="language-grid">
          {languageOptions.map((language) => {
            const enabled = enabledLocales.includes(language.code);
            const isDefault = defaultLocale === language.code;
            const direction = getTextDirection(language.code);

            return (
              <article
                key={language.code}
                className={`language-card${isDefault ? " is-default" : ""}`}
              >
                <div className="language-card__heading">
                  <span lang={language.code} dir={direction}>
                    {language.nativeName}
                  </span>
                  <code>{language.code}</code>
                </div>
                <p>
                  {language.englishName} · {direction.toUpperCase()}
                </p>
                <label className="language-toggle">
                  <input
                    type="checkbox"
                    name="enabledLocales"
                    value={language.code}
                    checked={enabled}
                    onChange={(event) => setEnabled(language.code, event.currentTarget.checked)}
                    disabled={isDefault || !editable || pending}
                  />
                  <span>{enabled ? "Enabled" : "Disabled"}</span>
                </label>
                {isDefault ? (
                  <input type="hidden" name="enabledLocales" value={language.code} />
                ) : null}
                <label className="default-language-choice">
                  <input
                    type="radio"
                    name="defaultLocale"
                    value={language.code}
                    checked={isDefault}
                    onChange={() => setDefault(language.code)}
                  />
                  <span>{isDefault ? "Default language" : "Make default"}</span>
                  {isDefault ? <CheckmarkCircleIcon size={17} /> : null}
                </label>
              </article>
            );
          })}
        </div>
      </fieldset>

      {state?.fieldErrors?.enabledLocales ? (
        <p className="form-alert" role="alert">
          {state.fieldErrors.enabledLocales}
        </p>
      ) : null}
      {state?.message ? (
        <p className={state.status === "success" ? "success-alert" : "form-alert"} role="status">
          {state.message}
        </p>
      ) : null}

      {editable ? (
        <button
          type="submit"
          className="primary-button language-settings-form__submit"
          disabled={pending}
        >
          {pending ? "Saving languages…" : "Save language settings"}
        </button>
      ) : null}
    </form>
  );
}
