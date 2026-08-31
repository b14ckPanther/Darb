import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";

import { expect, test } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

test.describe.configure({ mode: "serial" });

const runId = randomUUID().slice(0, 8);
const email = `admin-e2e-${runId}@example.test`;
const password = `Darb-${runId}-secure-password`;
const businessName = `Darb E2E ${runId}`;
const businessSlug = `darb-e2e-${runId}`;

let adminClient: SupabaseClient;
let userId: string | undefined;

test.beforeAll(async () => {
  adminClient = createClient(
    requiredEnvironment("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnvironment("SUPABASE_SECRET_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    },
  );

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    email_confirm: true,
    password,
  });

  if (error) {
    throw error;
  }

  userId = data.user.id;
});

test.afterAll(async () => {
  if (!userId) {
    return;
  }

  cleanLocalDatabaseFixture(userId);
});

test("redirects an unauthenticated admin request to login", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/login\?next=%2F$/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
});

test("shows a generic sign-in error and rejects an external return path", async ({ page }) => {
  await page.goto("/login?next=%2F%2Fattacker.example");

  await expect(page.locator('input[name="next"]')).toHaveValue("/");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill("incorrect-password");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.locator(".form-alert")).toContainText("email or password is incorrect");
  await expect(page).toHaveURL(/\/login/);
});

test("completes sign-in, first-business onboarding, protected access, and sign-out", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/onboarding$/);
  await expect(page.getByRole("heading", { name: "Create your business" })).toBeVisible();

  await page.goto("/");
  await expect(page).toHaveURL(/\/onboarding$/);

  await page.getByLabel("Business name").fill(businessName);
  await page.getByLabel("Business slug").fill("bad slug");
  await page.getByRole("button", { name: "Create business" }).click();
  await expect(page).toHaveURL(/\/onboarding$/);
  expect(
    await page
      .getByLabel("Business slug")
      .evaluate((element) => (element as HTMLInputElement).checkValidity()),
  ).toBe(false);

  await page.getByLabel("Business slug").fill(businessSlug);
  await page.getByLabel("العربية").check();
  await page.getByRole("button", { name: "Create business" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Your Darb workspace is ready." })).toBeVisible();
  await expect(page.getByRole("heading", { name: businessName })).toBeVisible();
  await expect(page.getByText(businessSlug, { exact: true })).toBeVisible();

  await page.goto("/login");
  await expect(page).toHaveURL(/\/$/);

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.goto("/");
  await expect(page).toHaveURL(/\/login\?next=%2F$/);
});

function requiredEnvironment(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required for the admin authentication E2E suite.`);
  }

  return value;
}

function cleanLocalDatabaseFixture(fixtureUserId: string): void {
  const databaseUrl = requiredEnvironment("SUPABASE_TEST_DATABASE_URL");
  const hostname = new URL(databaseUrl).hostname;

  if (!["127.0.0.1", "localhost", "[::1]"].includes(hostname)) {
    throw new Error("Authentication E2E cleanup is restricted to a local Supabase database.");
  }

  const cleanup = spawnSync(
    "psql",
    [
      databaseUrl,
      "--no-psqlrc",
      "--set",
      "ON_ERROR_STOP=1",
      "--set",
      `fixture_slug=${businessSlug}`,
      "--set",
      `fixture_user_id=${fixtureUserId}`,
    ],
    {
      encoding: "utf8",
      input: `
        begin;
        delete from core.audit_events
          where business_id in (
            select id from core.businesses where slug = :'fixture_slug'
          );
        delete from core.businesses where slug = :'fixture_slug';
        delete from auth.users where id = :'fixture_user_id'::uuid;
        commit;
      `,
    },
  );

  if (cleanup.status !== 0) {
    throw new Error(cleanup.stderr || cleanup.stdout || "Unable to clean up the E2E fixture.");
  }
}
