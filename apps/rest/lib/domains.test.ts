import { describe, expect, it } from "vitest";
import { parsePublicDomainResolution } from "./domains";

describe("parsePublicDomainResolution", () => {
  it("accepts only the curated Restaurant resolution shape", () => {
    expect(
      parsePublicDomainResolution({
        businessSlug: "caramel",
        hostname: "caramel.example",
        isPrimary: true,
        primaryHostname: "caramel.example",
        targetModuleKey: "restaurant",
      }),
    ).toMatchObject({ businessSlug: "caramel", targetModuleKey: "restaurant" });
  });
  it("fails closed for unsupported engines and internal shapes", () => {
    expect(
      parsePublicDomainResolution({
        businessSlug: "caramel",
        hostname: "caramel.example",
        isPrimary: true,
        primaryHostname: null,
        targetModuleKey: "pages",
      }),
    ).toBeNull();
    expect(
      parsePublicDomainResolution({ businessId: "secret", targetModuleKey: "restaurant" }),
    ).toBeNull();
  });
});
