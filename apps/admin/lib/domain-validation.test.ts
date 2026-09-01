import { describe, expect, it } from "vitest";

import {
  buildDnsTxtRecordName,
  buildDnsTxtRecordValue,
  isReservedDarbHostname,
  normalizeHostname,
} from "./domain-validation";

describe("custom domain validation", () => {
  it("normalizes case, a trailing dot, and international hostnames to ASCII", () => {
    expect(normalizeHostname("  Portal.Example.COM. ")).toEqual({
      hostname: "portal.example.com",
      success: true,
    });
    expect(normalizeHostname("BÜCHER.Example")).toEqual({
      hostname: "xn--bcher-kva.example",
      success: true,
    });
  });

  it.each([
    "https://example.com",
    "example.com/path",
    "example.com:443",
    "admin@Example.com",
    "not-a-hostname",
    "admin.darb.co.il",
    "darb.co.il",
  ])("rejects unsafe or platform-reserved input %s", (hostname) => {
    expect(normalizeHostname(hostname)).toMatchObject({ success: false });
  });

  it("reserves the root Darb hostname and every subdomain", () => {
    expect(isReservedDarbHostname("darb.co.il")).toBe(true);
    expect(isReservedDarbHostname("ADMIN.DARB.CO.IL.")).toBe(true);
    expect(isReservedDarbHostname("notdarb.co.il")).toBe(false);
  });

  it("builds the exact DNS TXT ownership proof", () => {
    expect(buildDnsTxtRecordName("www.example.com")).toBe("_darb-verification.www.example.com");
    expect(buildDnsTxtRecordValue("abc123")).toBe("darb-verification=abc123");
  });
});
