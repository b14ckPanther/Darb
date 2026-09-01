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

export function canManageModules(
  access: BusinessAccessSnapshot,
  businessStatus: "active" | "archived" | "suspended",
): boolean {
  return access.canManageModules && businessStatus === "active";
}

export function canManageMedia(
  access: BusinessAccessSnapshot,
  businessStatus: "active" | "archived" | "suspended",
): boolean {
  return access.canManageMedia && businessStatus === "active";
}

export function canManageDomains(
  access: BusinessAccessSnapshot,
  businessStatus: "active" | "archived" | "suspended",
): boolean {
  return access.canManageDomains && businessStatus === "active";
}

export function canShowMedia(access: BusinessAccessSnapshot): boolean {
  return access.canManageMedia;
}

export function canShowDomains(access: BusinessAccessSnapshot): boolean {
  return access.canManageDomains;
}
