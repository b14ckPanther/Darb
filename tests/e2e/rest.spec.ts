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
const extraCategoryIds = Array.from({ length: 5 }, () => randomUUID());
const itemId = randomUUID();
const soldOutItemId = randomUUID();
const hiddenItemId = randomUUID();
const variantId = randomUUID();
const modifierGroupId = randomUUID();
const modifierId = randomUUID();
const mediaPath = `${businessId}/${mediaId}/public-menu.png`;
const publicBusinessName = "مطبخ درب للمأكولات الموسمية";
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
    "iVBORw0KGgoAAAANSUhEUgAAAPAAAACgCAIAAAC9uXYyAAADMklEQVR42u3dMW7TYBiAYQdVjOxMdOIA7EhIrD1Kj8DIETgAh+AAnTr2DGVi5wRsLKhRkPw7v18/79oq8W89/WI7Tnp6f/dxkSq9sgsEtAS0BLQEtICWgJaAloCWgBbQEtAS0BLQEtACWgJaAloCWgJaQEtAS0BLQEv/dGMX5Hu4f3fhb3769nPviz355qQjC+75BprjlGygOU7JBhrlFGugUU6xBhrlFGugUU6x9sYKxanNA5rm1EY65KAkdfhhQtOc2mygsUhtPNBApJYANAqphQANQWo5QNOcWhTQNKeWBjTNqQUCrcWHZGU8T7pMoGlOLda9HEfR/ObDlzM//f30dUnc7OFrDMqdR/zSb26J24Q2nlemfJWZPW5Im9DHncqXPM7uprWTwtR4XkvzuAcc/epkQhvMqVFtQhfG8zjN455i0JAG2mye7omAPu543hjZuk83YkgDbTan5jTQNKdMA+3OjdQOAdp4Tg1poGlOmQba8UZqtwBtPKeGNNBafARLJuKkmwS0TGg5I5x15wAtE1qOVmfdMKBlQktAS0BLQAtoqdHN99vX9oKu3loOTWg55JCA1jLxtydmNgxomdD6/55//LITNtg5QMuElqPVWTcJaJnQMhFnfcUA2nlharcAbUinrosDzXTqXR6gHXWkdgjQhnRnPAPNdEoz0Lt/kd2Y17pPN+IADGhzOjKbge6cCW1AbfWnGHR+7D/Jpub0iC8x2te/+zahU9fvVsc3SPO4y5cmtFFdGMx/Oz3ef4bgWt3evV3m+xrF0ZSHvrtkQh/lAsh53Dudxyb04Yb00d78d1Lo7o7UYoFmOrVMoLX4CJYM6UkXCDTTqaUBzXRqUUAznVoO0BCkFgI0CqklAA1EauOBxiK12W5O2gGOvdzvMcNfoAkNSmojgWY6tXkOORx+pP7SgMY69aIBNNap4x+gsU6dngLdOV8cJ3tHV8SBJjv1zg7Q/Wt8l/sO3EMCtGvYi49gSUBLQEtAC2gJaAloCWgJaAEtAS0BLQEtAS2gJaAloCWgJaAFtAS0BLQEtAS0gJaAloCWgJaAFtAS0BLQEtAS0AJaAloCWgJax+4P4SVQi2PxKG0AAAAASUVORK5CYII=",
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

    update core.business_plan_assignments set plan_key = 'restaurant-starter'
    where business_id in ('${businessId}', '${gatedBusinessId}');

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

    insert into restaurant.location_public_profiles (
      business_id, location_id, public_phone, public_email, website_url, whatsapp_phone, map_url
    ) values (
      '${businessId}', '${locationOneId}', '+972501234567', 'hello@example.test',
      'https://example.test', '+972509876543', 'https://maps.example.test/place'
    );
    insert into restaurant.location_opening_intervals (
      business_id, location_id, iso_weekday, opens_at, closes_at
    ) values
      ('${businessId}', '${locationOneId}', 1, '09:00', '14:00'),
      ('${businessId}', '${locationOneId}', 1, '18:00', '02:00'),
      ('${businessId}', '${locationOneId}', 5, '10:00', '15:00');

    insert into core.media_assets (
      id, business_id, storage_bucket, storage_path, media_kind, mime_type,
      byte_size, width, height, alt_text, original_filename, status
    ) values (
      '${mediaId}', '${businessId}', 'tenant-media-images', '${mediaPath}', 'image',
      'image/png', 875, 240, 160, 'طبق مميز من مطبخ درب', 'public-menu.png', 'active'
    );

    insert into core.business_visual_settings (
      business_id, module_key, template_key, theme_overrides
    ) values (
      '${businessId}', 'restaurant', 'restaurant-signature',
      '{"colors":{"primary":"#263B32","accent":"#B8633F"},"shape":{"radius":"bold"}}'::jsonb
    );

    insert into core.business_media_assignments (
      business_id, module_key, role_key, media_asset_id
    ) values
      ('${businessId}', 'restaurant', 'logo', '${mediaId}'),
      ('${businessId}', 'restaurant', 'hero', '${mediaId}');

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

    insert into restaurant.categories (
      id, business_id, menu_id, internal_name, image_media_asset_id, is_visible, lifecycle_status, display_order
    ) values
      ${extraCategoryIds
        .map(
          (id, index) =>
            `('${id}', '${businessId}', '${menuId}', 'internal-extra-${index + 1}', null, true, 'active', ${(index + 3) * 10})`,
        )
        .join(",\n      ")};

    insert into restaurant.category_translations (
      business_id, category_id, locale_code, name, description
    ) values
      ${extraCategoryIds
        .flatMap((id, index) => [
          `('${businessId}', '${id}', 'ar', 'تصنيف موسمي طويل ${index + 1}', 'اختيارات موسمية بتتغير حسب المتوفر.')`,
          `('${businessId}', '${id}', 'he', 'קטגוריה עונתית ארוכה ${index + 1}', 'אפשרויות עונתיות שמשתנות לפי הזמינות.')`,
          `('${businessId}', '${id}', 'en', 'Long seasonal category ${index + 1}', 'Seasonal choices that change with availability.')`,
        ])
        .join(",\n      ")};

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
  await page.getByRole("button", { name: "العربية" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(
    page.getByRole("heading", { name: "قائمة المطعم، بتجربة مرتّبة وواضحة." }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "تعرّف على درب" })).toBeVisible();

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
  await expect(page.locator('[data-branding-role="logo"] img')).toBeVisible();
  await expect(page.locator('[data-branding-role="hero"] img')).toBeVisible();
  await expect
    .poll(() =>
      page
        .getByRole("heading", { level: 1, name: publicBusinessName })
        .evaluate((element) => getComputedStyle(element).fontFamily),
    )
    .toContain("Cairo");
  await expect(page.getByRole("heading", { name: "قائمة الموسم" })).toBeVisible();
  await expect(page.getByAltText("طبق مميز من مطبخ درب").first()).toBeVisible();
  await expect(page.getByRole("link", { name: /اتصل/ })).toHaveAttribute(
    "href",
    "tel:+972501234567",
  );
  await expect(page.getByText("ساعات الدوام").first()).toBeVisible();
  await expect(
    page.locator(".location-details__card").filter({ hasText: "فرع الحديقة" }),
  ).not.toContainText("ساعات الدوام");
  await expect(page.getByText("secret-draft-menu")).toHaveCount(0);
  await expect(page.getByText("Hidden item")).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText("internal-signature");
});

