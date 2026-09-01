import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";

import { expect, test, type Page } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

test.describe.configure({ mode: "serial" });

const runId = randomUUID().slice(0, 8);
const fixturePrefix = `darb-e2e-${runId}`;
const ownerEmail = `owner-${runId}@example.test`;
const scopedEmail = `scoped-${runId}@example.test`;
const password = `Darb-${runId}-secure-password`;
const initialBusinessName = `Darb E2E ${runId}`;
const initialBusinessSlug = fixturePrefix;
const updatedBusinessName = `${initialBusinessName} Core`;
const updatedBusinessSlug = `${fixturePrefix}-core`;
const secondBusinessName = `Darb E2E Second ${runId}`;
const secondBusinessSlug = `${fixturePrefix}-second`;
const assignedLocationName = `Central Studio ${runId}`;
const otherLocationName = `North Office ${runId}`;
const mediaFilename = `phase6-${runId}.png`;
const customHostname = `${fixturePrefix}.example.invalid`;

const ownerPermissionBundle = [
  "audit.view",
  "business.manage",
  "domains.manage",
  "locations.manage",
  "locations.read",
  "media.manage",
  "memberships.manage",
  "modules.manage",
  "permissions.manage",
] as const;

let adminClient: SupabaseClient;
let ownerUserId: string | undefined;
let scopedUserId: string | undefined;
let primaryBusinessId: string | undefined;
let assignedLocationId: string | undefined;
let otherLocationId: string | undefined;

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

  ownerUserId = await createTestUser(ownerEmail);
  scopedUserId = await createTestUser(scopedEmail);
});

test.afterAll(async () => {
  await cleanLocalStorageFixtures();
  cleanLocalDatabaseFixtures([ownerUserId, scopedUserId].filter(isPresent));
});

test("redirects an unauthenticated admin request to login", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/login\?next=%2F$/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
});

test("shows a generic sign-in error and rejects an external return path", async ({ page }) => {
  await page.goto("/login?next=%2F%2Fattacker.example");

  await expect(page.locator('input[name="next"]')).toHaveValue("/");
  await page.getByLabel("Email address").fill(ownerEmail);
  await page.getByLabel("Password").fill("incorrect-password");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.locator(".form-alert")).toContainText("email or password is incorrect");
  await expect(page).toHaveURL(/\/login/);
});

test("completes first-business onboarding and enters the canonical workspace route", async ({
  page,
}) => {
  await signIn(page, ownerEmail);

  await expect(page).toHaveURL(/\/onboarding$/);
  await expect(page.getByRole("heading", { name: "Create your business" })).toBeVisible();

  await page.getByLabel("Business name").fill(initialBusinessName);
  await page.getByLabel("Business slug").fill("bad slug");
  await page.getByRole("button", { name: "Create business" }).click();
  expect(
    await page
      .getByLabel("Business slug")
      .evaluate((element) => (element as HTMLInputElement).checkValidity()),
  ).toBe(false);

  await page.getByLabel("Business slug").fill(initialBusinessSlug);
  await page.getByLabel("العربية").check();
  await page.getByRole("button", { name: "Create business" }).click();

  await expect(page).toHaveURL(new RegExp(`/b/${initialBusinessSlug}$`));
  await expect(page.getByRole("heading", { name: initialBusinessName })).toBeVisible();

  const { data, error } = await adminClient
    .schema("core")
    .from("businesses")
    .select("id")
    .eq("slug", initialBusinessSlug)
    .single();

  if (error || !data) {
    throw error ?? new Error("The onboarding business was not created.");
  }

  primaryBusinessId = data.id;
  await provisionMultiBusinessFixture();
});

