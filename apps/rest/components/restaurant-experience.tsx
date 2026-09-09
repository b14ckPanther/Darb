import type { LocalizedRestaurantPublication } from "@darb/restaurant";
import { getPublicSupabaseConfig } from "../lib/config";
import type { RestaurantRouteContext } from "../lib/routes";
import { createRestaurantJsonLd, serializeJsonLd } from "../lib/seo";
import { resolveRestaurantTemplateKey, type RestaurantTemplateKey } from "../lib/templates";
import { CounterTemplate } from "./counter-template";
import { EditorialTemplate } from "./editorial-template";
import { SignatureTemplate } from "./signature-template";

const restaurantTemplateComponents: Record<RestaurantTemplateKey, typeof SignatureTemplate> = {
  "restaurant-counter": CounterTemplate,
  "restaurant-editorial": EditorialTemplate,
  "restaurant-signature": SignatureTemplate,
};

export function RestaurantExperience({
  publication,
  route,
}: {
  publication: LocalizedRestaurantPublication;
  route: RestaurantRouteContext;
}) {
  const jsonLd = serializeJsonLd(
    createRestaurantJsonLd(publication, route, getPublicSupabaseConfig().url),
  );
  const templateKey = resolveRestaurantTemplateKey(publication.appearance.templateKey);
  const Template = restaurantTemplateComponents[templateKey];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <Template publication={publication} route={route} />
    </>
  );
}
