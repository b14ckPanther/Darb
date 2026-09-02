import { describe, expect, it } from "vitest";

import {
  getPlatformBusinessTransitions,
  getPlatformModuleImplementation,
  parsePlatformAuditPage,
  parsePlatformBusinessDetail,
  parsePlatformBusinessPage,
  parsePlatformDomainPage,
  parsePlatformModules,
  parsePlatformOverview,
  parsePlatformSuperAdmins,
  parsePlatformTemplates,
  parsePlatformUserPage,
  parsePositivePage,
  platformBusinessPath,
} from "./platform-model";

const page = (items: unknown[]) => ({ items, page: 1, page_size: 25, total: items.length });

describe("platform route and lifecycle model", () => {
  it("builds stable platform detail routes and bounds page input", () => {
    expect(platformBusinessPath("72f68e8c-7f0a-49e9-a20b-09d2ff26d15e")).toBe(
      "/platform/businesses/72f68e8c-7f0a-49e9-a20b-09d2ff26d15e",
    );
    expect(parsePositivePage("7")).toBe(7);
    expect(parsePositivePage(["12", "13"])).toBe(12);
    expect(parsePositivePage("0")).toBe(1);
    expect(parsePositivePage("1000001")).toBe(1);
    expect(parsePositivePage("2.5")).toBe(1);
  });

  it("offers only explicit lifecycle transitions", () => {
    expect(getPlatformBusinessTransitions("active").map((item) => item.status)).toEqual([
      "suspended",
      "archived",
    ]);
    expect(getPlatformBusinessTransitions("suspended")).toMatchObject([{ status: "active" }]);
    expect(getPlatformBusinessTransitions("archived")).toMatchObject([{ status: "active" }]);
  });

  it("keeps implemented engines distinct from capability availability", () => {
    expect(getPlatformModuleImplementation("restaurant")).toBe("Admin ready");
    expect(getPlatformModuleImplementation("booking")).toBe("Engine pending");
    expect(getPlatformModuleImplementation("future-capability")).toBe("Engine pending");
  });
});

