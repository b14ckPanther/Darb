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

select has_schema('restaurant', 'Restaurant Engine has an isolated schema');
select has_table('restaurant', 'configurations', 'restaurant configuration table exists');
select has_table('restaurant', 'menus', 'menus table exists');
select has_table('restaurant', 'menu_translations', 'menu translations table exists');
select has_table('restaurant', 'categories', 'categories table exists');
select has_table('restaurant', 'category_translations', 'category translations table exists');
select has_table('restaurant', 'items', 'items table exists');
select has_table('restaurant', 'item_translations', 'item translations table exists');
select has_table('restaurant', 'item_variants', 'item variants table exists');
select has_table('restaurant', 'item_variant_translations', 'variant translations table exists');
select has_table('restaurant', 'modifier_groups', 'modifier groups table exists');
select has_table('restaurant', 'modifier_group_translations', 'modifier group translations table exists');
select has_table('restaurant', 'modifiers', 'modifiers table exists');
select has_table('restaurant', 'modifier_translations', 'modifier translations table exists');
select has_table('restaurant', 'item_modifier_groups', 'item modifier-group assignments exist');
select has_table('restaurant', 'item_location_availability', 'item location overrides exist');

select has_function('restaurant', 'save_configuration', array['uuid', 'boolean'], 'configuration mutation RPC exists');
select has_function('restaurant', 'save_menu', array['uuid', 'uuid', 'text', 'text', 'text', 'integer'], 'menu mutation RPC exists');
select has_function('restaurant', 'save_category', array['uuid', 'uuid', 'uuid', 'text', 'uuid', 'boolean', 'text', 'integer'], 'category mutation RPC exists');
select has_function('restaurant', 'save_item', array['uuid', 'uuid', 'uuid', 'uuid', 'text', 'bigint', 'uuid', 'boolean', 'text', 'text', 'integer'], 'item mutation RPC exists');
select has_function('restaurant', 'save_item_variant', array['uuid', 'uuid', 'uuid', 'text', 'bigint', 'boolean', 'text', 'text', 'integer'], 'variant mutation RPC exists');
select has_function('restaurant', 'save_modifier_group', array['uuid', 'uuid', 'text', 'boolean', 'text'], 'modifier-group mutation RPC exists');
select has_function('restaurant', 'save_modifier', array['uuid', 'uuid', 'uuid', 'text', 'bigint', 'boolean', 'text', 'text', 'integer'], 'modifier mutation RPC exists');
select has_function('restaurant', 'save_translation', array['uuid', 'text', 'uuid', 'text', 'text', 'text'], 'translation mutation RPC exists');
select has_function('restaurant', 'set_item_modifier_group', array['uuid', 'uuid', 'uuid', 'integer', 'integer', 'integer'], 'modifier assignment RPC exists');
select has_function('restaurant', 'remove_item_modifier_group', array['uuid', 'uuid', 'uuid'], 'modifier removal RPC exists');
select has_function('restaurant', 'set_item_location_availability', array['uuid', 'uuid', 'uuid', 'text'], 'location availability RPC exists');

select is((select scope::text from core.permissions where key = 'restaurant.read'), 'business', 'restaurant.read is business scoped');
select is((select scope::text from core.permissions where key = 'restaurant.manage'), 'business', 'restaurant.manage is business scoped');
select is((select module_key from core.permissions where key = 'restaurant.read'), 'restaurant', 'restaurant.read belongs to the Restaurant capability');
select is((select module_key from core.permissions where key = 'restaurant.manage'), 'restaurant', 'restaurant.manage belongs to the Restaurant capability');
select ok(has_function_privilege('authenticated', 'restaurant.save_menu(uuid,uuid,text,text,text,integer)', 'execute'), 'authenticated callers may invoke guarded menu RPC');
select ok(not has_function_privilege('anon', 'restaurant.save_menu(uuid,uuid,text,text,text,integer)', 'execute'), 'anonymous callers cannot invoke menu RPC');
select ok(not has_function_privilege('service_role', 'restaurant.save_menu(uuid,uuid,text,text,text,integer)', 'execute'), 'service role is not conceptually granted tenant mutation RPC');
select ok(has_table_privilege('authenticated', 'restaurant.items', 'select'), 'authenticated role has RLS-bound item reads');
select ok(not has_table_privilege('authenticated', 'restaurant.items', 'insert'), 'authenticated role cannot bypass item mutation RPC');
select ok(not has_table_privilege('authenticated', 'restaurant.items', 'update'), 'authenticated role cannot directly update items');
select ok(not has_table_privilege('anon', 'restaurant.items', 'select'), 'anonymous role has no Restaurant admin reads');

