import { spawnSync } from "node:child_process";

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: globalThis.process.cwd(),
    encoding: "utf8",
    ...options,
  });

  if (result.status !== 0) {
    if (options.stdio !== "inherit") {
      globalThis.process.stderr.write(
        result.stderr || result.stdout || "Command failed without output.\n",
      );
    }

    throw new Error(`${command} ${args.join(" ")} exited with status ${result.status}.`);
  }

  return result.stdout;
}

function readLocalSupabaseStatus() {
  const output = run("pnpm", ["exec", "supabase", "status", "-o", "json"]);
  return JSON.parse(output);
}

let startedSupabase = false;

try {
  let status;

  try {
    status = readLocalSupabaseStatus();
  } catch {
    run("pnpm", ["exec", "supabase", "start"], { stdio: "inherit" });
    startedSupabase = true;
    status = readLocalSupabaseStatus();
  }

  const apiUrl = status.API_URL;
  const databaseUrl = status.DB_URL;
  const publishableKey = status.PUBLISHABLE_KEY ?? status.ANON_KEY;
  const secretKey = status.SECRET_KEY ?? status.SERVICE_ROLE_KEY;

  if (!apiUrl || !databaseUrl || !publishableKey || !secretKey) {
    throw new Error("The local Supabase status did not provide the required E2E configuration.");
  }

  run("pnpm", ["exec", "playwright", "test"], {
    env: {
      ...globalThis.process.env,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableKey,
      NEXT_PUBLIC_SUPABASE_URL: apiUrl,
      SUPABASE_SECRET_KEY: secretKey,
      SUPABASE_TEST_DATABASE_URL: databaseUrl,
    },
    stdio: "inherit",
  });
} finally {
  if (startedSupabase) {
    spawnSync("pnpm", ["exec", "supabase", "stop"], {
      cwd: globalThis.process.cwd(),
      stdio: "inherit",
    });
  }
}
