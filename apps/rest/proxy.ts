import { NextRequest, NextResponse } from "next/server";
import { resolveHostRouting } from "./lib/host-routing";

const internalPrefix = "/darb-host-internal";
const customHostHeader = "x-darb-custom-host";

export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete(customHostHeader);

  if (request.nextUrl.pathname.startsWith(internalPrefix)) {
    return NextResponse.rewrite(new URL("/__darb-private-route", request.url), {
      request: { headers: requestHeaders },
    });
  }

  const routing = resolveHostRouting(
    request.headers.get("host"),
    request.headers.get("x-forwarded-host"),
    process.env,
  );
  if (routing.kind === "invalid") {
    return NextResponse.rewrite(new URL("/__darb-invalid-host", request.url), {
      request: { headers: requestHeaders },
    });
  }
  if (routing.kind === "platform") {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  requestHeaders.set(customHostHeader, routing.hostname);
  const target = request.nextUrl.clone();
  target.pathname = `${internalPrefix}/${routing.hostname}${request.nextUrl.pathname}`;
  return NextResponse.rewrite(target, { request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml).*)"],
};
