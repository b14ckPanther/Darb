import type { ReactNode } from "react";

import { AdminShell } from "../../../_components/admin-shell";
import { requireBusinessAdminContext } from "../../../../lib/admin-context";
import { buildAdminNavigation } from "../../../../lib/navigation";

interface BusinessLayoutProps {
  children: ReactNode;
  params: Promise<{ businessSlug: string }>;
}

export default async function BusinessLayout({ children, params }: BusinessLayoutProps) {
  const { businessSlug } = await params;
  const context = await requireBusinessAdminContext(businessSlug);
  const permissionKeys = [
    context.access.canManageAppearance ? "appearance.manage" : null,
    context.access.canManageBusiness ? "business.manage" : null,
    context.access.canManageDomains ? "domains.manage" : null,
    context.access.canManageMedia ? "media.manage" : null,
    context.access.canManageModules ? "modules.manage" : null,
    context.access.canViewAudit ? "audit.view" : null,
  ].filter((key): key is string => key !== null);
  const navigation = buildAdminNavigation(context.business.slug, {
    canManageAllLocations: context.access.canManageAllLocations,
    canReadAllLocations: context.access.canReadAllLocations,
    enabledModules: context.modules
      .filter((module) => module.isEffectivelyEnabled)
      .map((module) => module.key),
    permissionKeys,
    visibleLocationCount: context.locations.length,
  });

  return (
    <AdminShell
      businesses={context.businesses}
      currentBusiness={context.business}
      navigation={navigation}
      user={context.user}
    >
      {children}
    </AdminShell>
  );
}
