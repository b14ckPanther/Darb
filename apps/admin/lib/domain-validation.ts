import { domainToASCII } from "node:url";

export const DARB_ROOT_HOSTNAME = "darb.co.il";
const hostnamePattern =
  /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

type HostnameResult = { hostname: string; success: true } | { message: string; success: false };

export function normalizeHostname(value: string): HostnameResult {
  const trimmed = value.trim();

  if (
    !trimmed ||
    /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ||
    /[/@:]/.test(trimmed) ||
    /\s/.test(trimmed)
  ) {
    return {
      message: "Enter a hostname without a protocol, path, port, or spaces.",
      success: false,
    };
  }

  const withoutTrailingDot = trimmed.replace(/\.+$/, "");
  const hostname = domainToASCII(withoutTrailingDot).toLowerCase();

  if (!hostname || hostname.length > 253 || !hostnamePattern.test(hostname)) {
    return { message: "Enter a valid domain hostname, such as www.example.com.", success: false };
  }

  if (isReservedDarbHostname(hostname)) {
    return { message: "Darb-owned hostnames are reserved for platform services.", success: false };
  }

  return { hostname, success: true };
}

export function isReservedDarbHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/\.+$/, "");
  return normalized === DARB_ROOT_HOSTNAME || normalized.endsWith(`.${DARB_ROOT_HOSTNAME}`);
}

export function buildDnsTxtRecordName(hostname: string): string {
  return `_darb-verification.${hostname}`;
}

export function buildDnsTxtRecordValue(token: string): string {
  return `darb-verification=${token}`;
}
