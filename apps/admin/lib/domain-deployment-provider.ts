import "server-only";

export type DomainDnsRecord = Readonly<{
  name: string;
  type: "A" | "CNAME" | "TXT";
  value: string;
}>;

export type DomainDeploymentState = "live" | "needs-configuration";

export interface DomainDeploymentStatus {
  state: DomainDeploymentState;
  dnsRecords: readonly DomainDnsRecord[];
}

export interface DomainDeploymentProvider {
  connect(hostname: string): Promise<DomainDeploymentStatus>;
  status(hostname: string): Promise<DomainDeploymentStatus>;
  disconnect(hostname: string): Promise<void>;
}

export type DomainProviderErrorCode =
  "already-assigned" | "configuration" | "forbidden" | "not-found" | "provider-unavailable";

export class DomainProviderError extends Error {
  constructor(readonly safeCode: DomainProviderErrorCode) {
    super(`Domain deployment provider failed (${safeCode}).`);
    this.name = "DomainProviderError";
  }
}

interface VercelProviderConfig {
  apiToken: string;
  projectId: string;
  teamId?: string;
}

interface VercelProviderOptions extends VercelProviderConfig {
  fetcher?: typeof fetch;
}

type UnknownRecord = Record<string, unknown>;

export class VercelDomainDeploymentProvider implements DomainDeploymentProvider {
  readonly #fetcher: typeof fetch;
  readonly #config: VercelProviderConfig;

  constructor({ fetcher = fetch, ...config }: VercelProviderOptions) {
    this.#fetcher = fetcher;
    this.#config = config;
  }

  async connect(hostname: string): Promise<DomainDeploymentStatus> {
    const response = await this.#request(
      `/v10/projects/${encodeURIComponent(this.#config.projectId)}/domains`,
      { body: JSON.stringify({ name: hostname }), method: "POST" },
    );

    if (!response.ok && response.status !== 400) {
      throw await mapProviderResponseError(response);
    }

    try {
      return await this.status(hostname);
    } catch (error) {
      if (
        response.status === 400 &&
        error instanceof DomainProviderError &&
        error.safeCode === "not-found"
      ) {
        throw new DomainProviderError("already-assigned");
      }
      throw error;
    }
  }

  async status(hostname: string): Promise<DomainDeploymentStatus> {
    const encodedHostname = encodeURIComponent(hostname);
    const [projectResponse, configResponse] = await Promise.all([
      this.#request(
        `/v9/projects/${encodeURIComponent(this.#config.projectId)}/domains/${encodedHostname}`,
      ),
      this.#request(
        `/v6/domains/${encodedHostname}/config`,
        undefined,
        new URLSearchParams({ projectIdOrName: this.#config.projectId }),
      ),
    ]);

    if (!projectResponse.ok) throw await mapProviderResponseError(projectResponse);
    if (!configResponse.ok) throw await mapProviderResponseError(configResponse);

    const project = await parseProviderRecord(projectResponse);
    const configuration = await parseProviderRecord(configResponse);
    if (typeof project.verified !== "boolean" || typeof configuration.misconfigured !== "boolean") {
      throw new DomainProviderError("provider-unavailable");
    }
    const verified = project.verified;
    const misconfigured = configuration.misconfigured;

    return {
      state: verified && !misconfigured ? "live" : "needs-configuration",
      dnsRecords: collectDnsRecords(hostname, project, configuration),
    };
  }

  async disconnect(hostname: string): Promise<void> {
    const response = await this.#request(
      `/v9/projects/${encodeURIComponent(this.#config.projectId)}/domains/${encodeURIComponent(hostname)}`,
      { method: "DELETE" },
    );
    if (!response.ok && response.status !== 404) {
      throw await mapProviderResponseError(response);
    }
  }

  async #request(path: string, init?: RequestInit, extraQuery = new URLSearchParams()) {
    if (this.#config.teamId) extraQuery.set("teamId", this.#config.teamId);
    const query = extraQuery.size > 0 ? `?${extraQuery.toString()}` : "";
    try {
      return await this.#fetcher(`https://api.vercel.com${path}${query}`, {
        ...init,
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${this.#config.apiToken}`,
          "Content-Type": "application/json",
        },
      });
    } catch {
      throw new DomainProviderError("provider-unavailable");
    }
  }
}

