import "server-only";

import type { DarbServerSupabaseClient } from "@darb/database/server";
import type { Database } from "@darb/database/types";

type MediaAssetRow = Database["core"]["Tables"]["media_assets"]["Row"];

export type AccessibleMediaAsset = Pick<
  MediaAssetRow,
  | "alt_text"
  | "byte_size"
  | "created_at"
  | "duration_ms"
  | "height"
  | "id"
  | "media_kind"
  | "mime_type"
  | "original_filename"
  | "status"
  | "storage_bucket"
  | "storage_path"
  | "updated_at"
  | "width"
>;

const mediaColumns =
  "id, storage_bucket, storage_path, media_kind, mime_type, byte_size, width, height, duration_ms, alt_text, original_filename, status, created_at, updated_at" as const;

export async function listBusinessMediaAssets(
  supabase: DarbServerSupabaseClient,
  businessId: string,
): Promise<AccessibleMediaAsset[]> {
  const { data, error } = await supabase
    .schema("core")
    .from("media_assets")
    .select(mediaColumns)
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Unable to load business media (${error.code}).`);
  }

  return data;
}
