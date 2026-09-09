import type { SupportedLocale } from "@darb/i18n";

export type RestaurantItemFilterAvailability = "all" | "available" | "sold_out";
export type RestaurantItemFilterMedia = "all" | "with_image" | "without_image";

export interface RestaurantOperationalItem {
  availabilityStatus: "available" | "sold_out";
  categoryId: string;
  hasImage: boolean;
  internalName: string;
  localizedName: string;
}

export interface RestaurantItemFilters {
  availability: RestaurantItemFilterAvailability;
  categoryId: string;
  media: RestaurantItemFilterMedia;
  query: string;
}

export function filterRestaurantItems<T extends RestaurantOperationalItem>(
  items: readonly T[],
  filters: RestaurantItemFilters,
): T[] {
  const query = filters.query.trim().toLocaleLowerCase();

  return items.filter((item) => {
    if (filters.categoryId !== "all" && item.categoryId !== filters.categoryId) return false;
    if (filters.availability !== "all" && item.availabilityStatus !== filters.availability)
      return false;
    if (filters.media === "with_image" && !item.hasImage) return false;
    if (filters.media === "without_image" && item.hasImage) return false;
    if (!query) return true;

    return `${item.localizedName} ${item.internalName}`.toLocaleLowerCase().includes(query);
  });
}

export function buildRestaurantPublicUrl({
  businessSlug,
  defaultLocale,
  locale,
  primaryHostname,
}: {
  businessSlug: string;
  defaultLocale: SupportedLocale;
  locale: SupportedLocale;
  primaryHostname: string | null;
}): string {
  const localePath = locale === defaultLocale ? "" : `/${locale}`;
  return primaryHostname
    ? `https://${primaryHostname}${localePath || "/"}`
    : `https://rest.darb.co.il/${businessSlug}${localePath}`;
}
