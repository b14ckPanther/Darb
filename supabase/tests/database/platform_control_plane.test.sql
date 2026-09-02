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

select plan(56);

insert into auth.users (
  id, aud, role, email, encrypted_password, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
)
values
  (
    '00000000-0000-0000-0000-0000000014a1', 'authenticated', 'authenticated',
    'tenant-owner@example.test', 'not-browser-visible', '{"provider":"email"}'::jsonb,
    '{"private_note":"must-not-project"}'::jsonb, now() - interval '4 days', now()
  ),
  (
    '00000000-0000-0000-0000-0000000014b1', 'authenticated', 'authenticated',
    'other-owner@example.test', 'not-browser-visible', '{}'::jsonb, '{}'::jsonb,
    now() - interval '3 days', now()
  ),
  (
    '00000000-0000-0000-0000-0000000014c1', 'authenticated', 'authenticated',
    'platform-operator@example.test', 'not-browser-visible', '{}'::jsonb, '{}'::jsonb,
    now() - interval '2 days', now()
  ),
  (
    '00000000-0000-0000-0000-0000000014d1', 'authenticated', 'authenticated',
    'revoked-operator@example.test', 'not-browser-visible', '{}'::jsonb, '{}'::jsonb,
    now() - interval '1 day', now()
  );

insert into core.businesses (id, slug, display_name, default_locale, status)
values
  ('14000000-0000-0000-0000-000000000001', 'phase14-active', 'Phase 14 Active', 'en', 'active'),
  ('14000000-0000-0000-0000-000000000002', 'phase14-archived', 'Phase 14 Archived', 'he', 'archived');

insert into core.locations (id, business_id, display_name)
values ('14100000-0000-0000-0000-000000000001', '14000000-0000-0000-0000-000000000001', 'Platform-visible location');

insert into core.memberships (id, business_id, user_id)
values
  ('14200000-0000-0000-0000-000000000001', '14000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000014a1'),
  ('14200000-0000-0000-0000-000000000002', '14000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000014b1');

insert into core.membership_permissions (business_id, membership_id, permission_key)
select '14000000-0000-0000-0000-000000000001', '14200000-0000-0000-0000-000000000001', key
from core.permissions;

insert into private.super_admins (user_id, reason, granted_at, revoked_at)
values
  (
    '00000000-0000-0000-0000-0000000014c1',
    'Transaction-scoped Phase 14 operator', now() - interval '2 days', null
  ),
  (
    '00000000-0000-0000-0000-0000000014d1',
    'Transaction-scoped revoked operator', now() - interval '2 days', now() - interval '1 day'
  );

insert into core.business_modules (business_id, module_key, is_enabled)
values ('14000000-0000-0000-0000-000000000001', 'restaurant', true);

insert into core.business_domains (
  id, business_id, hostname, verification_token, status
)
values (
  '14300000-0000-0000-0000-000000000001',
  '14000000-0000-0000-0000-000000000001',
  'phase14.example.test',
  repeat('a', 64),
  'pending'
);

insert into core.business_visual_settings (
  business_id, module_key, template_key, theme_overrides
)
values (
  '14000000-0000-0000-0000-000000000001',
  'restaurant',
  'restaurant-signature',
  '{}'::jsonb
);

insert into core.audit_events (
  actor_kind, actor_user_id, business_id, action_key, entity_type, entity_id, metadata
)
values (
  'user', '00000000-0000-0000-0000-0000000014a1',
  '14000000-0000-0000-0000-000000000001', 'business.updated',
  'core.business', '14000000-0000-0000-0000-000000000001',
  '{"changed_fields":["display_name"]}'::jsonb
);

select has_function('core', 'get_platform_overview', array[]::text[], 'platform overview RPC exists');
select has_function(
  'core', 'list_platform_businesses',
  array['text', 'text', 'text', 'text', 'text', 'integer', 'integer'],
  'paginated platform business RPC exists'
);
select has_function('core', 'get_platform_business_detail', array['uuid'], 'platform business detail RPC exists');
select has_function(
  'core', 'list_platform_users', array['text', 'integer', 'integer'],
  'safe platform user projection exists'
);
select has_function('core', 'list_platform_super_admins', array[]::text[], 'super-admin roster RPC exists');
select has_function('core', 'list_platform_modules', array[]::text[], 'platform module projection exists');
select has_function('core', 'list_platform_templates', array[]::text[], 'platform template projection exists');
select has_function(
  'core', 'list_platform_domains',
  array['text', 'text', 'text', 'text', 'boolean', 'integer', 'integer'],
  'paginated platform domain projection exists'
);
select has_function(
  'core', 'list_platform_audit_events',
  array['uuid', 'text', 'text', 'text', 'timestamp with time zone', 'timestamp with time zone', 'integer', 'integer'],
  'paginated platform audit projection exists'
);
select has_function(
  'core', 'set_platform_business_status', array['uuid', 'text'],
  'audited platform business lifecycle RPC exists'
);