test("chooses and switches only between accessible business routes", async ({ page }) => {
  await signIn(page, ownerEmail);

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Choose a business to manage." })).toBeVisible();
  await expect(page.getByRole("link", { name: new RegExp(initialBusinessName) })).toBeVisible();
  await expect(page.getByRole("link", { name: new RegExp(secondBusinessName) })).toBeVisible();

  await page.getByRole("link", { name: new RegExp(initialBusinessName) }).click();
  await expect(page).toHaveURL(new RegExp(`/b/${initialBusinessSlug}$`));
  await page.getByRole("link", { exact: true, name: "Business settings" }).click();
  await expect(page).toHaveURL(new RegExp(`/b/${initialBusinessSlug}/settings$`));
  await page.getByLabel("Current business").selectOption(secondBusinessSlug);
  await expect(page).toHaveURL(new RegExp(`/b/${secondBusinessSlug}/settings$`));
  await page.getByLabel("Current business").selectOption(initialBusinessSlug);
  await expect(page).toHaveURL(new RegExp(`/b/${initialBusinessSlug}/settings$`));
});

test("updates business settings and redirects a slug change to its canonical route", async ({
  page,
}) => {
  await signIn(page, ownerEmail);
  await page.goto(`/b/${initialBusinessSlug}/settings`);

  await page.getByLabel("Display name").fill(updatedBusinessName);
  await page.getByLabel("Business slug").fill(updatedBusinessSlug);
  await page.getByLabel("Default language").selectOption("he");
  await page.getByLabel("Timezone").selectOption("Asia/Jerusalem");
  await page.getByRole("button", { name: "Save business settings" }).click();

  await expect(page).toHaveURL(new RegExp(`/b/${updatedBusinessSlug}/settings$`));
  await expect(page.getByLabel("Display name")).toHaveValue(updatedBusinessName);
  await expect(page.getByLabel("Business slug")).toHaveValue(updatedBusinessSlug);

  await page.goto(`/b/${initialBusinessSlug}/settings`);
  await expect(
    page.getByRole("heading", { name: "That business is not available to this account." }),
  ).toBeVisible();
});

test("enables and disables a module with persistent multi-business isolation", async ({ page }) => {
  await signIn(page, ownerEmail);
  await page.goto(`/b/${updatedBusinessSlug}/modules`);

  await expect(page.getByRole("heading", { name: "Modules" })).toBeVisible();
  await expect(page.getByText("Capability state, not a product launch")).toBeVisible();
  await expect(page.locator('a[href*="/restaurant"]')).toHaveCount(0);

  const primaryRestaurant = page.getByRole("article", { name: "Restaurant" });
  await expect(primaryRestaurant.getByText("Disabled", { exact: true })).toBeVisible();
  await primaryRestaurant.getByRole("button", { name: "Enable capability" }).click();
  await expect(primaryRestaurant.getByText("Restaurant enabled.")).toBeVisible();

  await page.reload();
  await expect(
    page.getByRole("article", { name: "Restaurant" }).getByText("Enabled", { exact: true }),
  ).toBeVisible();

  await page.getByLabel("Current business").selectOption(secondBusinessSlug);
  await expect(page).toHaveURL(new RegExp(`/b/${secondBusinessSlug}/modules$`));
  await expect(
    page.getByRole("article", { name: "Restaurant" }).getByText("Disabled", { exact: true }),
  ).toBeVisible();

  await page.getByLabel("Current business").selectOption(updatedBusinessSlug);
  const restoredPrimaryRestaurant = page.getByRole("article", { name: "Restaurant" });
  await restoredPrimaryRestaurant.getByRole("button", { name: "Disable capability" }).click();
  await expect(restoredPrimaryRestaurant.getByText("Disable this capability")).toBeVisible();
  await restoredPrimaryRestaurant.getByRole("button", { name: "Confirm disable" }).click();
  await expect(restoredPrimaryRestaurant.getByText("Restaurant disabled.")).toBeVisible();

  await page.reload();
  await expect(
    page.getByRole("article", { name: "Restaurant" }).getByText("Disabled", { exact: true }),
  ).toBeVisible();
});

