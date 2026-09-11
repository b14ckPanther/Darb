begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

create or replace function pg_temp.capture_sqlstate(statement text)
returns text language plpgsql as $$
begin execute statement; return null;
exception when others then return sqlstate;
end;
$$;

select has_table('core', 'plans', 'plans registry exists');
select has_table('core', 'plan_module_entitlements', 'plan module entitlements exist');
select has_table('core', 'business_plan_assignments', 'business plan assignments exist');
select has_table('core', 'business_module_entitlement_overrides', 'module overrides exist');
select has_table('core', 'business_initial_setup_services', 'initial setup service lifecycle exists');
select col_is_pk('core', 'business_plan_assignments', 'business_id', 'one current plan is stored per business');
select col_is_pk('core', 'business_initial_setup_services', 'business_id', 'one setup service state is stored per business');
select has_function('core', 'get_business_module_access', array['uuid'], 'member-safe module access snapshot exists');
select has_function('core', 'get_business_commercial_summary', array['uuid'], 'member-safe commercial summary exists');
select has_function('core', 'set_platform_business_plan', array['uuid','text'], 'platform plan mutation exists');
select has_function('core', 'set_platform_module_entitlement_override', array['uuid','text','text','text'], 'platform override mutation exists');
select has_function('core', 'request_business_initial_setup', array['uuid'], 'business setup request mutation exists');
select has_function('core', 'set_platform_initial_setup_status', array['uuid','text'], 'platform setup lifecycle mutation exists');
select enum_has_labels('core', 'entitlement_override_decision', array['grant','deny'], 'override decisions are closed');
select enum_has_labels('core', 'initial_setup_status', array['requested','accepted','in_progress','completed','cancelled'], 'setup lifecycle is closed');
select results_eq(
  $$select key from core.plans order by sort_order$$,
  $$values ('core-only'::text), ('restaurant-starter'::text)$$,
  'the initial price-free arrangements are deterministic'
);
select results_eq(
  $$select plan_key, module_key from core.plan_module_entitlements$$,
  $$values ('restaurant-starter'::text, 'restaurant'::text)$$,
  'Restaurant Starter includes only Restaurant'
);

insert into core.plans (key, display_name, description, max_locations, sort_order)
values ('test-one-location', 'One-location test', 'Transaction-scoped location limit.', 1, 999);

insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-00000000c0a1', 'authenticated', 'authenticated', 'commercial-owner@example.test', '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-00000000c0b1', 'authenticated', 'authenticated', 'commercial-outsider@example.test', '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-00000000c0c1', 'authenticated', 'authenticated', 'commercial-platform@example.test', '{}', '{}', now(), now());

insert into private.super_admins (user_id, reason)
values ('00000000-0000-0000-0000-00000000c0c1', 'Commercial boundary test');

insert into core.businesses (id, slug, display_name, default_locale, status, created_by)
values
  ('c0100000-0000-0000-0000-000000000001', 'commercial-a', 'Commercial A', 'en', 'active', '00000000-0000-0000-0000-00000000c0a1'),
  ('c0200000-0000-0000-0000-000000000002', 'commercial-b', 'Commercial B', 'ar', 'active', '00000000-0000-0000-0000-00000000c0b1');

insert into core.memberships (id, business_id, user_id, status)
values
  ('c0110000-0000-0000-0000-000000000001', 'c0100000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000c0a1', 'active'),
  ('c0210000-0000-0000-0000-000000000002', 'c0200000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-00000000c0b1', 'active');

insert into core.membership_permissions (business_id, membership_id, permission_key, granted_by)
select 'c0100000-0000-0000-0000-000000000001', 'c0110000-0000-0000-0000-000000000001', permission,
  '00000000-0000-0000-0000-00000000c0a1'
from unnest(array['business.manage','locations.manage','modules.manage','appearance.manage','restaurant.manage','restaurant.read']) as permission;

