import { darbApplications } from "@darb/config/platform";
import {
  AppearanceIcon,
  ArrowRightIcon,
  BuildingIcon,
  DomainIcon,
  LanguagesSettingsIcon,
  LocationIcon,
  ModulesIcon,
  RestaurantIcon,
} from "@darb/icons";
import type { SupportedLocale } from "@darb/i18n";

import { mainSiteCopy } from "../lib/copy";
import { BrandLockup } from "./brand-lockup";
import { HeroArt } from "./hero-art";
import { LocaleLinks } from "./locale-links";
import { SiteHeader } from "./site-header";

const adminUrl = `https://${darbApplications.admin.productionHost}`;

const foundationIcons = [
  BuildingIcon,
  LocationIcon,
  LanguagesSettingsIcon,
  AppearanceIcon,
  DomainIcon,
  ModulesIcon,
] as const;

export function Homepage({ locale }: { locale: SupportedLocale }) {
  const copy = mainSiteCopy[locale];

  return (
    <div className="public-site">
      <SiteHeader copy={copy} locale={locale} />

      <main id="main-content">
        <section className="hero" aria-labelledby="hero-title">
          <HeroArt alt="" />
          <div className="hero__veil" aria-hidden="true" />
          <div className="hero__content">
            <p className="eyebrow eyebrow--light">{copy.hero.eyebrow}</p>
            <h1 id="hero-title">
              <span>{copy.hero.titleLead}</span>
              <em>{copy.hero.titleAccent}</em>
            </h1>
            <p className="hero__description">{copy.hero.description}</p>
            <div className="hero__actions">
              <a className="button button--gold" href="#story">
                {copy.hero.primaryAction}
                <ArrowRightIcon size={19} />
              </a>
              <a className="button button--ghost" href={adminUrl}>
                {copy.hero.secondaryAction}
              </a>
            </div>
          </div>
          <a className="hero__scroll" href="#story">
            <span>{copy.hero.scrollLabel}</span>
            <span aria-hidden="true" className="hero__scroll-line" />
          </a>
        </section>

        <section id="story" className="story-section section-shell" aria-labelledby="story-title">
          <div className="section-index" aria-hidden="true">
            01
          </div>
          <div className="story-section__lead">
            <p className="eyebrow">{copy.story.eyebrow}</p>
            <h2 id="story-title">{copy.story.title}</h2>
          </div>
          <div className="story-section__body">
            <p>{copy.story.body}</p>
            <p className="story-section__principle">{copy.story.principle}</p>
          </div>
        </section>

        <section id="paths" className="paths-section" aria-labelledby="paths-title">
          <div className="section-shell">
            <div className="section-heading section-heading--split">
              <div>
                <p className="eyebrow">{copy.paths.eyebrow}</p>
                <h2 id="paths-title">{copy.paths.title}</h2>
              </div>
              <p>{copy.paths.description}</p>
            </div>
            <ol className="path-list">
              {copy.paths.items.map((path, index) => (
                <li key={path.title}>
                  <span className="path-list__number" aria-hidden="true">
                    0{index + 1}
                  </span>
                  <div>
                    <h3>{path.title}</h3>
                    <p>{path.description}</p>
                  </div>
                  <span className={`path-list__status${index === 0 ? " is-current" : ""}`}>
                    {path.status}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="products" className="products-section" aria-labelledby="products-title">
          <div className="products-section__glow" aria-hidden="true" />
          <div className="section-shell">
            <div className="section-heading section-heading--light">
              <p className="eyebrow eyebrow--light">{copy.products.eyebrow}</p>
              <h2 id="products-title">{copy.products.title}</h2>
              <p>{copy.products.description}</p>
            </div>
            <div className="product-grid">
              {copy.products.items.map((product, index) => (
                <article
                  key={product.key}
                  className={`product-card${product.current ? " product-card--current" : ""}`}
                >
                  <div className="product-card__topline">
                    <span aria-hidden="true">0{index + 1}</span>
                    <span>{product.current ? copy.products.available : copy.products.future}</span>
                  </div>
                  <div className="product-card__symbol" aria-hidden="true">
                    {product.key === "restaurant" ? (
                      <RestaurantIcon size={32} />
                    ) : (
                      <span>{product.key.slice(0, 1).toUpperCase()}</span>
                    )}
                  </div>
                  <h3>{product.title}</h3>
                  <p>{product.description}</p>
                </article>
              ))}
            </div>
            <p className="products-section__note">{copy.products.honestNote}</p>
          </div>
        </section>

        <section id="foundation" className="foundation-section" aria-labelledby="foundation-title">
          <div className="section-shell">
            <div className="foundation-section__intro">
              <p className="eyebrow">{copy.foundation.eyebrow}</p>
              <h2 id="foundation-title">{copy.foundation.title}</h2>
              <p>{copy.foundation.description}</p>
            </div>
            <div className="foundation-grid">
              {copy.foundation.items.map((item, index) => {
                const Icon = foundationIcons[index];
                return (
                  <article key={item.title}>
                    <span className="foundation-grid__icon" aria-hidden="true">
                      {Icon ? <Icon size={25} /> : null}
                    </span>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="language-section" aria-labelledby="languages-title">
          <div className="language-section__arch" aria-hidden="true" />
          <div className="section-shell language-section__content">
            <div>
              <p className="eyebrow eyebrow--light">{copy.languages.eyebrow}</p>
              <h2 id="languages-title">{copy.languages.title}</h2>
              <p>{copy.languages.description}</p>
            </div>
            <div className="language-samples">
              {copy.languages.scripts.map((script) => (
                <article
                  key={script.code}
                  lang={script.lang}
                  dir={script.lang === "en" ? "ltr" : "rtl"}
                >
                  <span>{script.code}</span>
                  <h3>{script.title}</h3>
                  <p>{script.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="final-cta" aria-labelledby="final-cta-title">
          <div className="final-cta__opening" aria-hidden="true">
            <span />
          </div>
          <div className="section-shell final-cta__content">
            <p className="eyebrow">{copy.finalCta.eyebrow}</p>
            <h2 id="final-cta-title">{copy.finalCta.title}</h2>
            <p>{copy.finalCta.description}</p>
            <a className="button button--dark" href={adminUrl}>
              {copy.finalCta.action}
              <ArrowRightIcon size={19} />
            </a>
          </div>
        </section>
      </main>

      <footer className="public-footer">
        <div className="section-shell public-footer__top">
          <BrandLockup />
          <p>{copy.footer.statement}</p>
          <a href={adminUrl}>{copy.footer.admin}</a>
        </div>
        <div className="section-shell public-footer__bottom">
          <p>
            © {new Date().getUTCFullYear()} {copy.footer.rights}
          </p>
          <LocaleLinks currentLocale={locale} label={copy.nav.language} />
        </div>
      </footer>
    </div>
  );
}
