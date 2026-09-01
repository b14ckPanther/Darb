import type { ReactNode } from "react";

import { requireRestaurantAdminContext } from "../../../../../lib/restaurant-access";
import { RestaurantSubnav } from "./restaurant-subnav";

export default async function RestaurantLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ businessSlug: string }>;
}) {
  const { businessSlug } = await params;
  const context = await requireRestaurantAdminContext(businessSlug);

  return (
    <>
      <RestaurantSubnav businessSlug={context.businessContext.business.slug} />
      {children}
    </>
  );
}
