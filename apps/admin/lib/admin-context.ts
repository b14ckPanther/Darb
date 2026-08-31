import "server-only";

import { notFound, redirect } from "next/navigation";

import { getAdminAccessSnapshot, getBusinessAdminContext } from "./auth";
import { getProtectedAdminDestination } from "./navigation";

export async function requireBusinessAdminContext(businessSlug: string) {
  const snapshot = await getAdminAccessSnapshot();
  const destination = getProtectedAdminDestination(
    {
      accessibleBusinessCount: snapshot.businesses.length,
      isAuthenticated: Boolean(snapshot.user),
    },
    `/b/${businessSlug}`,
  );

  if (destination) {
    redirect(destination);
  }

  const context = await getBusinessAdminContext(businessSlug);

  if (!context) {
    notFound();
  }

  return context;
}
