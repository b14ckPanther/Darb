import { describe, expect, it } from "vitest";

import type { BusinessAccessSnapshot } from "./auth";
import {
  canCreateLocation,
  canEditLocation,
  canManageAppearance,
  canManageDomains,
  canManageMedia,
  canManageModules,
  canShowDomains,
  canShowLocations,
  canShowMedia,
} from "./admin-access";

const noAccess: BusinessAccessSnapshot = {
  canManageAppearance: false,
  canManageAllLocations: false,
  canManageBusiness: false,
  canManageDomains: false,
  canManageMedia: false,
  canManageModules: false,
  canReadAllLocations: false,
  canViewAudit: false,
  isSuperAdmin: false,
};

describe("admin access decisions", () => {
  it("shows locations for business-wide read or manage access", () => {
    expect(canShowLocations({ ...noAccess, canReadAllLocations: true }, 0)).toBe(true);
    expect(canShowLocations({ ...noAccess, canManageAllLocations: true }, 0)).toBe(true);
  });

  it("shows locations when RLS exposes a location-scoped assignment", () => {
    expect(canShowLocations(noAccess, 1)).toBe(true);
    expect(canShowLocations(noAccess, 0)).toBe(false);
  });

  it("allows location creation only with business-wide manage access", () => {
    expect(canCreateLocation({ ...noAccess, canManageAllLocations: true })).toBe(true);
    expect(canCreateLocation(noAccess)).toBe(false);
  });

  it("uses the exact database-backed location permission for editing", () => {
    expect(canEditLocation(true)).toBe(true);
    expect(canEditLocation(false)).toBe(false);
  });

  it("allows module mutation only with modules.manage on an active business", () => {
    expect(canManageModules({ ...noAccess, canManageModules: true }, "active")).toBe(true);
    expect(canManageModules({ ...noAccess, canManageModules: true }, "suspended")).toBe(false);
    expect(canManageModules({ ...noAccess, canManageModules: true }, "archived")).toBe(false);
    expect(canManageModules(noAccess, "active")).toBe(false);
  });

  it("allows appearance mutation only with appearance.manage on an active business", () => {
    const access = { ...noAccess, canManageAppearance: true };
    expect(canManageAppearance(access, "active")).toBe(true);
    expect(canManageAppearance(access, "suspended")).toBe(false);
    expect(canManageAppearance(access, "archived")).toBe(false);
    expect(canManageAppearance(noAccess, "active")).toBe(false);
  });

  it("keeps media and domain navigation scoped to their explicit permissions", () => {
    expect(canShowMedia({ ...noAccess, canManageMedia: true })).toBe(true);
    expect(canShowDomains({ ...noAccess, canManageDomains: true })).toBe(true);
    expect(canShowMedia(noAccess)).toBe(false);
    expect(canShowDomains(noAccess)).toBe(false);
  });

  it("blocks media and domain mutations outside an active business", () => {
    const mediaAccess = { ...noAccess, canManageMedia: true };
    const domainAccess = { ...noAccess, canManageDomains: true };

    expect(canManageMedia(mediaAccess, "active")).toBe(true);
    expect(canManageMedia(mediaAccess, "archived")).toBe(false);
    expect(canManageMedia(mediaAccess, "suspended")).toBe(false);
    expect(canManageDomains(domainAccess, "active")).toBe(true);
    expect(canManageDomains(domainAccess, "archived")).toBe(false);
    expect(canManageDomains(domainAccess, "suspended")).toBe(false);
  });
});
