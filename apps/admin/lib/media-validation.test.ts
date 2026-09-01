import { describe, expect, it } from "vitest";

import {
  buildMediaStoragePath,
  buildPublicMediaUrl,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  validateMediaCandidate,
} from "./media-validation";

describe("shared media validation", () => {
  it("accepts the reviewed image and video formats at their exact limits", () => {
    expect(
      validateMediaCandidate({
        byteSize: MAX_IMAGE_BYTES,
        filename: "brand-image.WEBP",
        mimeType: "image/webp",
      }),
    ).toMatchObject({ data: { kind: "image", mimeType: "image/webp" }, success: true });
    expect(
      validateMediaCandidate({
        byteSize: MAX_VIDEO_BYTES,
        filename: "intro.mp4",
        mimeType: "video/mp4",
      }),
    ).toMatchObject({ data: { kind: "video", mimeType: "video/mp4" }, success: true });
  });

  it("rejects unsafe names, unsupported MIME types, mismatched extensions, and oversize files", () => {
    expect(
      validateMediaCandidate({ byteSize: 68, filename: "../asset.png", mimeType: "image/png" }),
    ).toMatchObject({ success: false });
    expect(
      validateMediaCandidate({ byteSize: 68, filename: "asset.svg", mimeType: "image/svg+xml" }),
    ).toMatchObject({ success: false });
    expect(
      validateMediaCandidate({ byteSize: 68, filename: "asset.jpg", mimeType: "image/png" }),
    ).toMatchObject({ success: false });
    expect(
      validateMediaCandidate({
        byteSize: MAX_IMAGE_BYTES + 1,
        filename: "asset.png",
        mimeType: "image/png",
      }),
    ).toMatchObject({ success: false });
  });

  it("derives an immutable UUID path and encodes the public delivery URL", () => {
    const path = buildMediaStoragePath("business-id", "asset-id", "image/jpeg");
    expect(path).toBe("business-id/asset-id/asset.jpg");
    expect(buildPublicMediaUrl("https://project.supabase.co", "tenant-media-images", path)).toBe(
      "https://project.supabase.co/storage/v1/object/public/tenant-media-images/business-id/asset-id/asset.jpg",
    );
  });
});
