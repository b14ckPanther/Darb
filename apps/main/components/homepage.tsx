import Image from "next/image";

import { DirectionArrowIcon } from "@darb/icons";
import { supportedLocales, type SupportedLocale } from "@darb/i18n";

import { mainSiteCopy } from "../lib/copy";
import {
  getAdminRegistrationUrl,
  getAdminSignInUrl,
  getPublicLocaleDirection,
  getRestaurantLandingUrl,
  portfolioUrl,
} from "../lib/site";
import { BrandLockup } from "./brand-lockup";
import { LocaleLinks } from "./locale-links";
import { RestaurantLayers } from "./restaurant-layers";
import { RouteExit } from "./route-exit";
import { SiteHeader } from "./site-header";
import { ThresholdPoster } from "./threshold/threshold-poster";
import { ThresholdScene } from "./threshold/threshold-scene";

/** Elevation of the architectural doorway used by the threshold scene, drawn at plan scale. */
const doorwayFramePath =
  "M2 96V31Q2 26 7 23.5L51 6Q55 4.5 58.5 6Q62 7.5 62 12V96H53V22Q53 17.5 49 18L15 32Q11 33.5 11 38V96Z";
const doorwayOpeningPath = "M11 96V38Q11 33.5 15 32L49 18Q53 17.5 53 22V96Z";

