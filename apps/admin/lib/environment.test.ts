import { describe, expect, it } from "vitest";

import { readDomainProviderEnvironment, readSupabaseSecretKey } from "./environment";
import { getSupabasePublicConfig } from "./supabase/config";

describe("Admin environment boundaries", () => {
  it("accepts the Darb-owned provider namespace and an optional team", () => {
    expect(
      readDomainProviderEnvironment({
        DARB_VERCEL_API_TOKEN: "token",
        DARB_VERCEL_RESTAURANT_PROJECT_ID: "prj_rest",
        DARB_VERCEL_TEAM_ID: "team_darb",
      }),
    ).toEqual({ apiToken: "token", projectId: "prj_rest", teamId: "team_darb" });
  });

  it("ignores reserved legacy names and rejects malformed provider configuration", () => {
    expect(() =>
      readDomainProviderEnvironment({
        VERCEL_API_TOKEN: "legacy",
        VERCEL_RESTAURANT_PROJECT_ID: "prj_rest",
      }),
    ).toThrow("DARB_VERCEL_API_TOKEN");
    expect(() =>
      readDomainProviderEnvironment({
        DARB_VERCEL_API_TOKEN: "token",
        DARB_VERCEL_RESTAURANT_PROJECT_ID: "not-a-project",
      }),
    ).toThrow("Vercel project ID");
  });

  it("keeps a Supabase secret separate from browser-safe configuration", () => {
    expect(readSupabaseSecretKey({ SUPABASE_SECRET_KEY: "sb_secret_server" })).toBe(
      "sb_secret_server",
    );
    expect(() => readSupabaseSecretKey({ SUPABASE_SECRET_KEY: "sb_publishable_browser" })).toThrow(
      "publishable",
    );
    expect(
      getSupabasePublicConfig({
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_browser",
        NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co/",
      }),
    ).toEqual({
      publishableKey: "sb_publishable_browser",
      url: "https://project.supabase.co",
    });
  });
});
