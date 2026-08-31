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

select plan(21);

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
    '00000000-0000-0000-0000-0000000000a1',
    'authenticated',
    'authenticated',
    'user-a@example.test',
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-0000000000b1',
    'authenticated',
    'authenticated',
    'user-b@example.test',
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-0000000000c1',
    'authenticated',
    'authenticated',
    'super-admin@example.test',
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  );

insert into core.businesses (id, slug, display_name, default_locale)
values
  ('10000000-0000-0000-0000-000000000001', 'test-business-a', 'Test Business A', 'ar'),
  ('20000000-0000-0000-0000-000000000002', 'test-business-b', 'Test Business B', 'he');

insert into core.locations (id, business_id, display_name)
values
  (
    '11000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'Business A Location 1'
  ),
  (
    '11000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    'Business A Location 2'
  ),
  (
    '21000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000002',
    'Business B Location 1'
  );

insert into core.memberships (id, business_id, user_id)
values
  (
    '12000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-0000000000a1'
  ),
  (
    '22000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-0000000000b1'
  );

insert into core.membership_permissions (
  id,
  business_id,
  membership_id,
  permission_key,
  location_id
)
values
  (
    '13000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    '12000000-0000-0000-0000-000000000001',
    'locations.read',
    '11000000-0000-0000-0000-000000000001'
  ),
  (
    '13000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    '12000000-0000-0000-0000-000000000001',
    'locations.manage',
    '11000000-0000-0000-0000-000000000001'
  ),
  (
    '13000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000001',
    '12000000-0000-0000-0000-000000000001',
    'permissions.manage',
    '11000000-0000-0000-0000-000000000001'
  ),
  (
    '13000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000001',
    '12000000-0000-0000-0000-000000000001',
    'audit.view',
    null
  ),
  (
    '23000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000002',
    '22000000-0000-0000-0000-000000000001',
    'business.manage',
    null
  ),
  (
    '23000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000002',
    '22000000-0000-0000-0000-000000000001',
    'locations.read',
    null
  );

insert into core.business_modules (business_id, module_key)
values
  ('10000000-0000-0000-0000-000000000001', 'restaurant'),
  ('20000000-0000-0000-0000-000000000002', 'booking');

insert into core.audit_events (id, actor_kind, actor_user_id, business_id, action_key)
values
  (
    '14000000-0000-0000-0000-000000000001',
    'user',
    '00000000-0000-0000-0000-0000000000a1',
    '10000000-0000-0000-0000-000000000001',
    'business.tested'
  ),
  (
    '24000000-0000-0000-0000-000000000001',
    'user',
    '00000000-0000-0000-0000-0000000000b1',
    '20000000-0000-0000-0000-000000000002',
    'business.tested'
  );

insert into private.super_admins (user_id, reason)
values (
  '00000000-0000-0000-0000-0000000000c1',
  'Transaction-scoped pgTAP fixture'
);

select is(
  (select count(*) from core.profiles),
  3::bigint,
  'auth user creation produces one minimal profile per user'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);

select results_eq(
  $$select id from core.businesses order by id$$,
  $$values ('10000000-0000-0000-0000-000000000001'::uuid)$$,
  'user A can read business A and cannot read business B'
);

select results_eq(
  $$select id from core.profiles order by id$$,
  $$values ('00000000-0000-0000-0000-0000000000a1'::uuid)$$,
  'user A can read its own profile and no other user profile'
);

select results_eq(
  $$select id from core.locations order by id$$,
  $$values ('11000000-0000-0000-0000-000000000001'::uuid)$$,
  'user A sees only the location covered by a scoped permission'
);

select results_eq(
  $$update core.locations
      set display_name = 'Business A Location 1 Updated'
      where id = '11000000-0000-0000-0000-000000000001'
      returning id$$,
  $$values ('11000000-0000-0000-0000-000000000001'::uuid)$$,
  'user A can mutate the location covered by locations.manage'
);

select is_empty(
  $$update core.locations
      set display_name = 'Unauthorized Update'
      where id = '11000000-0000-0000-0000-000000000002'
      returning id$$,
  'user A cannot mutate another location in the same business'
);

select is(
  pg_temp.capture_sqlstate(
    $$insert into core.membership_permissions (
        business_id,
        membership_id,
        permission_key
      ) values (
        '10000000-0000-0000-0000-000000000001',
        '12000000-0000-0000-0000-000000000001',
        'business.manage'
      )$$
  ),
  '42501',
  'user A cannot grant itself a permission it does not possess at business scope'
);

select is(
  (select private.is_super_admin()),
  false,
  'a normal tenant user is not a platform super admin'
);

select is(
  pg_temp.capture_sqlstate(
    $$insert into private.super_admins (user_id, reason)
      values (
        '00000000-0000-0000-0000-0000000000a1',
        'Unauthorized self-promotion'
      )$$
  ),
  '42501',
  'a normal user cannot self-promote into private.super_admins'
);

select is(
  (select count(*) from core.audit_events),
  1::bigint,
  'audit.view exposes only audit rows for the authorized business'
);

select results_eq(
  $$select module_key from core.business_modules order by module_key$$,
  $$values ('restaurant'::text)$$,
  'user A sees module enablement only for business A'
);

select is(
  pg_temp.capture_sqlstate(
    $$update core.business_modules
      set is_enabled = false,
          updated_by = '00000000-0000-0000-0000-0000000000a1'
      where business_id = '10000000-0000-0000-0000-000000000001'
      returning business_id$$
  ),
  '42501',
  'user A cannot bypass the audited module mutation boundary'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b1', true);

select results_eq(
  $$select id from core.businesses order by id$$,
  $$values ('20000000-0000-0000-0000-000000000002'::uuid)$$,
  'user B can read business B and cannot read business A'
);

select is_empty(
  $$update core.businesses
      set display_name = 'Unauthorized Business Mutation'
      where id = '10000000-0000-0000-0000-000000000001'
      returning id$$,
  'user B cannot mutate business A'
);

select results_eq(
  $$select id from core.locations order by id$$,
  $$values ('21000000-0000-0000-0000-000000000001'::uuid)$$,
  'user B business-wide location permission does not cross tenant boundaries'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c1', true);

select is(
  (select private.is_super_admin()),
  true,
  'the explicit private assignment identifies the platform super admin'
);

select is(
  (select count(*) from core.businesses),
  2::bigint,
  'the platform super admin can read across tenant boundaries'
);

select is(
  (select count(*) from core.audit_events),
  2::bigint,
  'the platform super admin can read platform-wide audit scope'
);

reset role;
set local role anon;
select set_config('request.jwt.claim.sub', '', true);

select is(
  pg_temp.capture_sqlstate($$select * from core.businesses$$),
  '42501',
  'an anonymous request cannot read tenant tables'
);

select is(
  pg_temp.capture_sqlstate($$select * from core.memberships$$),
  '42501',
  'an anonymous request cannot read membership data'
);

select is(
  pg_temp.capture_sqlstate($$select * from private.super_admins$$),
  '42501',
  'an anonymous request cannot read platform super-admin assignments'
);

reset role;

select * from finish();

rollback;
