begin;

create extension if not exists pgtap with schema extensions;

select no_plan();

select has_function(
  'public',
  'list_public_restaurant_sitemap',
  array[]::text[],
  'one anonymous-safe Restaurant discovery projection exists'
);
select ok(
  has_function_privilege('anon', 'public.list_public_restaurant_sitemap()', 'execute'),
  'anonymous callers may execute the curated discovery projection'
);
select ok(
  has_function_privilege('authenticated', 'public.list_public_restaurant_sitemap()', 'execute'),
  'authenticated callers may use the same public discovery projection'
);
select ok(
  not has_function_privilege('service_role', 'public.list_public_restaurant_sitemap()', 'execute'),
  'service role is not conceptually granted the public discovery projection'
);
select is(
  (select prosecdef from pg_proc where oid = 'public.list_public_restaurant_sitemap()'::regprocedure),
  true,
  'the discovery projection owns its narrow definer boundary'
);
select is(
  (select proconfig from pg_proc where oid = 'public.list_public_restaurant_sitemap()'::regprocedure),
  array['search_path=""'],
  'the discovery projection has an empty search path'
);

insert into core.businesses (id, slug, display_name, default_locale, status)
values
  ('13000000-0000-0000-0000-000000000001', 'discoverable-restaurant', 'Discoverable', 'en', 'active'),
  ('13000000-0000-0000-0000-000000000002', 'private-restaurant', 'Private', 'en', 'active'),
  ('13000000-0000-0000-0000-000000000003', 'disabled-restaurant', 'Disabled', 'en', 'active'),
  ('13000000-0000-0000-0000-000000000004', 'suspended-restaurant', 'Suspended', 'en', 'suspended'),
  ('13000000-0000-0000-0000-000000000005', 'draft-only-restaurant', 'Draft only', 'en', 'active');

insert into core.business_locales (business_id, locale_code, is_enabled)
values
  ('13000000-0000-0000-0000-000000000001', 'ar', true),
  ('13000000-0000-0000-0000-000000000001', 'he', false);

insert into core.business_modules (business_id, module_key, is_enabled)
values
  ('13000000-0000-0000-0000-000000000001', 'restaurant', true),
  ('13000000-0000-0000-0000-000000000002', 'restaurant', true),
  ('13000000-0000-0000-0000-000000000003', 'restaurant', false),
  ('13000000-0000-0000-0000-000000000004', 'restaurant', true),
  ('13000000-0000-0000-0000-000000000005', 'restaurant', true);

insert into restaurant.configurations (business_id, is_publicly_active)
values
  ('13000000-0000-0000-0000-000000000001', true),
  ('13000000-0000-0000-0000-000000000002', false),
  ('13000000-0000-0000-0000-000000000003', true),
  ('13000000-0000-0000-0000-000000000004', true),
  ('13000000-0000-0000-0000-000000000005', true);

insert into restaurant.menus (
  id, business_id, internal_name, publication_status, lifecycle_status, display_order
)
values
  ('13100000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001', 'Public menu', 'published', 'active', 10),
  ('13100000-0000-0000-0000-000000000002', '13000000-0000-0000-0000-000000000002', 'Private menu', 'published', 'active', 10),
  ('13100000-0000-0000-0000-000000000003', '13000000-0000-0000-0000-000000000003', 'Disabled menu', 'published', 'active', 10),
  ('13100000-0000-0000-0000-000000000004', '13000000-0000-0000-0000-000000000004', 'Suspended menu', 'published', 'active', 10),
  ('13100000-0000-0000-0000-000000000005', '13000000-0000-0000-0000-000000000005', 'Draft menu', 'draft', 'active', 10);

insert into restaurant.menu_translations (business_id, menu_id, locale_code, name)
values
  ('13000000-0000-0000-0000-000000000001', '13100000-0000-0000-0000-000000000001', 'en', 'Public menu'),
  ('13000000-0000-0000-0000-000000000001', '13100000-0000-0000-0000-000000000001', 'ar', 'قائمة عامة'),
  ('13000000-0000-0000-0000-000000000002', '13100000-0000-0000-0000-000000000002', 'en', 'Private menu'),
  ('13000000-0000-0000-0000-000000000003', '13100000-0000-0000-0000-000000000003', 'en', 'Disabled menu'),
  ('13000000-0000-0000-0000-000000000004', '13100000-0000-0000-0000-000000000004', 'en', 'Suspended menu'),
  ('13000000-0000-0000-0000-000000000005', '13100000-0000-0000-0000-000000000005', 'en', 'Draft menu');

insert into core.business_domains (
  business_id, hostname, status, verification_token, verification_method,
  verification_checked_at, verified_at, target_module_key, routing_status,
  routing_checked_at, routing_live_at, is_primary
)
values (
  '13000000-0000-0000-0000-000000000001', 'discoverable.example.test', 'verified',
  repeat('d', 64), 'dns_txt', now(), now(), 'restaurant', 'live', now(), now(), true
);

select ok(
  not has_table_privilege('anon', 'core.businesses', 'select')
    and not has_table_privilege('anon', 'restaurant.menus', 'select'),
  'discovery adds no anonymous raw tenant-table access'
);

set local role anon;
select set_config('request.jwt.claim.sub', '', true);

select results_eq(
  $$select business_slug from public.list_public_restaurant_sitemap()$$,
  $$values ('discoverable-restaurant'::text)$$,
  'only active, enabled, publicly configured Restaurants with published content are discoverable'
);
select results_eq(
  $$select default_locale::text, locales::text from public.list_public_restaurant_sitemap()$$,
  $$values ('en'::text, '{en,ar}'::text)$$,
  'the canonical default and only enabled locales are projected in stable order'
);
select is(
  (select primary_hostname from public.list_public_restaurant_sitemap()),
  'discoverable.example.test',
  'the trusted primary live Restaurant hostname is projected for canonical discovery'
);

reset role;
update core.modules set is_available = false where key = 'restaurant';
set local role anon;
select is(
  (select count(*)::integer from public.list_public_restaurant_sitemap()),
  0,
  'a platform-unavailable Restaurant capability fails discovery closed'
);

reset role;
select * from finish();
rollback;
