export const restaurantTemplateKeys = [
  "restaurant-signature",
  "restaurant-editorial",
  "restaurant-counter",
] as const;

export type RestaurantTemplateKey = (typeof restaurantTemplateKeys)[number];

export function resolveRestaurantTemplateKey(value: string): RestaurantTemplateKey {
  return restaurantTemplateKeys.includes(value as RestaurantTemplateKey)
    ? (value as RestaurantTemplateKey)
    : "restaurant-signature";
}
