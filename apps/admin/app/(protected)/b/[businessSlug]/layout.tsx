import type { ReactNode } from "react";

import { AdminShell } from "../../../_components/admin-shell";
import { canShowLocations } from "../../../../lib/admin-access";
import { requireBusinessAdminContext } from "../../../../lib/admin-context";

interface BusinessLayoutProps {
  children: ReactNode;
  params: Promise<{ businessSlug: string }>;
}

export default async function BusinessLayout({ children, params }: BusinessLayoutProps) {
  const { businessSlug } = await params;
  const context = await requireBusinessAdminContext(businessSlug);
  const showLocations = canShowLocations(context.access, context.locations.length);

  return (
    <AdminShell
      businesses={context.businesses}
      currentBusiness={context.business}
      showLocations={showLocations}
      user={context.user}
    >
      {children}
    </AdminShell>
  );
}
