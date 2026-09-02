export type DarbApplicationKey = "admin" | "main" | "rest";
export type SafeLogValue = boolean | number | string | null | undefined;

export interface OperationalErrorInput {
  application: DarbApplicationKey;
  context?: Readonly<Record<string, SafeLogValue>> | undefined;
  digest?: string | undefined;
  event: string;
  requestId?: string | undefined;
}

const sensitiveKeyPattern =
  /authorization|cookie|credential|password|payload|publication|secret|token|api[_-]?key|service[_-]?key|publishable[_-]?key/i;
const safeIdentifierPattern = /^[a-zA-Z0-9_.:/-]{1,160}$/;

export function reportOperationalError(input: OperationalErrorInput): void {
  const record = {
    level: "error",
    application: input.application,
    event: normalizeIdentifier(input.event, "application.error"),
    ...(normalizeIdentifier(input.requestId)
      ? { requestId: normalizeIdentifier(input.requestId) }
      : {}),
    ...(normalizeIdentifier(input.digest) ? { digest: normalizeIdentifier(input.digest) } : {}),
    context: sanitizeLogContext(input.context),
  };
  console.error(JSON.stringify(record));
}

export function sanitizeLogContext(
  context: Readonly<Record<string, SafeLogValue>> | undefined,
): Record<string, boolean | number | string | null> {
  if (!context) return {};
  const sanitized: Record<string, boolean | number | string | null> = {};
  for (const [key, value] of Object.entries(context)) {
    if (sensitiveKeyPattern.test(key) || value === undefined) continue;
    sanitized[key] =
      typeof value === "string" ? value.replace(/[\r\n\t]/g, " ").slice(0, 160) : value;
  }
  return sanitized;
}

export function readSafeCorrelationId(
  headers: Readonly<Record<string, string | readonly string[] | undefined>>,
): string | undefined {
  for (const name of ["x-request-id", "x-vercel-id"]) {
    const value = headers[name];
    const candidate = Array.isArray(value) ? value[0] : value;
    const normalized = normalizeIdentifier(candidate);
    if (normalized) return normalized;
  }
  return undefined;
}

export function readErrorDigest(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("digest" in error)) return undefined;
  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === "string" ? normalizeIdentifier(digest) : undefined;
}

function normalizeIdentifier(value: string | undefined, fallback?: string): string | undefined {
  if (value && safeIdentifierPattern.test(value)) return value;
  return fallback;
}
