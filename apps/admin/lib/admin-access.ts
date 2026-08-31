import type { BusinessAccessSnapshot } from "./auth";

export function canShowLocations(
  access: BusinessAccessSnapshot,
  visibleLocationCount: number,
): boolean {
  return access.canManageAllLocations || access.canReadAllLocations || visibleLocationCount > 0;
}

export function canCreateLocation(access: BusinessAccessSnapshot): boolean {
  return access.canManageAllLocations;
}

export function canEditLocation(hasScopedManagePermission: boolean): boolean {
  return hasScopedManagePermission;
}
