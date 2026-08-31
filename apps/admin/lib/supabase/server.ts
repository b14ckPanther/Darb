import "server-only";

import { cookies } from "next/headers";

import { createDarbServerSupabaseClient } from "@darb/database/server";

import { getSupabasePublicConfig } from "./config";

export async function createServerComponentSupabaseClient() {
  const cookieStore = await cookies();

  return createDarbServerSupabaseClient({
    ...getSupabasePublicConfig(),
    cookies: {
      getAll: () => cookieStore.getAll(),
    },
  });
}

export async function createServerActionSupabaseClient() {
  const cookieStore = await cookies();

  return createDarbServerSupabaseClient({
    ...getSupabasePublicConfig(),
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        for (const { name, options, value } of cookiesToSet) {
          cookieStore.set(name, value, options);
        }
      },
    },
  });
}