test("uploads, describes, and archives shared media without deleting Storage", async ({ page }) => {
  await signIn(page, ownerEmail);
  await page.goto(`/b/${updatedBusinessSlug}/media`);

  await expect(page.getByRole("heading", { exact: true, name: "Media" })).toBeVisible();
  await page.getByLabel("Image or video").setInputFiles({
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl+fRcAAAAASUVORK5CYII=",
      "base64",
    ),
    mimeType: "image/png",
    name: mediaFilename,
  });
  await page.getByLabel("Alternative text").fill("A tiny Darb test asset");
  await page.getByRole("button", { name: "Upload media" }).click();

  const asset = page.getByRole("article", { name: mediaFilename });
  await expect(asset).toBeVisible();
  await expect(asset.getByRole("img", { name: "A tiny Darb test asset" })).toBeVisible();

  await asset.getByLabel("Alternative text").fill("Updated accessible Darb asset");
  await asset.getByRole("button", { name: "Save description" }).click();
  await expect(asset.getByText("Alternative text saved.")).toBeVisible();

  await page.reload();
  const persistedAsset = page.getByRole("article", { name: mediaFilename });
  await expect(persistedAsset.getByLabel("Alternative text")).toHaveValue(
    "Updated accessible Darb asset",
  );
  await persistedAsset.getByRole("button", { name: "Archive asset" }).click();
  await persistedAsset.getByRole("button", { name: "Confirm archive" }).click();
  await expect(persistedAsset.getByText("archived", { exact: true })).toBeVisible();

  const { count, error } = await adminClient
    .schema("core")
    .from("media_assets")
    .select("id", { count: "exact", head: true })
    .eq("business_id", primaryBusinessId!);
  if (error) throw error;
  expect(count).toBe(1);
});

test("records an honest failed DNS check and keeps domains isolated by business", async ({
  page,
}) => {
  await signIn(page, ownerEmail);
  await page.goto(`/b/${updatedBusinessSlug}/domains`);

  await page.locator('input[name="hostname"]').fill(customHostname.toUpperCase());
  await page.getByRole("button", { name: "Add domain" }).click();

  const domain = page.getByRole("article", { name: new RegExp(customHostname, "i") });
  await expect(domain).toBeVisible();
  await expect(domain.getByText("_darb-verification.", { exact: false })).toBeVisible();
  await expect(domain.getByText("darb-verification=", { exact: false })).toBeVisible();
  await expect(domain.getByRole("button", { name: "Make primary" })).toHaveCount(0);

  await domain.getByRole("button", { name: "Verify TXT record" }).click();
  await expect(
    domain.getByText("The exact TXT value was not found.", { exact: false }),
  ).toBeVisible();
  await expect(domain.getByText("failed", { exact: true })).toBeVisible();

  await page.getByLabel("Current business").selectOption(secondBusinessSlug);
  await expect(page).toHaveURL(new RegExp(`/b/${secondBusinessSlug}/domains$`));
  await expect(page.getByText(customHostname, { exact: true })).toHaveCount(0);
  await expect(page.getByText("No custom domains")).toBeVisible();

  await page.getByLabel("Current business").selectOption(updatedBusinessSlug);
  const restoredDomain = page.getByRole("article", { name: new RegExp(customHostname, "i") });
  await restoredDomain.getByRole("button", { name: "Disable domain" }).click();
  await restoredDomain.getByRole("button", { name: "Confirm disable" }).click();
  await expect(restoredDomain.getByText("disabled", { exact: true })).toBeVisible();
});

test("persists enabled languages and an atomic default-locale change", async ({ page }) => {
  await signIn(page, ownerEmail);
  await page.goto(`/b/${updatedBusinessSlug}/languages`);

  const english = page.locator(".language-card").filter({ hasText: "English" });
  const hebrew = page.locator(".language-card").filter({ hasText: "עברית" });
  await english.getByRole("checkbox").check();
  await english.getByRole("radio").check();
  await page.getByRole("button", { name: "Save language settings" }).click();
  await expect(page.getByText("Business languages saved.")).toBeVisible();

  await page.reload();
  await expect(english.getByRole("checkbox")).toBeChecked();
  await expect(english.getByRole("checkbox")).toBeDisabled();
  await expect(english.getByRole("radio")).toBeChecked();
  await expect(hebrew.getByRole("checkbox")).toBeChecked();
});

