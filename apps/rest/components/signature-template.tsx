import Image from "next/image";
import Link from "next/link";

import {
  ArrowRightIcon,
  CancelIcon,
  LanguagesSettingsIcon,
  LocationIcon,
  RestaurantIcon,
} from "@darb/icons";
import {
  formatRestaurantMoney,
  type LocalizedRestaurantItem,
  type LocalizedRestaurantPublication,
  type PublicRestaurantImage,
} from "@darb/restaurant";

import { getRestaurantCopy } from "../lib/copy";
import { getPublicSupabaseConfig } from "../lib/config";
import { buildRestaurantImageUrl } from "../lib/media";
import { restaurantPath } from "../lib/routes";
import { ItemDialogController } from "./item-dialog-controller";

interface SignatureTemplateProps {
  publication: LocalizedRestaurantPublication;
}

export function SignatureTemplate({ publication }: SignatureTemplateProps) {
  const copy = getRestaurantCopy(publication.locale);
  const heroImage = findFirstImage(publication);
  const imageBaseUrl = getPublicSupabaseConfig().url;
  const currentLocationId = publication.selectedLocation?.id ?? null;
  const categoryCount = publication.menus.reduce(
    (count, menu) => count + menu.categories.length,
    0,
  );

  return (
    <>
      <ItemDialogController />
      <header className="site-header">
        <Link
          href={restaurantPath(
            publication.business.slug,
            publication.locale,
            publication.business.defaultLocale,
            currentLocationId,
          )}
          className="brand-mark"
        >
          <span className="brand-symbol" aria-hidden="true">
            <RestaurantIcon size={20} />
          </span>
          <span>{publication.business.displayName}</span>
        </Link>
        <div className="header-tools">
          {publication.locations.length > 0 ? (
            <details className="locale-menu location-menu">
              <summary>
                <LocationIcon size={18} />
                <span>{publication.selectedLocation?.displayName ?? copy.allLocations}</span>
              </summary>
              <div className="popover-list">
                <Link
                  aria-current={currentLocationId === null ? "page" : undefined}
                  href={restaurantPath(
                    publication.business.slug,
                    publication.locale,
                    publication.business.defaultLocale,
                  )}
                >
                  {copy.allLocations}
                </Link>
                {publication.locations.map((location) => (
                  <Link
                    key={location.id}
                    aria-current={location.id === currentLocationId ? "page" : undefined}
                    href={restaurantPath(
                      publication.business.slug,
                      publication.locale,
                      publication.business.defaultLocale,
                      location.id,
                    )}
                  >
                    <span>{location.displayName}</span>
                    {location.locality ? <small>{location.locality}</small> : null}
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
                    aria-current={locale === publication.locale ? "page" : undefined}
                    href={restaurantPath(
                      publication.business.slug,
                      locale,
                      publication.business.defaultLocale,
                      currentLocationId,
                    )}
                  >
                    {{ ar: "العربية", en: "English", he: "עברית" }[locale]}
                  </Link>
                ))}
              </div>
            </details>
          ) : null}
        </div>
      </header>

      <main id="menu-content">
        <section className={`hero ${heroImage ? "hero--with-image" : "hero--without-image"}`}>
          <div className="hero-copy">
            <p className="eyebrow">{copy.menu}</p>
            <h1>{publication.business.displayName}</h1>
            {publication.menus[0]?.description ? (
              <p className="hero-description">{publication.menus[0].description}</p>
            ) : null}
            {publication.selectedLocation ? (
              <p className="hero-location">
                <LocationIcon size={19} />
                <span>{formatLocation(publication.selectedLocation)}</span>
              </p>
            ) : null}
          </div>
          {heroImage ? (
            <div className="hero-image">
              <Image
                src={buildRestaurantImageUrl(imageBaseUrl, heroImage)}
                alt={heroImage.altText ?? ""}
                fill
                fetchPriority="high"
                sizes="(max-width: 767px) 100vw, 54vw"
              />
            </div>
          ) : (
            <div className="hero-motif" aria-hidden="true">
              <span />
              <RestaurantIcon size={72} />
            </div>
          )}
        </section>

        {categoryCount > 0 ? (
          <nav className="category-rail" aria-label={copy.categories}>
            <div className="category-rail__inner">
              {publication.menus.flatMap((menu) =>
                menu.categories.map((category) => (
                  <a key={category.id} href={`#category-${category.id}`}>
                    {category.name}
                  </a>
                )),
              )}
            </div>
          </nav>
        ) : null}

        <div className="menu-content">
          {publication.menus.length === 0 ? (
            <section className="empty-menu" aria-labelledby="empty-title">
              <RestaurantIcon size={38} />
              <h2 id="empty-title">{copy.noMenusTitle}</h2>
              <p>{copy.noMenusDescription}</p>
            </section>
          ) : (
            publication.menus.map((menu) => (
              <section className="menu" key={menu.id} aria-labelledby={`menu-${menu.id}`}>
                <div className="menu-heading">
                  <p className="eyebrow">{copy.menu}</p>
                  <h2 id={`menu-${menu.id}`}>{menu.name}</h2>
                  {menu.description ? <p>{menu.description}</p> : null}
                </div>
                {menu.categories.map((category) => (
                  <section
                    className="category"
                    id={`category-${category.id}`}
                    key={category.id}
                    aria-labelledby={`category-title-${category.id}`}
                  >
                    <div className="category-heading">
                      <div>
                        <h3 id={`category-title-${category.id}`}>{category.name}</h3>
                        {category.description ? <p>{category.description}</p> : null}
                      </div>
                      <span aria-hidden="true" />
                    </div>
                    {category.items.length === 0 ? (
                      <p className="category-empty">{copy.noItems}</p>
                    ) : (
                      <div className="item-grid">
                        {category.items.map((item) => (
                          <ItemCard
                            key={item.id}
                            item={item}
                            currencyCode={publication.business.currencyCode}
                            locale={publication.locale}
                            imageBaseUrl={imageBaseUrl}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                ))}
              </section>
            ))
          )}
        </div>
      </main>

      <footer className="site-footer">
        <span>{publication.business.displayName}</span>
        <a href="https://darb.co.il" lang="en">
          {copy.poweredBy}
          <ArrowRightIcon size={16} />
        </a>
      </footer>
    </>
  );
}

interface ItemCardProps {
  currencyCode: string;
  imageBaseUrl: string;
  item: LocalizedRestaurantItem;
  locale: LocalizedRestaurantPublication["locale"];
}

function ItemCard({ currencyCode, imageBaseUrl, item, locale }: ItemCardProps) {
  const copy = getRestaurantCopy(locale);
  const dialogId = `item-${item.id}`;

  return (
    <article className={`item-card ${item.image ? "item-card--with-image" : ""}`}>
      <button
        type="button"
        className="item-card__button"
        data-item-dialog-open={dialogId}
        aria-label={`${copy.viewDetails}: ${item.name}`}
      >
        <div className="item-card__copy">
          <div className="item-card__title-row">
            <h4>{item.name}</h4>
            {item.availabilityStatus === "sold_out" ? (
              <span className="sold-out">{copy.soldOut}</span>
            ) : null}
          </div>
          {item.description ? <p>{item.description}</p> : null}
          <strong>{formatRestaurantMoney(item.basePriceMinor, currencyCode, locale)}</strong>
        </div>
        {item.image ? (
          <span className="item-card__image">
            <Image
              src={buildRestaurantImageUrl(imageBaseUrl, item.image)}
              alt={item.image.altText ?? ""}
              fill
              sizes="(max-width: 600px) 34vw, (max-width: 1200px) 20vw, 15vw"
            />
          </span>
        ) : null}
      </button>
      <ItemDialog
        currencyCode={currencyCode}
        dialogId={dialogId}
        imageBaseUrl={imageBaseUrl}
        item={item}
        locale={locale}
      />
    </article>
  );
}

function ItemDialog({
  currencyCode,
  dialogId,
  imageBaseUrl,
  item,
  locale,
}: ItemCardProps & { dialogId: string }) {
  const copy = getRestaurantCopy(locale);
  return (
    <dialog id={dialogId} className="item-dialog" aria-labelledby={`${dialogId}-title`}>
      <div className="item-dialog__surface">
        <button
          type="button"
          className="dialog-close"
          data-item-dialog-close
          aria-label={copy.close}
        >
          <CancelIcon size={22} />
        </button>
        {item.image ? (
          <div className="item-dialog__image">
            <Image
              src={buildRestaurantImageUrl(imageBaseUrl, item.image)}
              alt={item.image.altText ?? ""}
              fill
              sizes="(max-width: 700px) 100vw, 38rem"
            />
          </div>
        ) : null}
        <div className="item-dialog__content">
          <div className="item-dialog__heading">
            <div>
              <p className="eyebrow">{copy.details}</p>
              <h2 id={`${dialogId}-title`}>{item.name}</h2>
            </div>
            <strong>{formatRestaurantMoney(item.basePriceMinor, currencyCode, locale)}</strong>
          </div>
          {item.availabilityStatus === "sold_out" ? (
            <p className="sold-out sold-out--large">{copy.soldOut}</p>
          ) : null}
          {item.description ? <p className="item-dialog__description">{item.description}</p> : null}
          {item.variants.length > 0 ? (
            <section className="option-section">
              <h3>{copy.variants}</h3>
              <ul>
                {item.variants.map((variant) => (
                  <li
                    key={variant.id}
                    className={variant.availabilityStatus === "sold_out" ? "is-unavailable" : ""}
                  >
                    <span>{variant.name}</span>
                    <strong>
                      {formatRestaurantMoney(variant.priceMinor, currencyCode, locale)}
                    </strong>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {item.modifierGroups.map((group) => (
            <section className="option-section" key={group.id}>
              <div className="option-section__heading">
                <div>
                  <h3>{group.name}</h3>
                  {group.description ? <p>{group.description}</p> : null}
                </div>
                <span>
                  {group.minimumSelections > 0 ? copy.modifierRequired : copy.modifierOptional}
                </span>
              </div>
              <p className="selection-guidance">
                {copy.selections(group.minimumSelections, group.maximumSelections)}
              </p>
              <ul>
                {group.modifiers.map((modifier) => (
                  <li
                    key={modifier.id}
                    className={modifier.availabilityStatus === "sold_out" ? "is-unavailable" : ""}
                  >
                    <span>{modifier.name}</span>
                    {modifier.priceDeltaMinor > 0 ? (
                      <strong>
                        {formatRestaurantMoney(
                          modifier.priceDeltaMinor,
                          currencyCode,
                          locale,
                          true,
                        )}
                      </strong>
                    ) : (
                      <span aria-hidden="true">—</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </dialog>
  );
}

function findFirstImage(publication: LocalizedRestaurantPublication): PublicRestaurantImage | null {
  for (const menu of publication.menus) {
    for (const category of menu.categories) {
      if (category.image) return category.image;
      const itemImage = category.items.find((item) => item.image)?.image;
      if (itemImage) return itemImage;
    }
  }
  return null;
}

function formatLocation(location: LocalizedRestaurantPublication["locations"][number]): string {
  return [location.displayName, location.addressLine, location.locality]
    .filter(Boolean)
    .join(" · ");
}
