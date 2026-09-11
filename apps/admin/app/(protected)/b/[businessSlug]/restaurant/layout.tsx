import type { ReactNode } from "react";

import { requireRestaurantAdminContext } from "../../../../../lib/restaurant-access";
import { RestaurantSubnav } from "./restaurant-subnav";
import { PermissionNotice } from "../../../../_components/permission-notice";
import { getAdminI18n } from "../../../../../lib/i18n-server";

export default async function RestaurantLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ businessSlug: string }>;
}) {
  const { businessSlug } = await params;
  const [context, { t }] = await Promise.all([
    requireRestaurantAdminContext(businessSlug),
    getAdminI18n(),
  ]);

  return (
    <>
      <RestaurantSubnav businessSlug={context.businessContext.business.slug} />
      {!context.capabilityEffective ? (
        <PermissionNotice title={t("Restaurant access is currently read-only.")}>
          {t(
            context.capabilityEntitled
              ? "Restaurant data is retained, but the capability is not currently effective."
              : "Restaurant data is retained, but Restaurant is not included in this business’s current access arrangement.",
          )}
        </PermissionNotice>
      ) : null}
      {children}
    </>
  );
}