test("creates and edits a core location through audited tenant actions", async ({ page }) => {
  await signIn(page, ownerEmail);
  await page.goto(`/b/${updatedBusinessSlug}/locations`);
  await page.getByRole("link", { name: "New location" }).click();

  await page.getByLabel("Display name").fill(assignedLocationName);
  await page.getByLabel("Address line").fill("12 Darb Street");
  await page.getByLabel("Locality / city").fill("Haifa");
  await page.getByLabel("Postal code").fill("3300000");
  await page.getByLabel("Timezone").selectOption("Asia/Jerusalem");
  await page.getByRole("button", { name: "Create location" }).click();

  await expect(page).toHaveURL(/\/locations\/[0-9a-f-]+\?created=1$/);
  assignedLocationId = page.url().match(/\/locations\/([0-9a-f-]+)/)?.[1];
  expect(assignedLocationId).toBeTruthy();
  await expect(page.getByText("Location created successfully.")).toBeVisible();

  await page.getByLabel("Display name").fill(`${assignedLocationName} Updated`);
  await page.getByLabel("Operational status").selectOption("inactive");
  await page.getByRole("button", { name: "Save location" }).click();
  await expect(page.getByText("Location details saved.")).toBeVisible();
  await expect(page.getByLabel("Display name")).toHaveValue(`${assignedLocationName} Updated`);

  await provisionLocationScopeFixture();
});

