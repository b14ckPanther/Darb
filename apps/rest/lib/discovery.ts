import "server-only";

import { createDarbAnonymousSupabaseClient } from "@darb/database/anonymous";
import {
  parsePublicRestaurantSitemapEntries,
  type PublicRestaurantSitemapEntry,
} from "@darb/restaurant";

import { getPublicSupabaseConfig } from "./config";

export async function listPublicRestaurantSitemapEntries(): Promise<
  PublicRestaurantSitemapEntry[]
> {
  const client = createDarbAnonymousSupabaseClient(getPublicSupabaseConfig());
  const { data, error } = await client.rpc("list_public_restaurant_sitemap");
  if (error) throw new Error("Public Restaurant discovery could not be loaded.");

  const entries = parsePublicRestaurantSitemapEntries(data);
  if (!entries) throw new Error("The public Restaurant discovery projection was invalid.");
  return entries;
}
