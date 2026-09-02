import { describe, expect, it } from "vitest";

import { getPublicSupabaseConfig } from "./config";

describe("Restaurant public environment boundary", () => {
  it("requires only browser-safe Supabase publication variables", () => {
    expect(
      getPublicSupabaseConfig({
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_browser",
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      }),
    ).toEqual({
      publishableKey: "sb_publishable_browser",
      url: "http://127.0.0.1:54321",
    });
  });

  it("rejects secret keys and URL injection surfaces", () => {
    expect(() =>
      getPublicSupabaseConfig({
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_secret_server",
        NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
      }),
    ).toThrow("secret key");
    expect(() =>
      getPublicSupabaseConfig({
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_browser",
        NEXT_PUBLIC_SUPABASE_URL: "https://user:password@project.supabase.co/path?leak=yes",
      }),
    ).toThrow("origin");
  });
});
