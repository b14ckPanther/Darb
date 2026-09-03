import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";

import { expect, test } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

test.describe.configure({ mode: "serial" });

const runId = randomUUID().slice(0, 8);
const slug = `darb-public-${runId}`;
const gatedSlug = `darb-gated-${runId}`;
const businessId = randomUUID();
const gatedBusinessId = randomUUID();
const locationOneId = randomUUID();
const locationTwoId = randomUUID();
const mediaId = randomUUID();
const menuId = randomUUID();
const draftMenuId = randomUUID();
const categoryId = randomUUID();
const hiddenCategoryId = randomUUID();
const itemId = randomUUID();
const soldOutItemId = randomUUID();
const hiddenItemId = randomUUID();
const variantId = randomUUID();
const modifierGroupId = randomUUID();
const modifierId = randomUUID();
const mediaPath = `${businessId}/${mediaId}/public-menu.png`;
const publicBusinessName = `مطبخ درب ${runId}`;
const customHost = `${slug}.localhost`;
const alternateHost = `alternate-${runId}.localhost`;
const provisioningHost = `provisioning-${runId}.localhost`;
const failedRoutingHost = `failed-routing-${runId}.localhost`;
const pendingHost = `pending-${runId}.localhost`;
const failedOwnershipHost = `failed-ownership-${runId}.localhost`;
const disabledHost = `disabled-${runId}.localhost`;
const unsupportedHost = `pages-${runId}.localhost`;

let adminClient: SupabaseClient;

