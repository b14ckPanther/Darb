import { LocationIcon, RestaurantIcon } from "@darb/icons";
import { getTextDirection } from "@darb/i18n";
import type { LocalizedRestaurantPublication } from "@darb/restaurant";

import { getRestaurantCopy } from "../lib/copy";
import { getPublicSupabaseConfig } from "../lib/config";
import { formatRestaurantLocation } from "../lib/presentation";
import type { RestaurantRouteContext } from "../lib/routes";
import { ItemCard } from "./signature-template";
import {
  TemplateBrand,
  TemplateCategoryRail,
  TemplateController,
  TemplateFooter,
  TemplateHeroMedia,
  TemplateTools,
} from "./template-chrome";

export function CounterTemplate({
  publication,
  route,
}: {
  publication: LocalizedRestaurantPublication;
  route: RestaurantRouteContext;
}) {
  const copy = getRestaurantCopy(publication.locale);
  const imageBaseUrl = getPublicSupabaseConfig().url;

  return (
    <div className="restaurant-template template--counter" data-restaurant-template="counter">
      <TemplateController publication={publication} route={route} />
      <header className="counter-header">
        <TemplateBrand publication={publication} route={route} />
        <TemplateTools publication={publication} route={route} />
      </header>

      <main id="menu-content">
        <section className="counter-hero">
          <div className="counter-hero__copy">
            <span className="counter-kicker">
              <RestaurantIcon size={17} /> {copy.menu}
            </span>
            <h1 lang={publication.business.defaultLocale} dir="auto">
              {publication.business.displayName}
            </h1>
            {publication.menus[0]?.description ? <p>{publication.menus[0].description}</p> : null}
            {publication.selectedLocation ? (
              <p className="counter-location">
                <LocationIcon size={18} />
                <span dir="auto">{formatRestaurantLocation(publication.selectedLocation)}</span>
              </p>
            ) : null}
          </div>
          <TemplateHeroMedia
            className="counter-hero__media"
            publication={publication}
            sizes="(max-width: 767px) 100vw, 42vw"
          />
        </section>

        <TemplateCategoryRail publication={publication} />

        <div className="counter-menu-content">
          {publication.menus.length === 0 ? (
            <section className="empty-menu" aria-labelledby="empty-title">
              <RestaurantIcon size={36} />
              <h2 id="empty-title">{copy.noMenusTitle}</h2>
              <p>{copy.noMenusDescription}</p>
            </section>
          ) : (
            publication.menus.map((menu) => (
              <section
                className="counter-menu"
                key={menu.id}
                lang={menu.locale}
                dir={getTextDirection(menu.locale)}
                aria-labelledby={`menu-${menu.id}`}
              >
                <header className="counter-menu__heading">
                  <p className="eyebrow">{copy.menu}</p>
                  <h2 id={`menu-${menu.id}`}>{menu.name}</h2>
                  {menu.description ? <p>{menu.description}</p> : null}
                </header>
                <div className="counter-category-grid">
                  {menu.categories.map((category) => (
                    <section
                      className="counter-category"
                      id={`category-${category.id}`}
                      key={category.id}
                      aria-labelledby={`category-title-${category.id}`}
                    >
                      <header
                        className="counter-category__heading"
                        lang={category.locale}
                        dir={getTextDirection(category.locale)}
                      >
                        <h3 id={`category-title-${category.id}`}>{category.name}</h3>
                        {category.description ? <p>{category.description}</p> : null}
                      </header>
                      {category.items.length === 0 ? (
                        <p className="category-empty">{copy.noItems}</p>
                      ) : (
                        <div className="counter-item-list">
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
                </div>
              </section>
            ))
          )}
        </div>
      </main>
      <TemplateFooter publication={publication} />
    </div>
  );
}
