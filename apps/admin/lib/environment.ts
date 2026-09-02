import "server-only";

export interface DomainProviderEnvironment {
  apiToken: string;
  projectId: string;
  teamId?: string;
}

export function readDomainProviderEnvironment(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): DomainProviderEnvironment {
  const apiToken = requiredValue(environment.DARB_VERCEL_API_TOKEN, "DARB_VERCEL_API_TOKEN");
  const projectId = requiredValue(
    environment.DARB_VERCEL_RESTAURANT_PROJECT_ID,
    "DARB_VERCEL_RESTAURANT_PROJECT_ID",
  );
  const teamId = optionalValue(environment.DARB_VERCEL_TEAM_ID);

  if (!/^prj_[A-Za-z0-9_-]+$/.test(projectId)) {
    throw new Error("DARB_VERCEL_RESTAURANT_PROJECT_ID must be a Vercel project ID.");
  }
  if (teamId && !/^team_[A-Za-z0-9_-]+$/.test(teamId)) {
    throw new Error("DARB_VERCEL_TEAM_ID must be a Vercel team ID when configured.");
  }
  return { apiToken, projectId, ...(teamId ? { teamId } : {}) };
}

export function readSupabaseSecretKey(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): string {
  const secretKey = requiredValue(environment.SUPABASE_SECRET_KEY, "SUPABASE_SECRET_KEY");
  if (secretKey.startsWith("sb_publishable_")) {
    throw new Error("SUPABASE_SECRET_KEY cannot contain a publishable key.");
  }
  return secretKey;
}

function requiredValue(value: string | undefined, name: string): string {
  const normalized = optionalValue(value);
  if (!normalized) throw new Error(`${name} is required for this trusted server operation.`);
  return normalized;
}

function optionalValue(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  if (!normalized) return undefined;
  if (/[\r\n\0]/.test(normalized) || normalized.length > 2048) {
    throw new Error("A server environment value is malformed.");
  }
  return normalized;
}
