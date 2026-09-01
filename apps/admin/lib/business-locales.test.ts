import { describe, expect, it } from "vitest";

import { mapBusinessLocaleState } from "./business-locales";

describe("business locale state", () => {
  it("maps enabled rows and restores the canonical default defensively", () => {
    expect(
      mapBusinessLocaleState(
        [
          {
            created_at: "2026-09-01T00:00:00Z",
            is_enabled: true,
            locale_code: "en",
            updated_at: "2026-09-01T00:00:00Z",
          },
          {
            created_at: "2026-09-01T00:00:00Z",
            is_enabled: false,
            locale_code: "he",
            updated_at: "2026-09-01T00:00:00Z",
          },
        ],
        "ar",
      ),
    ).toEqual({ defaultLocale: "ar", enabledLocales: ["ar", "en"] });
  });
});
