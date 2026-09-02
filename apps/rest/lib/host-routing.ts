import { domainToASCII } from "node:url";
import { darbApplications, darbPlatform } from "@darb/config/platform";

export type HostRoutingDecision =
  { kind: "custom"; hostname: string } | { kind: "invalid" } | { kind: "platform" };

export function resolveHostRouting(
  hostHeader: string | null,
  forwardedHostHeader: string | null,
  environment: NodeJS.ProcessEnv,
): HostRoutingDecision {
  const development = environment.NODE_ENV !== "production";
  const hostname = normalizeHostHeader(hostHeader, development);
  const forwarded = forwardedHostHeader
    ? normalizeHostHeader(forwardedHostHeader, development)
    : hostname;
  if (!hostname || !forwarded || hostname !== forwarded) return { kind: "invalid" };

  const platformHosts = new Set<string>([darbApplications.rest.productionHost]);
  if (environment.VERCEL_URL) {
    const preview = normalizeHostHeader(environment.VERCEL_URL, false);
    if (preview) platformHosts.add(preview);
  }
  if (development && (hostname === "localhost" || hostname === "127.0.0.1")) {
    return { kind: "platform" };
  }
  if (platformHosts.has(hostname)) return { kind: "platform" };
  if (hostname === darbPlatform.rootDomain || hostname.endsWith(`.${darbPlatform.rootDomain}`)) {
    return { kind: "invalid" };
  }
  if (development && environment.DARB_LOCAL_DOMAIN_ROUTING !== "enabled") {
    return { kind: "invalid" };
  }
  return { hostname, kind: "custom" };
}

export function normalizeHostHeader(value: string | null, allowLocalPort: boolean): string | null {
  if (!value || value.includes(",") || /[\s/@\\]/.test(value)) return null;
  let candidate = value.trim().toLowerCase();
  if (candidate.endsWith(".")) candidate = candidate.slice(0, -1);
  if (allowLocalPort && /^[^:]+:\d+$/.test(candidate)) {
    candidate = candidate.slice(0, candidate.lastIndexOf(":"));
  } else if (candidate.includes(":")) return null;
  const ascii = domainToASCII(candidate);
  if (!ascii || ascii.length > 253) return null;
  if (ascii === "localhost" || ascii === "127.0.0.1" || ascii.endsWith(".localhost")) {
    return allowLocalPort ? ascii : null;
  }
  return /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(
    ascii,
  )
    ? ascii
    : null;
}
