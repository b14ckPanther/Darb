import { LocationIcon } from "@darb/icons";
import { getTextDirection } from "@darb/i18n";
import type { LocalizedRestaurantPublication } from "@darb/restaurant";

import { getRestaurantCopy } from "../lib/copy";
import { getPublicSupabaseConfig } from "../lib/config";
import { formatRestaurantLocation } from "../lib/presentation";
import type { RestaurantRouteContext } from "../lib/routes";
import { ItemCard } from "./signature-template";
import {
  hasRestaurantMedia,
  TemplateBrand,
  TemplateCategoryRail,
  TemplateController,
  TemplateFooter,
  TemplateHeroMedia,
  TemplateTools,
} from "./template-chrome";

export function EditorialTemplate({
  publication,
  route,
}: {
  publication: LocalizedRestaurantPublication;
  route: RestaurantRouteContext;
}) {
  const copy = getRestaurantCopy(publication.locale);
  const imageBaseUrl = getPublicSupabaseConfig().url;
  const hasMedia = hasRestaurantMedia(publication);

  return (
    <div className="restaurant-template template--editorial" data-restaurant-template="editorial">
      <TemplateController publication={publication} route={route} />
      <header className="editorial-header">
        <TemplateBrand publication={publication} route={route} />
        <TemplateTools publication={publication} route={route} />
      </header>

      <main id="menu-content">
        <section className={`editorial-hero${hasMedia ? " has-media" : ""}`}>
          <TemplateHeroMedia
            className="editorial-hero__media"
            publication={publication}
            sizes="100vw"
          />
          <div className="editorial-hero__copy">
            <p className="eyebrow">{copy.menu}</p>
            <h1 lang={publication.business.defaultLocale} dir="auto">
              {publication.business.displayName}
            </h1>
            {publication.menus[0]?.description ? (
              <p className="editorial-hero__description">{publication.menus[0].description}</p>
            ) : null}
            {publication.selectedLocation ? (
              <p className="hero-location">
                <LocationIcon size={19} />
                <span dir="auto">{formatRestaurantLocation(publication.selectedLocation)}</span>
              </p>
            ) : null}
          </div>
        </section>

        <TemplateCategoryRail publication={publication} />

        <div className="editorial-menu-content">
          {publication.menus.length === 0 ? (
            <section className="empty-menu" aria-labelledby="empty-title">
              <h2 id="empty-title">{copy.noMenusTitle}</h2>
              <p>{copy.noMenusDescription}</p>
            </section>
          ) : (
            publication.menus.map((menu, menuIndex) => (
              <section
                className="editorial-menu"
                key={menu.id}
                lang={menu.locale}
                dir={getTextDirection(menu.locale)}
                aria-labelledby={`menu-${menu.id}`}
              >
                <header className="editorial-menu__heading">
                  <span aria-hidden="true">{String(menuIndex + 1).padStart(2, "0")}</span>
                  <div>
                    <p className="eyebrow">{copy.menu}</p>
                    <h2 id={`menu-${menu.id}`}>{menu.name}</h2>
                    {menu.description ? <p>{menu.description}</p> : null}
                  </div>
                </header>
                {menu.categories.map((category, categoryIndex) => (
                  <section
                    className="editorial-category"
                    id={`category-${category.id}`}
                    key={category.id}
                    aria-labelledby={`category-title-${category.id}`}
                  >
                    <header className="editorial-category__heading">
                      <span aria-hidden="true">{String(categoryIndex + 1).padStart(2, "0")}</span>
                      <div lang={category.locale} dir={getTextDirection(category.locale)}>
                        <h3 id={`category-title-${category.id}`}>{category.name}</h3>
                        {category.description ? <p>{category.description}</p> : null}
                      </div>
                    </header>
                    {category.items.length === 0 ? (
                      <p className="category-empty">{copy.noItems}</p>
                    ) : (
                      <div className="editorial-item-list">
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
