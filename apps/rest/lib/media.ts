import type { PublicRestaurantImage } from "@darb/restaurant";

const PUBLIC_IMAGE_BUCKET = "tenant-media-images";

export function buildRestaurantImageUrl(supabaseUrl: string, image: PublicRestaurantImage): string {
  if (image.storageBucket !== PUBLIC_IMAGE_BUCKET) {
    throw new Error("Unsupported public Restaurant media bucket.");
  }

  const url = new URL(`/storage/v1/object/public/${image.storageBucket}/`, supabaseUrl);
  url.pathname += image.storagePath.split("/").map(encodeURIComponent).join("/");
  return url.toString();
}