test("restores deliberate public fallbacks when branding assignments are removed", async ({
  page,
}) => {
  const { error: removeLogoError } = await adminClient
    .schema("core")
    .from("business_media_assignments")
    .delete()
    .eq("business_id", businessId)
    .eq("module_key", "restaurant")
    .eq("role_key", "logo");
  if (removeLogoError) throw removeLogoError;

  await page.goto(`/${slug}/en`);
  await expect(page.locator('[data-branding-role="logo"]')).toHaveCount(0);
  await expect(page.locator(".brand-symbol")).toBeVisible();
  await expect(page.locator('[data-branding-role="hero"] img')).toBeVisible();

  const { error: restoreLogoError } = await adminClient
    .schema("core")
    .from("business_media_assignments")
    .insert({
      business_id: businessId,
      media_asset_id: mediaId,
      module_key: "restaurant",
      role_key: "logo",
    });
  if (restoreLogoError) throw restoreLogoError;

  const { error: removeHeroError } = await adminClient
    .schema("core")
    .from("business_media_assignments")
    .delete()
    .eq("business_id", businessId)
    .eq("module_key", "restaurant")
    .eq("role_key", "hero");
  if (removeHeroError) throw removeHeroError;

  await page.goto(`/${slug}/en`);
  await expect(page.locator('[data-branding-role="logo"] img')).toBeVisible();
  await expect(page.locator('[data-branding-role="hero"]')).toHaveCount(0);
  await expect(page.getByAltText("طبق مميز من مطبخ درب").first()).toBeVisible();

  const { error: removeLogoAgainError } = await adminClient
    .schema("core")
    .from("business_media_assignments")
    .delete()
    .eq("business_id", businessId)
    .eq("module_key", "restaurant")
    .eq("role_key", "logo");
  if (removeLogoAgainError) throw removeLogoAgainError;

  for (const template of [
    { dataValue: "signature", key: "restaurant-signature" },
    { dataValue: "editorial", key: "restaurant-editorial" },
    { dataValue: "counter", key: "restaurant-counter" },
  ] as const) {
    await setRestaurantTemplate(template.key);
    await page.goto(`/${slug}/en`);
    await expect(page.locator(`[data-restaurant-template="${template.dataValue}"]`)).toBeVisible();
    await expect(page.locator('[data-branding-role="logo"]')).toHaveCount(0);
    await expect(page.locator('[data-branding-role="hero"]')).toHaveCount(0);
    await expect(page.locator(".brand-symbol")).toBeVisible();
    await expect(page.getByAltText("طبق مميز من مطبخ درب").first()).toBeVisible();
  }

  const { error: restoreError } = await adminClient
    .schema("core")
    .from("business_media_assignments")
    .insert([
      {
        business_id: businessId,
        media_asset_id: mediaId,
        module_key: "restaurant",
        role_key: "logo",
      },
      {
        business_id: businessId,
        media_asset_id: mediaId,
        module_key: "restaurant",
        role_key: "hero",
      },
    ]);
  if (restoreError) throw restoreError;
  await setRestaurantTemplate("restaurant-signature");
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
  await page.goto(`/${slug}/en?location=${locationOneId}`);
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
  expect(jsonLd).toContain('"telephone":"+972501234567"');
  expect(jsonLd).toContain('"dayOfWeek":"https://schema.org/Monday"');
  expect(jsonLd).not.toContain("internal-signature");
  expect(jsonLd).not.toContain("secret-draft-menu");

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
    await expect(page.locator('[data-branding-role="logo"] img')).toBeVisible();
    await expect(page.locator('[data-branding-role="hero"] img')).toBeVisible();
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

test("renders every Restaurant template across the exact responsive QA matrix", async ({
  page,
}, testInfo) => {
  const templates = [
    { dataValue: "signature", key: "restaurant-signature" },
    { dataValue: "editorial", key: "restaurant-editorial" },
    { dataValue: "counter", key: "restaurant-counter" },
  ] as const;
  const viewports = [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 },
  ] as const;
  const consoleIssues: string[] = [];
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) consoleIssues.push(message.text());
  });

  try {
    for (const template of templates) {
      await setRestaurantTemplate(template.key);
      for (const locale of ["ar", "en"] as const) {
        for (const viewport of viewports) {
          await page.setViewportSize(viewport);
          const localePath = locale === "ar" ? "" : "en";
          await page.goto(`http://${customHost}:3002/${localePath}`);
          const templateRoot = page.locator(`[data-restaurant-template="${template.dataValue}"]`);
          await expect(templateRoot).toBeVisible();
          await expect(page.locator("html")).toHaveAttribute(
            "dir",
            locale === "ar" ? "rtl" : "ltr",
          );
          await expect(page.locator('[data-branding-role="logo"] img')).toBeVisible();
          await expect(page.locator('[data-branding-role="hero"] img')).toBeVisible();
          await expect(
            page.getByRole("navigation", { name: /Categories|التصنيفات/ }),
          ).toBeVisible();
          await expect(page.getByText(locale === "ar" ? "حجم عائلي" : "Family size")).toBeHidden();
          const dimensions = await page.evaluate(() => ({
            clientWidth: document.documentElement.clientWidth,
            scrollWidth: document.documentElement.scrollWidth,
          }));
          expect(dimensions.scrollWidth).toBe(dimensions.clientWidth);
          await testInfo.attach(
            `${template.dataValue}-${locale}-${viewport.width}x${viewport.height}`,
            { body: await page.screenshot({ fullPage: true }), contentType: "image/png" },
          );
          if (process.env.DARB_VISUAL_QA_OUTPUT) {
            await page.screenshot({
              fullPage: true,
              path: `${process.env.DARB_VISUAL_QA_OUTPUT}/${template.dataValue}-${locale}-${viewport.width}x${viewport.height}.png`,
            });
          }
        }
      }

      await page.setViewportSize({ width: 390, height: 844 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(`http://${customHost}:3002/en`, { waitUntil: "networkidle" });
      await page.evaluate(() => {
        document.documentElement.style.fontSize = "200%";
      });
      const enlargedDimensions = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      expect(enlargedDimensions.scrollWidth).toBe(enlargedDimensions.clientWidth);
      const categoryLink = page
        .getByRole("navigation", { name: "Categories" })
        .getByRole("link")
        .first();
      await categoryLink.focus();
      await expect(categoryLink).toBeFocused();
      await categoryLink.press("Enter");
      await expect(page).toHaveURL(/#category-/);
      await page.evaluate(() => {
        document.documentElement.style.removeProperty("font-size");
      });
      await page.emulateMedia({ reducedMotion: "no-preference" });

      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(`http://${customHost}:3002/he`);
      await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
      await expect(page.getByRole("heading", { name: "תפריט עונתי" })).toBeVisible();
      const trigger = page.getByRole("button", { name: /פרטים: מנת הדרך/ });
      await trigger.focus();
      await trigger.press("Enter");
      await expect(page.getByRole("dialog", { name: /מנת הדרך/ })).toBeVisible();
      await expect(page.getByText("גודל משפחתי")).toBeVisible();
      await expect(page.getByText("בחירת רוטב")).toBeVisible();
      if (process.env.DARB_VISUAL_QA_OUTPUT) {
        await page.screenshot({
          path: `${process.env.DARB_VISUAL_QA_OUTPUT}/${template.dataValue}-he-dialog-768x1024.png`,
        });
      }
      await page.keyboard.press("Escape");
      await expect(trigger).toBeFocused();
      await testInfo.attach(`${template.dataValue}-he-768x1024`, {
        body: await page.screenshot({ fullPage: true }),
        contentType: "image/png",
      });
      if (process.env.DARB_VISUAL_QA_OUTPUT) {
        await page.screenshot({
          fullPage: true,
          path: `${process.env.DARB_VISUAL_QA_OUTPUT}/${template.dataValue}-he-768x1024.png`,
        });
      }
    }
  } finally {
    await setRestaurantTemplate("restaurant-signature");
  }

  expect(consoleIssues).toEqual([]);
});

test("keeps a deterministic 225-item Restaurant usable without overflow", async ({ page }) => {
  const scaleCategories = Array.from({ length: 15 }, () => randomUUID());
  const scaleItems = Array.from({ length: 225 }, () => randomUUID());
  try {
    runFixtureSql(`
      begin;
      insert into restaurant.categories (
        id, business_id, menu_id, internal_name, is_visible, lifecycle_status, display_order
      ) values
        ${scaleCategories
          .map(
            (id, index) =>
              `('${id}', '${businessId}', '${menuId}', 'scale-category-${index + 1}', true, 'active', ${100 + index})`,
          )
          .join(",\n        ")};
      insert into restaurant.category_translations (business_id, category_id, locale_code, name)
      values
        ${scaleCategories
          .map((id, index) => `('${businessId}', '${id}', 'en', 'Scale category ${index + 1}')`)
          .join(",\n        ")};
      insert into restaurant.items (
        id, business_id, menu_id, category_id, internal_name, base_price_minor,
        image_media_asset_id, is_visible, availability_status, lifecycle_status, display_order
      ) values
        ${scaleItems
          .map(
            (id, index) =>
              `('${id}', '${businessId}', '${menuId}', '${scaleCategories[index % scaleCategories.length]}', 'scale-item-${index + 1}', ${1000 + index}, ${index % 5 === 0 ? `'${mediaId}'` : "null"}, true, '${index % 17 === 0 ? "sold_out" : "available"}', 'active', ${index + 1})`,
          )
          .join(",\n        ")};
      insert into restaurant.item_translations (business_id, item_id, locale_code, name, description)
      values
        ${scaleItems
          .map(
            (id, index) =>
              `('${businessId}', '${id}', 'en', 'Scale item ${index + 1}', 'Deterministic large-menu content for local launch QA.')`,
          )
          .join(",\n        ")};
      commit;
    `);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/${slug}/en`);
    await expect(page.getByRole("heading", { name: "Scale item 225" })).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Categories" }).getByRole("link"),
    ).toHaveCount(21);
    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBe(dimensions.clientWidth);
  } finally {
    runFixtureSql(`
      begin;
      delete from restaurant.items where id in (${scaleItems.map((id) => `'${id}'`).join(",")});
      delete from restaurant.categories where id in (${scaleCategories.map((id) => `'${id}'`).join(",")});
      commit;
    `);
  }
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

async function setRestaurantTemplate(templateKey: string): Promise<void> {
  const supportedTemplateKeys = new Set([
    "restaurant-signature",
    "restaurant-editorial",
    "restaurant-counter",
  ]);
  if (!supportedTemplateKeys.has(templateKey)) throw new Error("Unsupported test template.");
  runFixtureSql(`
    update core.business_visual_settings
    set template_key = '${templateKey}'
    where business_id = '${businessId}' and module_key = 'restaurant';
  `);
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
