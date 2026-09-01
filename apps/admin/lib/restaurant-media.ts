import "server-only";

import type { AccessibleMediaAsset } from "./media";
import { buildPublicMediaUrl } from "./media-validation";
import { getSupabasePublicConfig } from "./supabase/config";

export interface RestaurantMediaOption {
  alt: string;
  id: string;
  label: string;
  url: string;
}

export function createRestaurantMediaOptions(
  assets: readonly AccessibleMediaAsset[],
): RestaurantMediaOption[] {
  const { url } = getSupabasePublicConfig();
  return assets.map((asset) => ({
    alt: asset.alt_text || "Business media image",
    id: asset.id,
    label: asset.original_filename,
    url: buildPublicMediaUrl(url, asset.storage_bucket, asset.storage_path),
  }));
}