select is(
  (select count(*)::integer from pg_class as relation
   join pg_namespace as namespace on namespace.oid = relation.relnamespace
   where namespace.nspname = 'restaurant' and relation.relkind = 'r' and relation.relrowsecurity),
  15,
  'RLS is enabled on every Restaurant tenant table'
);
select is(
  (select count(*)::integer from pg_policies where schemaname = 'restaurant' and cmd = 'SELECT'),
  15,
  'every Restaurant tenant table has an explicit authenticated read policy'
);
select is(
  (select count(*)::integer from pg_policies where schemaname = 'restaurant' and cmd <> 'SELECT'),
  0,
  'no direct Restaurant write policy bypasses the controlled mutation boundary'
);
select is(
  (select count(*)::integer from pg_proc as procedure
   join pg_namespace as namespace on namespace.oid = procedure.pronamespace
   where namespace.nspname in ('restaurant', 'private')
     and procedure.proname like '%restaurant%'
     and procedure.prosecdef
     and procedure.proconfig @> array['search_path=""']),
  (select count(*)::integer from pg_proc as procedure
   join pg_namespace as namespace on namespace.oid = procedure.pronamespace
   where namespace.nspname in ('restaurant', 'private')
     and procedure.proname like '%restaurant%'
     and procedure.prosecdef),
  'all Restaurant security-definer helpers use an empty search_path'
);

select is((select data_type from information_schema.columns where table_schema = 'restaurant' and table_name = 'items' and column_name = 'base_price_minor'), 'bigint', 'item base prices use bigint minor units');
select is((select data_type from information_schema.columns where table_schema = 'restaurant' and table_name = 'item_variants' and column_name = 'price_minor'), 'bigint', 'variant prices use bigint minor units');
select is((select data_type from information_schema.columns where table_schema = 'restaurant' and table_name = 'modifiers' and column_name = 'price_delta_minor'), 'bigint', 'modifier price deltas use bigint minor units');
select ok(not exists(select 1 from information_schema.columns where table_schema = 'restaurant' and column_name = 'currency_code'), 'Restaurant rows do not duplicate business currency');
select hasnt_table('restaurant', 'locations', 'Restaurant does not duplicate canonical core locations');
select hasnt_table('restaurant', 'media_assets', 'Restaurant does not duplicate canonical core media');
select hasnt_table('restaurant', 'orders', 'ordering tables are intentionally absent');

insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-0000000009a1', 'authenticated', 'authenticated', 'restaurant-owner-a@example.test', '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-0000000009a2', 'authenticated', 'authenticated', 'restaurant-reader-a@example.test', '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-0000000009a3', 'authenticated', 'authenticated', 'restaurant-location-only@example.test', '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-0000000009b1', 'authenticated', 'authenticated', 'restaurant-owner-b@example.test', '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-0000000009c1', 'authenticated', 'authenticated', 'restaurant-super@example.test', '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-0000000009d1', 'authenticated', 'authenticated', 'restaurant-lifecycle@example.test', '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-0000000009e1', 'authenticated', 'authenticated', 'restaurant-backfill-owner@example.test', '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-0000000009e2', 'authenticated', 'authenticated', 'restaurant-backfill-partial@example.test', '{}', '{}', now(), now());

insert into core.businesses (id, slug, display_name, default_locale, status)
values
  ('90000000-0000-0000-0000-000000000001', 'restaurant-business-a', 'Restaurant Business A', 'en', 'active'),
  ('90000000-0000-0000-0000-000000000002', 'restaurant-business-b', 'Restaurant Business B', 'he', 'active'),
  ('90000000-0000-0000-0000-000000000003', 'restaurant-suspended', 'Restaurant Suspended', 'ar', 'suspended'),
  ('90000000-0000-0000-0000-000000000004', 'restaurant-archived', 'Restaurant Archived', 'en', 'archived'),
  ('90000000-0000-0000-0000-000000000005', 'restaurant-backfill-a', 'Restaurant Backfill A', 'en', 'active'),
  ('90000000-0000-0000-0000-000000000006', 'restaurant-backfill-b', 'Restaurant Backfill B', 'en', 'active');

insert into core.locations (id, business_id, display_name)
values
  ('91000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000001', 'Location A'),
  ('91000000-0000-0000-0000-000000000002', '90000000-0000-0000-0000-000000000002', 'Location B');

