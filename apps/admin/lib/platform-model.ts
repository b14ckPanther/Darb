export type PlatformBusinessStatus = "active" | "archived" | "suspended";
export type PlatformDomainOwnershipStatus = "disabled" | "failed" | "pending" | "verified";
export type PlatformDomainRoutingStatus =
  "disconnected" | "failed" | "live" | "provisioning" | "unconfigured";

export interface PlatformOverview {
  activeSuperAdmins: number;
  availableModules: number;
  businesses: Record<PlatformBusinessStatus | "total", number>;
  liveDomains: number;
  memberships: number;
  restaurantEnabledBusinesses: number;
  templates: number;
  users: number;
}

export interface PlatformPage<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface PlatformBusinessListItem {
  createdAt: string;
  currencyCode: string;
  defaultLocale: string;
  displayName: string;
  domainCount: number;
  enabledLocales: string[];
  enabledModules: string[];
  id: string;
  liveDomainCount: number;
  locationCount: number;
  membershipCount: number;
  slug: string;
  status: PlatformBusinessStatus;
  timezone: string;
  updatedAt: string;
}

export interface PlatformBusinessDetail {
  activeMembershipCount: number;
  appearances: Array<{
    moduleKey: string;
    templateAvailable: boolean;
    templateDisplayName: string;
    templateKey: string;
    updatedAt: string;
  }>;
  business: Pick<
    PlatformBusinessListItem,
    | "createdAt"
    | "currencyCode"
    | "defaultLocale"
    | "displayName"
    | "id"
    | "slug"
    | "status"
    | "timezone"
    | "updatedAt"
  >;
  domains: PlatformDomainItem[];
  locales: Array<{ code: string; isEnabled: boolean }>;
  locations: Array<{
    addressLine: string | null;
    countryCode: string;
    displayName: string;
    id: string;
    locality: string | null;
    postalCode: string | null;
    status: string;
    timezone: string | null;
  }>;
  membershipCount: number;
  modules: Array<{
    displayName: string;
    isAvailable: boolean;
    isEffective: boolean;
    isEnabled: boolean;
    key: string;
  }>;
  restaurant: {
    configured: boolean;
    itemCount: number;
    menuCount: number;
    moduleEnabled: boolean;
    publiclyActive: boolean;
    publishedMenuCount: number;
  };
}

export interface PlatformUserItem {
  activeMembershipCount: number;
  businessCount: number;
  createdAt: string;
  email: string | null;
  id: string;
  isSuperAdmin: boolean;
  memberships: Array<{
    businessId: string;
    businessName: string;
    businessSlug: string;
    id: string;
    permissionKeys: string[];
    status: string;
  }>;
}

export interface PlatformSuperAdmin {
  email: string | null;
  grantedAt: string;
  revokedAt: string | null;
  state: "active" | "revoked";
  userId: string;
}

export interface PlatformModuleItem {
  description: string;
  displayName: string;
  effectiveBusinessCount: number;
  enabledBusinessCount: number;
  isAvailable: boolean;
  key: string;
  sortOrder: number;
}

export interface PlatformTemplateItem {
  description: string;
  displayName: string;
  isAvailable: boolean;
  isDefault: boolean;
  key: string;
  moduleKey: string;
  selectedBusinessCount: number;
  sortOrder: number;
  templateVersion: number;
  themeSchemaVersion: number;
}

export interface PlatformDomainItem {
  businessId: string;
  businessName: string;
  businessSlug: string;
  createdAt: string;
  hostname: string;
  id: string;
  isPrimary: boolean;
  ownershipStatus: PlatformDomainOwnershipStatus;
  routingCheckedAt: string | null;
  routingLiveAt: string | null;
  routingStatus: PlatformDomainRoutingStatus;
  targetModuleKey: string | null;
  updatedAt: string;
  verificationCheckedAt: string | null;
  verifiedAt: string | null;
}

