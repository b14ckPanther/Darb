import Image from "next/image";
import Link from "next/link";

import { darbApplications } from "@darb/config/platform";
import { ArrowRightIcon, LanguagesSettingsIcon, LocationIcon, RestaurantIcon } from "@darb/icons";
import { getTextDirection } from "@darb/i18n";
import type { LocalizedRestaurantPublication } from "@darb/restaurant";

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
  );
}

export function hasRestaurantMedia(publication: LocalizedRestaurantPublication): boolean {
  return Boolean(publication.branding.hero || findFirstRestaurantImage(publication));
}