test.beforeAll(async () => {
  assertLocalEnvironment();
  adminClient = createClient(
    requiredEnvironment("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnvironment("SUPABASE_SECRET_KEY"),
    { auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false } },
  );

  const image = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  );
  const { error: uploadError } = await adminClient.storage
    .from("tenant-media-images")
    .upload(mediaPath, image, { contentType: "image/png", upsert: true });
  if (uploadError) throw uploadError;

  runFixtureSql(`
    begin;
    insert into core.businesses (id, slug, display_name, default_locale, currency_code, timezone)
    values
      ('${businessId}', '${slug}', '${publicBusinessName}', 'ar', 'ILS', 'Asia/Jerusalem'),
      ('${gatedBusinessId}', '${gatedSlug}', 'Gated Restaurant', 'en', 'ILS', 'Asia/Jerusalem');

    insert into core.business_locales (business_id, locale_code, is_enabled) values
      ('${businessId}', 'ar', true), ('${businessId}', 'he', true), ('${businessId}', 'en', true),
      ('${gatedBusinessId}', 'en', true)
    on conflict (business_id, locale_code) do update set is_enabled = excluded.is_enabled;

    insert into core.business_modules (business_id, module_key, is_enabled) values
      ('${businessId}', 'restaurant', true), ('${gatedBusinessId}', 'restaurant', false);
    insert into restaurant.configurations (business_id, is_publicly_active) values
      ('${businessId}', true), ('${gatedBusinessId}', true);

    insert into core.locations (id, business_id, display_name, address_line, locality, status) values
      ('${locationOneId}', '${businessId}', 'البلدة القديمة', 'شارع السوق 12', 'الناصرة', 'active'),
      ('${locationTwoId}', '${businessId}', 'فرع الحديقة', 'طريق الحديقة 7', 'حيفا', 'active');

    insert into core.media_assets (
      id, business_id, storage_bucket, storage_path, media_kind, mime_type,
      byte_size, width, height, alt_text, original_filename, status
    ) values (
      '${mediaId}', '${businessId}', 'tenant-media-images', '${mediaPath}', 'image',
      'image/png', 68, 1, 1, 'طبق مميز من مطبخ درب', 'public-menu.png', 'active'
    );

    insert into core.business_visual_settings (
      business_id, module_key, template_key, theme_overrides
    ) values (
      '${businessId}', 'restaurant', 'restaurant-signature',
      '{"colors":{"primary":"#263B32","accent":"#B8633F"},"shape":{"radius":"bold"}}'::jsonb
    );

    insert into core.business_domains (
      business_id, hostname, status, verification_token, verification_method,
      verification_checked_at, verified_at, target_module_key, routing_status,
      routing_checked_at, routing_live_at, is_primary
    ) values
      ('${businessId}', '${customHost}', 'verified', repeat('a', 64), 'dns_txt', now(), now(), 'restaurant', 'live', now(), now(), true),
      ('${businessId}', '${alternateHost}', 'verified', repeat('b', 64), 'dns_txt', now(), now(), 'restaurant', 'live', now(), now(), false),
      ('${businessId}', '${provisioningHost}', 'verified', repeat('c', 64), 'dns_txt', now(), now(), 'restaurant', 'provisioning', now(), null, false),
      ('${businessId}', '${failedRoutingHost}', 'verified', repeat('e', 64), 'dns_txt', now(), now(), 'restaurant', 'failed', now(), null, false),
      ('${businessId}', '${unsupportedHost}', 'verified', repeat('d', 64), 'dns_txt', now(), now(), 'pages', 'live', now(), now(), false);

    insert into core.business_domains (
      business_id, hostname, status, verification_token, verification_method,
      verification_checked_at, target_module_key, routing_status, routing_checked_at
    ) values
      ('${businessId}', '${pendingHost}', 'pending', repeat('f', 64), 'dns_txt', null, null, 'unconfigured', null),
      ('${businessId}', '${failedOwnershipHost}', 'failed', repeat('1', 64), 'dns_txt', now(), null, 'unconfigured', null),
      ('${businessId}', '${disabledHost}', 'disabled', repeat('2', 64), 'dns_txt', now(), 'restaurant', 'disconnected', now());

    insert into restaurant.menus (
      id, business_id, internal_name, publication_status, lifecycle_status, display_order
    ) values
      ('${menuId}', '${businessId}', 'internal-main-menu', 'published', 'active', 10),
      ('${draftMenuId}', '${businessId}', 'secret-draft-menu', 'draft', 'active', 20);

    insert into restaurant.menu_translations (business_id, menu_id, locale_code, name, description) values
      ('${businessId}', '${menuId}', 'ar', 'قائمة الموسم', $$وصفات موسمية بهوية محلية وتفاصيل تُحضّر بعناية كل يوم.$$),
      ('${businessId}', '${menuId}', 'he', 'תפריט עונתי', $$מנות עונתיות שמוכנות בקפידה בכל יום.$$),
      ('${businessId}', '${menuId}', 'en', 'Seasonal menu', $$Seasonal recipes with a local point of view, prepared thoughtfully each day.$$),
      ('${businessId}', '${draftMenuId}', 'en', 'Secret draft', 'Must never render');

    insert into restaurant.categories (
      id, business_id, menu_id, internal_name, image_media_asset_id, is_visible, lifecycle_status, display_order
    ) values
      ('${categoryId}', '${businessId}', '${menuId}', 'internal-mains', '${mediaId}', true, 'active', 10),
      ('${hiddenCategoryId}', '${businessId}', '${menuId}', 'secret-hidden-category', null, false, 'active', 20);

    insert into restaurant.category_translations (business_id, category_id, locale_code, name, description) values
      ('${businessId}', '${categoryId}', 'ar', 'أطباق البيت', 'أطباق سخية للمشاركة أو للاستمتاع بها على مهل.'),
      ('${businessId}', '${categoryId}', 'he', 'מנות הבית', 'מנות נדיבות לחלוקה או לארוחה רגועה.'),
      ('${businessId}', '${categoryId}', 'en', 'From our kitchen', 'Generous plates for sharing or enjoying slowly.'),
      ('${businessId}', '${hiddenCategoryId}', 'en', 'Hidden category', 'Must never render');

    insert into restaurant.items (
      id, business_id, menu_id, category_id, internal_name, base_price_minor,
      image_media_asset_id, is_visible, availability_status, lifecycle_status, display_order
    ) values
      ('${itemId}', '${businessId}', '${menuId}', '${categoryId}', 'internal-signature', 4590, '${mediaId}', true, 'available', 'active', 10),
      ('${soldOutItemId}', '${businessId}', '${menuId}', '${categoryId}', 'internal-celebration', 999999999, null, true, 'sold_out', 'active', 20),
      ('${hiddenItemId}', '${businessId}', '${menuId}', '${categoryId}', 'secret-hidden-item', 100, null, false, 'available', 'active', 30);

    insert into restaurant.item_translations (business_id, item_id, locale_code, name, description) values
      ('${businessId}', '${itemId}', 'ar', 'طبق درب المميز طويل الاسم المصمم لاختبار التفاف النص بأمان', $$خضار مشوية ببطء مع صلصة موسمية، أعشاب طازجة، ولمسة حمضية متوازنة. وصف طويل يختبر القراءة والتخطيط دون قص المحتوى المهم.$$),
      ('${businessId}', '${itemId}', 'he', 'מנת הדרך המיוחדת עם שם ארוך לבדיקת גלישת טקסט', $$ירקות קלויים באיטיות עם רוטב עונתי, עשבי תיבול טריים וחמיצות מאוזנת.$$),
      ('${businessId}', '${itemId}', 'en', 'Darb signature plate with an intentionally long wrapping name', $$Slow-roasted vegetables, a seasonal sauce, fresh herbs and a bright finish. Long-form copy proves that the composition remains readable without hiding meaningful content.$$),
      ('${businessId}', '${soldOutItemId}', 'ar', 'وليمة المناسبات', 'طبق كبير متاح مجددًا قريبًا.'),
      ('${businessId}', '${soldOutItemId}', 'he', 'מגש החגיגה', 'מנה גדולה שתחזור בקרוב.'),
      ('${businessId}', '${soldOutItemId}', 'en', 'Celebration platter', 'A generous plate returning soon.'),
      ('${businessId}', '${hiddenItemId}', 'en', 'Hidden item', 'Must never render');

    insert into restaurant.item_variants (
      id, business_id, item_id, internal_name, price_minor, is_visible,
      availability_status, lifecycle_status, display_order
    ) values ('${variantId}', '${businessId}', '${itemId}', 'internal-family', 7890, true, 'available', 'active', 10);
    insert into restaurant.item_variant_translations (business_id, item_variant_id, locale_code, name) values
      ('${businessId}', '${variantId}', 'ar', 'حجم عائلي'),
      ('${businessId}', '${variantId}', 'he', 'גודל משפחתי'),
      ('${businessId}', '${variantId}', 'en', 'Family size');

    insert into restaurant.modifier_groups (
      id, business_id, internal_name, is_visible, lifecycle_status
    ) values ('${modifierGroupId}', '${businessId}', 'internal-sauces', true, 'active');
    insert into restaurant.modifier_group_translations (
      business_id, modifier_group_id, locale_code, name, description
    ) values
      ('${businessId}', '${modifierGroupId}', 'ar', 'اختر الصلصة', 'اختيار واحد حسب الرغبة.'),
      ('${businessId}', '${modifierGroupId}', 'he', 'בחירת רוטב', 'בחירה אחת לפי הטעם.'),
      ('${businessId}', '${modifierGroupId}', 'en', 'Choose a sauce', 'One choice, if you like.');
    insert into restaurant.modifiers (
      id, business_id, modifier_group_id, internal_name, price_delta_minor,
      is_visible, availability_status, lifecycle_status, display_order
    ) values ('${modifierId}', '${businessId}', '${modifierGroupId}', 'internal-tahini', 350, true, 'available', 'active', 10);
    insert into restaurant.modifier_translations (business_id, modifier_id, locale_code, name) values
      ('${businessId}', '${modifierId}', 'ar', 'طحينة أعشاب'),
      ('${businessId}', '${modifierId}', 'he', 'טחינה ירוקה'),
      ('${businessId}', '${modifierId}', 'en', 'Herb tahini');
    insert into restaurant.item_modifier_groups (
      business_id, item_id, modifier_group_id, minimum_selections, maximum_selections, display_order
    ) values ('${businessId}', '${itemId}', '${modifierGroupId}', 0, 1, 10);
    insert into restaurant.item_location_availability (
      business_id, item_id, location_id, availability_status
    ) values ('${businessId}', '${itemId}', '${locationTwoId}', 'sold_out');
    commit;
  `);
});

