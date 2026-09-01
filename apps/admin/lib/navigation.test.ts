import { describe, expect, it } from "vitest";

import {
  buildAdminNavigation,
  businessLocationPath,
  businessPath,
  businessSectionPath,
  getBusinessSwitchPath,
  getCanonicalBusinessPath,
  getLoginDestination,
  getOnboardingDestination,
  getPostSignInDestination,
  getProtectedAdminDestination,
  isAdminNavigationItemActive,
  sanitizeReturnPath,
  type AdminEngineContribution,
  type AdminNavigationContext,
} from "./navigation";

const navigationContext: AdminNavigationContext = {
  canManageAllLocations: true,
  canReadAllLocations: true,
  enabledModules: [],
  permissionKeys: ["domains.manage", "media.manage"],
  visibleLocationCount: 2,
};

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
    expect(getBusinessSwitchPath("/b/alpha/future-engine/items", "alpha", "beta")).toBe("/b/beta");
  });
});

describe("admin navigation registry", () => {
  it("composes ordered conceptual groups from one typed registry", () => {
    const groups = buildAdminNavigation("darb-core", navigationContext);

    expect(groups.map((group) => group.label)).toEqual([
      "Workspace",
      "Business",
      "Experience",
      "Products",
    ]);
    expect(groups.flatMap((group) => group.items.map((item) => item.label))).toEqual([
      "Overview",
      "Business settings",
      "Locations",
      "Languages",
      "Appearance",
      "Media",
      "Domains",
      "Modules",
    ]);
  });

  it("filters permission-sensitive links without treating hiding as authorization", () => {
    const groups = buildAdminNavigation("darb-core", {
      ...navigationContext,
      canManageAllLocations: false,
      canReadAllLocations: false,
      permissionKeys: [],
      visibleLocationCount: 0,
    });
    const keys = groups.flatMap((group) => group.items.map((item) => item.key));

    expect(keys).not.toContain("domains");
    expect(keys).not.toContain("media");
    expect(keys).not.toContain("locations");
    expect(keys).toContain("business-settings");
    expect(keys).toContain("modules");
  });

  it("adds a future engine contribution only when its capability is enabled", () => {
    const contribution = {
      key: "sample-engine-admin",
      moduleKey: "sample-engine",
      navigation: [
        {
          group: "products",
          icon: "modules",
          key: "sample-engine-overview",
          label: "Sample engine",
          order: 20,
          requiredPermission: "sample.manage",
          section: "sample-engine",
          visibility: "always",
        },
      ],
      routeOwner: "/b/[businessSlug]/sample-engine",
    } as const satisfies AdminEngineContribution;

    expect(
      buildAdminNavigation("darb-core", navigationContext, [contribution])
        .flatMap((group) => group.items)
        .some((item) => item.key === "sample-engine-overview"),
    ).toBe(false);
    expect(
      buildAdminNavigation(
        "darb-core",
        { ...navigationContext, enabledModules: ["sample-engine"] },
        [contribution],
      )
        .flatMap((group) => group.items)
        .some((item) => item.key === "sample-engine-overview"),
    ).toBe(false);
    expect(
      buildAdminNavigation(
        "darb-core",
        {
          ...navigationContext,
          enabledModules: ["sample-engine"],
          permissionKeys: [...navigationContext.permissionKeys, "sample.manage"],
        },
        [contribution],
      )
        .flatMap((group) => group.items)
        .find((item) => item.key === "sample-engine-overview")?.href,
    ).toBe("/b/darb-core/sample-engine");
  });

  it("marks only the exact overview or matching section as current", () => {
    const items = buildAdminNavigation("darb-core", navigationContext).flatMap(
      (group) => group.items,
    );
    const overview = items.find((item) => item.key === "overview")!;
    const locations = items.find((item) => item.key === "locations")!;

    expect(isAdminNavigationItemActive("/b/darb-core", overview)).toBe(true);
    expect(isAdminNavigationItemActive("/b/darb-core/settings", overview)).toBe(false);
    expect(isAdminNavigationItemActive("/b/darb-core/locations/123", locations)).toBe(true);
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