test("enforces read-only business access and exact location scope in the UI", async ({ page }) => {
  if (!assignedLocationId || !otherLocationId) {
    throw new Error("Location scope fixtures were not prepared.");
  }

  await signIn(page, scopedEmail);
  await expect(page).toHaveURL(new RegExp(`/b/${updatedBusinessSlug}$`));

  await page.getByRole("link", { exact: true, name: "Business settings" }).click();
  await expect(page.getByText("The business.manage permission is required")).toBeVisible();
  await expect(page.getByLabel("Display name")).toBeDisabled();

  await page.getByRole("link", { exact: true, name: "Modules" }).click();
  await expect(page.getByText("Module state is read-only.")).toBeVisible();
  await expect(page.getByRole("article", { name: "Restaurant" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Enable capability" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Disable capability" })).toHaveCount(0);

  await expect(page.getByRole("link", { exact: true, name: "Media" })).toHaveCount(0);
  await expect(page.getByRole("link", { exact: true, name: "Domains" })).toHaveCount(0);
  await page.goto(`/b/${updatedBusinessSlug}/media`);
  await expect(page.getByText("Media is read-only.")).toBeVisible();
  await expect(page.getByText(mediaFilename, { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Upload media" })).toHaveCount(0);

  await page.goto(`/b/${updatedBusinessSlug}/domains`);
  await expect(page.getByText("Domain settings are read-only.")).toBeVisible();
  await expect(page.getByText(customHostname, { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add domain" })).toHaveCount(0);

  await page.getByRole("link", { exact: true, name: "Languages" }).click();
  await expect(page.getByText("Language settings are read-only.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Save language settings" })).toHaveCount(0);

  await page.getByRole("link", { exact: true, name: "Locations" }).click();
  await expect(page.getByText(`${assignedLocationName} Updated`, { exact: true })).toBeVisible();
  await expect(page.getByText(otherLocationName, { exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "New location" })).toHaveCount(0);

  await page.goto(`/b/${updatedBusinessSlug}/locations/new`);
  await expect(page.getByText("Business-wide permission required.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Create location" })).toHaveCount(0);

  await page.goto(`/b/${updatedBusinessSlug}/locations/${assignedLocationId}`);
  await page.getByLabel("Locality / city").fill("Jerusalem");
  await page.getByRole("button", { name: "Save location" }).click();
  await expect(page.getByText("Location details saved.")).toBeVisible();

  await page.goto(`/b/${updatedBusinessSlug}/locations/${otherLocationId}`);
  await expect(
    page.getByRole("heading", { name: "That business is not available to this account." }),
  ).toBeVisible();
});

test("archives a location without hard-deleting it", async ({ page }) => {
  if (!otherLocationId) {
    throw new Error("The archive fixture was not prepared.");
  }

  await signIn(page, ownerEmail);
  await page.goto(`/b/${updatedBusinessSlug}/locations/${otherLocationId}`);
  await page.getByRole("button", { name: "Archive location" }).click();
  await page.getByRole("button", { name: "Confirm archive" }).click();

  await expect(page).toHaveURL(new RegExp(`/locations/${otherLocationId}\\?archived=1$`));
  await expect(page.getByText("Location archived and retained as read-only.")).toBeVisible();
  await expect(page.getByText("Archived locations are retained")).toBeVisible();
  await expect(page.getByRole("button", { name: "Save location" })).toHaveCount(0);
});

test("keeps mobile navigation and the business switcher keyboard-operable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page, ownerEmail);
  await page.goto(`/b/${updatedBusinessSlug}`);

  await expect(page.getByRole("button", { name: "Open navigation" })).toBeVisible();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("navigation", { name: "Business administration" })).toBeVisible();
  await page.getByLabel("Current business").focus();
  await page.getByLabel("Current business").selectOption(secondBusinessSlug);
  await expect(page).toHaveURL(new RegExp(`/b/${secondBusinessSlug}$`));

  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("link", { exact: true, name: "Media" })).toBeVisible();
  await expect(page.getByRole("link", { exact: true, name: "Domains" })).toBeVisible();
  await expect(page.getByRole("link", { exact: true, name: "Languages" })).toBeVisible();
  await page.getByRole("link", { exact: true, name: "Modules" }).click();
  await expect(page).toHaveURL(new RegExp(`/b/${secondBusinessSlug}/modules$`));
  const mobileRestaurant = page.getByRole("article", { name: "Restaurant" });
  await expect(mobileRestaurant.getByRole("button", { name: "Enable capability" })).toBeVisible();
  await mobileRestaurant.getByRole("button", { name: "Enable capability" }).click();
  await expect(mobileRestaurant.getByText("Restaurant enabled.")).toBeVisible();
  await mobileRestaurant.getByRole("button", { name: "Disable capability" }).click();
  await mobileRestaurant.getByRole("button", { name: "Confirm disable" }).click();
  await expect(mobileRestaurant.getByText("Restaurant disabled.")).toBeVisible();
});

test("signs out and re-protects the admin route", async ({ page }) => {
  await signIn(page, ownerEmail);
  await page.goto(`/b/${updatedBusinessSlug}`);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.goto("/");
  await expect(page).toHaveURL(/\/login\?next=%2F$/);
});

async function signIn(page: Page, email: string): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => url.pathname !== "/login");
}

async function createTestUser(email: string): Promise<string> {
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    email_confirm: true,
    password,
  });

  if (error) {
    throw error;
  }

  return data.user.id;
}

async function cleanLocalStorageFixtures(): Promise<void> {
  if (!primaryBusinessId) return;

  const { data, error } = await adminClient
    .schema("core")
    .from("media_assets")
    .select("storage_bucket, storage_path")
    .eq("business_id", primaryBusinessId);

  if (error) throw error;
  if (data.length === 0) return;

  for (const bucket of ["tenant-media-images", "tenant-media-videos"] as const) {
    const paths = data
      .filter((asset) => asset.storage_bucket === bucket)
      .map((asset) => asset.storage_path);
    if (paths.length === 0) continue;

    const { error: removeError } = await adminClient.storage.from(bucket).remove(paths);
    if (removeError) throw removeError;
  }
}