class FakeDomainDeploymentProvider implements DomainDeploymentProvider {
  constructor(private readonly state: "live" | "needs-configuration" | "failed") {}

  async connect(hostname: string) {
    return this.status(hostname);
  }

  async status(hostname: string): Promise<DomainDeploymentStatus> {
    if (this.state === "failed") throw new DomainProviderError("provider-unavailable");
    return {
      state: this.state,
      dnsRecords:
        this.state === "needs-configuration"
          ? [{ name: hostname, type: "CNAME", value: "local-routing.invalid" }]
          : [],
    };
  }

  async disconnect() {}
}

export function createDomainDeploymentProvider(
  environment: NodeJS.ProcessEnv = process.env,
): DomainDeploymentProvider {
  if (environment.DARB_DOMAIN_PROVIDER === "fake") {
    if (environment.NODE_ENV === "production") {
      throw new DomainProviderError("configuration");
    }
    const state = environment.DARB_FAKE_DOMAIN_PROVIDER_STATE;
    return new FakeDomainDeploymentProvider(
      state === "needs-configuration" || state === "failed" ? state : "live",
    );
  }

  const apiToken = environment.DARB_VERCEL_API_TOKEN;
  const projectId = environment.VERCEL_RESTAURANT_PROJECT_ID;
  if (!apiToken || !projectId) throw new DomainProviderError("configuration");

  return new VercelDomainDeploymentProvider({
    apiToken,
    projectId,
    ...(environment.VERCEL_TEAM_ID ? { teamId: environment.VERCEL_TEAM_ID } : {}),
  });
}

function collectDnsRecords(
  hostname: string,
  project: UnknownRecord | null,
  configuration: UnknownRecord | null,
): DomainDnsRecord[] {
  const records: DomainDnsRecord[] = [];
  for (const challenge of asRecordArray(project?.verification)) {
    if (challenge.type === "TXT" && typeof challenge.value === "string") {
      records.push({
        name: typeof challenge.domain === "string" ? challenge.domain : hostname,
        type: "TXT",
        value: challenge.value,
      });
    }
  }

  const cnames = rankedValues(configuration?.recommendedCNAME);
  if (cnames[0]) records.push({ name: hostname, type: "CNAME", value: cnames[0] });
  const addresses = rankedArrayValues(configuration?.recommendedIPv4);
  for (const address of addresses) records.push({ name: hostname, type: "A", value: address });
  return records;
}

function rankedValues(value: unknown): string[] {
  return asRecordArray(value)
    .filter((entry) => typeof entry.value === "string")
    .sort((left, right) => numberOrMax(left.rank) - numberOrMax(right.rank))
    .map((entry) => entry.value as string);
}

function rankedArrayValues(value: unknown): string[] {
  return asRecordArray(value)
    .sort((left, right) => numberOrMax(left.rank) - numberOrMax(right.rank))
    .flatMap((entry) =>
      Array.isArray(entry.value)
        ? entry.value.filter((item): item is string => typeof item === "string")
        : [],
    );
}

function numberOrMax(value: unknown): number {
  return typeof value === "number" ? value : Number.MAX_SAFE_INTEGER;
}

function asRecord(value: unknown): UnknownRecord | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function asRecordArray(value: unknown): UnknownRecord[] {
  return Array.isArray(value)
    ? value.map(asRecord).filter((item): item is UnknownRecord => item !== null)
    : [];
}

async function mapProviderResponseError(response: Response): Promise<DomainProviderError> {
  let providerCode: string | undefined;
  try {
    const body = asRecord(await response.json());
    providerCode =
      typeof asRecord(body?.error)?.code === "string"
        ? (asRecord(body?.error)?.code as string)
        : undefined;
  } catch {
    // Provider bodies are untrusted and optional; only stable response categories are retained.
  }

  if (response.status === 403) return new DomainProviderError("forbidden");
  if (response.status === 404) return new DomainProviderError("not-found");
  if (response.status === 409 || providerCode === "not_modified") {
    return new DomainProviderError("already-assigned");
  }
  return new DomainProviderError("provider-unavailable");
}

async function parseProviderRecord(response: Response): Promise<UnknownRecord> {
  try {
    const value = asRecord(await response.json());
    if (value) return value;
  } catch {
    // Provider bodies are untrusted. Malformed success payloads fail closed.
  }
  throw new DomainProviderError("provider-unavailable");
}
