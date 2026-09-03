import { darbApplications } from "@darb/config/platform";

const ADMIN_ORIGIN = `https://${darbApplications.admin.productionHost}`;

export const adminPaths = {
  home: "/",
  login: "/login",
  onboarding: "/onboarding",
} as const;

export type BusinessSection =
  | "appearance"
  | "domains"
  | "home"
  | "languages"
  | "locations"
  | "media"
  | "modules"
  | "restaurant"
  | "settings";

export type AdminNavigationGroupKey =
  "business" | "experience" | "governance" | "products" | "workspace";

export type AdminNavigationIconKey =
  | "appearance"
  | "audit"
  | "business"
  | "domains"
  | "languages"
  | "locations"
  | "media"
  | "modules"
  | "overview"
  | "restaurant";

export type AdminNavigationVisibility = "always" | "locations";

export interface AdminNavigationItemDefinition {
  group: AdminNavigationGroupKey;
  icon: AdminNavigationIconKey;
  key: string;
  label: string;
  order: number;
  requiredModule?: string;
  requiredAnyPermission?: readonly string[];
  requiredPermission?: string;
  section: BusinessSection | string;
  visibility: AdminNavigationVisibility;
}

export interface AdminEngineContribution {
  key: string;
  moduleKey: string;
  navigation: readonly AdminNavigationItemDefinition[];
  routeOwner: string;
}

export interface AdminNavigationContext {
  enabledModules: readonly string[];
  permissionKeys: readonly string[];
  visibleLocationCount: number;
  canReadAllLocations: boolean;
  canManageAllLocations: boolean;
}

export interface ResolvedAdminNavigationItem extends AdminNavigationItemDefinition {
  href: string;
}

export interface ResolvedAdminNavigationGroup {
  items: ResolvedAdminNavigationItem[];
  key: AdminNavigationGroupKey;
  label: string;
  order: number;
}

const navigationGroups = [
  { key: "workspace", label: "Workspace", order: 10 },
  { key: "business", label: "Business", order: 20 },
  { key: "experience", label: "Experience", order: 30 },
  { key: "products", label: "Products", order: 40 },
  { key: "governance", label: "Governance", order: 50 },
] as const satisfies readonly Omit<ResolvedAdminNavigationGroup, "items">[];

export const coreAdminNavigation = [
  {
    group: "workspace",
    icon: "overview",
    key: "overview",
    label: "Overview",
    order: 10,
    section: "home",
    visibility: "always",
  },
  {
    group: "business",
    icon: "business",
    key: "business-settings",
    label: "Business settings",
    order: 10,
    section: "settings",
    visibility: "always",
  },
  {
    group: "business",
    icon: "locations",
    key: "locations",
    label: "Locations",
    order: 20,
    section: "locations",
    visibility: "locations",
  },
  {
    group: "business",
    icon: "languages",
    key: "languages",
    label: "Languages",
    order: 30,
    section: "languages",
    visibility: "always",
  },
  {
    group: "experience",
    icon: "appearance",
    key: "appearance",
    label: "Appearance",
    order: 10,
    section: "appearance",
    visibility: "always",
  },
  {
    group: "experience",
    icon: "media",
    key: "media",
    label: "Media",
    order: 20,
    section: "media",
    requiredPermission: "media.manage",
    visibility: "always",
  },
  {
    group: "experience",
    icon: "domains",
    key: "domains",
    label: "Domains",
    order: 30,
    section: "domains",
    requiredPermission: "domains.manage",
    visibility: "always",
  },
  {
    group: "products",
    icon: "modules",
    key: "modules",
    label: "Modules",
    order: 10,
    section: "modules",
    visibility: "always",
  },
] as const satisfies readonly AdminNavigationItemDefinition[];

// Engine contributions are statically composed here. Future engines add a typed contribution,
// while their routes retain their own server-side module and permission gates.
export const restaurantAdminContribution = {
  key: "restaurant-admin",
  moduleKey: "restaurant",
  navigation: [
    {
      group: "products",
      icon: "restaurant",
      key: "restaurant-overview",
      label: "Restaurant",
      order: 20,
      requiredAnyPermission: ["restaurant.read", "restaurant.manage"],
      section: "restaurant",
      visibility: "always",
    },
  ],
  routeOwner: "/b/[businessSlug]/restaurant",
} as const satisfies AdminEngineContribution;

export const adminEngineContributions: readonly AdminEngineContribution[] = [
  restaurantAdminContribution,
];

export function buildAdminNavigation(
  slug: string,
  context: AdminNavigationContext,
  extensions: readonly AdminEngineContribution[] = adminEngineContributions,
): ResolvedAdminNavigationGroup[] {
  const enabledModules = new Set(context.enabledModules);
  const permissionKeys = new Set(context.permissionKeys);
  const extensionItems = extensions.flatMap((extension) =>
    extension.navigation.map((item) => ({
      ...item,
      requiredModule: item.requiredModule ?? extension.moduleKey,
    })),
  );
  const items = [...coreAdminNavigation, ...extensionItems]
    .filter((item) => isNavigationItemVisible(item, context, enabledModules, permissionKeys))
    .map((item): ResolvedAdminNavigationItem => ({
      ...item,
      href: resolveAdminNavigationHref(slug, item.section),
    }));

  return navigationGroups.flatMap((group) => {
    const groupItems = items
      .filter((item) => item.group === group.key)
      .sort((left, right) => left.order - right.order || left.label.localeCompare(right.label));

    return groupItems.length > 0 ? [{ ...group, items: groupItems }] : [];
  });
}

export function isAdminNavigationItemActive(
  pathname: string,
  item: Pick<ResolvedAdminNavigationItem, "href" | "section">,
): boolean {
  return item.section === "home"
    ? pathname === item.href
    : pathname.startsWith(`${item.href}/`) || pathname === item.href;
}

function isNavigationItemVisible(
  item: AdminNavigationItemDefinition,
  context: AdminNavigationContext,
  enabledModules: ReadonlySet<string>,
  permissionKeys: ReadonlySet<string>,
): boolean {
  if (item.requiredModule && !enabledModules.has(item.requiredModule)) {
    return false;
  }

  if (item.requiredPermission && !permissionKeys.has(item.requiredPermission)) {
    return false;
  }

  if (
    item.requiredAnyPermission &&
    !item.requiredAnyPermission.some((permission) => permissionKeys.has(permission))
  ) {
    return false;
  }

  switch (item.visibility) {
    case "locations":
      return (
        context.canManageAllLocations ||
        context.canReadAllLocations ||
        context.visibleLocationCount > 0
      );
    case "always":
      return true;
  }
}

function resolveAdminNavigationHref(slug: string, section: string): string {
  return section === "home" ? businessPath(slug) : `${businessPath(slug)}/${section}`;
}

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
  // Registered top-level sections can be preserved without carrying entity IDs across tenants.
  // The target route still re-resolves module and permission state server-side.
  const switchableSections = [
    ...coreAdminNavigation,
    ...adminEngineContributions.flatMap((engine) => engine.navigation),
  ]
    .map((item) => item.section)
    .filter((section) => section !== "home");
  const matchingSection = switchableSections.find(
    (section) => suffix === `/${section}` || suffix.startsWith(`/${section}/`),
  );

  if (matchingSection) return resolveAdminNavigationHref(nextSlug, matchingSection);

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
