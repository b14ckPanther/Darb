import { describe, expect, it } from "vitest";
import { normalizeHostHeader, resolveHostRouting } from "./host-routing";

describe("normalizeHostHeader", () => {
  it("normalizes IDN hostnames to stable ASCII", () => {
    expect(normalizeHostHeader("مقهى.example.", false)).toBe("xn--ehbfhi.example");
    expect(normalizeHostHeader("MENU.Example.", false)).toBe("menu.example");
  });
  it("rejects multi-value, path, credentials, and production IP input", () => {
    for (const value of [
      "good.example,evil.example",
      "good.example/path",
      "a@good.example",
      "127.0.0.1:3002",
      "tenant.localhost",
    ]) {
      expect(normalizeHostHeader(value, false)).toBeNull();
    }
  });
});

describe("resolveHostRouting", () => {
  it("recognizes production, preview, and development platform hosts", () => {
    expect(resolveHostRouting("rest.darb.co.il", null, { NODE_ENV: "production" })).toEqual({
      kind: "platform",
    });
    expect(
      resolveHostRouting("preview.vercel.app", null, {
        NODE_ENV: "production",
        VERCEL_URL: "preview.vercel.app",
      }),
    ).toEqual({ kind: "platform" });
    expect(
      resolveHostRouting("localhost:3002", "localhost:3002", { NODE_ENV: "development" }),
    ).toEqual({ kind: "platform" });
  });
  it("requires an explicit local custom-host allowance", () => {
    expect(resolveHostRouting("menu.example.test", null, { NODE_ENV: "development" })).toEqual({
      kind: "invalid",
    });
    expect(
      resolveHostRouting("menu.example.test", null, {
        NODE_ENV: "development",
        DARB_LOCAL_DOMAIN_ROUTING: "enabled",
      }),
    ).toEqual({ hostname: "menu.example.test", kind: "custom" });
  });
  it("rejects reserved Darb tenants and conflicting forwarded hosts", () => {
    expect(resolveHostRouting("admin.darb.co.il", null, { NODE_ENV: "production" })).toEqual({
      kind: "invalid",
    });
    expect(resolveHostRouting("menu.example", "evil.example", { NODE_ENV: "production" })).toEqual({
      kind: "invalid",
    });
  });

  it("allows local subdomains only in the explicit development path", () => {
    expect(
      resolveHostRouting("tenant.localhost:3002", null, {
        DARB_LOCAL_DOMAIN_ROUTING: "enabled",
        NODE_ENV: "development",
      }),
    ).toEqual({ hostname: "tenant.localhost", kind: "custom" });
    expect(resolveHostRouting("tenant.localhost", null, { NODE_ENV: "production" })).toEqual({
      kind: "invalid",
    });
  });
});
