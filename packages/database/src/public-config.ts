export interface PublicSupabaseConfig {
  publishableKey: string;
  url: string;
}

export function normalizePublicSupabaseConfig(config: PublicSupabaseConfig): PublicSupabaseConfig {
  const url = config.url.trim();
  const publishableKey = config.publishableKey.trim();

  if (!url) {
    throw new Error("Supabase URL is required.");
  }

  const parsedUrl = new URL(url);

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error("Supabase URL must use HTTP or HTTPS.");
  }

  if (!publishableKey) {
    throw new Error("Supabase publishable key is required.");
  }

  if (publishableKey.startsWith("sb_secret_")) {
    throw new Error("A Supabase secret key cannot be used in a public client.");
  }

  return { publishableKey, url };
}
