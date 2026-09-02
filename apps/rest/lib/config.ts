import "server-only";

import type { PublicSupabaseConfig } from "@darb/database/anonymous";
import { normalizePublicSupabaseConfig } from "@darb/database/public-config";

interface RestaurantPublicEnvironment {
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string | undefined;
  NEXT_PUBLIC_SUPABASE_URL?: string | undefined;
}

export function getPublicSupabaseConfig(
  environment: RestaurantPublicEnvironment = {
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  },
): PublicSupabaseConfig {
  if (!environment.NEXT_PUBLIC_SUPABASE_URL || !environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    throw new Error(
      "Restaurant requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return normalizePublicSupabaseConfig({
    publishableKey: environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    url: environment.NEXT_PUBLIC_SUPABASE_URL,
  });
}