test.afterAll(async () => {
  await adminClient.storage.from("tenant-media-images").remove([mediaPath]);
  runFixtureSql(`
    begin;
    delete from restaurant.menus where business_id in ('${businessId}', '${gatedBusinessId}');
    delete from restaurant.modifier_groups where business_id in ('${businessId}', '${gatedBusinessId}');
    delete from restaurant.configurations where business_id in ('${businessId}', '${gatedBusinessId}');
    delete from core.businesses where id in ('${businessId}', '${gatedBusinessId}');
    commit;
  `);
});

test("uses current Darb identity only on the Darb-owned Restaurant landing", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await expect(page.locator('[data-darb-brand="bilingual"]')).toBeVisible();
  await expect(page.locator('[data-darb-mark="current"]')).toBeVisible();
  await expect(page.getByRole("link", { name: "Visit Darb" })).toHaveAttribute(
    "href",
    "https://darb.co.il",
  );

  const icon = await request.get("/icon.png");
  expect(icon.ok()).toBe(true);
  expect(icon.headers()["content-type"]).toContain("image/png");
});

test("renders the anonymous public projection with media and no admin metadata", async ({
  page,
}) => {
  await page.goto(`/${slug}`);
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { level: 1, name: publicBusinessName })).toBeVisible();
  await expect(page.locator('[data-darb-brand="bilingual"]')).toHaveCount(0);
  await expect(page.locator(".brand-mark")).toContainText(publicBusinessName);
  await expect
    .poll(() =>
      page
        .getByRole("heading", { level: 1, name: publicBusinessName })
        .evaluate((element) => getComputedStyle(element).fontFamily),
    )
    .toContain("Cairo");
  await expect(page.getByRole("heading", { name: "قائمة الموسم" })).toBeVisible();
  await expect(page.getByAltText("طبق مميز من مطبخ درب").first()).toBeVisible();
  await expect(page.getByText("secret-draft-menu")).toHaveCount(0);
  await expect(page.getByText("Hidden item")).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText("internal-signature");
});

