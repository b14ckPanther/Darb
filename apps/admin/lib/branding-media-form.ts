import { isRestaurantBrandingRole, type RestaurantBrandingRole } from "@darb/restaurant";

import type { FieldErrors } from "./forms";

export type BrandingMediaInput = {
  mediaAssetId: string | null;
  role: RestaurantBrandingRole;
};

export type BrandingMediaParseResult =
  { data: BrandingMediaInput; success: true } | { errors: FieldErrors; success: false };

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parseBrandingMediaInput(formData: FormData): BrandingMediaParseResult {
  const roleValue = formData.get("role");
  const mediaValue = formData.get("mediaAssetId");
  const role = typeof roleValue === "string" ? roleValue.trim() : "";
  const mediaAssetId = typeof mediaValue === "string" ? mediaValue.trim() : "";
  const errors: Record<string, string> = {};

  if (!isRestaurantBrandingRole(role)) errors.role = "Choose a supported branding role.";
  if (mediaAssetId && !uuidPattern.test(mediaAssetId)) {
    errors.mediaAssetId = "Choose an active media asset from the library.";
  }

  return Object.keys(errors).length > 0 || !isRestaurantBrandingRole(role)
    ? { errors, success: false }
    : { data: { mediaAssetId: mediaAssetId || null, role }, success: true };
}
