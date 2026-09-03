import { describe, expect, it } from "vitest";

import { parseBrandingMediaInput } from "./branding-media-form";

describe("Restaurant branding media form", () => {
  it("accepts governed roles and a selected asset", () => {
    const form = new FormData();
    form.set("role", "hero");
    form.set("mediaAssetId", "00000000-0000-4000-8000-000000000001");
    expect(parseBrandingMediaInput(form)).toEqual({
      data: {
        mediaAssetId: "00000000-0000-4000-8000-000000000001",
        role: "hero",
      },
      success: true,
    });
  });

  it("uses an empty asset as the explicit fallback request", () => {
    const form = new FormData();
    form.set("role", "logo");
    form.set("mediaAssetId", "");
    expect(parseBrandingMediaInput(form)).toEqual({
      data: { mediaAssetId: null, role: "logo" },
      success: true,
    });
  });

  it("rejects ungoverned roles and arbitrary asset values", () => {
    const form = new FormData();
    form.set("role", "background");
    form.set("mediaAssetId", "https://attacker.example/image.png");
    expect(parseBrandingMediaInput(form)).toEqual({
      errors: {
        mediaAssetId: "Choose an active media asset from the library.",
        role: "Choose a supported branding role.",
      },
      success: false,
    });
  });
});