export interface PlatformAuditItem {
  actionKey: string;
  actorEmail: string | null;
  actorKind: string;
  actorUserId: string | null;
  businessId: string | null;
  businessName: string | null;
  businessSlug: string | null;
  entityId: string | null;
  entityType: string | null;
  id: string;
  occurredAt: string;
}

export interface PlatformBusinessTransition {
  description: string;
  label: string;
  status: PlatformBusinessStatus;
  tone: "danger" | "neutral" | "positive";
}

export const platformPaths = {
  audit: "/platform/audit",
  businesses: "/platform/businesses",
  domains: "/platform/domains",
  home: "/platform",
  modules: "/platform/modules",
  templates: "/platform/templates",
  users: "/platform/users",
} as const;

export function platformBusinessPath(id: string): string {
  return `${platformPaths.businesses}/${id}`;
}

export function parsePlatformOverview(value: unknown): PlatformOverview {
  const record = readRecord(value);
  const businesses = readRecord(record.businesses);
  return {
    activeSuperAdmins: readCount(record.active_super_admins),
    availableModules: readCount(record.available_modules),
    businesses: {
      active: readCount(businesses.active),
      archived: readCount(businesses.archived),
      suspended: readCount(businesses.suspended),
      total: readCount(businesses.total),
    },
    liveDomains: readCount(record.live_domains),
    memberships: readCount(record.memberships),
    restaurantEnabledBusinesses: readCount(record.restaurant_enabled_businesses),
    templates: readCount(record.templates),
    users: readCount(record.users),
  };
}

export function parsePlatformBusinessPage(value: unknown): PlatformPage<PlatformBusinessListItem> {
  return parsePage(value, (item) => {
    const record = readRecord(item);
    return {
      createdAt: readString(record.created_at),
      currencyCode: readString(record.currency_code),
      defaultLocale: readString(record.default_locale),
      displayName: readString(record.display_name),
      domainCount: readCount(record.domain_count),
      enabledLocales: readStringArray(record.enabled_locales),
      enabledModules: readStringArray(record.enabled_modules),
      id: readString(record.id),
      liveDomainCount: readCount(record.live_domain_count),
      locationCount: readCount(record.location_count),
      membershipCount: readCount(record.membership_count),
      slug: readString(record.slug),
      status: readBusinessStatus(record.status),
      timezone: readString(record.timezone),
      updatedAt: readString(record.updated_at),
    };
  });
}

export function parsePlatformBusinessDetail(value: unknown): PlatformBusinessDetail | null {
  if (value === null) return null;
  const record = readRecord(value);
  const business = readRecord(record.business);
  const restaurant = readRecord(record.restaurant);

  return {
    activeMembershipCount: readCount(record.active_membership_count),
    appearances: readArray(record.appearances).map((item) => {
      const row = readRecord(item);
      return {
        moduleKey: readString(row.module_key),
        templateAvailable: readBoolean(row.template_available),
        templateDisplayName: readString(row.template_display_name),
        templateKey: readString(row.template_key),
        updatedAt: readString(row.updated_at),
      };
    }),
    business: {
      createdAt: readString(business.created_at),
      currencyCode: readString(business.currency_code),
      defaultLocale: readString(business.default_locale),
      displayName: readString(business.display_name),
      id: readString(business.id),
      slug: readString(business.slug),
      status: readBusinessStatus(business.status),
      timezone: readString(business.timezone),
      updatedAt: readString(business.updated_at),
    },
    domains: readArray(record.domains).map(parseDomain),
    locales: readArray(record.locales).map((item) => {
      const row = readRecord(item);
      return { code: readString(row.code), isEnabled: readBoolean(row.is_enabled) };
    }),
    locations: readArray(record.locations).map((item) => {
      const row = readRecord(item);
      return {
        addressLine: readNullableString(row.address_line),
        countryCode: readString(row.country_code),
        displayName: readString(row.display_name),
        id: readString(row.id),
        locality: readNullableString(row.locality),
        postalCode: readNullableString(row.postal_code),
        status: readString(row.status),
        timezone: readNullableString(row.timezone),
      };
    }),
    membershipCount: readCount(record.membership_count),
    modules: readArray(record.modules).map((item) => {
      const row = readRecord(item);
      return {
        displayName: readString(row.display_name),
        isAvailable: readBoolean(row.is_available),
        isEffective: readBoolean(row.is_effective),
        isEnabled: readBoolean(row.is_enabled),
        key: readString(row.key),
      };
    }),
    restaurant: {
      configured: readBoolean(restaurant.configured),
      itemCount: readCount(restaurant.item_count),
      menuCount: readCount(restaurant.menu_count),
      moduleEnabled: readBoolean(restaurant.module_enabled),
      publiclyActive: readBoolean(restaurant.publicly_active),
      publishedMenuCount: readCount(restaurant.published_menu_count),
    },
  };
}