async function provisionMultiBusinessFixture(): Promise<void> {
  if (!ownerUserId || !scopedUserId || !primaryBusinessId) {
    throw new Error("User and primary business fixtures must exist first.");
  }

  const { data: business, error: businessError } = await adminClient
    .schema("core")
    .from("businesses")
    .insert({
      created_by: ownerUserId,
      default_locale: "en",
      display_name: secondBusinessName,
      slug: secondBusinessSlug,
    })
    .select("id")
    .single();

  if (businessError || !business) {
    throw businessError ?? new Error("Unable to create the second business fixture.");
  }

  const { data: memberships, error: membershipError } = await adminClient
    .schema("core")
    .from("memberships")
    .insert([
      {
        business_id: business.id,
        created_by: ownerUserId,
        status: "active",
        user_id: ownerUserId,
      },
      {
        business_id: primaryBusinessId,
        created_by: ownerUserId,
        status: "active",
        user_id: scopedUserId,
      },
    ])
    .select("id, business_id, user_id");

  if (membershipError || !memberships) {
    throw membershipError ?? new Error("Unable to create membership fixtures.");
  }

  const ownerMembership = memberships.find((membership) => membership.user_id === ownerUserId);

  if (!ownerMembership) {
    throw new Error("The second-business owner membership was not returned.");
  }

  const { error: permissionError } = await adminClient
    .schema("core")
    .from("membership_permissions")
    .insert(
      ownerPermissionBundle.map((permissionKey) => ({
        business_id: business.id,
        granted_by: ownerUserId,
        membership_id: ownerMembership.id,
        permission_key: permissionKey,
      })),
    );

  if (permissionError) {
    throw permissionError;
  }
}

async function provisionLocationScopeFixture(): Promise<void> {
  if (!ownerUserId || !scopedUserId || !primaryBusinessId || !assignedLocationId) {
    throw new Error("The core location fixtures must exist first.");
  }

  const { data: location, error: locationError } = await adminClient
    .schema("core")
    .from("locations")
    .insert({
      business_id: primaryBusinessId,
      country_code: "IL",
      created_by: ownerUserId,
      display_name: otherLocationName,
      status: "active",
    })
    .select("id")
    .single();

  if (locationError || !location) {
    throw locationError ?? new Error("Unable to create the second location fixture.");
  }

  otherLocationId = location.id;

  const { data: membership, error: membershipError } = await adminClient
    .schema("core")
    .from("memberships")
    .select("id")
    .eq("business_id", primaryBusinessId)
    .eq("user_id", scopedUserId)
    .single();

  if (membershipError || !membership) {
    throw membershipError ?? new Error("Unable to resolve the scoped membership fixture.");
  }

  const { error: permissionError } = await adminClient
    .schema("core")
    .from("membership_permissions")
    .insert([
      {
        business_id: primaryBusinessId,
        granted_by: ownerUserId,
        location_id: assignedLocationId,
        membership_id: membership.id,
        permission_key: "locations.read",
      },
      {
        business_id: primaryBusinessId,
        granted_by: ownerUserId,
        location_id: assignedLocationId,
        membership_id: membership.id,
        permission_key: "locations.manage",
      },
    ]);

  if (permissionError) {
    throw permissionError;
  }
}

function requiredEnvironment(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required for the admin authentication E2E suite.`);
  }

  return value;
}

function cleanLocalDatabaseFixtures(fixtureUserIds: string[]): void {
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
      `fixture_prefix=${fixturePrefix}`,
      "--set",
      `fixture_user_ids=${fixtureUserIds.join(",")}`,
    ],
    {
      encoding: "utf8",
      input: `
        begin;
        delete from core.audit_events
          where business_id in (
            select id from core.businesses where slug like :'fixture_prefix' || '%'
          );
        delete from core.businesses where slug like :'fixture_prefix' || '%';
        delete from auth.users
          where id = any(string_to_array(:'fixture_user_ids', ',')::uuid[]);
        commit;
      `,
    },
  );

  if (cleanup.status !== 0) {
    throw new Error(cleanup.stderr || cleanup.stdout || "Unable to clean up the E2E fixture.");
  }
}

function isPresent(value: string | undefined): value is string {
  return typeof value === "string";
}
