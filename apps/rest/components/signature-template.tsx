import Image from "next/image";

import { CancelIcon, LocationIcon, RestaurantIcon } from "@darb/icons";
import {
  formatRestaurantMoney,
  type LocalizedRestaurantItem,
  type LocalizedRestaurantPublication,
} from "@darb/restaurant";
import { getTextDirection } from "@darb/i18n";

import { getRestaurantCopy } from "../lib/copy";
import { getPublicSupabaseConfig } from "../lib/config";
import { buildRestaurantImageUrl, buildRestaurantMediaUrl } from "../lib/media";
import { findFirstRestaurantImage, formatRestaurantLocation } from "../lib/presentation";
import type { RestaurantRouteContext } from "../lib/routes";
import { HeroVideo } from "./hero-video";
import {
  TemplateBrand,
  TemplateCategoryRail,
  TemplateController,
  TemplateFooter,
  TemplateTools,
} from "./template-chrome";

interface SignatureTemplateProps {
  publication: LocalizedRestaurantPublication;
  route: RestaurantRouteContext;
}

export function SignatureTemplate({ publication, route }: SignatureTemplateProps) {
  const copy = getRestaurantCopy(publication.locale);
  const assignedHero = publication.branding.hero;
  const fallbackHeroImage = assignedHero ? null : findFirstRestaurantImage(publication);
  const hasHeroMedia = Boolean(assignedHero || fallbackHeroImage);
  const imageBaseUrl = getPublicSupabaseConfig().url;

  return (
    <div className="restaurant-template template--signature" data-restaurant-template="signature">
      <TemplateController publication={publication} route={route} />
      <header className="site-header">
        <TemplateBrand publication={publication} route={route} />
        <TemplateTools publication={publication} route={route} />
      </header>

      <main id="menu-content">
        <section className={`hero ${hasHeroMedia ? "hero--with-image" : "hero--without-image"}`}>
          <div className="hero-copy">
            <p className="eyebrow">{copy.menu}</p>
            <h1 lang={publication.business.defaultLocale} dir="auto">
              {publication.business.displayName}
            </h1>
            {publication.menus[0]?.description ? (
              <p className="hero-description">{publication.menus[0].description}</p>
            ) : null}
            {publication.selectedLocation ? (
              <p className="hero-location">
                <LocationIcon size={19} />
                <span dir="auto">{formatRestaurantLocation(publication.selectedLocation)}</span>
              </p>
            ) : null}
          </div>
          {assignedHero ? (
            <div className="hero-image" data-branding-role="hero">
              {assignedHero.mediaKind === "video" ? (
                <HeroVideo
                  src={buildRestaurantMediaUrl(imageBaseUrl, assignedHero)}
                  label={assignedHero.altText ?? copy.heroVideo(publication.business.displayName)}
                  pauseLabel={copy.pauseHeroVideo}
                  playLabel={copy.playHeroVideo}
                />
              ) : (
                <Image
                  src={buildRestaurantMediaUrl(imageBaseUrl, assignedHero)}
                  alt={assignedHero.altText ?? ""}
                  fill
                  fetchPriority="high"
                  loading="eager"
                  sizes="(max-width: 767px) 100vw, 54vw"
                />
              )}
            </div>
          ) : fallbackHeroImage ? (
            <div className="hero-image">
              <Image
                src={buildRestaurantImageUrl(imageBaseUrl, fallbackHeroImage)}
                alt={fallbackHeroImage.altText ?? ""}
                fill
                fetchPriority="high"
                loading="eager"
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

        <TemplateCategoryRail publication={publication} />

        <div className="menu-content">
          {publication.menus.length === 0 ? (
            <section className="empty-menu" aria-labelledby="empty-title">
              <RestaurantIcon size={38} />
              <h2 id="empty-title">{copy.noMenusTitle}</h2>
              <p>{copy.noMenusDescription}</p>
            </section>
          ) : (
            publication.menus.map((menu) => (
              <section
                className="menu"
                key={menu.id}
                lang={menu.locale}
                dir={getTextDirection(menu.locale)}
                aria-labelledby={`menu-${menu.id}`}
              >
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
                      <div lang={category.locale} dir={getTextDirection(category.locale)}>
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

      <TemplateFooter publication={publication} />
    </div>
  );
}

export interface ItemCardProps {
  currencyCode: string;
  imageBaseUrl: string;
  item: LocalizedRestaurantItem;
  locale: LocalizedRestaurantPublication["locale"];
}

export function ItemCard({ currencyCode, imageBaseUrl, item, locale }: ItemCardProps) {
  const copy = getRestaurantCopy(locale);
  const dialogId = `item-${item.id}`;

  return (
    <article
      className={`item-card ${item.image ? "item-card--with-image" : ""}`}
      lang={item.locale}
      dir={getTextDirection(item.locale)}
    >
      <button
        type="button"
        className="item-card__button"
        data-item-dialog-open={dialogId}
        data-analytics-item-id={item.id}
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
                    <span lang={variant.locale} dir={getTextDirection(variant.locale)}>
                      {variant.name}
                    </span>
                    <strong>
                      {formatRestaurantMoney(variant.priceMinor, currencyCode, locale)}
                    </strong>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {item.modifierGroups.map((group) => (
            <section
              className="option-section"
              key={group.id}
              lang={group.locale}
              dir={getTextDirection(group.locale)}
            >
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
                    <span lang={modifier.locale} dir={getTextDirection(modifier.locale)}>
                      {modifier.name}
                    </span>
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
