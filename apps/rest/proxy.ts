import { NextRequest, NextResponse } from "next/server";
import { resolveHostRouting } from "./lib/host-routing";

const internalPrefix = "/darb-host-internal";
const customHostHeader = "x-darb-custom-host";

export function proxy(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete(customHostHeader);
  requestHeaders.set("x-request-id", requestId);

  if (request.nextUrl.pathname.startsWith(internalPrefix)) {
    const response = NextResponse.rewrite(new URL("/__darb-private-route", request.url), {
      request: { headers: requestHeaders },
    });
    response.headers.set("x-request-id", requestId);
    return response;
  }

  const routing = resolveHostRouting(
    request.headers.get("host"),
    request.headers.get("x-forwarded-host"),
    process.env,
  );
  if (routing.kind === "invalid") {
    const response = NextResponse.rewrite(new URL("/__darb-invalid-host", request.url), {
      request: { headers: requestHeaders },
    });
    response.headers.set("x-request-id", requestId);
    return response;
  }
  if (routing.kind === "platform") {
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set("x-request-id", requestId);
    return response;
  }

  requestHeaders.set(customHostHeader, routing.hostname);
  const target = request.nextUrl.clone();
  target.pathname = `${internalPrefix}/${routing.hostname}${request.nextUrl.pathname}`;
  const response = NextResponse.rewrite(target, { request: { headers: requestHeaders } });
  response.headers.set("x-request-id", requestId);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml).*)"],
};