test("switches between Arabic, Hebrew, and English with correct direction", async ({ page }) => {
  await page.goto(`/${slug}`);
  await page.getByLabel("اللغة").click();
  await page.getByRole("link", { name: "English" }).click();
  await expect(page).toHaveURL(new RegExp(`/${slug}/en$`));
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.getByRole("heading", { name: "Seasonal menu" })).toBeVisible();

  await page.getByLabel("Language").click();
  await page.getByRole("link", { name: "עברית" }).click();
  await expect(page).toHaveURL(new RegExp(`/${slug}/he$`));
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { name: "תפריט עונתי" })).toBeVisible();
});

test("opens item detail with variants and modifiers, closes with Escape, and restores focus", async ({
  page,
}) => {
  await page.goto(`/${slug}/en`);
  const trigger = page.getByRole("button", { name: /View details: Darb signature/ });
  await trigger.focus();
  await trigger.press("Enter");
  const dialog = page.getByRole("dialog", { name: /Darb signature plate/ });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Family size")).toBeVisible();
  await expect(dialog.getByText("Choose a sauce")).toBeVisible();
  await expect(dialog.getByText("Herb tahini")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("keeps sold-out content visible and applies a selected location override", async ({
  page,
}) => {
  await page.goto(`/${slug}/en`);
  await expect(page.getByRole("heading", { level: 4, name: "Celebration platter" })).toBeVisible();
  await expect(page.getByText("Sold out").first()).toBeVisible();

  await page.locator("summary").filter({ hasText: "All locations" }).click();
  await page.getByRole("link", { name: /فرع الحديقة/ }).click();
  await expect(page).toHaveURL(new RegExp(`location=${locationTwoId}`));
  const signature = page.getByRole("button", { name: /View details: Darb signature/ });
  await expect(signature.getByText("Sold out")).toBeVisible();
});

test("emits canonical metadata and foundational Restaurant JSON-LD", async ({ page }) => {
  await page.goto(`/${slug}/en`);
  await expect(page).toHaveTitle(`${publicBusinessName} · Seasonal menu`);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    `https://${customHost}/en`,
  );
  await expect(page.locator('link[rel="alternate"][hreflang="ar-IL"]')).toHaveAttribute(
    "href",
    `https://${customHost}/`,
  );
  await expect(page.locator('link[rel="alternate"][hreflang="he-IL"]')).toHaveAttribute(
    "href",
    `https://${customHost}/he`,
  );
  await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute(
    "href",
    `https://${customHost}/`,
  );
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    "content",
    `https://${customHost}/en`,
  );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary_large_image",
  );
  const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
  expect(jsonLd).toContain('"@type":"Restaurant"');
  expect(jsonLd).toContain('"price":"45.90"');
  expect(jsonLd).not.toContain("internal-signature");
  expect(jsonLd).not.toContain("secret-draft-menu");

  await page.goto(`/${slug}/en?location=${locationOneId}`);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    `https://${customHost}/en`,
  );
});

