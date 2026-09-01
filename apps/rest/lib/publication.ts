import "server-only";

import { cache } from "react";

import { createDarbAnonymousSupabaseClient } from "@darb/database/anonymous";
import {
  parsePublicRestaurantPublication,
  type PublicRestaurantPublication,
} from "@darb/restaurant";

import { getPublicSupabaseConfig } from "./config";

export const getPublicRestaurantPublication = cache(
  async (businessSlug: string): Promise<PublicRestaurantPublication | null> => {
    const supabase = createDarbAnonymousSupabaseClient(getPublicSupabaseConfig());
    const { data, error } = await supabase.rpc("get_restaurant_publication", {
      requested_business_slug: businessSlug,
    });

    if (error) {
      throw new Error("The public Restaurant experience could not be loaded.");
    }
    if (data === null) return null;

    const publication = parsePublicRestaurantPublication(data);
    if (!publication) {
      throw new Error("The public Restaurant projection was invalid.");
    }
    return publication;
  },
);
