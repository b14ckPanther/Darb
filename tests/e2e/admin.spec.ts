import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";

import { expect, test, type Page } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

test.describe.configure({ mode: "serial" });

const runId = randomUUID().slice(0, 8);
const fixturePrefix = `darb-e2e-${runId}`;
const ownerEmail = `owner-${runId}@example.test`;
const scopedEmail = `scoped-${runId}@example.test`;
const platformEmail = `platform-${runId}@example.test`;
const password = `Darb-${runId}-secure-password`;
const initialBusinessName = `Darb E2E ${runId}`;
const initialBusinessSlug = fixturePrefix;
const updatedBusinessName = `${initialBusinessName} Core`;
const updatedBusinessSlug = `${fixturePrefix}-core`;
const secondBusinessName = `Darb E2E Regional Services and Operations Workspace ${runId}`;
const secondBusinessSlug = `${fixturePrefix}-second`;
const platformBusinessName = `Darb Platform Inspection Workspace With A Deliberately Long Name ${runId}`;
const platformBusinessSlug = `${fixturePrefix}-platform`;
const assignedLocationName = `Central Studio ${runId}`;
const otherLocationName = `North Office ${runId}`;
const mediaFilename = `phase6-${runId}.png`;
const customHostname = `${fixturePrefix}.example.invalid`;
const routableHostname = `${fixturePrefix}-routing.example.invalid`;

const ownerPermissionBundle = [
  "appearance.manage",
  "audit.view",
  "business.manage",
  "domains.manage",
  "locations.manage",
  "locations.read",
  "media.manage",
  "memberships.manage",
  "modules.manage",
  "permissions.manage",
  "restaurant.manage",
  "restaurant.read",
] as const;

let adminClient: SupabaseClient;
let ownerUserId: string | undefined;
let scopedUserId: string | undefined;
let platformUserId: string | undefined;
let primaryBusinessId: string | undefined;
let platformBusinessId: string | undefined;
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
  platformUserId = await createTestUser(platformEmail);
  promoteLocalSuperAdmin(platformUserId);
  await provisionPlatformBusinessFixture();
});

test.afterAll(async () => {
  await cleanLocalStorageFixtures();
  cleanLocalDatabaseFixtures([ownerUserId, scopedUserId, platformUserId].filter(isPresent));
});

test("redirects an unauthenticated admin request to login", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/login\?next=%2F$/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await expect(page.locator('[data-darb-mark="current"]')).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to Darb" })).toHaveAttribute(
    "href",
    "https://darb.co.il",
  );

  const password = page.getByLabel("Password", { exact: true });
  await expect(password).toHaveAttribute("type", "password");
  await page.getByRole("button", { name: "Show password" }).click();
  await expect(password).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Hide password" }).click();
  await expect(password).toHaveAttribute("type", "password");
});

