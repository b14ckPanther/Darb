import { describe, expect, it } from "vitest";

import {
  businessLocationPath,
  businessPath,
  businessSectionPath,
  getBusinessSwitchPath,
  getCanonicalBusinessPath,
  getLoginDestination,
  getOnboardingDestination,
  getPostSignInDestination,
  getProtectedAdminDestination,
  sanitizeReturnPath,
} from "./navigation";

describe("tenant-aware business routes", () => {
  it("builds canonical business and location paths", () => {
    expect(businessPath("darb-core")).toBe("/b/darb-core");
    expect(businessSectionPath("darb-core", "settings")).toBe("/b/darb-core/settings");
    expect(businessSectionPath("darb-core", "modules")).toBe("/b/darb-core/modules");
    expect(businessSectionPath("darb-core", "appearance")).toBe("/b/darb-core/appearance");
    expect(businessSectionPath("darb-core", "media")).toBe("/b/darb-core/media");
    expect(businessSectionPath("darb-core", "domains")).toBe("/b/darb-core/domains");
    expect(businessSectionPath("darb-core", "languages")).toBe("/b/darb-core/languages");
    expect(businessLocationPath("darb-core", "location-id")).toBe(
      "/b/darb-core/locations/location-id",
    );
    expect(getCanonicalBusinessPath("new-slug", "settings")).toBe("/b/new-slug/settings");
  });

  it("preserves safe implemented sections when switching businesses", () => {
    expect(getBusinessSwitchPath("/b/alpha/settings", "alpha", "beta")).toBe("/b/beta/settings");
    expect(getBusinessSwitchPath("/b/alpha/locations/location-id", "alpha", "beta")).toBe(
      "/b/beta/locations",
    );
    expect(getBusinessSwitchPath("/b/alpha/modules", "alpha", "beta")).toBe("/b/beta/modules");
    expect(getBusinessSwitchPath("/b/alpha/appearance", "alpha", "beta")).toBe(
      "/b/beta/appearance",
    );
    expect(getBusinessSwitchPath("/b/alpha/media", "alpha", "beta")).toBe("/b/beta/media");
    expect(getBusinessSwitchPath("/b/alpha/domains", "alpha", "beta")).toBe("/b/beta/domains");
    expect(getBusinessSwitchPath("/b/alpha/languages", "alpha", "beta")).toBe("/b/beta/languages");
    expect(getBusinessSwitchPath("/b/alpha", "alpha", "beta")).toBe("/b/beta");
  });

  it("fails back to the target business home for unrelated paths", () => {
    expect(getBusinessSwitchPath("/unexpected", "alpha", "beta")).toBe("/b/beta");
  });
});

describe("admin route decisions", () => {
  it("redirects unauthenticated protected access to login with a safe return path", () => {
    expect(
      getProtectedAdminDestination(
        { accessibleBusinessCount: 0, isAuthenticated: false },
        "/settings?tab=team",
      ),
    ).toBe("/login?next=%2Fsettings%3Ftab%3Dteam");
  });

  it("redirects authenticated users without businesses to onboarding", () => {
    expect(
      getProtectedAdminDestination({ accessibleBusinessCount: 0, isAuthenticated: true }),
    ).toBe("/onboarding");
  });

  it("allows authenticated users with an accessible business", () => {
    expect(
      getProtectedAdminDestination({ accessibleBusinessCount: 2, isAuthenticated: true }),
    ).toBeNull();
  });

  it("keeps onboarding limited to authenticated users with no business", () => {
    expect(getOnboardingDestination({ accessibleBusinessCount: 0, isAuthenticated: false })).toBe(
      "/login?next=%2Fonboarding",
    );
    expect(getOnboardingDestination({ accessibleBusinessCount: 1, isAuthenticated: true })).toBe(
      "/",
    );
    expect(
      getOnboardingDestination({ accessibleBusinessCount: 0, isAuthenticated: true }),
    ).toBeNull();
  });

  it("redirects an authenticated login visitor according to tenant access", () => {
    expect(getLoginDestination({ accessibleBusinessCount: 0, isAuthenticated: true })).toBe(
      "/onboarding",
    );
    expect(getLoginDestination({ accessibleBusinessCount: 1, isAuthenticated: true })).toBe("/");
    expect(getLoginDestination({ accessibleBusinessCount: 0, isAuthenticated: false })).toBeNull();
  });
});

describe("safe return paths", () => {
  it.each([
    "https://attacker.example/path",
    "//attacker.example/path",
    "/\\attacker.example/path",
    "javascript:alert(1)",
    "not-a-path",
  ])("rejects the unsafe return value %s", (value) => {
    expect(sanitizeReturnPath(value)).toBe("/");
  });

  it("preserves a same-origin path and query", () => {
    expect(sanitizeReturnPath("/business/example?tab=team#ignored")).toBe(
      "/business/example?tab=team",
    );
  });

  it("never sends a signed-in business user back to login or onboarding", () => {
    expect(getPostSignInDestination(1, "/login")).toBe("/");
    expect(getPostSignInDestination(1, "/onboarding")).toBe("/");
  });

  it("always sends a signed-in user without a business to onboarding", () => {
    expect(getPostSignInDestination(0, "/settings")).toBe("/onboarding");
  });
});
