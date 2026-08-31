import "server-only";

import { redirect } from "next/navigation";

import type { DarbServerSupabaseClient } from "@darb/database/server";

import { resolveBusinessContext, resolveCurrentUser } from "./auth";
import { adminPaths } from "./navigation";

export async function requireActionBusiness(
  supabase: DarbServerSupabaseClient,
  businessId: string,
) {
  const user = await resolveCurrentUser(supabase);

  if (!user) {
    redirect(adminPaths.login);
  }

  const business = await resolveBusinessContext(supabase, businessId);

  if (!business) {
    redirect(adminPaths.home);
  }

  return business;
}
