import Link from "next/link";

import { supportedLocales, type SupportedLocale } from "@darb/i18n";

import { getPublicLocalePath, publicLocaleNames } from "../lib/site";

export function LocaleLinks({
  currentLocale,
  label,
}: {
  currentLocale: SupportedLocale;
  label: string;
}) {
  return (
    <div className="locale-links" aria-label={label}>
      {supportedLocales.map((locale) => (
        <Link
          key={locale}
          href={getPublicLocalePath(locale)}
          hrefLang={locale}
          lang={locale}
          dir={locale === "en" ? "ltr" : "rtl"}
          aria-current={locale === currentLocale ? "page" : undefined}
        >
          {publicLocaleNames[locale]}
        </Link>
      ))}
    </div>
  );
}