insert into core.memberships (id, business_id, user_id)
values
  ('92000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000009a1'),
  ('92000000-0000-0000-0000-000000000002', '90000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000009a2'),
  ('92000000-0000-0000-0000-000000000003', '90000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000009a3'),
  ('92000000-0000-0000-0000-000000000004', '90000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000009b1'),
  ('92000000-0000-0000-0000-000000000005', '90000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-0000000009d1'),
  ('92000000-0000-0000-0000-000000000006', '90000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-0000000009d1'),
  ('92000000-0000-0000-0000-000000000007', '90000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-0000000009e1'),
  ('92000000-0000-0000-0000-000000000008', '90000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-0000000009e2');

insert into core.membership_permissions (business_id, membership_id, permission_key, location_id)
values
  ('90000000-0000-0000-0000-000000000001', '92000000-0000-0000-0000-000000000001', 'restaurant.read', null),
  ('90000000-0000-0000-0000-000000000001', '92000000-0000-0000-0000-000000000001', 'restaurant.manage', null),
  ('90000000-0000-0000-0000-000000000001', '92000000-0000-0000-0000-000000000002', 'restaurant.read', null),
  ('90000000-0000-0000-0000-000000000001', '92000000-0000-0000-0000-000000000003', 'locations.manage', '91000000-0000-0000-0000-000000000001'),
  ('90000000-0000-0000-0000-000000000002', '92000000-0000-0000-0000-000000000004', 'restaurant.read', null),
  ('90000000-0000-0000-0000-000000000002', '92000000-0000-0000-0000-000000000004', 'restaurant.manage', null),
  ('90000000-0000-0000-0000-000000000003', '92000000-0000-0000-0000-000000000005', 'restaurant.manage', null),
  ('90000000-0000-0000-0000-000000000004', '92000000-0000-0000-0000-000000000006', 'restaurant.manage', null);

insert into core.membership_permissions (business_id, membership_id, permission_key)
select '90000000-0000-0000-0000-000000000005', '92000000-0000-0000-0000-000000000007', permission_key
from unnest(array[
  'business.manage', 'locations.read', 'locations.manage', 'memberships.manage',
  'permissions.manage', 'modules.manage', 'media.manage', 'domains.manage',
  'appearance.manage', 'audit.view'
]) as prior_owner(permission_key);
insert into core.membership_permissions (business_id, membership_id, permission_key)
values
  ('90000000-0000-0000-0000-000000000006', '92000000-0000-0000-0000-000000000008', 'business.manage'),
  ('90000000-0000-0000-0000-000000000006', '92000000-0000-0000-0000-000000000008', 'modules.manage');

insert into core.business_modules (business_id, module_key, is_enabled)
values
  ('90000000-0000-0000-0000-000000000001', 'restaurant', true),
  ('90000000-0000-0000-0000-000000000002', 'restaurant', true),
  ('90000000-0000-0000-0000-000000000003', 'restaurant', true),
  ('90000000-0000-0000-0000-000000000004', 'restaurant', true);

insert into private.super_admins (user_id, reason)
values ('00000000-0000-0000-0000-0000000009c1', 'Transaction-scoped Restaurant security test');

insert into core.media_assets (
  id, business_id, storage_bucket, storage_path, media_kind, mime_type,
  byte_size, width, height, original_filename, status
) values
  ('93000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000001',
   'tenant-media-images', '90000000-0000-0000-0000-000000000001/93000000-0000-0000-0000-000000000001/menu.webp',
   'image', 'image/webp', 1024, 100, 100, 'menu.webp', 'active'),
  ('93000000-0000-0000-0000-000000000002', '90000000-0000-0000-0000-000000000002',
   'tenant-media-images', '90000000-0000-0000-0000-000000000002/93000000-0000-0000-0000-000000000002/menu.webp',
   'image', 'image/webp', 1024, 100, 100, 'menu.webp', 'active');

select is(private.backfill_phase9_owner_permissions(), 2, 'narrow Phase 9 backfill adds exactly two permissions to one complete prior owner');
select set_eq(
  $$select permission_key from core.membership_permissions where membership_id = '92000000-0000-0000-0000-000000000007' and permission_key like 'restaurant.%'$$,
  $$values ('restaurant.read'::text), ('restaurant.manage'::text)$$,
  'complete prior owner receives only the reviewed Restaurant permission pair'
);
select is((select count(*)::integer from core.membership_permissions where membership_id = '92000000-0000-0000-0000-000000000008' and permission_key like 'restaurant.%'), 0, 'partial custom membership is not broadened');
select is(private.backfill_phase9_owner_permissions(), 0, 'Phase 9 permission backfill is idempotent');