describe("platform projection parsing", () => {
  it("parses factual overview totals", () => {
    expect(
      parsePlatformOverview({
        active_super_admins: 1,
        available_modules: 4,
        businesses: { active: 2, archived: 1, suspended: 1, total: 4 },
        live_domains: 2,
        memberships: 6,
        restaurant_enabled_businesses: 1,
        templates: 2,
        users: 5,
      }),
    ).toMatchObject({
      activeSuperAdmins: 1,
      businesses: { active: 2, archived: 1, suspended: 1, total: 4 },
      users: 5,
    });
  });

  it("parses paginated tenant summaries", () => {
    const result = parsePlatformBusinessPage(
      page([
        {
          created_at: "2026-09-02T10:00:00Z",
          currency_code: "ILS",
          default_locale: "ar",
          display_name: "Darb",
          domain_count: 1,
          enabled_locales: ["ar", "en"],
          enabled_modules: ["restaurant"],
          id: "business-id",
          live_domain_count: 1,
          location_count: 2,
          membership_count: 3,
          slug: "darb",
          status: "active",
          timezone: "Asia/Jerusalem",
          updated_at: "2026-09-02T10:00:00Z",
        },
      ]),
    );

    expect(result.items[0]).toMatchObject({
      displayName: "Darb",
      enabledModules: ["restaurant"],
      status: "active",
    });
  });

  it("parses safe business detail without relying on private fields", () => {
    const result = parsePlatformBusinessDetail({
      active_membership_count: 1,
      appearances: [
        {
          module_key: "restaurant",
          template_available: true,
          template_display_name: "Darb Restaurant",
          template_key: "darb-restaurant-default",
          updated_at: "2026-09-02T10:00:00Z",
        },
      ],
      business: {
        created_at: "2026-09-02T10:00:00Z",
        currency_code: "ILS",
        default_locale: "ar",
        display_name: "Darb",
        id: "business-id",
        slug: "darb",
        status: "active",
        timezone: "Asia/Jerusalem",
        updated_at: "2026-09-02T10:00:00Z",
      },
      domains: [],
      locales: [{ code: "ar", is_enabled: true }],
      locations: [],
      membership_count: 1,
      modules: [
        {
          display_name: "Restaurant",
          is_available: true,
          is_effective: true,
          is_enabled: true,
          key: "restaurant",
        },
      ],
      restaurant: {
        configured: true,
        item_count: 5,
        menu_count: 1,
        module_enabled: true,
        publicly_active: true,
        published_menu_count: 1,
      },
    });

    expect(result?.restaurant).toEqual({
      configured: true,
      itemCount: 5,
      menuCount: 1,
      moduleEnabled: true,
      publiclyActive: true,
      publishedMenuCount: 1,
    });
    expect(result?.appearances[0]).not.toHaveProperty("theme");
  });

  it("parses only the allow-listed Auth/user projection", () => {
    const result = parsePlatformUserPage(
      page([
        {
          active_membership_count: 1,
          business_count: 1,
          created_at: "2026-09-02T10:00:00Z",
          email: "operator@example.test",
          id: "user-id",
          is_super_admin: true,
          memberships: [
            {
              business_id: "business-id",
              business_name: "Business",
              business_slug: "business",
              id: "membership-id",
              permission_keys: ["business.manage"],
              status: "active",
            },
          ],
        },
      ]),
    );

    expect(result.items[0]).toMatchObject({
      businessCount: 1,
      email: "operator@example.test",
      isSuperAdmin: true,
    });
    expect(result.items[0]).not.toHaveProperty("metadata");
    expect(result.items[0]).not.toHaveProperty("password");
  });

  it("parses the read-only super-admin roster", () => {
    expect(
      parsePlatformSuperAdmins([
        {
          email: "operator@example.test",
          granted_at: "2026-09-02T10:00:00Z",
          revoked_at: null,
          state: "active",
          user_id: "user-id",
        },
      ]),
    ).toMatchObject([{ state: "active", userId: "user-id" }]);
  });

  it("parses module and template adoption without tenant configuration payloads", () => {
    expect(
      parsePlatformModules([
        {
          description: "Restaurant capability",
          display_name: "Restaurant",
          effective_business_count: 2,
          enabled_business_count: 3,
          is_available: true,
          key: "restaurant",
          sort_order: 10,
        },
      ])[0],
    ).toMatchObject({ effectiveBusinessCount: 2, enabledBusinessCount: 3 });

    expect(
      parsePlatformTemplates([
        {
          description: "Public composition",
          display_name: "Darb Restaurant",
          is_available: true,
          is_default: true,
          key: "darb-restaurant-default",
          module_key: "restaurant",
          selected_business_count: 2,
          sort_order: 10,
          template_version: 1,
          theme_schema_version: 1,
        },
      ])[0],
    ).not.toHaveProperty("defaultTheme");
  });

  it("parses domain operations without ownership proof", () => {
    const result = parsePlatformDomainPage(
      page([
        {
          business_id: "business-id",
          business_name: "Business",
          business_slug: "business",
          created_at: "2026-09-02T10:00:00Z",
          hostname: "menu.example.test",
          id: "domain-id",
          is_primary: true,
          ownership_status: "verified",
          routing_checked_at: null,
          routing_live_at: "2026-09-02T10:00:00Z",
          routing_status: "live",
          target_module_key: "restaurant",
          updated_at: "2026-09-02T10:00:00Z",
          verification_checked_at: "2026-09-02T10:00:00Z",
          verified_at: "2026-09-02T10:00:00Z",
        },
      ]),
    );

    expect(result.items[0]).toMatchObject({ hostname: "menu.example.test", routingStatus: "live" });
    expect(result.items[0]).not.toHaveProperty("verificationToken");
  });

  it("parses audit identity while excluding metadata", () => {
    const result = parsePlatformAuditPage(
      page([
        {
          action_key: "platform.business_suspended",
          actor_email: "operator@example.test",
          actor_kind: "user",
          actor_user_id: "actor-id",
          business_id: "business-id",
          business_name: "Business",
          business_slug: "business",
          entity_id: "business-id",
          entity_type: "core.business",
          id: "event-id",
          occurred_at: "2026-09-02T10:00:00Z",
        },
      ]),
    );

    expect(result.items[0]).toMatchObject({ actionKey: "platform.business_suspended" });
    expect(result.items[0]).not.toHaveProperty("metadata");
  });

  it("fails closed on malformed projection data", () => {
    expect(() => parsePlatformOverview({ businesses: {} })).toThrow("Invalid platform data");
    expect(() => parsePlatformSuperAdmins([{ state: "unknown" }])).toThrow("Invalid platform data");
    expect(() => parsePlatformBusinessPage(page([{ status: "deleted" }]))).toThrow(
      "Invalid platform data",
    );
  });
});
