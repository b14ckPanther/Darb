import type { LocalizedRestaurantPublication, PublicRestaurantImage } from "@darb/restaurant";

export function findFirstRestaurantImage(
  publication: LocalizedRestaurantPublication,
): PublicRestaurantImage | null {
  for (const menu of publication.menus) {
    for (const category of menu.categories) {
      if (category.image) return category.image;
      const itemImage = category.items.find((item) => item.image)?.image;
      if (itemImage) return itemImage;
    }
  }
  return null;
}

export function formatRestaurantLocation(
  location: LocalizedRestaurantPublication["locations"][number],
): string {
  return [location.displayName, location.addressLine, location.locality]
    .filter(Boolean)
    .join(" · ");
}