export function Homepage({ locale }: { locale: SupportedLocale }) {
  const copy = mainSiteCopy[locale];
  const direction = getPublicLocaleDirection(locale);
  const signInUrl = getAdminSignInUrl(locale);
  const registrationUrl = getAdminRegistrationUrl(locale);
  const restaurantUrl = getRestaurantLandingUrl(locale);
  const restaurant = copy.junction.destinations.find((destination) => destination.current);
  const futureDestinations = copy.junction.destinations.filter(
    (destination) => !destination.current,
  );

  return (
    <div className="site" data-direction={direction}>
      <SiteHeader copy={copy} locale={locale} />
      <RouteExit />

      <main id="main-content">
        <section className="threshold" aria-labelledby="hero-title" data-threshold>
          <div className="threshold__stage">
            <div className="threshold__media" aria-hidden="true">
              <ThresholdPoster direction={direction} />
              <ThresholdScene />
            </div>
            <div className="threshold__veil" aria-hidden="true" />
            <div className="threshold__content">
              <h1 id="hero-title">
                <span>{copy.hero.titleLead}</span>
                <em>{copy.hero.titleAccent}</em>
              </h1>
              <p className="threshold__description">{copy.hero.description}</p>
              <div className="threshold__actions">
                <a className="button button--gold" href={registrationUrl}>
                  {copy.hero.primaryAction}
                  <DirectionArrowIcon className="direction-icon" size={18} />
                </a>
                <a className="button button--line" href={signInUrl}>
                  {copy.hero.secondaryAction}
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="story" className="route story" aria-labelledby="story-title">
          <svg
            className="story__turn"
            viewBox="0 0 1000 72"
            preserveAspectRatio="none"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M1000 0C1000 54 0 18 0 72" />
          </svg>
          <div className="route__rail story__rail" aria-hidden="true" />
          <div className="shell story__inner">
            <h2 id="story-title">{copy.story.title}</h2>
            <div className="story__body">
              <p>{copy.story.body}</p>
              <p className="story__principle">{copy.story.principle}</p>
            </div>
          </div>
        </section>

        <section id="paths" className="route junction" aria-labelledby="paths-title">
          <div className="shell junction__intro">
            <h2 id="paths-title">{copy.junction.title}</h2>
            <p>{copy.junction.description}</p>
          </div>

          <div className="shell junction__map">
            <svg
              className="junction__branches"
              viewBox="0 0 1000 160"
              preserveAspectRatio="none"
              aria-hidden="true"
              focusable="false"
            >
              <path className="junction__trunk" d="M0 0V40" pathLength={1} />
              <path
                className="junction__branch is-open"
                d="M0 40C0 108 174 84 174 160"
                pathLength={1}
              />
              <path className="junction__branch" d="M0 40C0 118 457 78 457 160" pathLength={1} />
              <path className="junction__branch" d="M0 40C0 122 674 74 674 160" pathLength={1} />
              <path className="junction__branch" d="M0 40C0 126 891 70 891 160" pathLength={1} />
            </svg>

            <ol id="products" className="junction__signs">
              {restaurant ? (
                <li className="sign sign--open">
                  <a
                    className="sign__link"
                    href={restaurantUrl}
                    aria-labelledby="sign-restaurant-name sign-restaurant-status"
                  >
                    <span className="sign__names">
                      {supportedLocales.map((scriptLocale) => {
                        const name = mainSiteCopy[scriptLocale].junction.destinations.find(
                          (destination) => destination.key === restaurant.key,
                        )?.product;
                        const primary = scriptLocale === locale;
                        return (
                          <span
                            key={scriptLocale}
                            id={primary ? "sign-restaurant-name" : undefined}
                            lang={scriptLocale}
                            dir={getPublicLocaleDirection(scriptLocale)}
                            className={primary ? "is-primary" : undefined}
                            aria-hidden={primary ? undefined : true}
                          >
                            {name}
                          </span>
                        );
                      })}
                    </span>
                    <span className="sign__industry">{restaurant.industry}</span>
                    <span className="sign__description">{restaurant.description}</span>
                    <span className="sign__foot">
                      <span className="sign__status" id="sign-restaurant-status">
                        {copy.junction.available}
                      </span>
                      <span className="sign__action">
                        {copy.junction.visit}
                        <DirectionArrowIcon className="direction-icon" size={20} />
                      </span>
                    </span>
                  </a>
                </li>
              ) : null}
              {futureDestinations.map((destination) => (
                <li key={destination.key} className="sign sign--future">
                  <h3 className="sign__names">
                    {supportedLocales.map((scriptLocale) => {
                      const name = mainSiteCopy[scriptLocale].junction.destinations.find(
                        (entry) => entry.key === destination.key,
                      )?.product;
                      const primary = scriptLocale === locale;
                      return (
                        <span
                          key={scriptLocale}
                          lang={scriptLocale}
                          dir={getPublicLocaleDirection(scriptLocale)}
                          className={primary ? "is-primary" : undefined}
                          aria-hidden={primary ? undefined : true}
                        >
                          {name}
                        </span>
                      );
                    })}
                  </h3>
                  <p className="sign__industry">{destination.industry}</p>
                  <p className="sign__description">{destination.description}</p>
                  <p className="sign__foot">
                    <span className="sign__status">{copy.junction.future}</span>
                  </p>
                </li>
              ))}
            </ol>
            <p className="junction__note">{copy.junction.note}</p>
          </div>
        </section>

        <section id="restaurant" className="place restaurant" aria-labelledby="restaurant-title">
          <div className="route__rail route__rail--waypoint" aria-hidden="true" />
          <div className="shell shell--railed restaurant__inner">
            <div className="restaurant__intro">
              <h2 id="restaurant-title">{copy.restaurant.title}</h2>
              <p>{copy.restaurant.description}</p>
              <div className="restaurant__actions">
                <a className="button button--gold" href={restaurantUrl}>
                  {copy.restaurant.visit}
                  <DirectionArrowIcon className="direction-icon" size={18} />
                </a>
                <p className="restaurant__boundary">{copy.restaurant.boundary}</p>
              </div>
            </div>
            <RestaurantLayers copy={copy.restaurant} />
          </div>
        </section>

        <section id="foundation" className="route foundation" aria-labelledby="foundation-title">
          <div className="route__rail route__rail--waypoint" aria-hidden="true" />
          <div className="shell shell--railed foundation__inner">
            <div className="foundation__intro">
              <h2 id="foundation-title">{copy.foundation.title}</h2>
              <p>{copy.foundation.description}</p>
            </div>
            <div className="foundation__structure">
              <div className="foundation__doors" aria-hidden="true">
                {copy.junction.destinations.map((destination) => (
                  <svg
                    key={destination.key}
                    viewBox="0 0 64 96"
                    focusable="false"
                    className={destination.current ? "is-open" : undefined}
                  >
                    <path className="foundation__door-light" d={doorwayOpeningPath} />
                    <path className="foundation__door-frame" d={doorwayFramePath} />
                  </svg>
                ))}
              </div>
              <ul className="foundation__course">
                {copy.foundation.items.map((item) => (
                  <li key={item.title}>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="route voices" aria-labelledby="languages-title">
          <div className="route__rail route__rail--waypoint" aria-hidden="true" />
          <div className="shell shell--railed voices__inner">
            <div className="voices__intro">
              <h2 id="languages-title">{copy.languages.title}</h2>
              <p>{copy.languages.description}</p>
            </div>
            <ul className="voices__lines">
              {supportedLocales.map((scriptLocale) => {
                const scriptDirection = getPublicLocaleDirection(scriptLocale);
                const statement = mainSiteCopy[scriptLocale].hero;
                return (
                  <li key={scriptLocale} data-script={scriptLocale} data-flow={scriptDirection}>
                    <p lang={scriptLocale} dir={scriptDirection} className="voices__statement">
                      {statement.titleLead} <em>{statement.titleAccent}</em>
                    </p>
                    <p className="voices__direction">
                      <DirectionArrowIcon
                        className={`voices__arrow voices__arrow--${scriptDirection}`}
                        size={18}
                      />
                      {copy.languages.directions[scriptDirection]}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section className="arrival" aria-labelledby="arrival-title">
          <div
            className="route__rail route__rail--waypoint route__rail--arrival"
            aria-hidden="true"
          />
          <div className="shell arrival__inner">
            <figure className="arrival__figure">
              <Image
                alt={copy.arrival.imageAlt}
                className="arrival__image"
                height={1844}
                sizes="(min-width: 48rem) 40vw, 100vw"
                src="/brand/hero/darb-hero-mobile.webp"
                width={853}
              />
            </figure>
            <div className="arrival__content">
              <h2 id="arrival-title">{copy.arrival.title}</h2>
              <p>{copy.arrival.description}</p>
              <div className="arrival__actions">
                <a className="button button--gold" href={registrationUrl}>
                  {copy.hero.primaryAction}
                  <DirectionArrowIcon className="direction-icon" size={18} />
                </a>
                <a className="button button--line" href={signInUrl}>
                  {copy.nav.signIn}
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="shell site-footer__top">
          <div className="site-footer__brand">
            <BrandLockup />
            <p>{copy.footer.statement}</p>
          </div>
          <nav className="site-footer__column" aria-labelledby="footer-paths">
            <p id="footer-paths">{copy.footer.paths}</p>
            <ul>
              {copy.junction.destinations.map((destination) => (
                <li key={destination.key}>
                  {destination.current ? (
                    <a href={restaurantUrl}>{destination.product}</a>
                  ) : (
                    <span>
                      {destination.product}
                      <small>{copy.junction.future}</small>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </nav>
          <nav className="site-footer__column" aria-labelledby="footer-account">
            <p id="footer-account">{copy.footer.account}</p>
            <ul>
              <li>
                <a href={registrationUrl}>{copy.nav.start}</a>
              </li>
              <li>
                <a href={signInUrl}>{copy.nav.signIn}</a>
              </li>
            </ul>
          </nav>
        </div>
        <div className="shell site-footer__bottom">
          <p>
            © {new Date().getUTCFullYear()} {copy.footer.rights}
          </p>
          <p className="site-footer__credit">
            {copy.footer.creditLead}{" "}
            <a href={portfolioUrl} rel="author">
              <bdi lang={locale === "he" ? "en" : undefined}>{copy.footer.creditName}</bdi>
            </a>
          </p>
          <LocaleLinks currentLocale={locale} label={copy.nav.language} />
        </div>
      </footer>
    </div>
  );
}
