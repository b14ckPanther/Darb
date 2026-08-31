import { type NextRequest, NextResponse } from "next/server";

import { createDarbServerSupabaseClient } from "@darb/database/server";

import { getSupabasePublicConfig } from "./config";

export async function updateSupabaseSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  const supabase = createDarbServerSupabaseClient({
    ...getSupabasePublicConfig(),
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet, headers) => {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }

        response = NextResponse.next({ request });

        for (const { name, options, value } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }

        for (const [name, value] of Object.entries(headers)) {
          response.headers.set(name, value);
        }
      },
    },
  });

  await supabase.auth.getClaims();

  return response;
}