select results_eq(
  $$select business_id, plan_key, source::text from core.business_plan_assignments where business_id in ('c0100000-0000-0000-0000-000000000001','c0200000-0000-0000-0000-000000000002') order by business_id$$,
  $$values
    ('c0100000-0000-0000-0000-000000000001'::uuid, 'core-only'::text, 'starter'::text),
    ('c0200000-0000-0000-0000-000000000002'::uuid, 'core-only'::text, 'starter'::text)$$,
  'every newly inserted business receives the platform starter plan'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000c0a1', true);

select results_eq(
  $$select entitled, enabled, effective, unavailable_reason from core.get_business_module_access('c0100000-0000-0000-0000-000000000001') where module_key = 'restaurant'$$,
  $$values (false, false, false, 'not_entitled'::text)$$,
  'availability alone does not confer Restaurant entitlement or effective access'
);
select is(
  pg_temp.capture_sqlstate($$select * from core.set_business_module_enabled('c0100000-0000-0000-0000-000000000001','restaurant',true)$$),
  '42501', 'an owner cannot self-enable a module that is not entitled'
);
select is(
  pg_temp.capture_sqlstate($$select * from core.set_business_appearance('c0100000-0000-0000-0000-000000000001','restaurant','restaurant-signature','{}'::jsonb)$$),
  '55000', 'appearance mutation is unavailable without effective module access'
);
select is(
  pg_temp.capture_sqlstate($$select * from core.set_business_media_assignment('c0100000-0000-0000-0000-000000000001','restaurant','logo',null)$$),
  '55000', 'branding assignment mutation is unavailable without effective module access'
);
select is(
  pg_temp.capture_sqlstate($$select * from restaurant.save_configuration('c0100000-0000-0000-0000-000000000001',true)$$),
  '55000', 'Restaurant domain mutation is unavailable without effective module access'
);
select is(
  pg_temp.capture_sqlstate($$select * from core.get_business_module_access('c0200000-0000-0000-0000-000000000002')$$),
  '42501', 'an authenticated outsider cannot inspect another tenant commercial state'
);
select is(
  pg_temp.capture_sqlstate($$select * from core.set_platform_business_plan('c0100000-0000-0000-0000-000000000001','restaurant-starter')$$),
  '42501', 'tenant permission cannot substitute for platform plan authority'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000c0c1', true);

select results_eq(
  $$select plan_key, changed from core.set_platform_business_plan('c0100000-0000-0000-0000-000000000001','restaurant-starter')$$,
  $$values ('restaurant-starter'::text, true)$$,
  'a platform operator can assign an available plan'
);
select results_eq(
  $$select plan_key, changed from core.set_platform_business_plan('c0100000-0000-0000-0000-000000000001','restaurant-starter')$$,
  $$values ('restaurant-starter'::text, false)$$,
  'repeating a plan assignment is an audited-noise-free no-op'
);
select results_eq(
  $$select plan_key from core.set_platform_business_plan('c0200000-0000-0000-0000-000000000002','test-one-location')$$,
  $$values ('test-one-location'::text)$$,
  'platform may assign a plan carrying a location limit'
);

reset role;
insert into core.locations (id, business_id, display_name)
values ('c0220000-0000-0000-0000-000000000001', 'c0200000-0000-0000-0000-000000000002', 'First location');
select is(
  pg_temp.capture_sqlstate($$insert into core.locations (business_id, display_name) values ('c0200000-0000-0000-0000-000000000002','Second location')$$),
  '55000', 'location creation is blocked at the authoritative plan limit'
);
insert into core.locations (id, business_id, display_name, status)
values ('c0220000-0000-0000-0000-000000000002', 'c0200000-0000-0000-0000-000000000002', 'Archived location', 'archived');
select is(
  pg_temp.capture_sqlstate($$update core.locations set status = 'active' where id = 'c0220000-0000-0000-0000-000000000002'$$),
  '55000', 'reactivating a location cannot bypass the authoritative plan limit'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000c0a1', true);
select results_eq(
  $$select module_key, is_enabled, changed from core.set_business_module_enabled('c0100000-0000-0000-0000-000000000001','restaurant',true)$$,
  $$values ('restaurant'::text, true, true)$$,
  'an entitled owner may enable Restaurant'
);
select results_eq(
  $$select entitled, enabled, effective, unavailable_reason from core.get_business_module_access('c0100000-0000-0000-0000-000000000001') where module_key = 'restaurant'$$,
  $$values (true, true, true, null::text)$$,
  'available plus entitled plus enabled produces effective access'
);

select results_eq(
  $$select status, changed from core.request_business_initial_setup('c0100000-0000-0000-0000-000000000001')$$,
  $$values ('requested'::text, true)$$,
  'a business manager may request initial setup'
);
select results_eq(
  $$select status, changed from core.request_business_initial_setup('c0100000-0000-0000-0000-000000000001')$$,
  $$values ('requested'::text, false)$$,
  'repeating the setup request is idempotent'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000c0c1', true);
select results_eq(
  $$select decision, changed from core.set_platform_module_entitlement_override('c0100000-0000-0000-0000-000000000001','restaurant','deny','Temporary commercial hold')$$,
  $$values ('deny'::text, true)$$,
  'an explicit deny override can be applied by platform authority'
);
select results_eq(
  $$select entitled, enabled, effective, entitlement_source from core.get_business_module_access('c0100000-0000-0000-0000-000000000001') where module_key = 'restaurant'$$,
  $$values (false, true, false, 'override_deny'::text)$$,
  'deny overrides plan inclusion while retaining tenant enablement'
);
select is(
  (select is_enabled from core.business_modules where business_id = 'c0100000-0000-0000-0000-000000000001' and module_key = 'restaurant'),
  true, 'entitlement loss retains the stored enabled state'
);
select results_eq(
  $$select decision, changed from core.set_platform_module_entitlement_override('c0100000-0000-0000-0000-000000000001','restaurant','','')$$,
  $$values (null::text, true)$$,
  'removing an override restores plan-derived entitlement'
);
select results_eq(
  $$select status, changed from core.set_platform_initial_setup_status('c0100000-0000-0000-0000-000000000001','accepted')$$,
  $$values ('accepted'::text, true)$$,
  'platform can accept a requested setup engagement'
);
select is(
  pg_temp.capture_sqlstate($$select * from core.set_platform_initial_setup_status('c0100000-0000-0000-0000-000000000001','completed')$$),
  '55000', 'setup lifecycle cannot skip from accepted to completed'
);
select results_eq(
  $$select status from core.set_platform_initial_setup_status('c0100000-0000-0000-0000-000000000001','in_progress')$$,
  $$values ('in_progress'::text)$$,
  'setup may move into progress'
);
select results_eq(
  $$select status from core.set_platform_initial_setup_status('c0100000-0000-0000-0000-000000000001','completed')$$,
  $$values ('completed'::text)$$,
  'setup may complete from in-progress'
);
reset role;
select ok(
  (select completed_at is not null from core.business_initial_setup_services where business_id = 'c0100000-0000-0000-0000-000000000001'),
  'completion records a factual completion timestamp'
);
select ok(
  (select count(*) >= 6 from core.audit_events
    where business_id = 'c0100000-0000-0000-0000-000000000001'
      and (action_key like 'platform.%' or action_key = 'business.initial_setup_requested')),
  'commercial mutations emit narrow audit events'
);

select is(
  (select count(*) from information_schema.role_table_grants where table_schema = 'core'
    and table_name in ('business_plan_assignments','business_module_entitlement_overrides','business_initial_setup_services')
    and grantee in ('anon','authenticated') and privilege_type in ('INSERT','UPDATE','DELETE')),
  0::bigint, 'commercial tenant tables expose no direct browser writes'
);
select is(
  (select count(*) from information_schema.role_table_grants where table_schema = 'core'
    and table_name in ('business_plan_assignments','business_module_entitlement_overrides','business_initial_setup_services')
    and grantee in ('anon','authenticated','service_role') and privilege_type = 'SELECT'),
  0::bigint, 'commercial tenant internals expose no direct Data API reads'
);
select is(
  (select count(*) from information_schema.routine_privileges where routine_schema = 'private'
    and routine_name in ('resolve_business_module_entitlement','business_has_effective_module_access')
    and grantee in ('anon','authenticated','service_role')),
  0::bigint, 'private entitlement helpers are not executable through Data API roles'
);
select is(
  has_function_privilege('anon', 'core.get_business_module_access(uuid)', 'EXECUTE'),
  false, 'anonymous users cannot execute business commercial projections'
);
select is(
  has_function_privilege('anon', 'core.set_platform_business_plan(uuid,text)', 'EXECUTE'),
  false, 'anonymous users cannot execute platform commercial mutations'
);

select * from finish();
rollback;
