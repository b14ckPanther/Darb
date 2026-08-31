import { describe, expect, it } from "vitest";

import { getSupportedTimezones, isValidTimezone } from "./timezones";

describe("IANA timezone support", () => {
  it("accepts platform and international IANA timezones", () => {
    expect(isValidTimezone("Asia/Jerusalem")).toBe(true);
    expect(isValidTimezone("Europe/Paris")).toBe(true);
    expect(isValidTimezone("Not/A-Timezone")).toBe(false);
  });

  it("provides the standards-backed runtime list", () => {
    const timezones = getSupportedTimezones("Asia/Jerusalem");

    expect(timezones.length).toBeGreaterThan(100);
    expect(timezones).toContain("Asia/Jerusalem");
  });
});
