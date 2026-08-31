import { describe, expect, it } from "vitest";

import type { BusinessAccessSnapshot } from "./auth";
import { canCreateLocation, canEditLocation, canShowLocations } from "./admin-access";

const noAccess: BusinessAccessSnapshot = {
  canManageAllLocations: false,
  canManageBusiness: false,
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
});