export function parsePlatformUserPage(value: unknown): PlatformPage<PlatformUserItem> {
  return parsePage(value, (item) => {
    const record = readRecord(item);
    return {
      activeMembershipCount: readCount(record.active_membership_count),
      businessCount: readCount(record.business_count),
      createdAt: readString(record.created_at),
      email: readNullableString(record.email),
      id: readString(record.id),
      isSuperAdmin: readBoolean(record.is_super_admin),
      memberships: readArray(record.memberships).map((membership) => {
        const row = readRecord(membership);
        return {
          businessId: readString(row.business_id),
          businessName: readString(row.business_name),
          businessSlug: readString(row.business_slug),
          id: readString(row.id),
          permissionKeys: readStringArray(row.permission_keys),
          status: readString(row.status),
        };
      }),
    };
  });
}

export function parsePlatformSuperAdmins(value: unknown): PlatformSuperAdmin[] {
  return readArray(value).map((item) => {
    const record = readRecord(item);
    const state = readString(record.state);
    if (state !== "active" && state !== "revoked") throw new Error("Invalid platform data.");
    return {
      email: readNullableString(record.email),
      grantedAt: readString(record.granted_at),
      revokedAt: readNullableString(record.revoked_at),
      state,
      userId: readString(record.user_id),
    };
  });
}

export function parsePlatformModules(value: unknown): PlatformModuleItem[] {
  return readArray(value).map((item) => {
    const record = readRecord(item);
    return {
      description: readString(record.description),
      displayName: readString(record.display_name),
      effectiveBusinessCount: readCount(record.effective_business_count),
      enabledBusinessCount: readCount(record.enabled_business_count),
      isAvailable: readBoolean(record.is_available),
      key: readString(record.key),
      sortOrder: readCount(record.sort_order),
    };
  });
}

export function parsePlatformTemplates(value: unknown): PlatformTemplateItem[] {
  return readArray(value).map((item) => {
    const record = readRecord(item);
    return {
      description: readString(record.description),
      displayName: readString(record.display_name),
      isAvailable: readBoolean(record.is_available),
      isDefault: readBoolean(record.is_default),
      key: readString(record.key),
      moduleKey: readString(record.module_key),
      selectedBusinessCount: readCount(record.selected_business_count),
      sortOrder: readCount(record.sort_order),
      templateVersion: readCount(record.template_version),
      themeSchemaVersion: readCount(record.theme_schema_version),
    };
  });
}

export function parsePlatformDomainPage(value: unknown): PlatformPage<PlatformDomainItem> {
  return parsePage(value, parseDomain);
}

export function parsePlatformAuditPage(value: unknown): PlatformPage<PlatformAuditItem> {
  return parsePage(value, (item) => {
    const record = readRecord(item);
    return {
      actionKey: readString(record.action_key),
      actorEmail: readNullableString(record.actor_email),
      actorKind: readString(record.actor_kind),
      actorUserId: readNullableString(record.actor_user_id),
      businessId: readNullableString(record.business_id),
      businessName: readNullableString(record.business_name),
      businessSlug: readNullableString(record.business_slug),
      entityId: readNullableString(record.entity_id),
      entityType: readNullableString(record.entity_type),
      id: readString(record.id),
      occurredAt: readString(record.occurred_at),
    };
  });
}

