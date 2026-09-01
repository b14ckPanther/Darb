begin;

create extension if not exists pgtap with schema extensions;

create function pg_temp.capture_sqlstate(statement text)
returns text
language plpgsql
as $$
begin
  execute statement;
  return null;
exception
  when others then return sqlstate;
end;
$$;

select no_plan();

select has_function(
  'public',
  'get_restaurant_publication',
  array['text'],
  'one explicit public Restaurant projection exists'
);
select ok(
  has_function_privilege('anon', 'public.get_restaurant_publication(text)', 'execute'),
  'anonymous callers may execute only the curated public projection'
);
select ok(
  has_function_privilege('authenticated', 'public.get_restaurant_publication(text)', 'execute'),
  'authenticated callers may use the same public projection'
);
select ok(
  not has_function_privilege('service_role', 'public.get_restaurant_publication(text)', 'execute'),
  'service role is not conceptually granted the public projection'
);
select ok(
  not has_table_privilege('anon', 'restaurant.items', 'select'),
  'anonymous callers still have no Restaurant administration-table reads'
);
select ok(
  not has_table_privilege('anon', 'core.media_assets', 'select'),
  'anonymous callers have no raw media-metadata reads'
);
select is(
  (select prosecdef from pg_proc where oid = 'public.get_restaurant_publication(text)'::regprocedure),
  true,
  'the public projection owns its narrow definer boundary'
);
select is(
  (select proconfig from pg_proc where oid = 'public.get_restaurant_publication(text)'::regprocedure),
  array['search_path=""'],
  'the public projection has an empty search path'
);
select results_eq(
  $$select key, module_key, is_default, is_available
    from core.templates where module_key = 'restaurant'$$,
  $$values ('restaurant-signature'::text, 'restaurant'::text, true, true)$$,
  'Restaurant has one available platform-owned default composition'
);
select ok(
  (select private.theme_has_safe_critical_contrast(default_theme)
   from core.templates where key = 'restaurant-signature'),
  'the Restaurant default theme passes critical contrast checks'
);

insert into core.businesses (id, slug, display_name, default_locale, status)
values
  ('a1000000-0000-0000-0000-000000000001', 'public-restaurant-a', 'Public Restaurant A', 'ar', 'active'),
  ('a2000000-0000-0000-0000-000000000002', 'public-restaurant-b', 'Public Restaurant B', 'en', 'active'),
  ('a3000000-0000-0000-0000-000000000003', 'public-restaurant-suspended', 'Suspended Restaurant', 'en', 'suspended'),
  ('a4000000-0000-0000-0000-000000000004', 'public-restaurant-disabled', 'Disabled Restaurant', 'en', 'active');

insert into core.business_locales (business_id, locale_code, is_enabled)
values
  ('a1000000-0000-0000-0000-000000000001', 'en', true),
  ('a1000000-0000-0000-0000-000000000001', 'he', true);

insert into core.business_modules (business_id, module_key, is_enabled)
values
  ('a1000000-0000-0000-0000-000000000001', 'restaurant', true),
  ('a2000000-0000-0000-0000-000000000002', 'restaurant', true),
  ('a3000000-0000-0000-0000-000000000003', 'restaurant', true),
  ('a4000000-0000-0000-0000-000000000004', 'restaurant', false);

insert into restaurant.configurations (business_id, is_publicly_active)
values
  ('a1000000-0000-0000-0000-000000000001', true),
  ('a2000000-0000-0000-0000-000000000002', true),
  ('a3000000-0000-0000-0000-000000000003', true),
  ('a4000000-0000-0000-0000-000000000004', true);

insert into core.locations (
  id, business_id, display_name, status, address_line, locality, postal_code
)
values
  ('a1700000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Jerusalem', 'active', '1 Public Street', 'Jerusalem', '91000'),
  ('a1710000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Retained branch', 'inactive', null, null, null),
  ('a2700000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000002', 'Tenant B', 'active', '2 Other Street', 'Haifa', null);

insert into core.media_assets (
  id, business_id, storage_bucket, storage_path, media_kind, mime_type,
  byte_size, width, height, alt_text, original_filename, status
)
values (
  'a1800000-0000-0000-0000-000000000001',
  'a1000000-0000-0000-0000-000000000001',
  'tenant-media-images',
  'a1000000-0000-0000-0000-000000000001/a1800000-0000-0000-0000-000000000001/public.webp',
  'image', 'image/webp', 2048, 1200, 800, 'Public menu photograph',
  'private-original-name.webp', 'active'
);

