"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { LanguagesSettingsIcon } from "@darb/icons";
import { localeNames, supportedLocales } from "@darb/i18n";

import { useAdminI18n } from "../../lib/i18n-client";
import { setAdminLocaleAction } from "../actions/locale";

export function AdminLanguageSwitcher() {
  const { locale, t } = useAdminI18n();
  const router = useRouter();
  const id = useId();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  return (
    <div className="admin-language-switcher">
      <label htmlFor={id}>
        <LanguagesSettingsIcon size={17} />
        <span>{t("Interface language")}</span>
      </label>
      <select
        id={id}
        value={locale}
        disabled={pending}
        aria-busy={pending}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(event) => {
          const nextLocale = event.currentTarget.value;
          setError("");
          startTransition(async () => {
            try {
              const result = await setAdminLocaleAction(nextLocale);
              if (result.error) setError(result.error);
              else router.refresh();
            } catch {
              setError("We could not save your language. Please try again.");
            }
          });
        }}
      >
        {supportedLocales.map((language) => (
          <option key={language} value={language} lang={language}>
            {localeNames[language]}
          </option>
        ))}
      </select>
      {error ? (
        <p id={`${id}-error`} className="field-error" role="alert">
          {t(error)}
        </p>
      ) : null}
      <span className="visually-hidden" role="status">
        {pending ? t("Changing language…") : ""}
      </span>
    </div>
  );
}
