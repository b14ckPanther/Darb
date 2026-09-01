import "server-only";

import { resolveTxt as nodeResolveTxt } from "node:dns/promises";

import { buildDnsTxtRecordName, buildDnsTxtRecordValue } from "./domain-validation";

export type DnsTxtResolver = (hostname: string) => Promise<string[][]>;
export type DomainVerificationResult =
  { status: "verified" } | { status: "not-found" } | { status: "temporary-error" };

const DNS_TIMEOUT_MS = 4_000;

export function mapDnsTxtRecords(
  records: readonly (readonly string[])[],
  expectedValue: string,
): DomainVerificationResult {
  const values = records.map((record) => record.join(""));
  return values.includes(expectedValue) ? { status: "verified" } : { status: "not-found" };
}

export async function verifyDomainDnsTxt(
  hostname: string,
  token: string,
  resolver: DnsTxtResolver = nodeResolveTxt,
  timeoutMs: number = DNS_TIMEOUT_MS,
): Promise<DomainVerificationResult> {
  try {
    const records = await withTimeout(resolver(buildDnsTxtRecordName(hostname)), timeoutMs);
    return mapDnsTxtRecords(records, buildDnsTxtRecordValue(token));
  } catch (error) {
    const code = readResolverCode(error);

    if (code === "ENOTFOUND" || code === "ENODATA" || code === "ENODOMAIN") {
      return { status: "not-found" };
    }

    return { status: "temporary-error" };
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("DNS_TIMEOUT")), timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timeout);
        reject(error instanceof Error ? error : new Error("DNS_RESOLUTION_FAILED"));
      },
    );
  });
}

function readResolverCode(error: unknown): string | undefined {
  return typeof error === "object" && error !== null && "code" in error
    ? String(error.code)
    : undefined;
}
