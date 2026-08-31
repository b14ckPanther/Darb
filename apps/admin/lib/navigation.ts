const ADMIN_ORIGIN = "https://admin.darb.co.il";

export const adminPaths = {
  home: "/",
  login: "/login",
  onboarding: "/onboarding",
} as const;

export type BusinessSection = "home" | "locations" | "settings";

export function businessPath(slug: string): string {
  return `/b/${slug}`;
}

export function businessSectionPath(slug: string, section: BusinessSection): string {
  return section === "home" ? businessPath(slug) : `${businessPath(slug)}/${section}`;
}

export function businessLocationPath(slug: string, locationId: string): string {
  return `${businessSectionPath(slug, "locations")}/${locationId}`;
}

export function getBusinessSwitchPath(
  currentPath: string,
  currentSlug: string,
  nextSlug: string,
): string {
  const currentBase = businessPath(currentSlug);

  if (!currentPath.startsWith(currentBase)) {
    return businessPath(nextSlug);
  }

  const suffix = currentPath.slice(currentBase.length);

  if (suffix === "/settings" || suffix.startsWith("/settings/")) {
    return businessSectionPath(nextSlug, "settings");
  }

  if (suffix === "/locations" || suffix.startsWith("/locations/")) {
    return businessSectionPath(nextSlug, "locations");
  }

  return businessPath(nextSlug);
}

export function getCanonicalBusinessPath(slug: string, section: BusinessSection): string {
  return businessSectionPath(slug, section);
}

export interface AdminAccessState {
  accessibleBusinessCount: number;
  isAuthenticated: boolean;
}

export function getProtectedAdminDestination(
  state: AdminAccessState,
  requestedPath: string = adminPaths.home,
): string | null {
  if (!state.isAuthenticated) {
    return buildLoginPath(requestedPath);
  }

  if (state.accessibleBusinessCount === 0) {
    return adminPaths.onboarding;
  }

  return null;
}

export function getOnboardingDestination(state: AdminAccessState): string | null {
  if (!state.isAuthenticated) {
    return buildLoginPath(adminPaths.onboarding);
  }

  if (state.accessibleBusinessCount > 0) {
    return adminPaths.home;
  }

  return null;
}

export function getLoginDestination(state: AdminAccessState): string | null {
  if (!state.isAuthenticated) {
    return null;
  }

  return state.accessibleBusinessCount > 0 ? adminPaths.home : adminPaths.onboarding;
}

export function getPostSignInDestination(
  accessibleBusinessCount: number,
  requestedPath: string | null | undefined,
): string {
  if (accessibleBusinessCount === 0) {
    return adminPaths.onboarding;
  }

  const safePath = sanitizeReturnPath(requestedPath);

  if (safePath === adminPaths.login || safePath.startsWith(`${adminPaths.onboarding}/`)) {
    return adminPaths.home;
  }

  return safePath === adminPaths.onboarding ? adminPaths.home : safePath;
}

export function sanitizeReturnPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return adminPaths.home;
  }

  try {
    const parsed = new URL(value, ADMIN_ORIGIN);

    if (parsed.origin !== ADMIN_ORIGIN) {
      return adminPaths.home;
    }

    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return adminPaths.home;
  }
}

function buildLoginPath(requestedPath: string): string {
  const safePath = sanitizeReturnPath(requestedPath);
  return `${adminPaths.login}?next=${encodeURIComponent(safePath)}`;
}
