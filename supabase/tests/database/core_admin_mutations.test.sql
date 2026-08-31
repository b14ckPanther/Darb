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

select plan(41);

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
  (
    '00000000-0000-0000-0000-0000000004a1',
    'authenticated',
    'authenticated',
    'core-owner@example.test',
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-0000000004a2',
    'authenticated',
    'authenticated',
    'scoped-manager@example.test',
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-0000000004b1',
    'authenticated',
    'authenticated',
    'other-owner@example.test',
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-0000000004c1',
    'authenticated',
    'authenticated',
    'core-super-admin@example.test',
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  );

insert into core.businesses (id, slug, display_name, default_locale)
values
  ('40000000-0000-0000-0000-000000000001', 'core-business-a', 'Core Business A', 'en'),
  ('40000000-0000-0000-0000-000000000002', 'core-business-b', 'Core Business B', 'he');

insert into core.locations (id, business_id, display_name)
values
  (
    '41000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000001',
    'Scoped Location'
  ),
  (
    '41000000-0000-0000-0000-000000000002',
    '40000000-0000-0000-0000-000000000001',
    'Unscoped Location'
  ),
  (
    '41000000-0000-0000-0000-000000000003',
    '40000000-0000-0000-0000-000000000002',
    'Other Tenant Location'
  );

insert into core.memberships (id, business_id, user_id)
values
  (
    '42000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-0000000004a1'
  ),
  (
    '42000000-0000-0000-0000-000000000002',
    '40000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-0000000004a2'
  ),
  (
    '42000000-0000-0000-0000-000000000003',
    '40000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-0000000004b1'
  );

insert into core.membership_permissions (
  business_id,
  membership_id,
  permission_key,
  location_id
)
values
  ('40000000-0000-0000-0000-000000000001', '42000000-0000-0000-0000-000000000001', 'business.manage', null),
  ('40000000-0000-0000-0000-000000000001', '42000000-0000-0000-0000-000000000001', 'locations.read', null),
  ('40000000-0000-0000-0000-000000000001', '42000000-0000-0000-0000-000000000001', 'locations.manage', null),
  ('40000000-0000-0000-0000-000000000001', '42000000-0000-0000-0000-000000000001', 'audit.view', null),
  ('40000000-0000-0000-0000-000000000001', '42000000-0000-0000-0000-000000000002', 'locations.read', '41000000-0000-0000-0000-000000000001'),
  ('40000000-0000-0000-0000-000000000001', '42000000-0000-0000-0000-000000000002', 'locations.manage', '41000000-0000-0000-0000-000000000001'),
  ('40000000-0000-0000-0000-000000000002', '42000000-0000-0000-0000-000000000003', 'business.manage', null),
  ('40000000-0000-0000-0000-000000000002', '42000000-0000-0000-0000-000000000003', 'locations.read', null),
  ('40000000-0000-0000-0000-000000000002', '42000000-0000-0000-0000-000000000003', 'locations.manage', null);

insert into private.super_admins (user_id, reason)
values (
  '00000000-0000-0000-0000-0000000004c1',
  'Transaction-scoped core admin mutation test'
);

select has_function(
  'core',
  'current_user_business_access',
  array['uuid'],
  'the business access snapshot has a narrow caller-derived signature'
);

select has_function(
  'core',
  'update_business_settings',
  array['uuid', 'text', 'text', 'text', 'text', 'text'],
  'the business settings mutation accepts no actor identity'
);

select has_function(
  'core',
  'create_location',
  array['uuid', 'text', 'text', 'text', 'text', 'text', 'text'],
  'the location creation mutation accepts only core location input'
);

select has_function(
  'core',
  'update_location',
  array['uuid', 'uuid', 'text', 'text', 'text', 'text', 'text', 'text', 'text'],
  'the location update mutation requires explicit tenant and location identities'
);

select has_function(
  'core',
  'archive_location',
  array['uuid', 'uuid'],
  'the archive mutation has no hard-delete or actor parameter'
);

set local role anon;
select set_config('request.jwt.claim.sub', '', true);

select is(
  pg_temp.capture_sqlstate(
    $$select * from core.current_user_business_access('40000000-0000-0000-0000-000000000001')$$
  ),
  '42501',
  'anonymous callers cannot read the business access snapshot'
);

select is(
  pg_temp.capture_sqlstate(
    $$select * from core.update_business_settings(
      '40000000-0000-0000-0000-000000000001', 'Anonymous', 'anonymous', 'en', 'Asia/Jerusalem', 'active'
    )$$
  ),
  '42501',
  'anonymous callers cannot update businesses'
);

select is(
  pg_temp.capture_sqlstate(
    $$select * from core.create_location(
      '40000000-0000-0000-0000-000000000001', 'Anonymous', null, null, null, 'IL', null
    )$$
  ),
  '42501',
  'anonymous callers cannot create locations'
);