select ok(
  has_function_privilege('authenticated', 'core.get_platform_overview()', 'execute'),
  'authenticated callers may invoke the guarded platform overview'
);
select ok(
  not has_function_privilege('anon', 'core.get_platform_overview()', 'execute'),
  'anonymous callers have no platform overview execute grant'
);
select ok(
  not has_function_privilege('service_role', 'core.set_platform_business_status(uuid,text)', 'execute'),
  'service role is not conceptually granted the platform lifecycle RPC'
);

set local role anon;
select set_config('request.jwt.claim.sub', '', true);

select is(
  pg_temp.capture_sqlstate($$select core.get_platform_overview()$$), '42501',
  'anonymous platform overview access is denied'
);
select is(
  pg_temp.capture_sqlstate($$select core.list_platform_users(null, 1, 25)$$), '42501',
  'anonymous user-directory access is denied'
);
select is(
  pg_temp.capture_sqlstate($$select core.set_platform_business_status('14000000-0000-0000-0000-000000000001', 'suspended')$$),
  '42501', 'anonymous platform mutation is denied'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000014a1', true);

select is(
  pg_temp.capture_sqlstate($$select core.get_platform_overview()$$), '42501',
  'a fully privileged tenant owner cannot read the platform overview'
);
select is(
  pg_temp.capture_sqlstate($$select core.list_platform_businesses(null, null, null, null, null, 1, 25)$$),
  '42501', 'tenant permissions cannot substitute for platform business-directory authority'
);
select is(
  pg_temp.capture_sqlstate($$select core.get_platform_business_detail('14000000-0000-0000-0000-000000000001')$$),
  '42501', 'a tenant owner cannot use the platform detail projection'
);
select is(
  pg_temp.capture_sqlstate($$select core.set_platform_business_status('14000000-0000-0000-0000-000000000001', 'suspended')$$),
  '42501', 'a tenant owner cannot use the platform lifecycle boundary'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000014d1', true);

select is(
  pg_temp.capture_sqlstate($$select core.get_platform_overview()$$), '42501',
  'a revoked platform operator is denied'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000014c1', true);

select is((core.get_platform_overview() #>> '{businesses,total}')::integer, 2, 'overview reports real business totals');
select is((core.get_platform_overview() ->> 'users')::integer, 4, 'overview reports the safe Auth user count');
select is((core.get_platform_overview() ->> 'memberships')::integer, 2, 'overview reports real membership totals');
select is(
  (core.get_platform_overview() ->> 'restaurant_enabled_businesses')::integer, 1,
  'overview counts only effectively enabled Restaurant businesses'
);

select is(
  (core.list_platform_businesses(null, null, null, null, null, 1, 1) ->> 'total')::integer,
  2, 'business list returns a separate total for pagination'
);
select is(
  jsonb_array_length(core.list_platform_businesses(null, null, null, null, null, 1, 1) -> 'items'),
  1, 'business list enforces page size'
);
select is(
  core.list_platform_businesses('Active', 'active', 'restaurant', 'en', 'pending', 1, 25)
    #>> '{items,0,slug}',
  'phase14-active', 'business filters compose across identity, lifecycle, module, locale, and domain'
);
select is(
  (core.list_platform_businesses(null, 'archived', null, null, 'none', 1, 25) ->> 'total')::integer,
  1, 'business list supports archived tenants without domains'
);
select is(
  pg_temp.capture_sqlstate($$select core.list_platform_businesses(null, null, null, null, null, 0, 25)$$),
  '22023', 'business list rejects an invalid page'
);

select is(
  core.get_platform_business_detail('14000000-0000-0000-0000-000000000001') #>> '{business,slug}',
  'phase14-active', 'business detail resolves the requested tenant'
);
select is(
  (core.get_platform_business_detail('14000000-0000-0000-0000-000000000001') ->> 'membership_count')::integer,
  1, 'business detail includes real membership counts'
);
select is(
  core.get_platform_business_detail('14000000-0000-0000-0000-000000000001') #>> '{appearances,0,template_key}',
  'restaurant-signature', 'business detail projects the selected template without theme payloads'
);
select ok(
  not jsonb_path_exists(
    core.get_platform_business_detail('14000000-0000-0000-0000-000000000001'),
    '$.domains[*].verification_token'
  ), 'business detail excludes domain verification tokens'
);
select is(
  core.get_platform_business_detail('ffffffff-ffff-ffff-ffff-ffffffffffff'), null::jsonb,
  'unknown business detail fails closed as null'
);

select is(
  (core.list_platform_users('tenant-owner', 1, 25) ->> 'total')::integer, 1,
  'user directory searches the allowlisted email projection'
);
select is(
  core.list_platform_users('tenant-owner', 1, 25) #>> '{items,0,email}',
  'tenant-owner@example.test', 'user directory returns the safe email field'
);
select ok(
  position('encrypted_password' in core.list_platform_users(null, 1, 25)::text) = 0
    and position('raw_app_meta_data' in core.list_platform_users(null, 1, 25)::text) = 0
    and position('private_note' in core.list_platform_users(null, 1, 25)::text) = 0
    and position('not-browser-visible' in core.list_platform_users(null, 1, 25)::text) = 0,
  'user projection excludes password and Auth metadata fields and values'
);
select is(
  jsonb_array_length(core.list_platform_super_admins()), 2,
  'super-admin roster includes active and revoked assignments'
);
select is(
  core.list_platform_super_admins() #>> '{0,state}', 'active',
  'active super administrators are clearly projected first'
);

select is(jsonb_array_length(core.list_platform_modules()), 4, 'module registry remains canonical and complete');
select is(
  core.list_platform_modules() #>> '{0,effective_business_count}', '1',
  'module adoption distinguishes effective tenant state'
);
select ok(
  jsonb_array_length(core.list_platform_templates()) >= 3,
  'template registry exposes factual platform template rows'
);
select ok(
  position('default_theme' in core.list_platform_templates()::text) = 0,
  'template projection excludes full theme documents'
);

select is(
  (core.list_platform_domains('phase14', 'pending', 'unconfigured', null, false, 1, 25) ->> 'total')::integer,
  1, 'domain registry supports safe operational filters'
);
select ok(
  position('verification_token' in core.list_platform_domains(null, null, null, null, null, 1, 25)::text) = 0
    and position(repeat('a', 64) in core.list_platform_domains(null, null, null, null, null, 1, 25)::text) = 0,
  'global domain projection excludes ownership proof names and values'
);

select is(
  (core.list_platform_audit_events(
    '14000000-0000-0000-0000-000000000001', 'tenant-owner', 'business.updated', 'core',
    null, null, 1, 1
  ) ->> 'total')::integer,
  1, 'audit filters compose without loading the full table'
);
select ok(
  position('metadata' in core.list_platform_audit_events(null, null, null, null, null, null, 1, 25)::text) = 0
    and position('changed_fields' in core.list_platform_audit_events(null, null, null, null, null, null, 1, 25)::text) = 0,
  'platform audit projection excludes metadata entirely'
);

select is(
  core.set_platform_business_status('14000000-0000-0000-0000-000000000001', 'suspended') ->> 'status',
  'suspended', 'a platform operator can suspend an active business'
);
select results_eq(
  $$select action_key, actor_user_id, metadata
    from core.audit_events where action_key = 'platform.business_suspended'$$,
  $$values (
    'platform.business_suspended'::text,
    '00000000-0000-0000-0000-0000000014c1'::uuid,
    '{"new_status":"suspended","previous_status":"active"}'::jsonb
  )$$,
  'business suspension emits one actor-bound, allowlisted audit event'
);
select is(
  core.set_platform_business_status('14000000-0000-0000-0000-000000000001', 'suspended') ->> 'changed',
  'false', 'repeated lifecycle state is an explicit no-op'
);
select is(
  (select count(*) from core.audit_events where action_key = 'platform.business_suspended'),
  1::bigint, 'a lifecycle no-op does not duplicate audit events'
);
select is(
  pg_temp.capture_sqlstate($$select core.set_platform_business_status('14000000-0000-0000-0000-000000000001', 'archived')$$),
  '55000', 'suspended cannot transition directly to archived'
);
select is(
  core.set_platform_business_status('14000000-0000-0000-0000-000000000001', 'active') ->> 'status',
  'active', 'a platform operator can reactivate a suspended business'
);
select is(
  core.set_platform_business_status('14000000-0000-0000-0000-000000000001', 'archived') ->> 'status',
  'archived', 'a platform operator can archive an active business without deletion'
);
select is(
  (select count(*) from core.businesses where id = '14000000-0000-0000-0000-000000000001'),
  1::bigint, 'platform archival retains the canonical business row'
);

select * from finish();

rollback;
