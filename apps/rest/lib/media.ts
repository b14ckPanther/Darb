import type { PublicRestaurantBrandingMedia, PublicRestaurantImage } from "@darb/restaurant";

const PUBLIC_IMAGE_BUCKET = "tenant-media-images";
const PUBLIC_VIDEO_BUCKET = "tenant-media-videos";

type PublicRestaurantMedia = PublicRestaurantImage | PublicRestaurantBrandingMedia;

export function buildRestaurantMediaUrl(supabaseUrl: string, media: PublicRestaurantMedia): string {
  const allowedBucket =
    media.storageBucket === PUBLIC_IMAGE_BUCKET || media.storageBucket === PUBLIC_VIDEO_BUCKET;
  if (!allowedBucket) throw new Error("Unsupported public Restaurant media bucket.");

  const url = new URL(`/storage/v1/object/public/${media.storageBucket}/`, supabaseUrl);
  url.pathname += media.storagePath.split("/").map(encodeURIComponent).join("/");
  return url.toString();
}

export function buildRestaurantImageUrl(supabaseUrl: string, image: PublicRestaurantImage): string {
  if (image.storageBucket !== PUBLIC_IMAGE_BUCKET) {
    throw new Error("Unsupported public Restaurant media bucket.");
  }

  return buildRestaurantMediaUrl(supabaseUrl, image);
}
