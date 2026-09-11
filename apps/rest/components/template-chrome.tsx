import Image from "next/image";
import Link from "next/link";

import { darbApplications } from "@darb/config/platform";
import {
  ArrowRightIcon,
  ExternalLinkIcon,
  LanguagesSettingsIcon,
  LocationIcon,
  MailIcon,
  RestaurantIcon,
} from "@darb/icons";
import { getTextDirection } from "@darb/i18n";
import {
  formatRestaurantTime,
  formatRestaurantWeekday,
  getRestaurantOpeningStatus,
  type LocalizedRestaurantPublication,
  type PublicRestaurantLocation,
} from "@darb/restaurant";

import { getRestaurantCopy } from "../lib/copy";
import { getPublicSupabaseConfig } from "../lib/config";
import { buildRestaurantImageUrl, buildRestaurantMediaUrl } from "../lib/media";
import { findFirstRestaurantImage } from "../lib/presentation";
import { restaurantPath, type RestaurantRouteContext } from "../lib/routes";
import { HeroVideo } from "./hero-video";
import { ItemDialogController } from "./item-dialog-controller";

interface TemplateProps {
  publication: LocalizedRestaurantPublication;
  route: RestaurantRouteContext;
}

export function TemplateController({ publication, route }: TemplateProps) {
  return (
    <ItemDialogController
      context={{
        businessSlug: publication.business.slug,
        locale: publication.locale,
        routeKind: route.kind,
      }}
      hasLocation={publication.selectedLocation !== null}
    />
  );
}

export function TemplateBrand({ publication, route }: TemplateProps) {
  return (
    <Link
      href={restaurantPath(
        publication.business.slug,
        publication.locale,
        publication.business.defaultLocale,
        publication.selectedLocation?.id ?? null,
        route,
      )}
      className="brand-mark"
    >
      {publication.branding.logo ? (
        <span className="brand-logo" data-branding-role="logo">
          <Image
            src={buildRestaurantMediaUrl(getPublicSupabaseConfig().url, publication.branding.logo)}
            alt=""
            width={publication.branding.logo.width ?? 96}
            height={publication.branding.logo.height ?? 96}
            loading="eager"
          />
        </span>
      ) : (
        <span className="brand-symbol" aria-hidden="true">
          <RestaurantIcon size={20} />
        </span>
      )}
      <span lang={publication.business.defaultLocale} dir="auto">
        {publication.business.displayName}
      </span>
    </Link>
  );
}

