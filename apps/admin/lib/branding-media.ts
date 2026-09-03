import "server-only";

import type { DarbServerSupabaseClient } from "@darb/database/server";
import type { Database } from "@darb/database/types";
import {
  isMediaEligibleForRestaurantBrandingRole,
  isRestaurantBrandingRole,
  type RestaurantBrandingRole,
} from "@darb/restaurant";

import type { AccessibleMediaAsset } from "./media";
import { buildPublicMediaUrl } from "./media-validation";
import { getSupabasePublicConfig } from "./supabase/config";

type AssignmentRow = Database["core"]["Tables"]["business_media_assignments"]["Row"];

export type RestaurantBrandingAssignments = Record<RestaurantBrandingRole, string | null>;

export interface BrandingMediaOption {
  alt: string;
  durationMs: number | null;
  height: number | null;
  id: string;
  kind: "image" | "video";
  label: string;
  mimeType: string;
  url: string;
  width: number | null;
}

export async function listRestaurantBrandingAssignments(
  supabase: DarbServerSupabaseClient,
  businessId: string,
): Promise<RestaurantBrandingAssignments> {
  const { data, error } = await supabase
    .schema("core")
    .from("business_media_assignments")
    .select("module_key, role_key, media_asset_id")
    .eq("business_id", businessId)
    .eq("module_key", "restaurant");
  if (error) throw new Error(`Unable to load Restaurant branding (${error.code}).`);

  const assignments: RestaurantBrandingAssignments = { hero: null, logo: null };
  for (const row of data as Pick<AssignmentRow, "media_asset_id" | "role_key">[]) {
    if (isRestaurantBrandingRole(row.role_key)) assignments[row.role_key] = row.media_asset_id;
  }
  return assignments;
}

export function createBrandingMediaOptions(
  assets: readonly AccessibleMediaAsset[],
  role: RestaurantBrandingRole,
): BrandingMediaOption[] {
  const { url } = getSupabasePublicConfig();
  return assets.flatMap((asset) => {
    if (
      asset.status !== "active" ||
      !isMediaEligibleForRestaurantBrandingRole(role, asset.media_kind)
    ) {
      return [];
    }
    return [
      {
        alt: asset.alt_text || (asset.media_kind === "image" ? "Business image" : "Business video"),
        durationMs: asset.duration_ms,
        height: asset.height,
        id: asset.id,
        kind: asset.media_kind,
        label: asset.original_filename,
        mimeType: asset.mime_type,
        url: buildPublicMediaUrl(url, asset.storage_bucket, asset.storage_path),
        width: asset.width,
      },
    ];
  });
}
