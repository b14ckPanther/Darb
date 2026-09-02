import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import type { DarbServerSupabaseClient } from "@darb/database/server";

import { resolveCurrentUser, type CurrentUser } from "./auth";
import { adminPaths } from "./navigation";
import {
  parsePlatformAuditPage,
  parsePlatformBusinessDetail,
  parsePlatformBusinessPage,
  parsePlatformDomainPage,
  parsePlatformModules,
  parsePlatformOverview,
  parsePlatformSuperAdmins,
  parsePlatformTemplates,
  parsePlatformUserPage,
  type PlatformAuditItem,
  type PlatformBusinessDetail,
  type PlatformBusinessListItem,
  type PlatformDomainItem,
  type PlatformModuleItem,
  type PlatformOverview,
  type PlatformPage,
  type PlatformSuperAdmin,
  type PlatformTemplateItem,
  type PlatformUserItem,
} from "./platform-model";
import { createServerComponentSupabaseClient } from "./supabase/server";

export interface PlatformAdminContext {
  user: CurrentUser;
}

interface PlatformAuthorizationState {
  isSuperAdmin: boolean;
  user: CurrentUser | null;
}

export interface PlatformBusinessFilters {
  domainStatus?: string;
  locale?: string;
  moduleKey?: string;
  page: number;
  query?: string;
  status?: string;
}

export interface PlatformDomainFilters {
  moduleKey?: string;
  ownershipStatus?: string;
  page: number;
  primary?: boolean;
  query?: string;
  routingStatus?: string;
}

export interface PlatformAuditFilters {
  actionQuery?: string;
  actorQuery?: string;
  businessId?: string;
  from?: string;
  page: number;
  resourceCategory?: string;
  to?: string;
}

const resolvePlatformAuthorization = cache(async (): Promise<PlatformAuthorizationState> => {
  const supabase = await createServerComponentSupabaseClient();
  const user = await resolveCurrentUser(supabase);
  if (!user) return { isSuperAdmin: false, user: null };

  const { data, error } = await supabase.schema("core").rpc("current_user_is_super_admin");
  return { isSuperAdmin: !error && data === true, user };
});

export const getPlatformAdminContext = cache(async (): Promise<PlatformAdminContext | null> => {
  const authorization = await resolvePlatformAuthorization();
  return authorization.user && authorization.isSuperAdmin ? { user: authorization.user } : null;
});

export async function requirePlatformAdmin(
  requestedPath = "/platform",
): Promise<PlatformAdminContext> {
  const authorization = await resolvePlatformAuthorization();

  if (!authorization.user) {
    redirect(`${adminPaths.login}?next=${encodeURIComponent(requestedPath)}`);
  }

  if (!authorization.isSuperAdmin) redirect(adminPaths.home);
  return { user: authorization.user };
}

export async function loadPlatformOverview(): Promise<PlatformOverview> {
  const data = await callPlatformRpc("get_platform_overview", {});
  return parsePlatformOverview(data);
}

export async function listPlatformBusinesses(
  filters: PlatformBusinessFilters,
): Promise<PlatformPage<PlatformBusinessListItem>> {
  const data = await callPlatformRpc("list_platform_businesses", {
    requested_page: filters.page,
    requested_page_size: 25,
    ...(filters.domainStatus ? { requested_domain_status: filters.domainStatus } : {}),
    ...(filters.locale ? { requested_locale: filters.locale } : {}),
    ...(filters.moduleKey ? { requested_module_key: filters.moduleKey } : {}),
    ...(filters.query ? { requested_query: filters.query } : {}),
    ...(filters.status ? { requested_status: filters.status } : {}),
  });
  return parsePlatformBusinessPage(data);
}

export async function getPlatformBusinessDetail(
  businessId: string,
): Promise<PlatformBusinessDetail | null> {
  const data = await callPlatformRpc("get_platform_business_detail", {
    target_business_id: businessId,
  });
  return parsePlatformBusinessDetail(data);
}

export async function listPlatformUsers(
  query: string | undefined,
  page: number,
): Promise<PlatformPage<PlatformUserItem>> {
  const data = await callPlatformRpc("list_platform_users", {
    requested_page: page,
    requested_page_size: 25,
    ...(query ? { requested_query: query } : {}),
  });
  return parsePlatformUserPage(data);
}

export async function listPlatformSuperAdmins(): Promise<PlatformSuperAdmin[]> {
  const data = await callPlatformRpc("list_platform_super_admins", {});
  return parsePlatformSuperAdmins(data);
}

export async function listPlatformModules(): Promise<PlatformModuleItem[]> {
  const data = await callPlatformRpc("list_platform_modules", {});
  return parsePlatformModules(data);
}

export async function listPlatformTemplates(): Promise<PlatformTemplateItem[]> {
  const data = await callPlatformRpc("list_platform_templates", {});
  return parsePlatformTemplates(data);
}

export async function listPlatformDomains(
  filters: PlatformDomainFilters,
): Promise<PlatformPage<PlatformDomainItem>> {
  const data = await callPlatformRpc("list_platform_domains", {
    requested_page: filters.page,
    requested_page_size: 25,
    ...(filters.moduleKey ? { requested_module_key: filters.moduleKey } : {}),
    ...(filters.ownershipStatus ? { requested_ownership_status: filters.ownershipStatus } : {}),
    ...(filters.primary !== undefined ? { requested_primary: filters.primary } : {}),
    ...(filters.query ? { requested_query: filters.query } : {}),
    ...(filters.routingStatus ? { requested_routing_status: filters.routingStatus } : {}),
  });
  return parsePlatformDomainPage(data);
}

export async function listPlatformAuditEvents(
  filters: PlatformAuditFilters,
): Promise<PlatformPage<PlatformAuditItem>> {
  const data = await callPlatformRpc("list_platform_audit_events", {
    requested_page: filters.page,
    requested_page_size: 25,
    ...(filters.actionQuery ? { requested_action_query: filters.actionQuery } : {}),
    ...(filters.actorQuery ? { requested_actor_query: filters.actorQuery } : {}),
    ...(filters.businessId ? { requested_business_id: filters.businessId } : {}),
    ...(filters.from ? { requested_from: filters.from } : {}),
    ...(filters.resourceCategory ? { requested_resource_category: filters.resourceCategory } : {}),
    ...(filters.to ? { requested_to: filters.to } : {}),
  });
  return parsePlatformAuditPage(data);
}

async function callPlatformRpc<
  Name extends
    | "get_platform_business_detail"
    | "get_platform_overview"
    | "list_platform_audit_events"
    | "list_platform_businesses"
    | "list_platform_domains"
    | "list_platform_modules"
    | "list_platform_super_admins"
    | "list_platform_templates"
    | "list_platform_users",
>(
  name: Name,
  args: Parameters<DarbServerSupabaseClient["schema"]>[0] extends never
    ? never
    : Record<string, boolean | number | string>,
): Promise<unknown> {
  await requirePlatformAdmin();
  const supabase = await createServerComponentSupabaseClient();
  const { data, error } = await supabase.schema("core").rpc(name, args);
  if (error) throw new Error(`Unable to load platform operations (${error.code}).`);
  return data;
}
