import { describe, expect, it, vi } from "vitest";

import { createDarbSecurityHeaders } from "./http";
import {
  readErrorDigest,
  readSafeCorrelationId,
  reportOperationalError,
  sanitizeLogContext,
} from "./observability";

describe("Darb production hardening primitives", () => {
  it("builds a scoped production CSP and platform-only HSTS", () => {
    const headers = createDarbSecurityHeaders({
      allowIndexing: true,
      enablePlatformHsts: true,
      environment: "production",
      resourceOrigins: ["https://project.supabase.co/path"],
    });
    const csp = headers.find(({ key }) => key === "Content-Security-Policy")?.value;
    expect(csp).toContain(
      "connect-src 'self' https://project.supabase.co wss://project.supabase.co",
    );
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).not.toContain("'unsafe-eval'");
    expect(headers).toContainEqual({
      key: "Strict-Transport-Security",
      value: "max-age=31536000; includeSubDomains",
    });
  });

  it("keeps local development workable and private surfaces non-indexable", () => {
    const headers = createDarbSecurityHeaders({
      allowIndexing: false,
      environment: "development",
      resourceOrigins: ["http://127.0.0.1:54321", "javascript:alert(1)"],
    });
    const csp = headers.find(({ key }) => key === "Content-Security-Policy")?.value;
    expect(csp).toContain("'unsafe-eval'");
    expect(csp).toContain("http://127.0.0.1:54321");
    expect(csp).not.toContain("javascript:");
    expect(headers).toContainEqual({
      key: "X-Robots-Tag",
      value: "noindex, nofollow, noarchive",
    });
  });

  it("redacts dangerous logging keys and emits structured error context", () => {
    expect(
      sanitizeLogContext({
        authorization: "Bearer secret",
        businessSlug: "safe-business\nforged",
        cookie: "session",
        operation: "resolve",
      }),
    ).toEqual({ businessSlug: "safe-business forged", operation: "resolve" });
    expect(readSafeCorrelationId({ "x-request-id": "bad id", "x-vercel-id": "iad1::abc" })).toBe(
      "iad1::abc",
    );
    expect(readErrorDigest({ digest: "NEXT_ERROR.123" })).toBe("NEXT_ERROR.123");

    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    reportOperationalError({
      application: "rest",
      context: { operation: "publication" },
      event: "restaurant.publication_failed",
    });
    expect(JSON.parse(String(error.mock.calls[0]?.[0]))).toMatchObject({
      application: "rest",
      context: { operation: "publication" },
      event: "restaurant.publication_failed",
      level: "error",
    });
    error.mockRestore();
  });
});
