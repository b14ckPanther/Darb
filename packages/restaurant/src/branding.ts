export const restaurantBrandingRoles = {
  hero: { allowedMediaKinds: ["image", "video"] as const, label: "Hero media" },
  logo: { allowedMediaKinds: ["image"] as const, label: "Logo" },
} as const;

export type RestaurantBrandingRole = keyof typeof restaurantBrandingRoles;
export type RestaurantBrandingMediaKind = "image" | "video";

export function isRestaurantBrandingRole(value: string): value is RestaurantBrandingRole {
  return value === "logo" || value === "hero";
}

export function isMediaEligibleForRestaurantBrandingRole(
  role: RestaurantBrandingRole,
  mediaKind: string,
): mediaKind is RestaurantBrandingMediaKind {
  return (restaurantBrandingRoles[role].allowedMediaKinds as readonly string[]).includes(mediaKind);
}
