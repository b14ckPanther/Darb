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

select plan(27);

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
    '00000000-0000-0000-0000-0000000001a1',
    'authenticated',
    'authenticated',
    'bootstrap-a@example.test',
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-0000000001b1',
    'authenticated',
    'authenticated',
    'bootstrap-b@example.test',
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-0000000001c1',
    'authenticated',
    'authenticated',
    'bootstrap-suspended@example.test',
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  );

insert into core.businesses (id, slug, display_name, default_locale)
values (
  '30000000-0000-0000-0000-000000000001',
  'suspended-membership-business',
  'Suspended Membership Business',
  'en'
);

insert into core.memberships (id, business_id, user_id, status)
values (
  '32000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-0000000001c1',
  'suspended'
);

select has_function(
  'core',
  'bootstrap_first_business',
  array['text', 'text', 'text'],
  'the exposed bootstrap function has only validated business input parameters'
);

select hasnt_function(
  'core',
  'bootstrap_first_business',
  array['text', 'text', 'text', 'uuid'],
  'the bootstrap function has no caller-selectable user parameter'
);

set local role anon;
select set_config('request.jwt.claim.sub', '', true);

select is(
  pg_temp.capture_sqlstate(
    $$select * from core.bootstrap_first_business('Anonymous', 'anonymous-business', 'en')$$
  ),
  '42501',
  'an anonymous caller cannot execute first-business bootstrap'
);

select is(
  pg_temp.capture_sqlstate($$select core.current_user_is_super_admin()$$),
  '42501',
  'an anonymous caller cannot execute the exposed authorization helper'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000001a1', true);

select is(
  (select was_created from core.bootstrap_first_business('  Business A  ', 'BUSINESS-A', 'ar')),
  true,
  'an authenticated user can create a first business'
);

select results_eq(
  $$select slug, display_name, default_locale::text, currency_code, timezone
      from core.businesses$$,
  $$values ('business-a'::text, 'Business A'::text, 'ar'::text, 'ILS'::text, 'Asia/Jerusalem'::text)$$,
  'bootstrap normalizes names and slugs while retaining platform defaults'
);

select results_eq(
  $$select user_id, status::text
      from core.memberships$$,
  $$values ('00000000-0000-0000-0000-0000000001a1'::uuid, 'active'::text)$$,
  'the bootstrap membership belongs to the authenticated caller and is active'
);

select set_eq(
  $$select permission_key from core.membership_permissions$$,
  $$values
      ('business.manage'::text),
      ('locations.read'::text),
      ('locations.manage'::text),
      ('memberships.manage'::text),
      ('permissions.manage'::text),
      ('modules.manage'::text),
      ('audit.view'::text)$$,
  'bootstrap grants exactly the reviewed seven-permission owner bundle'
);

select results_eq(
  $$select action_key, actor_user_id, entity_type, metadata ->> 'source'
      from core.audit_events$$,
  $$values (
      'business.created'::text,
      '00000000-0000-0000-0000-0000000001a1'::uuid,
      'core.business'::text,
      'first_business_bootstrap'::text
    )$$,
  'bootstrap writes the expected business.created audit event'
);

select is(
  (select core.current_user_has_permission(
    (select id from core.businesses where slug = 'business-a'),
    'permissions.manage'
  )),
  true,
  'the application permission helper delegates to database authorization'
);

select is(
  (select core.current_user_is_super_admin()),
  false,
  'business bootstrap does not promote the caller to platform super admin'
);

select is(
  (select was_created from core.bootstrap_first_business('Business A', 'business-a', 'ar')),
  false,
  'an exact repeated bootstrap is idempotent'
);

select is(
  (select count(*) from core.businesses),
  1::bigint,
  'an exact retry does not create another business'
);

select is(
  (select count(*) from core.memberships),
  1::bigint,
  'an exact retry does not create another membership'
);

select is(
  (select count(*) from core.audit_events where action_key = 'business.created'),
  1::bigint,
  'an exact retry does not duplicate the audit event'
);

select is(
  pg_temp.capture_sqlstate(
    $$select * from core.bootstrap_first_business('Another Business', 'another-business', 'en')$$
  ),
  'P0001',
  'a user with an active business cannot use bootstrap to create another tenant'
);

select is(
  pg_temp.capture_sqlstate(
    $$select * from core.bootstrap_first_business(
        'Business A',
        'business-a',
        'ar',
        '00000000-0000-0000-0000-0000000001b1'::uuid
      )$$
  ),
  '42883',
  'a caller cannot provide another user as the bootstrap membership owner'
);

select is(
  pg_temp.capture_sqlstate(
    $$select * from core.bootstrap_first_business(
        'Business A',
        'business-a',
        'ar',
        array['restaurant.manage']::text[]
      )$$
  ),
  '42883',
  'a caller cannot provide an arbitrary permission bundle'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000001b1', true);

select is(
  pg_temp.capture_sqlstate(
    $$select * from core.bootstrap_first_business('Conflicting Business', 'business-a', 'he')$$
  ),
  '23505',
  'business slug uniqueness is enforced during bootstrap'
);

select is(
  (select count(*) from core.memberships),
  0::bigint,
  'a failed slug-conflict bootstrap leaves no partial membership'
);

select is(
  (select was_created from core.bootstrap_first_business('Business B', 'business-b', 'he')),
  true,
  'a second user can bootstrap a distinct tenant'
);

select results_eq(
  $$select slug from core.businesses order by slug$$,
  $$values ('business-b'::text)$$,
  'the second user sees only its bootstrapped tenant'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000001a1', true);

select results_eq(
  $$select slug from core.businesses order by slug$$,
  $$values ('business-a'::text)$$,
  'the first user remains isolated from the second bootstrapped tenant'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000001c1', true);

select is(
  (select count(*) from core.businesses),
  0::bigint,
  'a suspended membership does not provide tenant access'
);

select is(
  (select was_created from core.bootstrap_first_business(
    'Replacement Business',
    'replacement-business',
    'en'
  )),
  true,
  'a user with no active membership may bootstrap despite a suspended relationship'
);

select is(
  (select count(*) from core.memberships where status = 'active'),
  1::bigint,
  'the suspended-membership caller receives exactly one active bootstrap membership'
);

select is(
  (select count(*) from core.business_modules),
  0::bigint,
  'bootstrap does not enable any business modules prematurely'
);

reset role;

select * from finish();

rollback;