test("keeps Admin private at both metadata and response-header boundaries", async ({ request }) => {
  const [login, robots, health] = await Promise.all([
    request.get("/login"),
    request.get("/robots.txt"),
    request.get("/health"),
  ]);
  expect(login.headers()["x-robots-tag"]).toContain("noindex");
  expect(login.headers()["x-frame-options"]).toBe("DENY");
  expect(login.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
  await expect(robots.text()).resolves.toContain("Disallow: /");
  expect(await health.json()).toEqual({ service: "darb-admin", status: "ok" });
  expect(health.headers()["cache-control"]).toContain("no-store");
});

test("shows a generic sign-in error and rejects an external return path", async ({ page }) => {
  await page.goto("/login?next=%2F%2Fattacker.example");

  await expect(page.locator('input[name="next"]')).toHaveValue("/");
  await page.getByLabel("Email address").fill(ownerEmail);
  await page.getByLabel("Password", { exact: true }).fill("incorrect-password");
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
  await expect(page.getByRole("heading", { level: 1, name: initialBusinessName })).toBeVisible();

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

test("renders the unified Overview from real platform state and one grouped navigation model", async ({
  page,
}) => {
  await signIn(page, ownerEmail);
  await page.goto(`/b/${initialBusinessSlug}`);

  await expect(page.getByRole("heading", { level: 1, name: initialBusinessName })).toBeVisible();
  await expect(page.getByText(`darb.co.il/b/${initialBusinessSlug}`)).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Clear next steps, without a made-up score" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Enabled state is not an engine launch" }),
  ).toBeVisible();
  await expect(page.locator(".overview-facts dd")).toHaveText(["0", "1", "0", "0"]);
  await expect(page.locator('a[href*="/restaurant"]')).toHaveCount(0);

  const navigation = page.getByRole("navigation", { name: "Business administration" });
  await expect(page.locator('[data-admin-brand="admin"]')).toBeVisible();
  await expect(page.getByRole("link", { name: "Darb public website" })).toHaveAttribute(
    "href",
    "https://darb.co.il",
  );
  await expect
    .poll(() =>
      page
        .locator('[data-admin-brand="admin"] [lang="ar"]')
        .evaluate((element) => getComputedStyle(element).fontFamily),
    )
    .toContain("Cairo");
  await expect
    .poll(() =>
      page
        .getByRole("heading", { level: 2, name: initialBusinessName })
        .evaluate((element) => getComputedStyle(element).fontFamily),
    )
    .toContain("Cairo");
  await expect(navigation.getByRole("heading", { name: "Workspace" })).toBeVisible();
  await expect(navigation.getByRole("heading", { name: "Business" })).toBeVisible();
  await expect(navigation.getByRole("heading", { name: "Experience" })).toBeVisible();
  await expect(navigation.getByRole("heading", { name: "Products" })).toBeVisible();
  await expect(navigation.getByRole("link", { name: "Overview" })).toHaveAttribute(
    "aria-current",
    "page",
  );
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

test("contains long business settings controls across responsive LTR and RTL layouts", async ({
  page,
}) => {
  await signIn(page, ownerEmail);
  await page.goto(`/b/${updatedBusinessSlug}/settings`);

  const displayName = page.getByLabel("Display name");
  const slug = page.getByLabel("Business slug");
  const defaultLanguage = page.getByLabel("Default language");
  const timezone = page.getByLabel("Timezone");
  const currency = page.getByLabel("Currency");
  await displayName.fill("A deliberately long Darb business identity ".repeat(3).trim());
  await slug.fill("darb-business-slug-with-a-deliberately-long-readable-identifier-123");

  expect(await currency.isDisabled()).toBe(true);
  expect(await currency.evaluate((input) => (input as HTMLInputElement).readOnly)).toBe(true);
  await expect(currency).toHaveValue("ILS");
  await expect(defaultLanguage).toHaveValue("he");
  await expect(timezone).toHaveValue("Asia/Jerusalem");

  for (const viewport of [
    { height: 844, width: 390 },
    { height: 1024, width: 768 },
    { height: 900, width: 1440 },
    { height: 1080, width: 1920 },
  ]) {
    await page.setViewportSize(viewport);

    for (const direction of ["ltr", "rtl"] as const) {
      await page.locator("html").evaluate((element, dir) => {
        element.setAttribute("dir", dir);
      }, direction);

      const layout = await page.evaluate(() => {
        const measureField = (id: string) => {
          const input = document.getElementById(id);
          const control = input?.closest(".field-control");
          const group = input?.closest(".field-group");
          const section = input?.closest(".form-section");
          if (!input || !control || !group || !section) return null;

          const inputRect = input.getBoundingClientRect();
          const controlRect = control.getBoundingClientRect();
          const groupRect = group.getBoundingClientRect();
          const prefix = control.querySelector(".field-prefix");
          const prefixRect = prefix?.getBoundingClientRect();
          const sectionRect = section.getBoundingClientRect();
          return {
            controlInsideGroup:
              controlRect.left >= groupRect.left - 1 && controlRect.right <= groupRect.right + 1,
            groupInsideSection:
              groupRect.left >= sectionRect.left - 1 && groupRect.right <= sectionRect.right + 1,
            inputInsideControl:
              inputRect.left >= controlRect.left - 1 && inputRect.right <= controlRect.right + 1,
            prefixInsideControl:
              !prefixRect ||
              prefixRect.width === 0 ||
              (prefixRect.left >= controlRect.left - 1 &&
                prefixRect.right <= controlRect.right + 1),
          };
        };

        return {
          currency: measureField("business-currency"),
          documentFits:
            document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
          slug: measureField("business-slug"),
        };
      });

      expect(layout, `${viewport.width}x${viewport.height} ${direction}`).toEqual({
        currency: {
          controlInsideGroup: true,
          groupInsideSection: true,
          inputInsideControl: true,
          prefixInsideControl: true,
        },
        documentFits: true,
        slug: {
          controlInsideGroup: true,
          groupInsideSection: true,
          inputInsideControl: true,
          prefixInsideControl: true,
        },
      });
    }
  }
});

test("enables Restaurant with persistent multi-business isolation", async ({ page }) => {
  await signIn(page, ownerEmail);
  await page.goto(`/b/${updatedBusinessSlug}/modules`);

  await expect(page.getByRole("heading", { name: "Modules" })).toBeVisible();
  await expect(page.getByText("Capability state, not a product launch")).toBeVisible();
  await expect(page.locator('a[href*="/restaurant"]')).toHaveCount(0);

  const primaryRestaurant = page.getByRole("article", { name: "Restaurant" });
  await expect(primaryRestaurant.getByText("Disabled", { exact: true })).toBeVisible();
  await primaryRestaurant.getByRole("button", { name: "Enable capability" }).click();
  await expect(primaryRestaurant.getByText("Restaurant enabled.")).toBeVisible();
  await expect(page.getByRole("link", { exact: true, name: "Restaurant" })).toBeVisible();

  await page.reload();
  await expect(
    page.getByRole("article", { name: "Restaurant" }).getByText("Enabled", { exact: true }),
  ).toBeVisible();

  await page.getByLabel("Current business").selectOption(secondBusinessSlug);
  await expect(page).toHaveURL(new RegExp(`/b/${secondBusinessSlug}/modules$`));
  await expect(
    page.getByRole("article", { name: "Restaurant" }).getByText("Disabled", { exact: true }),
  ).toBeVisible();

  const secondaryRestaurant = page.getByRole("article", { name: "Restaurant" });
  await secondaryRestaurant.getByRole("button", { name: "Enable capability" }).click();
  await expect(secondaryRestaurant.getByText("Restaurant enabled.")).toBeVisible();
  await secondaryRestaurant.getByRole("button", { name: "Disable capability" }).click();
  await secondaryRestaurant.getByRole("button", { name: "Confirm disable" }).click();
  await expect(secondaryRestaurant.getByText("Restaurant disabled.")).toBeVisible();

  await page.getByLabel("Current business").selectOption(updatedBusinessSlug);
  const restoredPrimaryRestaurant = page.getByRole("article", { name: "Restaurant" });
  await expect(restoredPrimaryRestaurant.getByText("Enabled", { exact: true })).toBeVisible();
});

test("selects, customizes, previews, isolates, and resets an appearance foundation", async ({
  page,
}) => {
  await signIn(page, ownerEmail);
  await page.goto(`/b/${updatedBusinessSlug}/modules`);
  const primaryPages = page.getByRole("article", { name: "Pages" });
  await primaryPages.getByRole("button", { name: "Enable capability" }).click();
  await expect(primaryPages.getByText("Pages enabled.")).toBeVisible();

  await page.getByRole("link", { exact: true, name: "Appearance" }).click();
  await expect(page).toHaveURL(new RegExp(`/b/${updatedBusinessSlug}/appearance$`));
  await expect(page.getByRole("heading", { name: "Appearance" })).toBeVisible();
  await expect(page.getByText("Composition and tokens—not arbitrary CSS")).toBeVisible();
  await expect(page.locator('a[href*="/pages"]')).toHaveCount(0);

  const pagesAppearance = page.getByRole("region", { name: "Pages rendering foundation" });
  await pagesAppearance.getByRole("radio", { name: /Editorial/ }).check();
  await pagesAppearance.getByLabel("Primary color", { exact: true }).fill("#3a2140");
  await pagesAppearance.getByLabel("Corners", { exact: true }).selectOption("bold");
  await pagesAppearance.getByLabel("Density", { exact: true }).selectOption("spacious");
  await pagesAppearance.getByLabel("Depth", { exact: true }).selectOption("medium");
  await pagesAppearance.getByLabel("Motion", { exact: true }).selectOption("expressive");
  await pagesAppearance.getByRole("button", { name: "Reset primary color" }).click();
  await expect(pagesAppearance.getByLabel("Primary color", { exact: true })).toHaveValue("#4A253F");
  await pagesAppearance.getByLabel("Primary color", { exact: true }).fill("#3a2140");
  await pagesAppearance.getByRole("button", { name: "Reset section" }).click();
  await expect(pagesAppearance.getByLabel("Corners", { exact: true })).toHaveValue("soft");
  await pagesAppearance.getByLabel("Corners", { exact: true }).selectOption("bold");
  await pagesAppearance.getByLabel("Density", { exact: true }).selectOption("spacious");
  await pagesAppearance.getByLabel("Depth", { exact: true }).selectOption("medium");
  await pagesAppearance.getByLabel("Motion", { exact: true }).selectOption("expressive");
  await pagesAppearance.getByLabel("Preview language").selectOption("ar");
  await expect(
    page.locator('[aria-label="Live appearance preview"] [lang="ar"][dir="rtl"]'),
  ).toBeVisible();
  const saveAppearance = pagesAppearance.getByRole("button", { name: "Save appearance" });
  let delayedSaveRequest = false;
  await page.route(`**/b/${updatedBusinessSlug}/appearance`, async (route) => {
    const request = route.request();
    if (!delayedSaveRequest && request.method() === "POST" && request.headers()["next-action"]) {
      delayedSaveRequest = true;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    await route.continue();
  });
  const saveResponse = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      response.url().endsWith(`/b/${updatedBusinessSlug}/appearance`),
  );
  await saveAppearance.click();
  await expect(pagesAppearance.getByRole("button", { name: "Saving appearance…" })).toBeDisabled();
  const completedSaveResponse = await saveResponse;
  expect(completedSaveResponse.ok()).toBe(true);
  expect(completedSaveResponse.headers()["x-action-revalidated"]).toBeUndefined();
  await expect(page.getByText("Appearance saved and ready for future rendering.")).toBeVisible();
  await expect(saveAppearance).toBeEnabled();
  await page.unroute(`**/b/${updatedBusinessSlug}/appearance`);

  await page.reload();
  await expect(pagesAppearance.getByRole("radio", { name: /Editorial/ })).toBeChecked();
  await expect(pagesAppearance.getByLabel("Primary color", { exact: true })).toHaveValue("#3A2140");
  await expect(pagesAppearance.getByLabel("Corners", { exact: true })).toHaveValue("bold");

  const saveForm = saveAppearance.locator("xpath=ancestor::form");
  await saveForm.locator('input[name="themeOverrides"]').evaluate((input) => {
    (input as HTMLInputElement).value = JSON.stringify({ css: "position: fixed" });
  });
  await saveAppearance.click();
  await expect(
    pagesAppearance.getByText(
      "Some appearance values were not accepted. Review the controls and try again.",
    ),
  ).toBeVisible();
  await expect(saveAppearance).toBeEnabled();

  let interruptedSaveRequest = false;
  await page.route(`**/b/${updatedBusinessSlug}/appearance`, async (route) => {
    const request = route.request();
    if (
      !interruptedSaveRequest &&
      request.method() === "POST" &&
      request.headers()["next-action"]
    ) {
      interruptedSaveRequest = true;
      await route.abort("connectionfailed");
      return;
    }
    await route.continue();
  });
  await saveAppearance.click();
  await expect(
    pagesAppearance.getByText(
      "The appearance request did not complete. Check your connection and try again.",
    ),
  ).toBeVisible();
  await expect(saveAppearance).toBeEnabled();
  await page.unroute(`**/b/${updatedBusinessSlug}/appearance`);

  await page.reload();
  await expect(pagesAppearance.getByLabel("Primary color", { exact: true })).toHaveValue("#3A2140");

  await page.getByLabel("Current business").selectOption(secondBusinessSlug);
  await expect(page).toHaveURL(new RegExp(`/b/${secondBusinessSlug}/appearance$`));
  await expect(
    page.getByRole("heading", { name: "Enable a capability with an appearance foundation" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Review modules" }).click();
  const secondaryPages = page.getByRole("article", { name: "Pages" });
  await secondaryPages.getByRole("button", { name: "Enable capability" }).click();
  await expect(secondaryPages.getByText("Pages enabled.")).toBeVisible();
  await page.getByRole("link", { exact: true, name: "Appearance" }).click();
  await expect(pagesAppearance.getByRole("radio", { name: /Canvas/ })).toBeChecked();

  await page.getByLabel("Current business").selectOption(updatedBusinessSlug);
  await expect(page).toHaveURL(new RegExp(`/b/${updatedBusinessSlug}/appearance$`));
  await expect(pagesAppearance.getByRole("radio", { name: /Editorial/ })).toBeChecked();
  await pagesAppearance.getByRole("button", { name: "Reset theme" }).click();
  await expect(pagesAppearance.getByText("Reset every override")).toBeVisible();
  await pagesAppearance.getByRole("button", { name: "Confirm reset" }).click();
  await expect(page.getByText("Theme overrides reset to the template defaults.")).toBeVisible();
  await page.reload();
  await expect(pagesAppearance.getByLabel("Primary color", { exact: true })).toHaveValue("#4A253F");
  await expect(pagesAppearance.getByLabel("Corners", { exact: true })).toHaveValue("soft");

  await page.goto(`/b/${updatedBusinessSlug}`);
  const pagesCapability = page.locator(".overview-module-list > li").filter({ hasText: "Pages" });
  await expect(
    pagesCapability.getByText("Enabled · engine pending", { exact: true }),
  ).toBeVisible();
  await expect(
    pagesCapability.getByText(
      "Capability enabled. Its engine administration is not available yet.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(page.locator('a[href*="/pages"]')).toHaveCount(0);
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
  await expect(persistedAsset.getByText("Archived", { exact: true })).toBeVisible();

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

  await domain.getByRole("button", { name: "Verify ownership" }).click();
  const missingRecord = domain.getByText("The exact TXT value was not found.", { exact: false });
  const unavailableResolver = domain.getByText("DNS could not be checked reliably.", {
    exact: false,
  });
  await expect(missingRecord.or(unavailableResolver)).toBeVisible();
  await expect(
    domain.getByText(
      (await missingRecord.isVisible()) ? "Ownership: failed" : "Ownership: pending",
      { exact: true },
    ),
  ).toBeVisible();

  await page.getByLabel("Current business").selectOption(secondBusinessSlug);
  await expect(page).toHaveURL(new RegExp(`/b/${secondBusinessSlug}/domains$`));
  await expect(page.getByText(customHostname, { exact: true })).toHaveCount(0);
  await expect(page.getByText("No custom domains")).toBeVisible();

  await page.getByLabel("Current business").selectOption(updatedBusinessSlug);
  const restoredDomain = page.getByRole("article", { name: new RegExp(customHostname, "i") });
  await restoredDomain.getByRole("button", { name: "Disable domain" }).click();
  await restoredDomain.getByRole("button", { name: "Confirm disable" }).click();
  await expect(restoredDomain.getByText("Ownership: disabled", { exact: true })).toBeVisible();
});

test("assigns, connects, and makes a verified Restaurant hostname primary", async ({ page }) => {
  if (!primaryBusinessId) throw new Error("Primary business fixture is unavailable.");
  const { error } = await adminClient
    .schema("core")
    .from("business_domains")
    .insert({
      business_id: primaryBusinessId,
      hostname: routableHostname,
      status: "verified",
      verification_checked_at: new Date().toISOString(),
      verification_method: "dns_txt",
      verification_token: "e".repeat(64),
      verified_at: new Date().toISOString(),
    });
  if (error) throw error;

  await signIn(page, ownerEmail);
  await page.goto(`/b/${updatedBusinessSlug}/domains`);
  const domain = page.getByRole("article", { name: new RegExp(routableHostname, "i") });
  await domain.getByRole("button", { name: "Use for Restaurant" }).click();
  await expect(domain.getByText("Restaurant selected.", { exact: false })).toBeVisible();
  await domain.getByRole("button", { name: "Connect deployment" }).click();
  await expect(domain.getByText("Routing: live", { exact: true })).toBeVisible();
  await domain.getByRole("button", { name: "Make primary" }).click();
  await expect(domain.getByText("Primary Restaurant hostname")).toBeVisible();

  await domain.getByRole("button", { name: "Disconnect deployment" }).click();
  await domain.getByRole("button", { name: "Confirm disconnect" }).click();
  await expect(domain.getByText("Routing: disconnected", { exact: true })).toBeVisible();
  await expect(domain.getByText("Primary Restaurant hostname")).toHaveCount(0);
  await domain.getByRole("button", { name: "Connect deployment" }).click();
  await expect(domain.getByText("Routing: live", { exact: true })).toBeVisible();
});

test("presents provider routing failure safely and permits a trusted recheck", async ({ page }) => {
  const { error } = await adminClient
    .schema("core")
    .from("business_domains")
    .update({
      is_primary: false,
      routing_checked_at: new Date().toISOString(),
      routing_live_at: null,
      routing_status: "failed",
    })
    .eq("hostname", routableHostname);
  if (error) throw error;

  await signIn(page, ownerEmail);
  await page.goto(`/b/${updatedBusinessSlug}/domains`);
  const domain = page.getByRole("article", { name: new RegExp(routableHostname, "i") });
  await expect(domain.getByText("Routing: needs attention", { exact: true })).toBeVisible();
  await expect(domain.getByText("provider could not attest", { exact: false })).toBeVisible();
  await expect(domain).not.toContainText("DARB_VERCEL_API_TOKEN");
  await domain.getByRole("button", { name: "Check routing" }).click();
  await expect(domain.getByText("Routing: live", { exact: true })).toBeVisible();
});

test("keeps domain routing administration composed at the exact QA viewports", async ({ page }) => {
  const consoleIssues: string[] = [];
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) consoleIssues.push(message.text());
  });
  await signIn(page, ownerEmail);
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto(`/b/${updatedBusinessSlug}/domains`);
    await expect(page.getByRole("heading", { level: 1, name: "Domains" })).toBeVisible();
    const domain = page.getByRole("article", { name: new RegExp(routableHostname, "i") });
    await expect(domain.getByText("Routing: live", { exact: true })).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBe(dimensions.clientWidth);
  }
  await page.setViewportSize({ height: 844, width: 390 });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  const reflow = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(reflow.scrollWidth).toBe(reflow.clientWidth);
  expect(consoleIssues).toEqual([]);
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

test("manages real Restaurant menus, localization, variants, modifiers, media, and location state", async ({
  page,
}) => {
  if (!primaryBusinessId || !assignedLocationId) {
    throw new Error("Restaurant dependencies were not prepared.");
  }

  const { error: mediaError } = await adminClient
    .schema("core")
    .from("media_assets")
    .update({ status: "active" })
    .eq("business_id", primaryBusinessId)
    .eq("original_filename", mediaFilename);
  if (mediaError) throw mediaError;

  await signIn(page, ownerEmail);
  await page.goto(`/b/${updatedBusinessSlug}/restaurant`);
  await expect(page.getByRole("heading", { level: 1, name: "Restaurant" })).toBeVisible();
  await expect(page.getByText("Administration is live; public delivery is next")).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Restaurant content totals" }).locator("strong").first(),
  ).toHaveText("0");

  await page.getByLabel("Public Restaurant experience active").check();
  await page.getByRole("button", { name: "Save configuration" }).click();
  await expect(page.getByText("Restaurant public experience marked active.")).toBeVisible();

  await page.getByRole("link", { name: "Menus & items" }).click();
  const createMenu = page.locator("details").filter({ hasText: "Create a menu" }).first();
  await createMenu.locator("summary").click();
  await createMenu.getByLabel("Internal name").fill("All day menu");
  await createMenu.getByLabel("Publication").selectOption("published");
  await createMenu.getByLabel("Display position").fill("10");
  await createMenu.getByRole("button", { name: "Create menu" }).click();
  await expect(page).toHaveURL(/\/restaurant\/menus\/[0-9a-f-]+\?created=1$/);
  const menuUrl = page.url().replace(/\?created=1$/, "");

  const englishMenu = page.locator('form[lang="en"]').first();
  await englishMenu.getByLabel("Customer-facing name").fill("All day");
  await englishMenu.getByLabel("Description").fill("Available throughout the day.");
  await englishMenu.getByRole("button", { name: "Save EN" }).click();
  await expect(englishMenu.getByText("Localized content saved.")).toBeVisible();

  const addCategory = page.locator("details").filter({ hasText: "Add category" }).first();
  await addCategory.locator("summary").click();
  await addCategory.getByLabel("Internal name").fill("Coffee");
  await addCategory.getByLabel("Display position").fill("10");
  await addCategory.getByRole("button", { name: "Create category" }).click();
  await expect(addCategory.getByText("Category created.")).toBeVisible();

  const addItem = page.locator("details").filter({ hasText: "Add item" }).first();
  await addItem.locator("summary").click();
  await addItem.getByLabel("Internal name").fill("House espresso");
  await addItem.getByLabel("Category").selectOption({ label: "Coffee" });
  await addItem.getByLabel("Base price").fill("12.50");
  await addItem.getByLabel("Display position").fill("10");
  await addItem.getByRole("radio", { name: mediaFilename }).check();
  await addItem.getByRole("button", { name: "Create item" }).click();
  await expect(page).toHaveURL(/\/restaurant\/items\/[0-9a-f-]+\?created=1$/);
  const itemUrl = page.url().replace(/\?created=1$/, "");

  const englishItem = page.locator('form[lang="en"]').first();
  await englishItem.getByLabel("Customer-facing name").fill("House espresso");
  await englishItem.getByLabel("Description").fill("A balanced double espresso.");
  await englishItem.getByRole("button", { name: "Save EN" }).click();
  await expect(englishItem.getByText("Localized content saved.")).toBeVisible();

  const addVariant = page.locator("details").filter({ hasText: "Add variant" }).first();
  await addVariant.locator("summary").click();
  await addVariant.getByLabel("Variant name").fill("Double");
  await addVariant.getByLabel("Absolute price").fill("16.00");
  await addVariant.getByLabel("Display position").fill("10");
  await addVariant.getByRole("button", { name: "Add variant" }).click();
  await expect(addVariant.getByText("Variant created.")).toBeVisible();

  await page.getByRole("link", { name: "Modifier library" }).click();
  const createGroup = page.locator("details").filter({ hasText: "Create modifier group" }).first();
  await createGroup.locator("summary").click();
  await createGroup.getByLabel("Internal group name").fill("Milk choice");
  await createGroup.getByRole("button", { name: "Create modifier group" }).click();
  await expect(createGroup.getByText("Modifier group created.")).toBeVisible();

  const groupCard = page.locator("li").filter({ hasText: "Milk choice" }).first();
  await groupCard.getByText("Edit group, translations, and options").click();
  const addOption = groupCard.locator("details").filter({ hasText: "Add option" }).first();
  await addOption.getByText("Add option", { exact: true }).click();
  await addOption.getByLabel("Option name").fill("Oat milk");
  await addOption.getByLabel("Price add-on").fill("2.00");
  await addOption.getByLabel("Display position").fill("10");
  await addOption.getByRole("button", { name: "Add modifier option" }).click();
  await expect(addOption.getByText("Modifier option created.")).toBeVisible();

  await page.goto(itemUrl);
  const assignmentForm = page
    .locator("form")
    .filter({ has: page.getByRole("button", { name: "Assign modifier group" }) });
  await assignmentForm.locator('select[name="modifierGroupId"]').selectOption({
    label: "Milk choice",
  });
  await assignmentForm.getByLabel("Minimum selections").fill("0");
  await assignmentForm.getByLabel("Maximum selections").fill("1");
  await assignmentForm.getByRole("button", { name: "Assign modifier group" }).click();
  await expect(page.getByText("Milk choice", { exact: true }).first()).toBeVisible();

  await page.getByLabel(`${assignedLocationName} Updated availability`).selectOption("sold_out");
  const locationForm = page
    .locator("form")
    .filter({ has: page.getByLabel(`${assignedLocationName} Updated availability`) });
  await locationForm.getByRole("button", { name: "Save" }).click();
  await expect(locationForm.getByText("Location availability saved.")).toBeVisible();

  await page.reload();
  await expect(page.getByLabel(`${assignedLocationName} Updated availability`)).toHaveValue(
    "sold_out",
  );
  await expect(page.getByText("Milk choice", { exact: true })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  const archiveItem = page.getByRole("button", { name: "Archive item", exact: true }).first();
  await archiveItem.click();
  const confirmation = page.getByRole("dialog", { name: "Archive this item?" });
  await expect(confirmation).toBeVisible();
  const closeConfirmation = confirmation.getByRole("button", { name: "Close confirmation" });
  await expect
    .poll(async () => (await closeConfirmation.boundingBox())?.width ?? Number.POSITIVE_INFINITY)
    .toBeLessThanOrEqual(44);
  await confirmation.getByRole("button", { name: "Cancel" }).click();
  await expect(archiveItem).toBeFocused();

  await page.getByLabel("Current business").selectOption(secondBusinessSlug);
  await expect(page).toHaveURL(new RegExp(`/b/${secondBusinessSlug}$`));
  await expect(page.getByText("House espresso", { exact: true })).toHaveCount(0);
  await page.goto(menuUrl);
  await expect(page.getByRole("heading", { level: 1, name: "All day menu" })).toBeVisible();
});

test("enforces read-only business access and exact location scope in the UI", async ({ page }) => {
  if (!assignedLocationId || !otherLocationId) {
    throw new Error("Location scope fixtures were not prepared.");
  }

  await signIn(page, scopedEmail);
  await expect(page).toHaveURL(new RegExp(`/b/${updatedBusinessSlug}$`));

  await expect(page.getByText("Your access is scoped", { exact: false })).toBeVisible();
  await expect(page.getByRole("link", { exact: true, name: "Media" })).toHaveCount(0);
  await expect(page.getByRole("link", { exact: true, name: "Domains" })).toHaveCount(0);
  await expect(page.getByRole("link", { exact: true, name: "Locations" })).toBeVisible();
  await expect(page.getByRole("link", { exact: true, name: "Restaurant" })).toBeVisible();

  await page.getByRole("link", { exact: true, name: "Restaurant" }).click();
  await expect(page.getByText("Restaurant is read-only.")).toBeVisible();
  await expect(page.getByLabel("Public Restaurant experience active")).toBeDisabled();
  await expect(page.getByRole("button", { name: "Save configuration" })).toHaveCount(0);

  await page.getByRole("link", { exact: true, name: "Business settings" }).click();
  await expect(page.getByText("The business.manage permission is required")).toBeVisible();
  await expect(page.getByLabel("Display name")).toBeDisabled();

  await page.getByRole("link", { exact: true, name: "Modules" }).click();
  await expect(page.getByText("Module state is read-only.")).toBeVisible();
  await expect(page.getByRole("article", { name: "Restaurant" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Enable capability" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Disable capability" })).toHaveCount(0);

  await page.getByRole("link", { exact: true, name: "Appearance" }).click();
  await expect(page.getByText("Appearance is read-only.")).toBeVisible();
  await expect(page.getByRole("radio", { name: /Editorial/ })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Save appearance" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Reset theme" })).toHaveCount(0);

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
  await expect(page.getByRole("button", { name: "Use for Restaurant" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Connect deployment" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Check routing" })).toHaveCount(0);

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
  const archiveTrigger = page.getByRole("button", { name: "Archive location" });
  await archiveTrigger.click();
  await expect(page.getByRole("dialog", { name: "Archive this location?" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Archive this location?" })).not.toBeVisible();
  await expect(archiveTrigger).toBeFocused();
  await archiveTrigger.click();
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

  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);

  const openNavigation = page.getByRole("button", { name: "Open navigation" });
  await expect(openNavigation).toBeVisible();
  await openNavigation.click();
  await expect(page.getByRole("button", { name: "Close navigation" }).last()).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("button", { name: "Sign out" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Close navigation" }).last()).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(openNavigation).toBeFocused();

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect
    .poll(() =>
      page
        .locator(".admin-sidebar")
        .evaluate((element) => Number.parseFloat(getComputedStyle(element).transitionDuration)),
    )
    .toBeLessThanOrEqual(0.00001);

  await page.evaluate(() => {
    document.documentElement.dir = "rtl";
  });
  await openNavigation.click();
  await expect
    .poll(async () => {
      const drawerBox = await page.locator(".admin-sidebar").boundingBox();
      return drawerBox ? drawerBox.x + drawerBox.width : 0;
    })
    .toBeGreaterThan(380);
  await expect(page.getByRole("navigation", { name: "Business administration" })).toBeVisible();
  await page.getByLabel("Current business").focus();
  await page.getByLabel("Current business").selectOption(secondBusinessSlug);
  await expect(page).toHaveURL(new RegExp(`/b/${secondBusinessSlug}$`));

  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("link", { exact: true, name: "Media" })).toBeVisible();
  await expect(page.getByRole("link", { exact: true, name: "Domains" })).toBeVisible();
  await expect(page.getByRole("link", { exact: true, name: "Languages" })).toBeVisible();
  await expect(page.getByRole("link", { exact: true, name: "Appearance" })).toBeVisible();
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

test("denies platform routes to tenant administrators", async ({ page }) => {
  await signIn(page, ownerEmail);
  await page.goto("/platform");

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("link", { name: "Darb Platform Administration" })).toHaveCount(0);
});

test("operates the separate platform context and enters a tenant as the real operator", async ({
  page,
}) => {
  if (!platformBusinessId) throw new Error("The platform inspection business was not prepared.");

  await signIn(page, platformEmail);
  await expect(page.getByRole("heading", { name: "Choose your operating context." })).toBeVisible();
  await page.getByRole("link", { name: /Darb Platform Administration/ }).click();

  await expect(page).toHaveURL(/\/platform$/);
  await expect(page.getByRole("heading", { level: 1, name: "Platform overview" })).toBeVisible();
  await expect(page.getByText("Darb Platform", { exact: true }).first()).toBeVisible();
  await expect(page.locator('[data-admin-brand="platform"]')).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Platform administration" })).toBeVisible();

  await page.getByRole("link", { exact: true, name: "Businesses" }).click();
  await page.getByLabel("Name or slug").fill(platformBusinessSlug);
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page.locator("strong", { hasText: platformBusinessName })).toBeVisible();
  await page.getByRole("link", { name: `Inspect ${platformBusinessName}` }).click();
  await expect(page).toHaveURL(new RegExp(`/platform/businesses/${platformBusinessId}$`));
  await expect(page.getByRole("heading", { level: 1, name: platformBusinessName })).toBeVisible();

  await page.getByRole("link", { name: "Open business workspace" }).click();
  await expect(page).toHaveURL(new RegExp(`/b/${platformBusinessSlug}$`));
  await expect(page.getByText("Platform access", { exact: true })).toBeVisible();
  await expect(page.getByText("operating this tenant as yourself", { exact: false })).toBeVisible();
  await page.getByRole("link", { exact: true, name: "Platform Admin" }).click();
  await expect(page).toHaveURL(/\/platform$/);

  for (const destination of ["Users", "Modules", "Templates", "Domains", "Audit"] as const) {
    await page.getByRole("link", { exact: true, name: destination }).click();
    await expect(
      page.getByRole("heading", { exact: true, level: 1, name: destination }),
    ).toBeVisible();
  }
});

test("keeps the platform control plane responsive and keyboard-safe at exact QA viewports", async ({
  page,
}) => {
  const consoleProblems: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      consoleProblems.push(message.text());
    }
  });

  await signIn(page, platformEmail);
  await page.goto("/platform/businesses");

  for (const viewport of [
    { height: 844, width: 390 },
    { height: 1024, width: 768 },
    { height: 900, width: 1440 },
    { height: 1080, width: 1920 },
  ]) {
    await page.setViewportSize(viewport);
    const layout = await page.evaluate(() => ({
      containers: [".admin-workspace", ".core-admin-content", ".platform-table-shell"].map(
        (selector) => {
          const element = document.querySelector<HTMLElement>(selector);
          const rect = element?.getBoundingClientRect();
          return {
            clientWidth: element?.clientWidth,
            overflowX: element ? getComputedStyle(element).overflowX : null,
            rect: rect ? { left: rect.left, right: rect.right, width: rect.width } : null,
            scrollWidth: element?.scrollWidth,
            selector,
          };
        },
      ),
      documentWidth: document.documentElement.scrollWidth,
      offenders: [...document.querySelectorAll<HTMLElement>("body *")]
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            className: element.className,
            left: rect.left,
            right: rect.right,
            tag: element.tagName,
          };
        })
        .filter((item) => item.right > window.innerWidth + 1)
        .slice(0, 8),
    }));
    expect(
      layout.documentWidth,
      JSON.stringify({ containers: layout.containers, offenders: layout.offenders }),
    ).toBeLessThanOrEqual(viewport.width + 1);

    const openNavigation = page.getByRole("button", { name: "Open platform navigation" });
    if (viewport.width <= 1024) {
      await expect(openNavigation).toBeVisible();
      await openNavigation.click();
      await expect(page.locator(".platform-sidebar .admin-sidebar__close")).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(openNavigation).toBeFocused();
    } else {
      await expect(openNavigation).not.toBeVisible();
      await expect(page.getByRole("navigation", { name: "Platform administration" })).toBeVisible();
    }
  }

  await page.setViewportSize({ height: 844, width: 390 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const reducedMotionNavigation = page.getByRole("button", {
    name: "Open platform navigation",
  });
  await reducedMotionNavigation.click();
  await expect(page.locator(".platform-sidebar .admin-sidebar__close")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(reducedMotionNavigation).toBeFocused();
  await expect
    .poll(() =>
      page
        .locator(".admin-sidebar")
        .evaluate((element) => Number.parseFloat(getComputedStyle(element).transitionDuration)),
    )
    .toBeLessThanOrEqual(0.00001);

  await page.locator("html").evaluate((element) => {
    element.setAttribute("dir", "rtl");
  });
  await page.getByRole("button", { name: "Open platform navigation" }).click();
  await expect
    .poll(async () => {
      const drawer = await page.locator(".platform-sidebar").boundingBox();
      return drawer ? drawer.x + drawer.width : 0;
    })
    .toBeGreaterThan(380);
  await page.keyboard.press("Escape");

  await page.locator("html").evaluate((element) => {
    element.setAttribute("dir", "ltr");
    element.style.fontSize = "200%";
  });
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);
  await page.locator("html").evaluate((element) => {
    element.style.removeProperty("font-size");
  });

  expect(consoleProblems).toEqual([]);
});

test("applies audited platform lifecycle actions with deliberate confirmation", async ({
  page,
}) => {
  if (!platformBusinessId) throw new Error("The platform inspection business was not prepared.");

  await signIn(page, platformEmail);
  await page.goto(`/platform/businesses/${platformBusinessId}`);

  const suspend = page.getByRole("button", { name: "Suspend business", exact: true });
  await suspend.click();
  const confirmation = page.getByRole("dialog", { name: "Suspend business" });
  await expect(confirmation).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(confirmation).not.toBeVisible();
  await expect(suspend).toBeFocused();

  await suspend.click();
  await confirmation.getByRole("button", { name: "Suspend business", exact: true }).click();
  await expect(page.getByText("Business suspended by the platform.")).toBeVisible();
  await expect(page.getByText("Suspended", { exact: true }).first()).toBeVisible();

  const reactivate = page.getByRole("button", { name: "Reactivate business", exact: true });
  await reactivate.click();
  const restoreConfirmation = page.getByRole("dialog", { name: "Reactivate business" });
  await restoreConfirmation
    .getByRole("button", { name: "Reactivate business", exact: true })
    .click();
  await expect(page.getByText("Business reactivated.")).toBeVisible();
  await expect(page.getByText("Active", { exact: true }).first()).toBeVisible();

  await page.getByRole("link", { exact: true, name: "Audit" }).click();
  await page.getByLabel("Action", { exact: true }).fill("platform.business_");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page.getByText("platform.business_suspended", { exact: true })).toBeVisible();
  await expect(page.getByText("platform.business_reactivated", { exact: true })).toBeVisible();
});

test("presents suspended and archived lifecycle restrictions consistently", async ({ page }) => {
  if (!primaryBusinessId) throw new Error("The primary business fixture was not prepared.");

  await signIn(page, ownerEmail);

  const { error: suspendError } = await adminClient
    .schema("core")
    .from("businesses")
    .update({ status: "suspended" })
    .eq("id", primaryBusinessId);
  if (suspendError) throw suspendError;

  await page.goto(`/b/${updatedBusinessSlug}`);
  await expect(page.getByText("Suspended by Darb", { exact: true })).toBeVisible();
  await expect(
    page.getByText("business users cannot reactivate it", { exact: false }),
  ).toBeVisible();

  const { error: archiveError } = await adminClient
    .schema("core")
    .from("businesses")
    .update({ status: "archived" })
    .eq("id", primaryBusinessId);
  if (archiveError) throw archiveError;

  await page.reload();
  await expect(page.getByText("Archived · read-only", { exact: true })).toBeVisible();
  await expect(page.getByText("retained for history", { exact: false })).toBeVisible();

  const { error: restoreError } = await adminClient
    .schema("core")
    .from("businesses")
    .update({ status: "active" })
    .eq("id", primaryBusinessId);
  if (restoreError) throw restoreError;
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
  await page.getByLabel("Password", { exact: true }).fill(password);
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
  if (!ownerUserId || !scopedUserId || !platformUserId || !primaryBusinessId) {
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

async function provisionPlatformBusinessFixture(): Promise<void> {
  if (!platformUserId) throw new Error("The platform operator fixture must exist first.");

  const { data: business, error } = await adminClient
    .schema("core")
    .from("businesses")
    .insert({
      created_by: platformUserId,
      default_locale: "en",
      display_name: platformBusinessName,
      slug: platformBusinessSlug,
    })
    .select("id")
    .single();

  if (error || !business) {
    throw error ?? new Error("Unable to create the platform inspection fixture.");
  }
  platformBusinessId = business.id;
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
      {
        business_id: primaryBusinessId,
        granted_by: ownerUserId,
        membership_id: membership.id,
        permission_key: "restaurant.read",
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

function promoteLocalSuperAdmin(userId: string): void {
  const databaseUrl = requiredEnvironment("SUPABASE_TEST_DATABASE_URL");
  const hostname = new URL(databaseUrl).hostname;

  if (!["127.0.0.1", "localhost", "[::1]"].includes(hostname)) {
    throw new Error("Super-admin E2E promotion is restricted to a local Supabase database.");
  }

  const promotion = spawnSync(
    "psql",
    [databaseUrl, "--no-psqlrc", "--set", "ON_ERROR_STOP=1", "--set", `fixture_user_id=${userId}`],
    {
      encoding: "utf8",
      input: `
        insert into private.super_admins (user_id, granted_by, reason)
        values (
          :'fixture_user_id'::uuid,
          :'fixture_user_id'::uuid,
          'Local-only Phase 14 browser fixture'
        )
        on conflict (user_id) do update set revoked_at = null;
      `,
    },
  );

  if (promotion.status !== 0) {
    throw new Error(promotion.stderr || promotion.stdout || "Unable to promote the E2E operator.");
  }
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
        delete from restaurant.menus
          where business_id in (
            select id from core.businesses where slug like :'fixture_prefix' || '%'
          );
        delete from restaurant.modifier_groups
          where business_id in (
            select id from core.businesses where slug like :'fixture_prefix' || '%'
          );
        delete from restaurant.configurations
          where business_id in (
            select id from core.businesses where slug like :'fixture_prefix' || '%'
          );
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
