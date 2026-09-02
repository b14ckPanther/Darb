"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { BrandLockup } from "./brand-lockup";
import { mainSiteCopy } from "../lib/copy";
import { defaultPublicLocale, getPublicLocalePath, resolvePublicLocale } from "../lib/site";

function useStateLocale() {
  const params = useParams<{ locale?: string }>();
  return resolvePublicLocale(params.locale ?? "") ?? defaultPublicLocale;
}

export function SiteErrorState({ reset }: { reset: () => void }) {
  const locale = useStateLocale();
  const copy = mainSiteCopy[locale].error;

  return (
    <main id="main-content" className="site-state">
      <section className="site-state__content" aria-labelledby="site-error-title">
        <BrandLockup />
        <h1 id="site-error-title">{copy.title}</h1>
        <p>{copy.description}</p>
        <button type="button" className="button button--gold" onClick={reset}>
          {copy.action}
        </button>
      </section>
    </main>
  );
}

export function SiteNotFoundState() {
  const locale = useStateLocale();
  const copy = mainSiteCopy[locale].notFound;

  return (
    <main id="main-content" className="site-state">
      <section className="site-state__content" aria-labelledby="site-not-found-title">
        <BrandLockup />
        <h1 id="site-not-found-title">{copy.title}</h1>
        <p>{copy.description}</p>
        <Link className="button button--gold" href={getPublicLocalePath(locale)}>
          {copy.action}
        </Link>
      </section>
    </main>
  );
}
