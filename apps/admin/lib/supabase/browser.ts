"use client";

import { createDarbBrowserSupabaseClient } from "@darb/database/browser";

import { getSupabasePublicConfig } from "./config";

export function createBrowserSupabaseClient() {
  return createDarbBrowserSupabaseClient(getSupabasePublicConfig());
}
