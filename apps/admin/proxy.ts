import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  adminLocaleCookie,
  adminLocaleQueryParameter,
  getAdminLocaleCookieOptions,
  resolveAdminLocaleHandoff,
} from "./lib/i18n";
import { updateSupabaseSession } from "./lib/supabase/update-session";

export function proxy(request: NextRequest) {
  const locale = resolveAdminLocaleHandoff(
    request.nextUrl.pathname,
    request.method,
    request.nextUrl.searchParams.get(adminLocaleQueryParameter),
  );

  if (locale) {
    const destination = request.nextUrl.clone();
    destination.searchParams.delete(adminLocaleQueryParameter);
    const response = NextResponse.redirect(destination);
    response.cookies.set(adminLocaleCookie, locale, getAdminLocaleCookieOptions());
    return response;
  }

  return updateSupabaseSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