test("publishes only canonical Restaurant discovery and fail-closed robots", async ({
  request,
}) => {
  const [platformSitemap, customSitemap, alternateSitemap, customRobots, invalidRobots, health] =
    await Promise.all([
      request.get("http://localhost:3002/sitemap.xml"),
      request.get(`http://${customHost}:3002/sitemap.xml`),
      request.get(`http://${alternateHost}:3002/sitemap.xml`),
      request.get(`http://${customHost}:3002/robots.txt`),
      request.get(`http://unknown-${runId}.localhost:3002/robots.txt`),
      request.get("http://localhost:3002/health"),
    ]);
  expect(await platformSitemap.text()).not.toContain(slug);
  const canonicalSitemap = await customSitemap.text();
  expect(canonicalSitemap).toContain(`https://${customHost}/en`);
  expect(canonicalSitemap).toContain(`hreflang=\"x-default\"`);
  expect(await alternateSitemap.text()).not.toContain(slug);
  expect(await customRobots.text()).toContain(`Sitemap: https://${customHost}/sitemap.xml`);
  expect(await invalidRobots.text()).toContain("Disallow: /");
  expect(await health.json()).toEqual({ service: "darb-rest", status: "ok" });
  expect(health.headers()["cache-control"]).toContain("no-store");
});

test("serves hardened headers and rejects forwarded-host canonical poisoning", async ({
  request,
}) => {
  const response = await request.get(`http://localhost:3002/${slug}/en`);
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response.headers()["x-frame-options"]).toBe("DENY");
  expect(response.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(response.headers()["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);

  const poisoned = await request.get(`http://127.0.0.1:3002/${slug}/en`, {
    headers: { host: "rest.darb.co.il", "x-forwarded-host": "attacker.example" },
  });
  expect(await poisoned.text()).not.toContain(publicBusinessName);
});

test("serves the same publication on an exact live custom host without a tenant slug", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto(`http://${customHost}:3002/en`);
  await expect(page).toHaveURL(new RegExp(`^http://${customHost}:3002/en$`));
  await expect(page.getByRole("heading", { level: 1, name: publicBusinessName })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    `https://${customHost}/en`,
  );
  await expect(page.locator("body")).not.toContainText(slug);
  expect(errors).toEqual([]);
});

test("keeps custom locale and location links on the same host", async ({ page }) => {
  await page.goto(`http://${customHost}:3002/`);
  await page.getByLabel("اللغة").click();
  await page.getByRole("link", { name: "English" }).click();
  await expect(page).toHaveURL(new RegExp(`^http://${customHost}:3002/en$`));
  await page.locator("summary").filter({ hasText: "All locations" }).click();
  await page.getByRole("link", { name: /فرع الحديقة/ }).click();
  await expect(page).toHaveURL(
    new RegExp(`^http://${customHost}:3002/en\\?location=${locationTwoId}$`),
  );

  await page.goto(`http://${customHost}:3002/en?location=${randomUUID()}`);
  await expect(page.getByRole("heading", { name: "Restaurant unavailable" })).toBeVisible();
});

test("canonicalizes a live non-primary host and fails closed for unroutable hosts", async ({
  page,
}) => {
  await page.goto(`http://${alternateHost}:3002/en`);
  await expect(page.getByRole("heading", { name: "Seasonal menu" })).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    `https://${customHost}/en`,
  );

  for (const hostname of [
    pendingHost,
    failedOwnershipHost,
    disabledHost,
    provisioningHost,
    failedRoutingHost,
    unsupportedHost,
    `unknown-${runId}.localhost`,
  ]) {
    await page.goto(`http://${hostname}:3002/`);
    await expect(page.getByRole("heading", { name: "Restaurant unavailable" })).toBeVisible();
    await expect(page.getByRole("heading", { name: publicBusinessName })).toHaveCount(0);
  }

  await page.goto(`/darb-host-internal/${customHost}/en`);
  await expect(page.getByRole("heading", { name: "Restaurant unavailable" })).toBeVisible();
  await expect(page.getByRole("heading", { name: publicBusinessName })).toHaveCount(0);
});

