import type { LocalizedRestaurantPublication } from "@darb/restaurant";
import { getPublicSupabaseConfig } from "../lib/config";
import type { RestaurantRouteContext } from "../lib/routes";
import { createRestaurantJsonLd, serializeJsonLd } from "../lib/seo";
import { SignatureTemplate } from "./signature-template";

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
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <SignatureTemplate publication={publication} route={route} />
    </>
  );
}
