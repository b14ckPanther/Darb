import { describe, expect, it } from "vitest";

import {
  parseBusinessLocalesInput,
  parseMediaAltText,
  parseMediaUploadRequest,
} from "./phase6-forms";

describe("Phase 6 form parsing", () => {
  it("accepts validated media metadata and normalizes alternative text", () => {
    expect(
      parseMediaUploadRequest({
        altText: "  Front entrance  ",
        byteSize: 68,
        filename: "entrance.png",
        height: 1,
        mimeType: "image/png",
        width: 1,
      }),
    ).toMatchObject({
      data: { altText: "Front entrance", height: 1, kind: "image", width: 1 },
      success: true,
    });
  });

  it("rejects partial dimensions, video metadata on images, and oversized alt text", () => {
    expect(
      parseMediaUploadRequest({
        byteSize: 68,
        filename: "asset.png",
        height: 1,
        mimeType: "image/png",
      }),
    ).toMatchObject({ success: false });
    expect(
      parseMediaUploadRequest({
        byteSize: 68,
        durationMs: 100,
        filename: "asset.png",
        mimeType: "image/png",
      }),
    ).toMatchObject({ success: false });

    const alt = new FormData();
    alt.set("altText", "x".repeat(501));
    expect(parseMediaAltText(alt)).toMatchObject({ success: false });
  });

  it("requires the default business locale to remain in the enabled set", () => {
    const valid = new FormData();
    valid.set("defaultLocale", "ar");
    valid.append("enabledLocales", "ar");
    valid.append("enabledLocales", "en");
    valid.append("enabledLocales", "en");
    expect(parseBusinessLocalesInput(valid)).toEqual({
      data: { defaultLocale: "ar", enabledLocales: ["ar", "en"] },
      success: true,
    });

    const missingDefault = new FormData();
    missingDefault.set("defaultLocale", "he");
    missingDefault.append("enabledLocales", "en");
    expect(parseBusinessLocalesInput(missingDefault)).toMatchObject({ success: false });
  });
});