select is(
  pg_temp.capture_sqlstate(
    $$select * from core.update_location(
      '40000000-0000-0000-0000-000000000001',
      '41000000-0000-0000-0000-000000000001',
      'Anonymous', 'active', null, null, null, 'IL', null
    )$$
  ),
  '42501',
  'anonymous callers cannot update locations'
);

select is(
  pg_temp.capture_sqlstate(
    $$select * from core.archive_location(
      '40000000-0000-0000-0000-000000000001',
      '41000000-0000-0000-0000-000000000001'
    )$$
  ),
  '42501',
  'anonymous callers cannot archive locations'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000004a1', true);

select results_eq(
  $$select can_manage_business, can_read_all_locations, can_manage_all_locations, can_view_audit, is_super_admin
      from core.current_user_business_access('40000000-0000-0000-0000-000000000001')$$,
  $$values (true, true, true, true, false)$$,
  'the access snapshot reflects database-authoritative business-wide permissions'
);

select results_eq(
  $$select display_name, slug, default_locale::text, timezone, status::text
      from core.update_business_settings(
        '40000000-0000-0000-0000-000000000001',
        '  Updated Business A  ',
        'UPDATED-BUSINESS-A',
        'ar',
        'Europe/Paris',
        'archived'
      )$$,
  $$values ('Updated Business A'::text, 'updated-business-a'::text, 'ar'::text, 'Europe/Paris'::text, 'archived'::text)$$,
  'business.manage can update normalized core settings and archive the business'
);

select is(
  (select currency_code from core.businesses where id = '40000000-0000-0000-0000-000000000001'),
  'ILS',
  'business settings mutation deliberately leaves currency unchanged'
);

select results_eq(
  $$select action_key, actor_user_id, entity_type, entity_id
      from core.audit_events
      where action_key = 'business.updated'$$,
  $$values (
      'business.updated'::text,
      '00000000-0000-0000-0000-0000000004a1'::uuid,
      'core.business'::text,
      '40000000-0000-0000-0000-000000000001'::text
    )$$,
  'business update emits a caller-bound business.updated event'
);

select results_eq(
  $$select jsonb_object_keys(metadata)
      from core.audit_events
      where action_key = 'business.updated'$$,
  $$values ('changed_fields'::text)$$,
  'business audit metadata contains only redacted changed-field names'
);

select is(
  pg_temp.capture_sqlstate(
    $$select * from core.update_business_settings(
      '40000000-0000-0000-0000-000000000001',
      'Updated Business A', 'updated-business-a', 'ar', 'Europe/Paris', 'suspended'
    )$$
  ),
  '42501',
  'a normal business admin cannot set the platform-controlled suspended status'
);

select is(
  (select status::text from core.businesses where id = '40000000-0000-0000-0000-000000000001'),
  'archived',
  'a rejected suspension leaves the prior lifecycle state intact'
);

select is(
  pg_temp.capture_sqlstate(
    $$select * from core.update_business_settings(
      '40000000-0000-0000-0000-000000000002',
      'Cross Tenant', 'cross-tenant', 'en', 'Asia/Jerusalem', 'active'
    )$$
  ),
  '42501',
  'business update cannot cross tenant boundaries'
);

select is(
  pg_temp.capture_sqlstate(
    $$select * from core.update_business_settings(
      '40000000-0000-0000-0000-000000000001',
      'Updated Business A', 'core-business-b', 'ar', 'Europe/Paris', 'archived'
    )$$
  ),
  '23505',
  'business slug uniqueness is enforced atomically'
);

select is(
  (select count(*) from core.audit_events where action_key = 'business.updated'),
  1::bigint,
  'failed business updates do not emit audit events'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000004c1', true);

select is(
  (select status::text from core.update_business_settings(
    '40000000-0000-0000-0000-000000000002',
    'Core Business B', 'core-business-b', 'he', 'Asia/Jerusalem', 'suspended'
  )),
  'suspended',
  'an explicitly assigned platform super admin can suspend a business'
);

select is(
  (select actor_user_id from core.audit_events
    where action_key = 'business.updated'
      and business_id = '40000000-0000-0000-0000-000000000002'),
  '00000000-0000-0000-0000-0000000004c1'::uuid,
  'the super-admin lifecycle mutation remains explicitly attributable'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000004b1', true);

select is(
  pg_temp.capture_sqlstate(
    $$select * from core.update_business_settings(
      '40000000-0000-0000-0000-000000000002',
      'Core Business B', 'core-business-b', 'he', 'Asia/Jerusalem', 'active'
    )$$
  ),
  '42501',
  'a tenant admin cannot transition a platform-suspended business'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000004a1', true);

select results_eq(
  $$select display_name, status::text, address_line, locality, postal_code, country_code, timezone
      from core.create_location(
        '40000000-0000-0000-0000-000000000001',
        '  New Location  ', '  1 Main Street  ', '  Jerusalem  ', '  91000  ', 'il', 'Asia/Jerusalem'
      )$$,
  $$values (
      'New Location'::text, 'active'::text, '1 Main Street'::text, 'Jerusalem'::text,
      '91000'::text, 'IL'::text, 'Asia/Jerusalem'::text
    )$$,
  'business-wide locations.manage can create a normalized active location'
);

select is(
  (select count(*) from core.audit_events where action_key = 'location.created'),
  1::bigint,
  'location creation emits exactly one location.created event'
);

select is(
  pg_temp.capture_sqlstate(
    $$select * from core.create_location(
      '40000000-0000-0000-0000-000000000001',
      'Invalid Timezone', null, null, null, 'IL', 'Not/A_Timezone'
    )$$
  ),
  '22023',
  'location creation validates timezones against the PostgreSQL catalogue'
);

select is(
  (select count(*) from core.locations where display_name = 'Invalid Timezone'),
  0::bigint,
  'invalid location input leaves no partial row'
);

select is(
  (select count(*) from core.locations where business_id = '40000000-0000-0000-0000-000000000001'),
  3::bigint,
  'business-wide location permission exposes every location in the tenant'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000004a2', true);

select is(
  pg_temp.capture_sqlstate(
    $$select * from core.update_business_settings(
      '40000000-0000-0000-0000-000000000001',
      'Unauthorized', 'unauthorized', 'en', 'Asia/Jerusalem', 'active'
    )$$
  ),
  '42501',
  'a same-tenant user without business.manage cannot update business settings'
);

select results_eq(
  $$select id from core.locations order by id$$,
  $$values ('41000000-0000-0000-0000-000000000001'::uuid)$$,
  'location-scoped read permission exposes only the assigned location'
);

select is(
  pg_temp.capture_sqlstate(
    $$select * from core.create_location(
      '40000000-0000-0000-0000-000000000001',
      'Scoped Creation', null, null, null, 'IL', null
    )$$
  ),
  '42501',
  'location-scoped locations.manage cannot create an arbitrary location'
);

select results_eq(
  $$select display_name, status::text
      from core.update_location(
        '40000000-0000-0000-0000-000000000001',
        '41000000-0000-0000-0000-000000000001',
        'Scoped Location Updated', 'inactive', null, null, null, 'IL', null
      )$$,
  $$values ('Scoped Location Updated'::text, 'inactive'::text)$$,
  'location-scoped locations.manage can update only its assigned location'
);

select is(
  (select count(*) from core.audit_events
    where action_key = 'location.updated'
      and entity_id = '41000000-0000-0000-0000-000000000001'),
  0::bigint,
  'a scoped manager without audit.view cannot read mutation audit events through RLS'
);

select is(
  pg_temp.capture_sqlstate(
    $$select * from core.update_location(
      '40000000-0000-0000-0000-000000000001',
      '41000000-0000-0000-0000-000000000002',
      'Unauthorized Location', 'active', null, null, null, 'IL', null
    )$$
  ),
  '42501',
  'location-scoped manage cannot update another location in the same business'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000004b1', true);

select is(
  pg_temp.capture_sqlstate(
    $$select * from core.update_location(
      '40000000-0000-0000-0000-000000000001',
      '41000000-0000-0000-0000-000000000001',
      'Cross Tenant Location', 'active', null, null, null, 'IL', null
    )$$
  ),
  '42501',
  'location mutation cannot cross tenant boundaries'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000004a2', true);

select is(
  (select status::text from core.archive_location(
    '40000000-0000-0000-0000-000000000001',
    '41000000-0000-0000-0000-000000000001'
  )),
  'archived',
  'location-scoped manage can archive its assigned location without deleting it'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000004a1', true);

select is(
  (select count(*) from core.audit_events
    where action_key = 'location.archived'
      and entity_id = '41000000-0000-0000-0000-000000000001'),
  1::bigint,
  'location archive emits an attributable location.archived event'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000004a2', true);

select is(
  (select status::text from core.archive_location(
    '40000000-0000-0000-0000-000000000001',
    '41000000-0000-0000-0000-000000000001'
  )),
  'archived',
  'repeated location archive is idempotent'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000004a1', true);

select is(
  (select count(*) from core.audit_events
    where action_key = 'location.archived'
      and entity_id = '41000000-0000-0000-0000-000000000001'),
  1::bigint,
  'an idempotent archive retry does not duplicate the audit event'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000004a2', true);

select is(
  pg_temp.capture_sqlstate(
    $$select * from core.update_location(
      '40000000-0000-0000-0000-000000000001',
      '41000000-0000-0000-0000-000000000001',
      'Archived Update', 'active', null, null, null, 'IL', null
    )$$
  ),
  'P0001',
  'archived locations cannot be edited or reactivated through the update mutation'
);

select is(
  pg_temp.capture_sqlstate(
    $$select * from core.archive_location(
      '40000000-0000-0000-0000-000000000001',
      '41000000-0000-0000-0000-000000000002'
    )$$
  ),
  '42501',
  'location-scoped manage cannot archive another location'
);

reset role;

select * from finish();

rollback;