select is((select count(*)::integer from restaurant.configurations), 0, 'enabling Restaurant does not create configuration or fake content');
select is((select count(*)::integer from restaurant.menus), 0, 'enabling Restaurant does not invent menus');

create temporary table restaurant_test_ids (key text primary key, id uuid) on commit drop;
grant select, insert, update, delete on restaurant_test_ids to authenticated;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000009a1', true);

select results_eq(
  $$select changed from restaurant.save_configuration('90000000-0000-0000-0000-000000000001', true)$$,
  $$values (true)$$,
  'Restaurant manager can create engine configuration'
);
select results_eq(
  $$select changed from restaurant.save_configuration('90000000-0000-0000-0000-000000000001', true)$$,
  $$values (false)$$,
  'configuration no-op is explicit and idempotent'
);
insert into restaurant_test_ids
select 'menu_a', menu_id from restaurant.save_menu(
  '90000000-0000-0000-0000-000000000001', null, 'Main menu', 'draft', 'active', 10
);
insert into restaurant_test_ids
select 'menu_a_second', menu_id from restaurant.save_menu(
  '90000000-0000-0000-0000-000000000001', null, 'Drinks', 'published', 'active', 20
);
select is((select count(*)::integer from restaurant.menus where business_id = '90000000-0000-0000-0000-000000000001'), 2, 'one business can own multiple ordered menus');
select results_eq(
  $$select display_order from restaurant.menus where business_id = '90000000-0000-0000-0000-000000000001' order by display_order$$,
  $$values (10), (20)$$,
  'menu ordering is deterministic'
);

insert into restaurant_test_ids
select 'category_a', category_id from restaurant.save_category(
  '90000000-0000-0000-0000-000000000001', null,
  (select id from restaurant_test_ids where key = 'menu_a'), 'Mains',
  '93000000-0000-0000-0000-000000000001', true, 'active', 10
);
insert into restaurant_test_ids
select 'item_a', item_id from restaurant.save_item(
  '90000000-0000-0000-0000-000000000001', null,
  (select id from restaurant_test_ids where key = 'menu_a'),
  (select id from restaurant_test_ids where key = 'category_a'),
  'House item', 4500, '93000000-0000-0000-0000-000000000001', true,
  'available', 'active', 10
);
insert into restaurant_test_ids
select 'variant_a', variant_id from restaurant.save_item_variant(
  '90000000-0000-0000-0000-000000000001', null,
  (select id from restaurant_test_ids where key = 'item_a'),
  'Large', 6200, true, 'available', 'active', 10
);
insert into restaurant_test_ids
select 'group_a', modifier_group_id from restaurant.save_modifier_group(
  '90000000-0000-0000-0000-000000000001', null, 'Extras', true, 'active'
);
insert into restaurant_test_ids
select 'modifier_a', modifier_id from restaurant.save_modifier(
  '90000000-0000-0000-0000-000000000001', null,
  (select id from restaurant_test_ids where key = 'group_a'),
  'Extra portion', 500, true, 'available', 'active', 10
);

