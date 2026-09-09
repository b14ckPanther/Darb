"use client";

import { useEffect, useState } from "react";
import { darbApplications } from "@darb/config/platform";
import { getTextDirection, localeNames, supportedLocales, type SupportedLocale } from "@darb/i18n";
import { AlertCircleIcon, RestaurantIcon } from "@darb/icons";
import { DarbBrandLockup, DarbMark } from "@darb/ui";
import { getRestaurantCopy } from "../lib/copy";
import { useRestaurantLocale } from "./restaurant-locale";

export function RestaurantSystemState({
  kind,
  retry,
}: {
  kind: "landing" | "unavailable" | "error";
  retry?: () => void;
}) {
  const publicationLocale = useRestaurantLocale();
  const [systemLocale, setSystemLocale] = useState<SupportedLocale>("en");
  const locale = publicationLocale ?? systemLocale;
  const copy = getRestaurantCopy(locale);

  useEffect(() => {
    // With no resolvable tenant, this local control translates only the system page.
    // It cannot change a tenant's enabled locales, public URL, or content.
    if (publicationLocale) return;
    document.documentElement.lang = locale;
    document.documentElement.dir = getTextDirection(locale);
  }, [locale, publicationLocale]);

  return (
    <main
      className={kind === "landing" ? "platform-landing" : "system-state"}
      lang={locale}
      dir={getTextDirection(locale)}
    >
      {kind === "landing" ? (
        <div className="platform-landing__brand">
          <DarbBrandLockup accessibleLabel="Darb — درب" tone="dark" />
          <span>{copy.menu}</span>
        </div>
      ) : publicationLocale ? (
        <RestaurantIcon size={40} />
      ) : (
        <DarbMark size={46} />
      )}
      {!publicationLocale ? (
        <nav className="system-languages" aria-label={copy.language}>
          {supportedLocales.map((candidate) => (
            <button
              key={candidate}
              type="button"
              lang={candidate}
              dir={getTextDirection(candidate)}
              aria-pressed={candidate === locale}
              onClick={() => setSystemLocale(candidate)}
            >
              {localeNames[candidate]}
            </button>
          ))}
        </nav>
      ) : null}
      {kind === "error" ? (
        <span className="system-state__status-icon" aria-hidden="true">
          <AlertCircleIcon size={19} />
        </span>
      ) : null}
      {kind === "landing" ? <p className="eyebrow">{copy.productName}</p> : null}
      <h1>
        {kind === "landing"
          ? copy.landingTitle
          : kind === "error"
            ? copy.loadErrorTitle
            : copy.unavailableTitle}
      </h1>
      <p>
        {kind === "landing"
          ? copy.landingDescription
          : kind === "error"
            ? copy.loadErrorDescription
            : copy.unavailableDescription}
      </p>
      {kind === "error" && retry ? (
        <button type="button" onClick={retry}>
          {copy.retry}
        </button>
      ) : (
        <a href={`https://${darbApplications.main.productionHost}`}>{copy.visitDarb}</a>
      )}
    </main>
  );
}
