import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { adminPaths, resolveTrustedAdminOrigin, sanitizeReturnPath } from "../../../lib/navigation";
import { createServerActionSupabaseClient } from "../../../lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const next = sanitizeReturnPath(
    request.nextUrl.searchParams.get("next") ?? adminPaths.onboarding,
  );
  const supabase = await createServerActionSupabaseClient();
  const result = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : { error: new Error("missing confirmation credentials") };

  const destination = result.error ? `${adminPaths.login}?confirmation=failed` : next;
  return NextResponse.redirect(
    new URL(destination, resolveTrustedAdminOrigin(request.nextUrl.origin)),
  );
}
