export interface DarbSecurityHeadersOptions {
  allowIndexing: boolean;
  enablePlatformHsts?: boolean;
  environment: "development" | "production" | "test";
  resourceOrigins?: readonly (string | undefined)[];
}

export interface DarbHttpHeader {
  key: string;
  value: string;
}

export function createDarbSecurityHeaders({
  allowIndexing,
  enablePlatformHsts = false,
  environment,
  resourceOrigins = [],
}: DarbSecurityHeadersOptions): DarbHttpHeader[] {
  const origins = resourceOrigins.flatMap(normalizeResourceOrigin);
  const connectOrigins = origins.flatMap((origin) => [origin, websocketOrigin(origin)]);
  const development = environment === "development";
  const contentSecurityPolicy = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${development ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' blob: data:${origins.length > 0 ? ` ${origins.join(" ")}` : ""}`,
    `media-src 'self' blob:${origins.length > 0 ? ` ${origins.join(" ")}` : ""}`,
    `connect-src 'self'${connectOrigins.length > 0 ? ` ${connectOrigins.join(" ")}` : ""}`,
    "font-src 'self' data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "manifest-src 'self'",
    "worker-src 'self' blob:",
    ...(environment === "production" ? ["upgrade-insecure-requests"] : []),
  ].join("; ");

  return [
    { key: "Content-Security-Policy", value: contentSecurityPolicy },
    {
      key: "Permissions-Policy",
      value: "camera=(), geolocation=(), microphone=(), payment=(), usb=()",
    },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-DNS-Prefetch-Control", value: "off" },
    { key: "X-Frame-Options", value: "DENY" },
    ...(!allowIndexing ? [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }] : []),
    ...(enablePlatformHsts && environment === "production"
      ? [
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ]
      : []),
  ];
}

function normalizeResourceOrigin(value: string | undefined): string[] {
  if (!value) return [];
  try {
    const url = new URL(value);
    if ((url.protocol !== "http:" && url.protocol !== "https:") || url.username || url.password) {
      return [];
    }
    return [url.origin];
  } catch {
    return [];
  }
}

function websocketOrigin(origin: string): string {
  const url = new URL(origin);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.origin;
}