export function getPlatformBusinessTransitions(
  status: PlatformBusinessStatus,
): PlatformBusinessTransition[] {
  if (status === "active") {
    return [
      {
        description:
          "Suspend tenant operations at platform level. Stored data is retained and business users cannot self-reactivate.",
        label: "Suspend business",
        status: "suspended",
        tone: "danger",
      },
      {
        description:
          "Move this business into retained historical state. No tenant data is deleted.",
        label: "Archive business",
        status: "archived",
        tone: "neutral",
      },
    ];
  }

  return [
    {
      description:
        status === "suspended"
          ? "Restore normal tenant operation after the platform suspension has been resolved."
          : "Restore this retained business to active tenant operation.",
      label: "Reactivate business",
      status: "active",
      tone: "positive",
    },
  ];
}

export function getPlatformModuleImplementation(key: string): "Admin ready" | "Engine pending" {
  return key === "restaurant" ? "Admin ready" : "Engine pending";
}

export function parsePositivePage(value: string | string[] | undefined): number {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate || !/^\d+$/.test(candidate)) return 1;
  const parsed = Number(candidate);
  return Number.isSafeInteger(parsed) && parsed >= 1 && parsed <= 1_000_000 ? parsed : 1;
}

function parseDomain(item: unknown): PlatformDomainItem {
  const record = readRecord(item);
  return {
    businessId: readString(record.business_id),
    businessName: readString(record.business_name),
    businessSlug: readString(record.business_slug),
    createdAt: readString(record.created_at),
    hostname: readString(record.hostname),
    id: readString(record.id),
    isPrimary: readBoolean(record.is_primary),
    ownershipStatus: readOwnershipStatus(record.ownership_status ?? record.status),
    routingCheckedAt: readNullableString(record.routing_checked_at),
    routingLiveAt: readNullableString(record.routing_live_at),
    routingStatus: readRoutingStatus(record.routing_status),
    targetModuleKey: readNullableString(record.target_module_key),
    updatedAt: readString(record.updated_at),
    verificationCheckedAt: readNullableString(record.verification_checked_at),
    verifiedAt: readNullableString(record.verified_at),
  };
}

function parsePage<T>(value: unknown, mapItem: (value: unknown) => T): PlatformPage<T> {
  const record = readRecord(value);
  return {
    items: readArray(record.items).map(mapItem),
    page: readCount(record.page),
    pageSize: readCount(record.page_size),
    total: readCount(record.total),
  };
}

function readRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid platform data.");
  }
  return value as Record<string, unknown>;
}

function readArray(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw new Error("Invalid platform data.");
  return value;
}

function readString(value: unknown): string {
  if (typeof value !== "string") throw new Error("Invalid platform data.");
  return value;
}

function readNullableString(value: unknown): string | null {
  return value === null ? null : readString(value);
}

function readStringArray(value: unknown): string[] {
  return readArray(value).map(readString);
}

function readBoolean(value: unknown): boolean {
  if (typeof value !== "boolean") throw new Error("Invalid platform data.");
  return value;
}

function readCount(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error("Invalid platform data.");
  }
  return value;
}

function readBusinessStatus(value: unknown): PlatformBusinessStatus {
  const status = readString(value);
  if (status !== "active" && status !== "archived" && status !== "suspended") {
    throw new Error("Invalid platform data.");
  }
  return status;
}

function readOwnershipStatus(value: unknown): PlatformDomainOwnershipStatus {
  const status = readString(value);
  if (
    status !== "disabled" &&
    status !== "failed" &&
    status !== "pending" &&
    status !== "verified"
  ) {
    throw new Error("Invalid platform data.");
  }
  return status;
}

function readRoutingStatus(value: unknown): PlatformDomainRoutingStatus {
  const status = readString(value);
  if (
    status !== "disconnected" &&
    status !== "failed" &&
    status !== "live" &&
    status !== "provisioning" &&
    status !== "unconfigured"
  ) {
    throw new Error("Invalid platform data.");
  }
  return status;
}
