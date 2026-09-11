begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

create function pg_temp.capture_sqlstate(statement text)
returns text language plpgsql as $$
begin execute statement; return null;
exception when others then return sqlstate;
end;
$$;

select has_table('restaurant', 'location_public_profiles', 'governed location public profiles exist');
select has_table('restaurant', 'location_opening_intervals', 'regular opening intervals exist');
select has_function(
  'restaurant', 'save_location_public_details',
  array['uuid','uuid','text','text','text','text','text','jsonb'],
  'one narrow public-details mutation exists'
);
select ok(
  has_function_privilege(
    'authenticated',
    'restaurant.save_location_public_details(uuid,uuid,text,text,text,text,text,jsonb)',
    'execute'
  ),
  'authenticated callers may reach the guarded mutation'
);
select ok(
  not has_function_privilege(
    'anon',
    'restaurant.save_location_public_details(uuid,uuid,text,text,text,text,text,jsonb)',
    'execute'
  ),
  'anonymous callers cannot mutate location public details'
);
select ok(
  not has_function_privilege(
    'service_role',
    'restaurant.save_location_public_details(uuid,uuid,text,text,text,text,text,jsonb)',
    'execute'
  ),
  'service role is not conceptually granted the tenant mutation'
);
select is(
  (select prosecdef from pg_proc where oid =
    'restaurant.save_location_public_details(uuid,uuid,text,text,text,text,text,jsonb)'::regprocedure),
  true,
  'the mutation is a security-definer boundary'
);
select is(
  (select proconfig from pg_proc where oid =
    'restaurant.save_location_public_details(uuid,uuid,text,text,text,text,text,jsonb)'::regprocedure),
  array['search_path=""'],
  'the mutation uses an empty search path'
);
select ok(
  not has_table_privilege('anon', 'restaurant.location_public_profiles', 'select'),
  'anonymous callers cannot read raw public-profile administration rows'
);
select ok(
  not has_table_privilege('anon', 'restaurant.location_opening_intervals', 'select'),
  'anonymous callers cannot read raw opening-hours administration rows'
);
select ok(
  not has_table_privilege('authenticated', 'restaurant.location_public_profiles', 'insert'),
  'authenticated callers cannot bypass the governed profile mutation'
);
select ok(
  not has_table_privilege('authenticated', 'restaurant.location_opening_intervals', 'insert'),
  'authenticated callers cannot bypass the governed hours mutation'
);

