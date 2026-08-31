const ADMIN_ORIGIN = "https://admin.darb.co.il";

export const adminPaths = {
  home: "/",
  login: "/login",
  onboarding: "/onboarding",
} as const;

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
