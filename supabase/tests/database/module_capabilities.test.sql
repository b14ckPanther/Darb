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
  when others then
    return sqlstate;
end;
$$;

select plan(52);

insert into auth.users (
  id,
  aud,
  role,
  email,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  ('00000000-0000-0000-0000-0000000005a1', 'authenticated', 'authenticated', 'module-owner@example.test', '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-0000000005a2', 'authenticated', 'authenticated', 'module-reader@example.test', '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-0000000005a3', 'authenticated', 'authenticated', 'module-scoped@example.test', '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-0000000005b1', 'authenticated', 'authenticated', 'module-other-owner@example.test', '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-0000000005c1', 'authenticated', 'authenticated', 'module-super-admin@example.test', '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-0000000005d1', 'authenticated', 'authenticated', 'module-lifecycle-owner@example.test', '{}'::jsonb, '{}'::jsonb, now(), now());

insert into core.businesses (id, slug, display_name, default_locale, status)
values
  ('50000000-0000-0000-0000-000000000001', 'module-business-a', 'Module Business A', 'en', 'active'),
  ('50000000-0000-0000-0000-000000000002', 'module-business-b', 'Module Business B', 'he', 'active'),
  ('50000000-0000-0000-0000-000000000003', 'module-business-suspended', 'Suspended Module Business', 'ar', 'suspended'),
  ('50000000-0000-0000-0000-000000000004', 'module-business-archived', 'Archived Module Business', 'en', 'archived');

insert into core.locations (id, business_id, display_name)
values (
  '51000000-0000-0000-0000-000000000001',
  '50000000-0000-0000-0000-000000000001',
  'Module Scoped Location'
);

insert into core.memberships (id, business_id, user_id)
values
  ('52000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000005a1'),
  ('52000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000005a2'),
  ('52000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000005a3'),
  ('52000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000005b1'),
  ('52000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-0000000005d1'),
  ('52000000-0000-0000-0000-000000000006', '50000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-0000000005d1');

insert into core.membership_permissions (
  business_id,
  membership_id,
  permission_key,
  location_id
)
values
  ('50000000-0000-0000-0000-000000000001', '52000000-0000-0000-0000-000000000001', 'modules.manage', null),
  ('50000000-0000-0000-0000-000000000001', '52000000-0000-0000-0000-000000000003', 'locations.manage', '51000000-0000-0000-0000-000000000001'),
  ('50000000-0000-0000-0000-000000000002', '52000000-0000-0000-0000-000000000004', 'modules.manage', null),
  ('50000000-0000-0000-0000-000000000003', '52000000-0000-0000-0000-000000000005', 'modules.manage', null),
  ('50000000-0000-0000-0000-000000000004', '52000000-0000-0000-0000-000000000006', 'modules.manage', null);

insert into private.super_admins (user_id, reason)
values (
  '00000000-0000-0000-0000-0000000005c1',
  'Transaction-scoped module capability test'
);

-- The platform lifecycle remains migration-managed. This row is restored by rollback.
update core.modules set is_available = false where key = 'booking';

-- 1–10: shape, grants, registry metadata, and anonymous denial.
select has_function(
  'core',
  'set_business_module_enabled',
  array['uuid', 'text', 'boolean'],
  'module state has one narrow caller-derived mutation function'
);

select ok(
  has_function_privilege('authenticated', 'core.set_business_module_enabled(uuid,text,boolean)', 'execute'),
  'authenticated callers may execute the module mutation boundary'
);

select ok(
  not has_function_privilege('service_role', 'core.set_business_module_enabled(uuid,text,boolean)', 'execute'),
  'service role is not conceptually granted the tenant module mutation boundary'
);

select has_column('core', 'modules', 'display_name', 'module registry has a platform display label');
select has_column('core', 'modules', 'sort_order', 'module registry has a stable ordering hint');

select results_eq(
  $$select key, display_name, sort_order from core.modules order by sort_order$$,
  $$values
    ('restaurant'::text, 'Restaurant'::text, 10),
    ('booking'::text, 'Booking'::text, 20),
    ('pages'::text, 'Pages'::text, 30),
    ('commerce'::text, 'Commerce'::text, 40)$$,
  'the canonical platform registry remains deterministic'
);

select is(
  (select count(*)::integer from core.modules where is_available),
  3,
  'platform availability is independent from tenant state'
);

select ok(
  not has_table_privilege('authenticated', 'core.business_modules', 'insert'),
  'authenticated users cannot bypass the audited insert boundary'
);

select ok(
  not has_table_privilege('authenticated', 'core.business_modules', 'update'),
  'authenticated users cannot bypass the audited update boundary'
);

set local role anon;
select set_config('request.jwt.claim.sub', '', true);

select is(
  pg_temp.capture_sqlstate(
    $$select * from core.set_business_module_enabled(
      '50000000-0000-0000-0000-000000000001', 'restaurant', true
    )$$
  ),
  '42501',
  'anonymous callers cannot mutate module state'
);

-- 11–29: successful transitions, persistence, audit, and idempotency.
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000005a1', true);

select results_eq(
  $$select can_manage_modules, is_super_admin
      from core.current_user_business_access('50000000-0000-0000-0000-000000000001')$$,
  $$values (true, false)$$,
  'the access snapshot exposes database-authoritative module management access'
);

select is(
  (select count(*)::integer from core.modules),
  4,
  'authorized members can read the platform module registry'
);

select is(
  (select count(*)::integer from core.business_modules where business_id = '50000000-0000-0000-0000-000000000001'),
  0,
  'a new business starts with no module state rows'
);

select results_eq(
  $$select module_key, is_enabled, changed from core.set_business_module_enabled(
      '50000000-0000-0000-0000-000000000001', 'restaurant', true
    )$$,
  $$values ('restaurant'::text, true, true)$$,
  'modules.manage can enable an available capability'
);

select results_eq(
  $$select module_key, is_enabled from core.business_modules
      where business_id = '50000000-0000-0000-0000-000000000001'$$,
  $$values ('restaurant'::text, true)$$,
  'enabled state persists in one tenant-owned row'
);

reset role;
select is(
  (select count(*)::integer from core.audit_events
    where business_id = '50000000-0000-0000-0000-000000000001'
      and action_key = 'business.module_enabled'),
  1,
  'an actual enable transition emits one audit event'
);

select results_eq(
  $$select actor_user_id, entity_type, entity_id,
      metadata ->> 'module_key',
      metadata ->> 'previous_enabled',
      metadata ->> 'new_enabled'
    from core.audit_events
    where business_id = '50000000-0000-0000-0000-000000000001'
      and action_key = 'business.module_enabled'$$,
  $$values (
    '00000000-0000-0000-0000-0000000005a1'::uuid,
    'core.business_module'::text,
    'restaurant'::text,
    'restaurant'::text,
    'false'::text,
    'true'::text
  )$$,
  'enable audit metadata is narrow and derives the actor from auth.uid'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000005a1', true);

select results_eq(
  $$select module_key, is_enabled, changed from core.set_business_module_enabled(
      '50000000-0000-0000-0000-000000000001', 'restaurant', true
    )$$,
  $$values ('restaurant'::text, true, false)$$,
  'enabling an enabled module is an explicit no-op'
);

reset role;
select is(
  (select count(*)::integer from core.business_modules
    where business_id = '50000000-0000-0000-0000-000000000001'
      and module_key = 'restaurant'),
  1,
  'repeated enable preserves the unique business and module row'
);

select is(
  (select count(*)::integer from core.audit_events
    where business_id = '50000000-0000-0000-0000-000000000001'
      and action_key = 'business.module_enabled'),
  1,
  'a no-op enable does not duplicate audit history'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000005a1', true);

select results_eq(
  $$select module_key, is_enabled, changed from core.set_business_module_enabled(
      '50000000-0000-0000-0000-000000000001', 'restaurant', false
    )$$,
  $$values ('restaurant'::text, false, true)$$,
  'modules.manage can disable an enabled capability'
);

select results_eq(
  $$select module_key, is_enabled from core.business_modules
      where business_id = '50000000-0000-0000-0000-000000000001'$$,
  $$values ('restaurant'::text, false)$$,
  'disabled state remains explicit after a prior enable'
);

reset role;
select is(
  (select count(*)::integer from core.audit_events
    where business_id = '50000000-0000-0000-0000-000000000001'
      and action_key = 'business.module_disabled'),
  1,
  'an actual disable transition emits one audit event'
);

select is(
  (select count(*)::integer from core.audit_events
    where business_id = '50000000-0000-0000-0000-000000000001'
      and action_key like 'business.module_%'),
  2,
  'one enable and one disable produce exactly two audit events'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000005a1', true);

select results_eq(
  $$select module_key, is_enabled, changed from core.set_business_module_enabled(
      '50000000-0000-0000-0000-000000000001', 'restaurant', false
    )$$,
  $$values ('restaurant'::text, false, false)$$,
  'disabling an already disabled module is an explicit no-op'
);

reset role;
select is(
  (select count(*)::integer from core.audit_events
    where business_id = '50000000-0000-0000-0000-000000000001'
      and action_key like 'business.module_%'),
  2,
  'a no-op disable does not duplicate audit history'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000005a1', true);

select results_eq(
  $$select module_key, is_enabled, changed from core.set_business_module_enabled(
      '50000000-0000-0000-0000-000000000001', 'pages', false
    )$$,
  $$values ('pages'::text, false, false)$$,
  'disabling an absent module is an explicit no-op'
);

reset role;
select is(
  (select count(*)::integer from core.business_modules
    where business_id = '50000000-0000-0000-0000-000000000001'
      and module_key = 'pages'),
  0,
  'an absent disabled capability does not require a state row'
);

select is(
  (select count(*)::integer from core.audit_events
    where business_id = '50000000-0000-0000-0000-000000000001'
      and entity_id = 'pages'),
  0,
  'an absent disable no-op emits no audit event'
);

-- 30–40: permissions, scope, cross-tenant isolation, and unavailable keys.
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000005a2', true);

select results_eq(
  $$select can_manage_modules from core.current_user_business_access(
      '50000000-0000-0000-0000-000000000001'
    )$$,
  $$values (false)$$,
  'ordinary membership does not imply module management'
);

select is(
  pg_temp.capture_sqlstate(
    $$select * from core.set_business_module_enabled(
      '50000000-0000-0000-0000-000000000001', 'commerce', true
    )$$
  ),
  '42501',
  'a member without modules.manage cannot mutate module state'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000005a3', true);

select results_eq(
  $$select can_manage_modules from core.current_user_business_access(
      '50000000-0000-0000-0000-000000000001'
    )$$,
  $$values (false)$$,
  'location-scoped access does not become business-wide module management'
);

select is(
  pg_temp.capture_sqlstate(
    $$select * from core.set_business_module_enabled(
      '50000000-0000-0000-0000-000000000001', 'commerce', true
    )$$
  ),
  '42501',
  'location-scoped permissions cannot mutate module state'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000005b1', true);

select results_eq(
  $$select module_key, is_enabled, changed from core.set_business_module_enabled(
      '50000000-0000-0000-0000-000000000002', 'pages', true
    )$$,
  $$values ('pages'::text, true, true)$$,
  'a second tenant manager can mutate only their own business'
);

select is(
  pg_temp.capture_sqlstate(
    $$select * from core.set_business_module_enabled(
      '50000000-0000-0000-0000-000000000001', 'commerce', true
    )$$
  ),
  '42501',
  'a second tenant manager cannot mutate business A'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000005a1', true);

select is(
  pg_temp.capture_sqlstate(
    $$select * from core.set_business_module_enabled(
      '50000000-0000-0000-0000-000000000002', 'commerce', true
    )$$
  ),
  '42501',
  'business A manager cannot mutate business B'
);

select is(
  (select count(*)::integer from core.business_modules
    where business_id = '50000000-0000-0000-0000-000000000002'),
  0,
  'business A cannot read business B module state through RLS'
);

select is(
  pg_temp.capture_sqlstate(
    $$select * from core.set_business_module_enabled(
      '50000000-0000-0000-0000-000000000001', 'unsupported_module', true
    )$$
  ),
  '22023',
  'an unsupported module key is rejected'
);

select is(
  pg_temp.capture_sqlstate(
    $$select * from core.set_business_module_enabled(
      '50000000-0000-0000-0000-000000000001', 'booking', true
    )$$
  ),
  '55000',
  'a platform-unavailable module cannot be newly enabled'
);

reset role;
select is(
  (select count(*)::integer from core.business_modules
    where business_id = '50000000-0000-0000-0000-000000000001'
      and module_key = 'booking'),
  0,
  'a rejected unavailable module creates no tenant state'
);

-- 41–47: conservative business lifecycle rules and explicit super-admin behavior.
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000005d1', true);

select is(
  pg_temp.capture_sqlstate(
    $$select * from core.set_business_module_enabled(
      '50000000-0000-0000-0000-000000000003', 'commerce', true
    )$$
  ),
  '42501',
  'tenant admins cannot mutate modules for a suspended business'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000005c1', true);

select results_eq(
  $$select can_manage_modules, is_super_admin
      from core.current_user_business_access('50000000-0000-0000-0000-000000000003')$$,
  $$values (true, true)$$,
  'super-admin authorization remains an explicit database concept'
);

select results_eq(
  $$select module_key, is_enabled, changed from core.set_business_module_enabled(
      '50000000-0000-0000-0000-000000000003', 'commerce', true
    )$$,
  $$values ('commerce'::text, true, true)$$,
  'an explicit super admin may manage a suspended business capability'
);

reset role;
select is(
  (select count(*)::integer from core.business_modules
    where business_id = '50000000-0000-0000-0000-000000000003'
      and module_key = 'commerce'
      and is_enabled),
  1,
  'the super-admin suspended-business transition persists predictably'
);

select results_eq(
  $$select actor_user_id from core.audit_events
    where business_id = '50000000-0000-0000-0000-000000000003'
      and action_key = 'business.module_enabled'$$,
  $$values ('00000000-0000-0000-0000-0000000005c1'::uuid)$$,
  'the super-admin transition records the authenticated super-admin actor'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000005c1', true);

select is(
  pg_temp.capture_sqlstate(
    $$select * from core.set_business_module_enabled(
      '50000000-0000-0000-0000-000000000004', 'commerce', true
    )$$
  ),
  '55000',
  'even super admins must reactivate an archived business before module changes'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000005d1', true);

select is(
  pg_temp.capture_sqlstate(
    $$select * from core.set_business_module_enabled(
      '50000000-0000-0000-0000-000000000004', 'commerce', true
    )$$
  ),
  '55000',
  'archived business module state is immutable for tenant admins'
);

-- 48–52: write bypass resistance and final invariants.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000005a1', true);

select is(
  pg_temp.capture_sqlstate(
    $$insert into core.business_modules (business_id, module_key, is_enabled, updated_by)
      values (
        '50000000-0000-0000-0000-000000000001',
        'commerce',
        true,
        '00000000-0000-0000-0000-0000000005a1'
      )$$
  ),
  '42501',
  'authenticated callers cannot bypass audit with direct insert'
);

select is(
  pg_temp.capture_sqlstate(
    $$update core.business_modules
      set is_enabled = true
      where business_id = '50000000-0000-0000-0000-000000000001'
        and module_key = 'restaurant'$$
  ),
  '42501',
  'authenticated callers cannot bypass audit with direct update'
);

reset role;
select is(
  (select count(*)::integer
    from (
      select business_id, module_key
      from core.business_modules
      group by business_id, module_key
      having count(*) > 1
    ) as duplicate_state),
  0,
  'business and module uniqueness holds across repeated requests'
);

select is(
  (select count(*)::integer from core.modules),
  4,
  'tenant mutations never create platform module definitions'
);

select is(
  (select count(*)::integer from core.audit_events
    where action_key in ('business.module_enabled', 'business.module_disabled')),
  4,
  'only four actual transitions across all tenants emitted module audit events'
);

select * from finish();

rollback;
