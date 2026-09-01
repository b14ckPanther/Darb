export const IMAGE_MEDIA_BUCKET = "tenant-media-images";
export const VIDEO_MEDIA_BUCKET = "tenant-media-videos";
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

export const supportedMediaMimeTypes = [
  "image/avif",
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
] as const;

export type SupportedMediaMimeType = (typeof supportedMediaMimeTypes)[number];
export type MediaKind = "image" | "video";

export interface MediaCandidate {
  byteSize: number;
  filename: string;
  mimeType: string;
}

export interface ValidMediaCandidate {
  byteSize: number;
  filename: string;
  kind: MediaKind;
  mimeType: SupportedMediaMimeType;
}

type MediaValidationResult =
  { data: ValidMediaCandidate; success: true } | { message: string; success: false };

const supportedMimeTypeSet = new Set<string>(supportedMediaMimeTypes);
const mimeExtensions: Readonly<Record<SupportedMediaMimeType, readonly string[]>> = {
  "image/avif": ["avif"],
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
  "video/mp4": ["mp4"],
  "video/webm": ["webm"],
};

export function validateMediaCandidate(candidate: MediaCandidate): MediaValidationResult {
  const filename = candidate.filename.trim();
  const mimeType = candidate.mimeType.trim().toLowerCase();

  if (
    !filename ||
    filename.length > 255 ||
    filename.includes("/") ||
    filename.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(filename)
  ) {
    return {
      message: "Choose a file with a safe name of 255 characters or fewer.",
      success: false,
    };
  }

  if (!supportedMimeTypeSet.has(mimeType)) {
    return {
      message: "Use AVIF, JPEG, PNG, WebP, MP4, or WebM media.",
      success: false,
    };
  }

  const supportedMimeType = mimeType as SupportedMediaMimeType;
  const kind: MediaKind = supportedMimeType.startsWith("image/") ? "image" : "video";
  const maximum = kind === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;

  if (!Number.isSafeInteger(candidate.byteSize) || candidate.byteSize <= 0) {
    return { message: "The selected file is empty or unreadable.", success: false };
  }

  if (candidate.byteSize > maximum) {
    return {
      message: `${kind === "image" ? "Images" : "Videos"} must be ${maximum / 1024 / 1024} MB or smaller.`,
      success: false,
    };
  }

  const extension = filename.toLowerCase().split(".").pop() ?? "";

  if (!mimeExtensions[supportedMimeType].includes(extension)) {
    return {
      message: "The filename extension does not match the selected file type.",
      success: false,
    };
  }

  return {
    data: { byteSize: candidate.byteSize, filename, kind, mimeType: supportedMimeType },
    success: true,
  };
}

export function mediaStorageExtension(mimeType: SupportedMediaMimeType): string {
  if (mimeType === "image/jpeg") return "jpg";

  const extension = mimeExtensions[mimeType][0];
  if (!extension) throw new Error("Supported media MIME type has no canonical extension.");
  return extension;
}

export function buildMediaStoragePath(
  businessId: string,
  assetId: string,
  mimeType: SupportedMediaMimeType,
): string {
  return `${businessId}/${assetId}/asset.${mediaStorageExtension(mimeType)}`;
}

export function buildPublicMediaUrl(
  supabaseUrl: string,
  storageBucket: string,
  storagePath: string,
): string {
  if (storageBucket !== IMAGE_MEDIA_BUCKET && storageBucket !== VIDEO_MEDIA_BUCKET) {
    throw new Error("Unsupported Darb media bucket.");
  }

  const url = new URL(`/storage/v1/object/public/${storageBucket}/`, supabaseUrl);
  url.pathname += storagePath.split("/").map(encodeURIComponent).join("/");
  return url.toString();
}