insert into auth.users (
  id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('fa100000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'launch-owner@example.test', '{}', '{}', now(), now()),
  ('fa100000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'launch-outsider@example.test', '{}', '{}', now(), now());

insert into core.businesses (id, slug, display_name, default_locale, status)
values
  ('fa200000-0000-0000-0000-000000000001', 'launch-ready-a', 'Launch Ready A', 'en', 'active'),
  ('fa200000-0000-0000-0000-000000000002', 'launch-ready-b', 'Launch Ready B', 'en', 'active');

update core.business_plan_assignments set plan_key = 'restaurant-starter'
where business_id in (
  'fa200000-0000-0000-0000-000000000001',
  'fa200000-0000-0000-0000-000000000002'
);

insert into core.business_modules (business_id, module_key, is_enabled)
values
  ('fa200000-0000-0000-0000-000000000001', 'restaurant', true),
  ('fa200000-0000-0000-0000-000000000002', 'restaurant', true);

insert into core.memberships (id, business_id, user_id)
values
  ('fa300000-0000-0000-0000-000000000001', 'fa200000-0000-0000-0000-000000000001', 'fa100000-0000-0000-0000-000000000001'),
  ('fa300000-0000-0000-0000-000000000002', 'fa200000-0000-0000-0000-000000000002', 'fa100000-0000-0000-0000-000000000002');

insert into core.membership_permissions (business_id, membership_id, permission_key)
values
  ('fa200000-0000-0000-0000-000000000001', 'fa300000-0000-0000-0000-000000000001', 'restaurant.read'),
  ('fa200000-0000-0000-0000-000000000001', 'fa300000-0000-0000-0000-000000000001', 'restaurant.manage'),
  ('fa200000-0000-0000-0000-000000000002', 'fa300000-0000-0000-0000-000000000002', 'restaurant.read'),
  ('fa200000-0000-0000-0000-000000000002', 'fa300000-0000-0000-0000-000000000002', 'restaurant.manage');

insert into core.locations (
  id, business_id, display_name, status, address_line, locality, postal_code, timezone
) values
  ('fa400000-0000-0000-0000-000000000001', 'fa200000-0000-0000-0000-000000000001', 'Main location', 'active', '1 Market Street', 'Jerusalem', '91000', 'Asia/Jerusalem'),
  ('fa400000-0000-0000-0000-000000000002', 'fa200000-0000-0000-0000-000000000001', 'Inactive location', 'inactive', '2 Market Street', 'Jerusalem', null, 'Asia/Jerusalem'),
  ('fa400000-0000-0000-0000-000000000003', 'fa200000-0000-0000-0000-000000000002', 'Other tenant', 'active', null, 'Haifa', null, 'Asia/Jerusalem');

insert into restaurant.configurations (business_id, is_publicly_active)
values ('fa200000-0000-0000-0000-000000000001', true);
insert into restaurant.menus (id, business_id, internal_name, publication_status)
values ('fa500000-0000-0000-0000-000000000001', 'fa200000-0000-0000-0000-000000000001', 'Main menu', 'published');
insert into restaurant.menu_translations (business_id, menu_id, locale_code, name)
values ('fa200000-0000-0000-0000-000000000001', 'fa500000-0000-0000-0000-000000000001', 'en', 'Menu');
insert into restaurant.categories (id, business_id, menu_id, internal_name)
values ('fa600000-0000-0000-0000-000000000001', 'fa200000-0000-0000-0000-000000000001', 'fa500000-0000-0000-0000-000000000001', 'Food');
insert into restaurant.category_translations (business_id, category_id, locale_code, name)
values ('fa200000-0000-0000-0000-000000000001', 'fa600000-0000-0000-0000-000000000001', 'en', 'Food');
insert into restaurant.items (id, business_id, menu_id, category_id, internal_name, base_price_minor)
values ('fa700000-0000-0000-0000-000000000001', 'fa200000-0000-0000-0000-000000000001', 'fa500000-0000-0000-0000-000000000001', 'fa600000-0000-0000-0000-000000000001', 'Dish', 2500);
insert into restaurant.item_translations (business_id, item_id, locale_code, name)
values ('fa200000-0000-0000-0000-000000000001', 'fa700000-0000-0000-0000-000000000001', 'en', 'Public dish');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'fa100000-0000-0000-0000-000000000001', true);

select results_eq(
  $$select changed from restaurant.save_location_public_details(
    'fa200000-0000-0000-0000-000000000001',
    'fa400000-0000-0000-0000-000000000001',
    '+972501234567', 'HELLO@EXAMPLE.COM', 'https://example.com/menu',
    '+972509876543', 'https://maps.example/place',
    '[{"weekday":1,"opensAt":"09:00","closesAt":"14:00"},{"weekday":1,"opensAt":"18:00","closesAt":"02:00"},{"weekday":5,"opensAt":"10:00","closesAt":"15:00"}]'::jsonb
  )$$,
  $$values (true)$$,
  'an authorized manager saves safe contact details and split/overnight hours'
);
select results_eq(
  $$select changed from restaurant.save_location_public_details(
    'fa200000-0000-0000-0000-000000000001',
    'fa400000-0000-0000-0000-000000000001',
    '+972501234567', 'hello@example.com', 'https://example.com/menu',
    '+972509876543', 'https://maps.example/place',
    '[{"weekday":5,"opensAt":"10:00","closesAt":"15:00"},{"weekday":1,"opensAt":"18:00","closesAt":"02:00"},{"weekday":1,"opensAt":"09:00","closesAt":"14:00"}]'::jsonb
  )$$,
  $$values (false)$$,
  'canonical ordering makes equivalent retries explicit no-ops'
);
select is(
  (select public_email from restaurant.location_public_profiles where location_id = 'fa400000-0000-0000-0000-000000000001'),
  'hello@example.com',
  'public email is normalized'
);
select is(
  (select count(*)::integer from restaurant.location_opening_intervals where location_id = 'fa400000-0000-0000-0000-000000000001'),
  3,
  'multiple regular intervals are stored relationally'
);
select is(
  pg_temp.capture_sqlstate($$select * from restaurant.save_location_public_details(
    'fa200000-0000-0000-0000-000000000001',
    'fa400000-0000-0000-0000-000000000001',
    null, null, 'javascript:alert(1)', null, null, '[]'::jsonb
  )$$),
  '22023',
  'unsafe public URL protocols are rejected authoritatively'
);
select is(
  pg_temp.capture_sqlstate($$select * from restaurant.save_location_public_details(
    'fa200000-0000-0000-0000-000000000001',
    'fa400000-0000-0000-0000-000000000001',
    null, null, 'https://user:password@example.com', null, null, '[]'::jsonb
  )$$),
  '22023',
  'credential-bearing public URLs are rejected authoritatively'
);
select is(
  pg_temp.capture_sqlstate($$select * from restaurant.save_location_public_details(
    'fa200000-0000-0000-0000-000000000001',
    'fa400000-0000-0000-0000-000000000001',
    null, null, null, null, null,
    '[{"weekday":1,"opensAt":"09:00","closesAt":"14:00"},{"weekday":1,"opensAt":"12:00","closesAt":"15:00"}]'::jsonb
  )$$),
  '22023',
  'overlapping regular intervals are rejected authoritatively'
);
select is(
  pg_temp.capture_sqlstate($$select * from restaurant.save_location_public_details(
    'fa200000-0000-0000-0000-000000000002',
    'fa400000-0000-0000-0000-000000000003',
    null, null, null, null, null, '[]'::jsonb
  )$$),
  '42501',
  'a manager cannot mutate another tenant public profile'
);

reset role;
select is(
  (select count(*)::integer from core.audit_events where business_id = 'fa200000-0000-0000-0000-000000000001' and action_key = 'restaurant.location_public_details_updated'),
  1,
  'one redacted audit event records the actual change'
);
select ok(
  (select metadata::text from core.audit_events where business_id = 'fa200000-0000-0000-0000-000000000001' and action_key = 'restaurant.location_public_details_updated')
    not like '%hello@example.com%'
    and (select metadata::text from core.audit_events where business_id = 'fa200000-0000-0000-0000-000000000001' and action_key = 'restaurant.location_public_details_updated')
    not like '%501234567%',
  'audit metadata excludes public contact values'
);

set local role anon;
select set_config('request.jwt.claim.sub', '', true);

select is(
  public.get_restaurant_publication('launch-ready-a') #>> '{locations,0,contact,phone}',
  '+972501234567',
  'the curated projection includes only the governed public phone'
);
select is(
  public.get_restaurant_publication('launch-ready-a') #>> '{locations,0,openingHours,1,closesAt}',
  '02:00',
  'the curated projection preserves overnight closing time'
);
select is(
  jsonb_array_length(public.get_restaurant_publication('launch-ready-a') -> 'locations'),
  1,
  'inactive locations remain excluded from the public projection'
);
select ok(
  public.get_restaurant_publication('launch-ready-a')::text not like '%created_by%'
    and public.get_restaurant_publication('launch-ready-a')::text not like '%updated_at%',
  'public location details contain no administration metadata'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'fa100000-0000-0000-0000-000000000002', true);
select is(
  (select count(*)::integer from restaurant.location_public_profiles),
  0,
  'another tenant cannot read the first tenant profile rows'
);
select is(
  (select count(*)::integer from restaurant.location_opening_intervals),
  0,
  'another tenant cannot read the first tenant hours rows'
);

reset role;
select * from finish();
rollback;