select results_eq(
  $$select changed from restaurant.set_item_modifier_group(
    '90000000-0000-0000-0000-000000000001',
    (select id from restaurant_test_ids where key = 'item_a'),
    (select id from restaurant_test_ids where key = 'group_a'), 1, 2, 10
  )$$,
  $$values (true)$$,
  'reusable modifier group can be assigned with item-specific selection bounds'
);
select results_eq(
  $$select changed from restaurant.set_item_modifier_group(
    '90000000-0000-0000-0000-000000000001',
    (select id from restaurant_test_ids where key = 'item_a'),
    (select id from restaurant_test_ids where key = 'group_a'), 1, 2, 10
  )$$,
  $$values (false)$$,
  'duplicate modifier assignment is an idempotent no-op'
);
select results_eq(
  $$select changed from restaurant.remove_item_modifier_group(
    '90000000-0000-0000-0000-000000000001',
    (select id from restaurant_test_ids where key = 'item_a'),
    (select id from restaurant_test_ids where key = 'group_a')
  )$$,
  $$values (true)$$,
  'modifier assignment can be removed explicitly'
);
select results_eq(
  $$select changed from restaurant.remove_item_modifier_group(
    '90000000-0000-0000-0000-000000000001',
    (select id from restaurant_test_ids where key = 'item_a'),
    (select id from restaurant_test_ids where key = 'group_a')
  )$$,
  $$values (false)$$,
  'removing an absent modifier assignment is an idempotent no-op'
);
select results_eq(
  $$select changed from restaurant.set_item_modifier_group(
    '90000000-0000-0000-0000-000000000001',
    (select id from restaurant_test_ids where key = 'item_a'),
    (select id from restaurant_test_ids where key = 'group_a'), 1, 2, 10
  )$$,
  $$values (true)$$,
  'modifier assignment can be restored after explicit removal'
);
select results_eq(
  $$select changed from restaurant.set_item_location_availability(
    '90000000-0000-0000-0000-000000000001',
    (select id from restaurant_test_ids where key = 'item_a'),
    '91000000-0000-0000-0000-000000000001', 'sold_out'
  )$$,
  $$values (true)$$,
  'location availability override is set without duplicating an item'
);
select results_eq(
  $$select changed from restaurant.set_item_location_availability(
    '90000000-0000-0000-0000-000000000001',
    (select id from restaurant_test_ids where key = 'item_a'),
    '91000000-0000-0000-0000-000000000001', 'sold_out'
  )$$,
  $$values (false)$$,
  'duplicate location override is an idempotent no-op'
);
select results_eq(
  $$select changed from restaurant.set_item_location_availability(
    '90000000-0000-0000-0000-000000000001',
    (select id from restaurant_test_ids where key = 'item_a'),
    '91000000-0000-0000-0000-000000000001', null
  )$$,
  $$values (true)$$,
  'null location state removes an override to restore inheritance'
);
select results_eq(
  $$select changed from restaurant.set_item_location_availability(
    '90000000-0000-0000-0000-000000000001',
    (select id from restaurant_test_ids where key = 'item_a'),
    '91000000-0000-0000-0000-000000000001', null
  )$$,
  $$values (false)$$,
  'removing an absent location override is an idempotent no-op'
);
select results_eq(
  $$select changed from restaurant.set_item_location_availability(
    '90000000-0000-0000-0000-000000000001',
    (select id from restaurant_test_ids where key = 'item_a'),
    '91000000-0000-0000-0000-000000000001', 'sold_out'
  )$$,
  $$values (true)$$,
  'location override can be restored after returning to inheritance'
);

select results_eq(
  $$select changed from restaurant.save_translation(
    '90000000-0000-0000-0000-000000000001', 'menu',
    (select id from restaurant_test_ids where key = 'menu_a'), 'en', 'Main menu', 'Core offering'
  )$$,
  $$values (true)$$,
  'supported enabled locale translation is accepted'
);
select results_eq(
  $$select changed from restaurant.save_translation(
    '90000000-0000-0000-0000-000000000001', 'menu',
    (select id from restaurant_test_ids where key = 'menu_a'), 'en', 'Main menu', 'Core offering'
  )$$,
  $$values (false)$$,
  'duplicate unchanged translation is an idempotent no-op'
);
select is(
  pg_temp.capture_sqlstate($$select * from restaurant.save_translation(
    '90000000-0000-0000-0000-000000000001', 'menu',
    (select id from restaurant_test_ids where key = 'menu_a'), 'fr', 'Menu', null
  )$$),
  '22023',
  'unsupported locale is rejected by the mutation boundary'
);
select is(
  pg_temp.capture_sqlstate($$select * from restaurant.save_translation(
    '90000000-0000-0000-0000-000000000001', 'menu',
    (select id from restaurant_test_ids where key = 'menu_a'), 'he', 'תפריט', null
  )$$),
  '23514',
  'supported but disabled business locale is rejected'
);

select results_eq(
  $$select changed from restaurant.save_item(
    '90000000-0000-0000-0000-000000000001',
    (select id from restaurant_test_ids where key = 'item_a'),
    (select id from restaurant_test_ids where key = 'menu_a'),
    (select id from restaurant_test_ids where key = 'category_a'),
    'House item', 4500, '93000000-0000-0000-0000-000000000001', true,
    'sold_out', 'active', 10
  )$$,
  $$values (true)$$,
  'temporary item availability changes independently of visibility and lifecycle'
);
select is(
  (select action_key from core.audit_events
   where entity_id = (select id::text from restaurant_test_ids where key = 'item_a')
   order by occurred_at desc, id desc limit 1),
  null,
  'audit rows remain hidden from a manager without audit.view'
);
select results_eq(
  $$select changed from restaurant.save_item(
    '90000000-0000-0000-0000-000000000001',
    (select id from restaurant_test_ids where key = 'item_a'),
    (select id from restaurant_test_ids where key = 'menu_a'),
    (select id from restaurant_test_ids where key = 'category_a'),
    'House item', 4500, '93000000-0000-0000-0000-000000000001', true,
    'available', 'active', 10
  )$$,
  $$values (true)$$,
  'item can return from sold-out without a lifecycle transition'
);
select results_eq(
  $$select changed from restaurant.save_menu(
    '90000000-0000-0000-0000-000000000001',
    (select id from restaurant_test_ids where key = 'menu_a_second'),
    'Drinks', 'published', 'archived', 20
  )$$,
  $$values (true)$$,
  'menu archive is a retained lifecycle transition'
);
select is(
  (select lifecycle_status::text from restaurant.menus
   where id = (select id from restaurant_test_ids where key = 'menu_a_second')),
  'archived',
  'archived menu row remains retained'
);
select is(
  pg_temp.capture_sqlstate($$select * from restaurant.save_menu(
    '90000000-0000-0000-0000-000000000001',
    (select id from restaurant_test_ids where key = 'menu_a_second'),
    'Drinks restored', 'draft', 'active', 20
  )$$),
  '55000',
  'archived content is immutable through the normal mutation boundary'
);