test("fails closed for disabled capabilities and invalid locale/location routes", async ({
  page,
}) => {
  await page.goto(`/${gatedSlug}`);
  await expect(page.getByRole("heading", { name: "Restaurant unavailable" })).toBeVisible();
  await page.goto(`/${slug}/fr`);
  await expect(page.getByRole("heading", { name: "Restaurant unavailable" })).toBeVisible();
  await page.goto(`/${slug}/en?location=${randomUUID()}`);
  await expect(page.getByRole("heading", { name: "Restaurant unavailable" })).toBeVisible();
});

test("maintains a usable small-mobile composition without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/${slug}/en`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const metrics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(metrics.scrollWidth).toBe(metrics.clientWidth);
  const trigger = page.getByRole("button", { name: /View details: Darb signature/ });
  await trigger.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();
  await expect(trigger).toBeFocused();
});

test("respects reduced motion and remains usable with enlarged text", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`/${slug}/en`);
  const motion = await page
    .locator(".item-card")
    .first()
    .evaluate((element) => ({
      scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
      transitionDuration: getComputedStyle(element).transitionDuration,
    }));
  expect(motion.scrollBehavior).toBe("auto");
  expect(motion.transitionDuration.split(", ").every((duration) => duration === "0s")).toBe(true);

  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  await expect(page.getByRole("heading", { name: "Seasonal menu" })).toBeVisible();
  const metrics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(metrics.scrollWidth).toBe(metrics.clientWidth);
});

test("passes exact custom-host responsive QA in RTL and LTR", async ({ page }) => {
  const consoleIssues: string[] = [];
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) consoleIssues.push(message.text());
  });
  const viewports = [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 },
  ];
  for (const [index, viewport] of viewports.entries()) {
    await page.setViewportSize(viewport);
    await page.goto(`http://${customHost}:3002/${index % 2 === 0 ? "" : "en"}`);
    await expect(page.getByRole("heading", { level: 1, name: publicBusinessName })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("dir", index % 2 === 0 ? "rtl" : "ltr");
    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBe(dimensions.clientWidth);
    if (index === 1) {
      const trigger = page.getByRole("button", { name: /View details: Darb signature/ });
      await trigger.focus();
      await trigger.press("Enter");
      const dialog = page.getByRole("dialog", { name: /Darb signature plate/ });
      await expect(dialog).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
      await expect(trigger).toBeFocused();
    }
  }
  expect(consoleIssues).toEqual([]);
});

test("fails closed when the module is disabled after publication", async ({ page }) => {
  await setModuleEnabled(false);
  await page.goto(`/${slug}/en`);
  await expect(page.getByRole("heading", { name: "Restaurant unavailable" })).toBeVisible();
  await setModuleEnabled(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Seasonal menu" })).toBeVisible();
});

async function setModuleEnabled(isEnabled: boolean): Promise<void> {
  const { error } = await adminClient
    .schema("core")
    .from("business_modules")
    .update({ is_enabled: isEnabled })
    .eq("business_id", businessId)
    .eq("module_key", "restaurant");
  if (error) throw error;
}

function runFixtureSql(sql: string): void {
  const result = spawnSync(
    "psql",
    [requiredEnvironment("SUPABASE_TEST_DATABASE_URL"), "--no-psqlrc", "--set", "ON_ERROR_STOP=1"],
    { encoding: "utf8", input: sql },
  );
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || "Unable to apply public Restaurant fixture.");
  }
}

function assertLocalEnvironment(): void {
  const databaseUrl = new URL(requiredEnvironment("SUPABASE_TEST_DATABASE_URL"));
  const apiUrl = new URL(requiredEnvironment("NEXT_PUBLIC_SUPABASE_URL"));
  const allowed = new Set(["127.0.0.1", "localhost", "[::1]"]);
  if (!allowed.has(databaseUrl.hostname) || !allowed.has(apiUrl.hostname)) {
    throw new Error("Public Restaurant E2E mutations are restricted to local Supabase.");
  }
}

function requiredEnvironment(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for the public Restaurant E2E suite.`);
  return value;
}