insert into core.business_visual_settings (
  business_id, module_key, template_key, theme_overrides
)
values (
  'a1000000-0000-0000-0000-000000000001',
  'restaurant',
  'restaurant-signature',
  '{"colors":{"primary":"#294A3E"},"shape":{"radius":"bold"}}'::jsonb
);

insert into restaurant.menus (
  id, business_id, internal_name, publication_status, lifecycle_status, display_order
)
values
  ('a1100000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'INTERNAL MAIN TOKEN', 'published', 'active', 10),
  ('a1110000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'INTERNAL DRAFT TOKEN', 'draft', 'active', 20),
  ('a1120000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'INTERNAL ARCHIVED MENU TOKEN', 'published', 'archived', 30),
  ('a2100000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000002', 'TENANT B INTERNAL TOKEN', 'published', 'active', 10);

insert into restaurant.menu_translations (business_id, menu_id, locale_code, name, description)
values
  ('a1000000-0000-0000-0000-000000000001', 'a1100000-0000-0000-0000-000000000001', 'ar', 'قائمة عامة', 'وصف عربي عام'),
  ('a1000000-0000-0000-0000-000000000001', 'a1100000-0000-0000-0000-000000000001', 'en', 'Public menu', 'Public English description'),
  ('a1000000-0000-0000-0000-000000000001', 'a1100000-0000-0000-0000-000000000001', 'he', 'תרגום מושבת', 'Disabled locale description'),
  ('a1000000-0000-0000-0000-000000000001', 'a1110000-0000-0000-0000-000000000001', 'en', 'DRAFT TRANSLATION SECRET', null),
  ('a1000000-0000-0000-0000-000000000001', 'a1120000-0000-0000-0000-000000000001', 'en', 'ARCHIVED MENU SECRET', null),
  ('a2000000-0000-0000-0000-000000000002', 'a2100000-0000-0000-0000-000000000002', 'en', 'Tenant B public menu', null);

insert into restaurant.categories (
  id, business_id, menu_id, internal_name, image_media_asset_id,
  is_visible, lifecycle_status, display_order
)
values
  ('a1200000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'a1100000-0000-0000-0000-000000000001', 'INTERNAL CATEGORY TOKEN', 'a1800000-0000-0000-0000-000000000001', true, 'active', 10),
  ('a1210000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'a1100000-0000-0000-0000-000000000001', 'INTERNAL HIDDEN CATEGORY TOKEN', null, false, 'active', 20),
  ('a1220000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'a1100000-0000-0000-0000-000000000001', 'INTERNAL ARCHIVED CATEGORY TOKEN', null, true, 'archived', 30),
  ('a2200000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000002', 'a2100000-0000-0000-0000-000000000002', 'TENANT B CATEGORY INTERNAL', null, true, 'active', 10);

insert into restaurant.category_translations (business_id, category_id, locale_code, name, description)
values
  ('a1000000-0000-0000-0000-000000000001', 'a1200000-0000-0000-0000-000000000001', 'ar', 'الأطباق', 'وصف الفئة'),
  ('a1000000-0000-0000-0000-000000000001', 'a1200000-0000-0000-0000-000000000001', 'en', 'Dishes', 'Category description'),
  ('a1000000-0000-0000-0000-000000000001', 'a1210000-0000-0000-0000-000000000001', 'en', 'HIDDEN CATEGORY SECRET', null),
  ('a1000000-0000-0000-0000-000000000001', 'a1220000-0000-0000-0000-000000000001', 'en', 'ARCHIVED CATEGORY SECRET', null),
  ('a2000000-0000-0000-0000-000000000002', 'a2200000-0000-0000-0000-000000000002', 'en', 'Tenant B category', null);

insert into restaurant.items (
  id, business_id, menu_id, category_id, internal_name, base_price_minor,
  image_media_asset_id, is_visible, availability_status, lifecycle_status, display_order
)
values
  ('a1300000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'a1100000-0000-0000-0000-000000000001', 'a1200000-0000-0000-0000-000000000001', 'INTERNAL ITEM TOKEN', 4500, 'a1800000-0000-0000-0000-000000000001', true, 'available', 'active', 10),
  ('a1310000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'a1100000-0000-0000-0000-000000000001', 'a1200000-0000-0000-0000-000000000001', 'INTERNAL SOLD TOKEN', 5200, null, true, 'sold_out', 'active', 20),
  ('a1320000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'a1100000-0000-0000-0000-000000000001', 'a1200000-0000-0000-0000-000000000001', 'INTERNAL HIDDEN ITEM TOKEN', 100, null, false, 'available', 'active', 30),
  ('a1330000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'a1100000-0000-0000-0000-000000000001', 'a1200000-0000-0000-0000-000000000001', 'INTERNAL ARCHIVED ITEM TOKEN', 100, null, true, 'available', 'archived', 40),
  ('a1340000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'a1100000-0000-0000-0000-000000000001', 'a1200000-0000-0000-0000-000000000001', 'INTERNAL UNTRANSLATED ITEM TOKEN', 100, null, true, 'available', 'active', 50),
  ('a2300000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000002', 'a2100000-0000-0000-0000-000000000002', 'a2200000-0000-0000-0000-000000000002', 'TENANT B ITEM INTERNAL', 1000, null, true, 'available', 'active', 10);

insert into restaurant.item_translations (business_id, item_id, locale_code, name, description)
values
  ('a1000000-0000-0000-0000-000000000001', 'a1300000-0000-0000-0000-000000000001', 'ar', 'طبق عام', 'وصف الطبق'),
  ('a1000000-0000-0000-0000-000000000001', 'a1300000-0000-0000-0000-000000000001', 'en', 'Public dish', 'Dish description'),
  ('a1000000-0000-0000-0000-000000000001', 'a1310000-0000-0000-0000-000000000001', 'en', 'Sold-out dish', null),
  ('a1000000-0000-0000-0000-000000000001', 'a1320000-0000-0000-0000-000000000001', 'en', 'HIDDEN ITEM SECRET', null),
  ('a1000000-0000-0000-0000-000000000001', 'a1330000-0000-0000-0000-000000000001', 'en', 'ARCHIVED ITEM SECRET', null),
  ('a2000000-0000-0000-0000-000000000002', 'a2300000-0000-0000-0000-000000000002', 'en', 'Tenant B public item', null);

insert into restaurant.item_variants (
  id, business_id, item_id, internal_name, price_minor, is_visible,
  availability_status, lifecycle_status, display_order
)
values
  ('a1400000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'a1300000-0000-0000-0000-000000000001', 'INTERNAL VARIANT TOKEN', 6200, true, 'available', 'active', 10),
  ('a1410000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'a1300000-0000-0000-0000-000000000001', 'INTERNAL HIDDEN VARIANT TOKEN', 6400, false, 'available', 'active', 20),
  ('a1420000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'a1300000-0000-0000-0000-000000000001', 'INTERNAL ARCHIVED VARIANT TOKEN', 6500, true, 'available', 'archived', 30);

insert into restaurant.item_variant_translations (business_id, item_variant_id, locale_code, name)
values
  ('a1000000-0000-0000-0000-000000000001', 'a1400000-0000-0000-0000-000000000001', 'ar', 'كبير'),
  ('a1000000-0000-0000-0000-000000000001', 'a1400000-0000-0000-0000-000000000001', 'en', 'Large'),
  ('a1000000-0000-0000-0000-000000000001', 'a1410000-0000-0000-0000-000000000001', 'en', 'HIDDEN VARIANT SECRET'),
  ('a1000000-0000-0000-0000-000000000001', 'a1420000-0000-0000-0000-000000000001', 'en', 'ARCHIVED VARIANT SECRET');

insert into restaurant.modifier_groups (
  id, business_id, internal_name, is_visible, lifecycle_status
)
values
  ('a1500000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'INTERNAL MODIFIER GROUP TOKEN', true, 'active'),
  ('a1510000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'INTERNAL HIDDEN GROUP TOKEN', false, 'active');

insert into restaurant.modifier_group_translations (
  business_id, modifier_group_id, locale_code, name, description
)
values
  ('a1000000-0000-0000-0000-000000000001', 'a1500000-0000-0000-0000-000000000001', 'ar', 'الإضافات', 'اختيارات إضافية'),
  ('a1000000-0000-0000-0000-000000000001', 'a1500000-0000-0000-0000-000000000001', 'en', 'Extras', 'Optional additions'),
  ('a1000000-0000-0000-0000-000000000001', 'a1510000-0000-0000-0000-000000000001', 'en', 'HIDDEN GROUP SECRET', null);

insert into restaurant.modifiers (
  id, business_id, modifier_group_id, internal_name, price_delta_minor,
  is_visible, availability_status, lifecycle_status, display_order
)
values
  ('a1600000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'a1500000-0000-0000-0000-000000000001', 'INTERNAL MODIFIER TOKEN', 500, true, 'available', 'active', 10),
  ('a1610000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'a1500000-0000-0000-0000-000000000001', 'INTERNAL SOLD MODIFIER TOKEN', 200, true, 'sold_out', 'active', 20),
  ('a1620000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'a1500000-0000-0000-0000-000000000001', 'INTERNAL HIDDEN MODIFIER TOKEN', 100, false, 'available', 'active', 30);

insert into restaurant.modifier_translations (business_id, modifier_id, locale_code, name)
values
  ('a1000000-0000-0000-0000-000000000001', 'a1600000-0000-0000-0000-000000000001', 'ar', 'إضافة'),
  ('a1000000-0000-0000-0000-000000000001', 'a1600000-0000-0000-0000-000000000001', 'en', 'Extra portion'),
  ('a1000000-0000-0000-0000-000000000001', 'a1610000-0000-0000-0000-000000000001', 'en', 'Unavailable extra'),
  ('a1000000-0000-0000-0000-000000000001', 'a1620000-0000-0000-0000-000000000001', 'en', 'HIDDEN MODIFIER SECRET');

insert into restaurant.item_modifier_groups (
  business_id, item_id, modifier_group_id, minimum_selections, maximum_selections, display_order
)
values
  ('a1000000-0000-0000-0000-000000000001', 'a1300000-0000-0000-0000-000000000001', 'a1500000-0000-0000-0000-000000000001', 0, 2, 10),
  ('a1000000-0000-0000-0000-000000000001', 'a1300000-0000-0000-0000-000000000001', 'a1510000-0000-0000-0000-000000000001', 0, 1, 20);

insert into restaurant.item_location_availability (
  business_id, item_id, location_id, availability_status
)
values
  ('a1000000-0000-0000-0000-000000000001', 'a1300000-0000-0000-0000-000000000001', 'a1700000-0000-0000-0000-000000000001', 'sold_out'),
  ('a1000000-0000-0000-0000-000000000001', 'a1300000-0000-0000-0000-000000000001', 'a1710000-0000-0000-0000-000000000001', 'available');

update core.business_locales
set is_enabled = false
where business_id = 'a1000000-0000-0000-0000-000000000001'
  and locale_code = 'he';

set local role anon;
select set_config('request.jwt.claim.sub', '', true);

select is(
  pg_temp.capture_sqlstate($$select * from restaurant.items$$),
  '42501',
  'anonymous direct Restaurant reads remain blocked'
);
select is(
  public.get_restaurant_publication('unknown-public-restaurant'),
  null,
  'unknown business slugs fail closed'
);
select is(
  public.get_restaurant_publication('../public-restaurant-a'),
  null,
  'malformed public slugs fail closed'
);
select is(
  public.get_restaurant_publication('public-restaurant-disabled'),
  null,
  'disabled Restaurant capability fails closed'
);
select is(
  public.get_restaurant_publication('public-restaurant-suspended'),
  null,
  'non-active business lifecycle fails closed'
);
select is(
  public.get_restaurant_publication('public-restaurant-a') #>> '{business,slug}',
  'public-restaurant-a',
  'an active public Restaurant resolves by canonical slug'
);
select is(
  public.get_restaurant_publication(' PUBLIC-RESTAURANT-A ') #>> '{business,slug}',
  'public-restaurant-a',
  'public slug normalization remains deterministic'
);
select is(
  public.get_restaurant_publication('public-restaurant-a') #>> '{business,displayName}',
  'Public Restaurant A',
  'only canonical business identity is projected'
);
select is(
  public.get_restaurant_publication('public-restaurant-a') #>> '{appearance,templateKey}',
  'restaurant-signature',
  'the available selected Restaurant template is projected'
);
select is(
  public.get_restaurant_publication('public-restaurant-a') #>> '{appearance,overrides,colors,primary}',
  '#294A3E',
  'closed tenant theme overrides are projected for the renderer'
);
select is(
  jsonb_array_length(public.get_restaurant_publication('public-restaurant-a') -> 'locales'),
  2,
  'only enabled business locales are projected'
);
select ok(
  public.get_restaurant_publication('public-restaurant-a')::text not like '%תרגום מושבת%',
  'disabled-locale translations are absent'
);
select is(
  jsonb_array_length(public.get_restaurant_publication('public-restaurant-a') -> 'locations'),
  1,
  'only active same-business locations are projected'
);
select is(
  jsonb_array_length(public.get_restaurant_publication('public-restaurant-a') -> 'menus'),
  1,
  'only active published menus are projected'
);
select is(
  public.get_restaurant_publication('public-restaurant-a') #>> '{menus,0,translations,0,name}',
  'قائمة عامة',
  'enabled localized menu content is projected without internal fallback'
);
select is(
  jsonb_array_length(public.get_restaurant_publication('public-restaurant-a') #> '{menus,0,categories}'),
  1,
  'hidden and archived categories are omitted'
);
select is(
  jsonb_array_length(public.get_restaurant_publication('public-restaurant-a') #> '{menus,0,categories,0,items}'),
  2,
  'hidden, archived, and untranslated items are omitted while sold-out items remain'
);
select ok(
  jsonb_path_exists(
    public.get_restaurant_publication('public-restaurant-a'),
    '$.menus[*].categories[*].items[*] ? (@.availabilityStatus == "sold_out")'
  ),
  'sold-out item state remains intentionally public'
);
select is(
  jsonb_array_length(public.get_restaurant_publication('public-restaurant-a') #> '{menus,0,categories,0,items,0,variants}'),
  1,
  'only active visible translated variants are projected'
);
select is(
  jsonb_array_length(public.get_restaurant_publication('public-restaurant-a') #> '{menus,0,categories,0,items,0,modifierGroups}'),
  1,
  'only active visible translated modifier groups are projected'
);
select is(
  jsonb_array_length(public.get_restaurant_publication('public-restaurant-a') #> '{menus,0,categories,0,items,0,modifierGroups,0,modifiers}'),
  2,
  'visible modifiers remain projected with availability semantics'
);
select is(
  jsonb_array_length(public.get_restaurant_publication('public-restaurant-a') #> '{menus,0,categories,0,items,0,locationAvailability}'),
  1,
  'location overrides are limited to active same-business locations'
);
select is(
  public.get_restaurant_publication('public-restaurant-a') #>> '{menus,0,categories,0,items,0,locationAvailability,0,availabilityStatus}',
  'sold_out',
  'public location override semantics retain explicit sold-out state'
);
select ok(
  public.get_restaurant_publication('public-restaurant-a') #> '{menus,0,categories,0,items,0,image}'
    ?& array['storageBucket', 'storagePath', 'altText', 'width', 'height'],
  'active same-business image projection contains only render-required fields'
);
select ok(
  public.get_restaurant_publication('public-restaurant-a')::text not like '%private-original-name.webp%',
  'private media filename metadata is never projected'
);
select ok(
  public.get_restaurant_publication('public-restaurant-a')::text not like '%INTERNAL%',
  'internal Restaurant names never enter the public graph'
);
select ok(
  public.get_restaurant_publication('public-restaurant-a')::text not like '%DRAFT TRANSLATION SECRET%'
    and public.get_restaurant_publication('public-restaurant-a')::text not like '%ARCHIVED%'
    and public.get_restaurant_publication('public-restaurant-a')::text not like '%HIDDEN%',
  'draft, archived, and hidden customer content never enters the public graph'
);
select ok(
  public.get_restaurant_publication('public-restaurant-a')::text not like '%created_by%'
    and public.get_restaurant_publication('public-restaurant-a')::text not like '%lifecycle_status%'
    and public.get_restaurant_publication('public-restaurant-a')::text not like '%publication_status%',
  'creator and internal lifecycle implementation fields are absent'
);
select ok(
  public.get_restaurant_publication('public-restaurant-a')::text not like '%Tenant B%',
  'tenant A projection cannot leak tenant B content'
);
select is(
  public.get_restaurant_publication('public-restaurant-b') #>> '{menus,0,categories,0,items,0,translations,0,name}',
  'Tenant B public item',
  'each canonical slug resolves only its own public graph'
);

reset role;
update restaurant.configurations
set is_publicly_active = false
where business_id = 'a1000000-0000-0000-0000-000000000001';
set local role anon;
select is(
  public.get_restaurant_publication('public-restaurant-a'),
  null,
  'inactive Restaurant configuration fails closed'
);

reset role;
update restaurant.configurations
set is_publicly_active = true
where business_id = 'a1000000-0000-0000-0000-000000000001';
update core.modules set is_available = false where key = 'restaurant';
set local role anon;
select is(
  public.get_restaurant_publication('public-restaurant-a'),
  null,
  'platform-unavailable Restaurant capability fails closed'
);

reset role;
select * from finish();
rollback;