select is((select base_price_minor from restaurant.items where id = (select id from restaurant_test_ids where key = 'item_a')), 4500::bigint, 'item base price is stored exactly in minor units');
select is((select price_minor from restaurant.item_variants where id = (select id from restaurant_test_ids where key = 'variant_a')), 6200::bigint, 'variant price is an independent absolute minor-unit price');
select is((select price_delta_minor from restaurant.modifiers where id = (select id from restaurant_test_ids where key = 'modifier_a')), 500::bigint, 'modifier delta is stored exactly in minor units');
select is((select minimum_selections from restaurant.item_modifier_groups), 1, 'modifier assignment retains minimum selections');
select is((select maximum_selections from restaurant.item_modifier_groups), 2, 'modifier assignment retains maximum selections');
select is((select availability_status::text from restaurant.item_location_availability), 'sold_out', 'location override remains distinct from base item availability');
select is((select availability_status::text from restaurant.items where id = (select id from restaurant_test_ids where key = 'item_a')), 'available', 'location override does not mutate base item availability');

reset role;
select is(
  (select count(*)::integer from core.audit_events where business_id = '90000000-0000-0000-0000-000000000001' and action_key like 'restaurant.%'),
  18,
  'actual Restaurant mutations emit one narrow audit event each while no-ops do not'
);
select is(
  (select count(*)::integer from core.audit_events where action_key = 'restaurant.menu_created'),
  2,
  'menu creation audit uses a stable action key'
);
select is(
  (select count(*)::integer from core.audit_events where action_key = 'restaurant.item_availability_changed'),
  2,
  'availability-only item updates use their dedicated audit action'
);
select is(
  (select count(*)::integer from core.audit_events where action_key = 'restaurant.menu_archived'),
  1,
  'menu archive uses a retained-lifecycle audit action'
);
select ok(
  (select bool_and(actor_user_id = '00000000-0000-0000-0000-0000000009a1')
   from core.audit_events where business_id = '90000000-0000-0000-0000-000000000001' and action_key like 'restaurant.%'),
  'audit actor is always derived from the authenticated caller'
);
select ok(
  not exists(select 1 from core.audit_events where action_key like 'restaurant.%' and metadata ?| array['name', 'description', 'price_minor', 'base_price_minor']),
  'audit metadata excludes names, descriptions, and prices'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000009a1', true);
select is(pg_temp.capture_sqlstate($$insert into restaurant.menus (business_id, internal_name) values ('90000000-0000-0000-0000-000000000001', 'Direct')$$), '42501', 'authenticated direct menu write is denied');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000009a2', true);
select is((select count(*)::integer from restaurant.items), 1, 'restaurant.read can read authorized business content');
select is(pg_temp.capture_sqlstate($$select * from restaurant.save_menu('90000000-0000-0000-0000-000000000001', null, 'Denied', 'draft', 'active', 0)$$), '42501', 'read-only permission cannot mutate Restaurant data');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000009a3', true);
select is((select count(*)::integer from restaurant.items), 0, 'location-only platform permission does not grant business-wide Restaurant reads');
select is(pg_temp.capture_sqlstate($$select * from restaurant.save_menu('90000000-0000-0000-0000-000000000001', null, 'Denied', 'draft', 'active', 0)$$), '42501', 'location-scoped platform permission cannot mutate Restaurant data');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000009b1', true);
select is((select count(*)::integer from restaurant.items), 0, 'business B cannot read business A Restaurant rows');
select is(pg_temp.capture_sqlstate($$select * from restaurant.save_menu('90000000-0000-0000-0000-000000000001', null, 'Cross tenant', 'draft', 'active', 0)$$), '42501', 'business B manager cannot mutate business A');
insert into restaurant_test_ids
select 'menu_b', menu_id from restaurant.save_menu(
  '90000000-0000-0000-0000-000000000002', null, 'Business B menu', 'draft', 'active', 0
);
insert into restaurant_test_ids
select 'group_b', modifier_group_id from restaurant.save_modifier_group(
  '90000000-0000-0000-0000-000000000002', null, 'Business B group', true, 'active'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000009d1', true);
select is(pg_temp.capture_sqlstate($$select * from restaurant.save_menu('90000000-0000-0000-0000-000000000003', null, 'Suspended', 'draft', 'active', 0)$$), '55000', 'suspended business cannot mutate Restaurant data');
select is(pg_temp.capture_sqlstate($$select * from restaurant.save_menu('90000000-0000-0000-0000-000000000004', null, 'Archived', 'draft', 'active', 0)$$), '55000', 'archived business cannot mutate Restaurant data');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000009c1', true);
select results_eq(
  $$select changed from restaurant.save_configuration('90000000-0000-0000-0000-000000000002', true)$$,
  $$values (true)$$,
  'platform super admin remains explicit and can manage an active enabled tenant'
);
select is(pg_temp.capture_sqlstate($$select * from restaurant.save_menu('90000000-0000-0000-0000-000000000003', null, 'Still suspended', 'draft', 'active', 0)$$), '55000', 'super admin must restore business lifecycle before Restaurant mutation');

reset role;

select is(pg_temp.capture_sqlstate(format(
  'insert into restaurant.categories (business_id, menu_id, internal_name) values (%L, %L, %L)',
  '90000000-0000-0000-0000-000000000002',
  (select id from restaurant_test_ids where key = 'menu_a'), 'Cross tenant category'
)), '23503', 'declarative FK rejects business B category on business A menu');

insert into restaurant.categories (id, business_id, menu_id, internal_name)
values (
  '94000000-0000-0000-0000-000000000002', '90000000-0000-0000-0000-000000000002',
  (select id from restaurant_test_ids where key = 'menu_b'), 'Business B category'
);
select is(pg_temp.capture_sqlstate(format(
  'insert into restaurant.items (business_id, menu_id, category_id, internal_name, base_price_minor) values (%L, %L, %L, %L, 100)',
  '90000000-0000-0000-0000-000000000001',
  (select id from restaurant_test_ids where key = 'menu_b'),
  '94000000-0000-0000-0000-000000000002', 'Cross tenant item'
)), '23503', 'declarative FK rejects business A item on business B category');
select is(pg_temp.capture_sqlstate(format(
  'insert into restaurant.categories (business_id, menu_id, internal_name, image_media_asset_id) values (%L, %L, %L, %L)',
  '90000000-0000-0000-0000-000000000001',
  (select id from restaurant_test_ids where key = 'menu_a'), 'Cross tenant media',
  '93000000-0000-0000-0000-000000000002'
)), '23514', 'attachment trigger rejects cross-business media');
select is(pg_temp.capture_sqlstate(format(
  'insert into restaurant.item_modifier_groups (business_id, item_id, modifier_group_id) values (%L, %L, %L)',
  '90000000-0000-0000-0000-000000000001',
  (select id from restaurant_test_ids where key = 'item_a'),
  (select id from restaurant_test_ids where key = 'group_b')
)), '23503', 'declarative FK rejects cross-business modifier assignment');
select is(pg_temp.capture_sqlstate(format(
  'insert into restaurant.item_location_availability (business_id, item_id, location_id, availability_status) values (%L, %L, %L, %L)',
  '90000000-0000-0000-0000-000000000001',
  (select id from restaurant_test_ids where key = 'item_a'),
  '91000000-0000-0000-0000-000000000002', 'sold_out'
)), '23503', 'declarative FK rejects cross-business location override');
select is(pg_temp.capture_sqlstate(format(
  'insert into restaurant.menu_translations (business_id, menu_id, locale_code, name) values (%L, %L, %L, %L)',
  '90000000-0000-0000-0000-000000000002',
  (select id from restaurant_test_ids where key = 'menu_a'), 'he', 'Cross tenant'
)), '23503', 'translation ownership FK rejects a cross-business entity relationship');
select is(pg_temp.capture_sqlstate(format(
  'insert into restaurant.menu_translations (business_id, menu_id, locale_code, name) values (%L, %L, %L, %L)',
  '90000000-0000-0000-0000-000000000001',
  (select id from restaurant_test_ids where key = 'menu_a'), 'en', 'Duplicate'
)), '23505', 'one translation per entity and locale is enforced');
select is(pg_temp.capture_sqlstate(format(
  'insert into restaurant.items (business_id, menu_id, category_id, internal_name, base_price_minor) values (%L, %L, %L, %L, -1)',
  '90000000-0000-0000-0000-000000000001',
  (select id from restaurant_test_ids where key = 'menu_a'),
  (select id from restaurant_test_ids where key = 'category_a'), 'Negative price'
)), '23514', 'negative item price is rejected');
select is(pg_temp.capture_sqlstate(format(
  'insert into restaurant.item_variants (business_id, item_id, internal_name, price_minor) values (%L, %L, %L, -1)',
  '90000000-0000-0000-0000-000000000001',
  (select id from restaurant_test_ids where key = 'item_a'), 'Negative variant'
)), '23514', 'negative variant price is rejected');
select is(pg_temp.capture_sqlstate(format(
  'insert into restaurant.modifiers (business_id, modifier_group_id, internal_name, price_delta_minor) values (%L, %L, %L, -1)',
  '90000000-0000-0000-0000-000000000001',
  (select id from restaurant_test_ids where key = 'group_a'), 'Negative modifier'
)), '23514', 'negative modifier price delta is rejected');
select is(pg_temp.capture_sqlstate(format(
  'insert into restaurant.menus (business_id, internal_name, display_order) values (%L, %L, -1)',
  '90000000-0000-0000-0000-000000000001', 'Bad order'
)), '23514', 'negative display order is rejected');
select is(pg_temp.capture_sqlstate(format(
  'insert into restaurant.item_modifier_groups (business_id, item_id, modifier_group_id, minimum_selections, maximum_selections) values (%L, %L, %L, 2, 1)',
  '90000000-0000-0000-0000-000000000001',
  (select id from restaurant_test_ids where key = 'item_a'),
  (select id from restaurant_test_ids where key = 'group_a')
)), '23514', 'modifier minimum cannot exceed maximum');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000009a1', true);
select is(
  pg_temp.capture_sqlstate($$select * from restaurant.save_item(
    '90000000-0000-0000-0000-000000000001', null,
    (select id from restaurant_test_ids where key = 'menu_a'),
    (select id from restaurant_test_ids where key = 'category_a'),
    'Cross tenant image', 100, '93000000-0000-0000-0000-000000000002', true,
    'available', 'active', 30
  )$$),
  '23514',
  'mutation API rejects cross-business media'
);
select is((select count(*)::integer from restaurant.items where internal_name = 'Cross tenant image'), 0, 'failed mutation does not partially create an item');
select is((select count(*)::integer from core.audit_events where entity_type = 'restaurant.item' and metadata ->> 'source' = 'Cross tenant image'), 0, 'failed mutation does not write an audit event');

reset role;
update core.business_modules set is_enabled = false
where business_id = '90000000-0000-0000-0000-000000000001' and module_key = 'restaurant';
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000009a1', true);
select is(pg_temp.capture_sqlstate($$select * from restaurant.save_menu('90000000-0000-0000-0000-000000000001', null, 'Disabled', 'draft', 'active', 0)$$), '55000', 'disabled Restaurant capability blocks mutation');
select is((select count(*)::integer from restaurant.menus), 2, 'disabled capability retains and exposes authorized historical Restaurant data');

reset role;
update core.business_modules set is_enabled = true
where business_id = '90000000-0000-0000-0000-000000000001' and module_key = 'restaurant';
update core.modules set is_available = false where key = 'restaurant';
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000009a1', true);
select is(pg_temp.capture_sqlstate($$select * from restaurant.save_menu('90000000-0000-0000-0000-000000000001', null, 'Unavailable', 'draft', 'active', 0)$$), '55000', 'platform-unavailable Restaurant module blocks mutation');
select is((select count(*)::integer from restaurant.items), 1, 'unavailable module retains authorized historical data');

reset role;
update core.modules set is_available = true where key = 'restaurant';

set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select is(pg_temp.capture_sqlstate($$select * from restaurant.menus$$), '42501', 'anonymous caller cannot read Restaurant administration tables');
select is(pg_temp.capture_sqlstate($$select * from restaurant.save_menu('90000000-0000-0000-0000-000000000001', null, 'Anonymous', 'draft', 'active', 0)$$), '42501', 'anonymous caller cannot execute Restaurant mutation RPC');

reset role;
select * from finish();
rollback;