export function TemplateTools({ publication, route }: TemplateProps) {
  const copy = getRestaurantCopy(publication.locale);
  const locationId = publication.selectedLocation?.id ?? null;
  return (
    <div className="header-tools">
      {publication.locations.length > 0 ? (
        <details className="locale-menu location-menu">
          <summary>
            <LocationIcon size={18} />
            <span dir="auto">{publication.selectedLocation?.displayName ?? copy.allLocations}</span>
          </summary>
          <div className="popover-list">
            <Link
              aria-current={locationId === null ? "page" : undefined}
              data-analytics-event="location-changed"
              data-analytics-has-location="false"
              href={restaurantPath(
                publication.business.slug,
                publication.locale,
                publication.business.defaultLocale,
                null,
                route,
              )}
            >
              {copy.allLocations}
            </Link>
            {publication.locations.map((location) => (
              <Link
                key={location.id}
                aria-current={location.id === locationId ? "page" : undefined}
                data-analytics-event="location-changed"
                data-analytics-has-location="true"
                href={restaurantPath(
                  publication.business.slug,
                  publication.locale,
                  publication.business.defaultLocale,
                  location.id,
                  route,
                )}
              >
                <span dir="auto">{location.displayName}</span>
                {location.locality ? <small dir="auto">{location.locality}</small> : null}
              </Link>
            ))}
          </div>
        </details>
      ) : null}
      {publication.locales.length > 1 ? (
        <details className="locale-menu">
          <summary aria-label={copy.language}>
            <LanguagesSettingsIcon size={18} />
            <span>{publication.locale.toUpperCase()}</span>
          </summary>
          <div className="popover-list popover-list--compact">
            {publication.locales.map((locale) => (
              <Link
                key={locale}
                lang={locale}
                dir={getTextDirection(locale)}
                aria-current={locale === publication.locale ? "page" : undefined}
                data-analytics-event="locale-changed"
                data-analytics-locale={locale}
                href={restaurantPath(
                  publication.business.slug,
                  locale,
                  publication.business.defaultLocale,
                  locationId,
                  route,
                )}
              >
                {{ ar: "العربية", en: "English", he: "עברית" }[locale]}
              </Link>
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}

export function TemplateHeroMedia({
  className,
  publication,
  sizes,
}: {
  className: string;
  publication: LocalizedRestaurantPublication;
  sizes: string;
}) {
  const copy = getRestaurantCopy(publication.locale);
  const assigned = publication.branding.hero;
  const fallback = assigned ? null : findFirstRestaurantImage(publication);
  return (
    <div className={className} data-branding-role={assigned ? "hero" : undefined}>
      {assigned?.mediaKind === "video" ? (
        <HeroVideo
          src={buildRestaurantMediaUrl(getPublicSupabaseConfig().url, assigned)}
          label={assigned.altText ?? copy.heroVideo(publication.business.displayName)}
          pauseLabel={copy.pauseHeroVideo}
          playLabel={copy.playHeroVideo}
        />
      ) : assigned ? (
        <Image
          src={buildRestaurantMediaUrl(getPublicSupabaseConfig().url, assigned)}
          alt={assigned.altText ?? ""}
          fill
          fetchPriority="high"
          loading="eager"
          sizes={sizes}
        />
      ) : fallback ? (
        <Image
          src={buildRestaurantImageUrl(getPublicSupabaseConfig().url, fallback)}
          alt={fallback.altText ?? ""}
          fill
          fetchPriority="high"
          loading="eager"
          sizes={sizes}
        />
      ) : (
        <span className="template-media-fallback" aria-hidden="true">
          <RestaurantIcon size={72} />
        </span>
      )}
    </div>
  );
}

export function TemplateCategoryRail({ publication }: Pick<TemplateProps, "publication">) {
  const copy = getRestaurantCopy(publication.locale);
  const categories = publication.menus.flatMap((menu) => menu.categories);
  return categories.length > 0 ? (
    <nav className="category-rail" aria-label={copy.categories}>
      <div className="category-rail__inner">
        {categories.map((category) => (
          <a
            key={category.id}
            href={`#category-${category.id}`}
            data-analytics-event="category-selected"
            data-analytics-category-id={category.id}
          >
            <span lang={category.locale} dir={getTextDirection(category.locale)}>
              {category.name}
            </span>
          </a>
        ))}
      </div>
    </nav>
  ) : null;
}

export function TemplateFooter({ publication }: Pick<TemplateProps, "publication">) {
  const copy = getRestaurantCopy(publication.locale);
  return (
    <>
      <RestaurantLocationDetails publication={publication} />
      <footer className="site-footer">
        <span lang={publication.business.defaultLocale} dir="auto">
          {publication.business.displayName}
        </span>
        <a
          href={`https://${darbApplications.main.productionHost}`}
          lang="en"
          data-analytics-event="outbound-darb"
        >
          {copy.poweredBy}
          <ArrowRightIcon size={16} />
        </a>
      </footer>
    </>
  );
}

function RestaurantLocationDetails({ publication }: Pick<TemplateProps, "publication">) {
  const locations = publication.selectedLocation
    ? [publication.selectedLocation]
    : publication.locations;
  const visible = locations.filter(hasPublicLocationDetails);
  if (visible.length === 0) return null;
  return (
    <section
      className="location-details"
      aria-label={getRestaurantCopy(publication.locale).location}
    >
      <div className="location-details__inner">
        {visible.map((location) => (
          <LocationDetailsCard key={location.id} location={location} locale={publication.locale} />
        ))}
      </div>
    </section>
  );
}

function LocationDetailsCard({
  locale,
  location,
}: {
  locale: LocalizedRestaurantPublication["locale"];
  location: PublicRestaurantLocation;
}) {
  const copy = getRestaurantCopy(locale);
  const status =
    location.openingHours.length > 0
      ? getRestaurantOpeningStatus(location.openingHours, location.timezone)
      : null;
  const grouped = Array.from({ length: 7 }, (_, index) => index + 1).map((weekday) => ({
    intervals: location.openingHours.filter((interval) => interval.weekday === weekday),
    weekday,
  }));
  const address = [location.addressLine, location.locality, location.postalCode]
    .filter(Boolean)
    .join(" · ");
  const next = status?.nextOpening;
  const nextLabel = next
    ? next.dayOffset === 0
      ? copy.opensAt(formatRestaurantTime(next.opensAt, locale))
      : next.dayOffset === 1
        ? copy.opensTomorrowAt(formatRestaurantTime(next.opensAt, locale))
        : copy.opensOn(
            formatRestaurantWeekday(next.weekday, locale),
            formatRestaurantTime(next.opensAt, locale),
          )
    : null;
  const whatsappHref = location.contact?.whatsappPhone
    ? `https://wa.me/${location.contact.whatsappPhone.replace("+", "")}`
    : null;

  return (
    <article className="location-details__card">
      <div className="location-details__heading">
        <div>
          <p className="eyebrow">{copy.location}</p>
          <h2 dir="auto">{location.displayName}</h2>
        </div>
        {status ? (
          <div className={`open-state ${status.isOpen ? "open-state--open" : ""}`}>
            <strong>{status.isOpen ? copy.openNow : copy.closedNow}</strong>
            {!status.isOpen && nextLabel ? <span>{nextLabel}</span> : null}
          </div>
        ) : null}
      </div>
      <div className="location-details__grid">
        {address ? (
          <div className="location-details__address">
            <LocationIcon size={20} />
            <div>
              <strong>{copy.address}</strong>
              <span dir="auto">{address}</span>
            </div>
          </div>
        ) : null}
        {location.openingHours.length > 0 ? (
          <div className="opening-hours">
            <strong>{copy.openingHours}</strong>
            <dl>
              {grouped.map(({ intervals, weekday }) => (
                <div key={weekday}>
                  <dt>{formatRestaurantWeekday(weekday, locale, "short")}</dt>
                  <dd dir={intervals.length > 0 ? "ltr" : undefined}>
                    {intervals.length > 0
                      ? intervals
                          .map(
                            (interval) =>
                              `${formatRestaurantTime(interval.opensAt, locale)} – ${formatRestaurantTime(interval.closesAt, locale)}`,
                          )
                          .join(" · ")
                      : copy.closed}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}
      </div>
      {location.contact ? (
        <div className="contact-links">
          {location.contact.phone ? (
            <a href={`tel:${location.contact.phone}`} dir="ltr">
              {copy.call} · {location.contact.phone}
            </a>
          ) : null}
          {location.contact.email ? (
            <a href={`mailto:${location.contact.email}`} dir="ltr">
              <MailIcon size={16} /> {copy.email}
            </a>
          ) : null}
          {location.contact.websiteUrl ? (
            <a href={location.contact.websiteUrl} target="_blank" rel="noreferrer">
              <ExternalLinkIcon size={16} /> {copy.website}
            </a>
          ) : null}
          {whatsappHref ? (
            <a href={whatsappHref} target="_blank" rel="noreferrer">
              {copy.whatsapp}
            </a>
          ) : null}
          {location.contact.mapUrl ? (
            <a href={location.contact.mapUrl} target="_blank" rel="noreferrer">
              <LocationIcon size={16} /> {copy.map}
            </a>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function hasPublicLocationDetails(location: PublicRestaurantLocation): boolean {
  return Boolean(
    location.addressLine ||
    location.locality ||
    location.contact ||
    location.openingHours.length > 0,
  );
}

export function hasRestaurantMedia(publication: LocalizedRestaurantPublication): boolean {
  return Boolean(publication.branding.hero || findFirstRestaurantImage(publication));
}
