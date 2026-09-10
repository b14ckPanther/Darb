begin;

create extension if not exists pgtap with schema extensions;

create function pg_temp.capture_sqlstate(statement text)
returns text language plpgsql as $$
begin execute statement; return null;
exception when others then return sqlstate;
end;
$$;

select plan(20);

select has_column('core', 'businesses', 'onboarding_completed_at', 'businesses records first-setup completion');
select has_function('core', 'complete_first_business_onboarding', array['uuid','text[]','text','boolean','text','text','text'], 'onboarding completion has a narrow typed RPC');

insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000001501', 'authenticated', 'authenticated', 'onboarding-owner@example.test', '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000001502', 'authenticated', 'authenticated', 'onboarding-other@example.test', '{}'::jsonb, '{}'::jsonb, now(), now());

set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select is(pg_temp.capture_sqlstate($$select * from core.complete_first_business_onboarding(gen_random_uuid(), array['en'], '', false, '', '', '')$$), '42501', 'anonymous onboarding completion is denied');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000001501', true);

select is(pg_temp.capture_sqlstate($$select * from core.bootstrap_first_business('Reserved', 'admin', 'en')$$), '22023', 'reserved platform slugs are rejected authoritatively');
select is((select count(*) from core.businesses), 0::bigint, 'reserved slug rejection creates no tenant');

select is((select was_created from core.bootstrap_first_business('Onboarding Cafe', 'onboarding-cafe', 'ar')), true, 'owner bootstraps the first business');
select is((select onboarding_completed_at is null from core.businesses where slug = 'onboarding-cafe'), true, 'new tenant remains explicitly incomplete');

select is(pg_temp.capture_sqlstate($$select * from core.complete_first_business_onboarding((select id from core.businesses where slug = 'onboarding-cafe'), array['he'], 'restaurant', true, 'Main', '', '')$$), '22023', 'default public locale must remain enabled');
select is((select count(*) from core.locations), 0::bigint, 'failed setup leaves no partial location');

select is((select was_completed from core.complete_first_business_onboarding((select id from core.businesses where slug = 'onboarding-cafe'), array['ar','he'], 'restaurant', true, 'Main', '1 Darb Street', 'Haifa')), true, 'valid setup completes atomically');
select is((select onboarding_completed_at is not null from core.businesses where slug = 'onboarding-cafe'), true, 'completion timestamp is persisted');
select is((select count(*) from core.locations where display_name = 'Main'), 1::bigint, 'first location is created once');
select is((select is_enabled from core.business_modules where module_key = 'restaurant'), true, 'selected available module is enabled');
select set_eq($$select locale_code::text from core.business_locales where is_enabled$$, $$values ('ar'::text), ('he'::text)$$, 'selected public locales are enabled');
select is((select count(*) from core.audit_events where action_key = 'business.onboarding_completed'), 1::bigint, 'completion emits one narrow audit event');
select is((select was_completed from core.complete_first_business_onboarding((select id from core.businesses where slug = 'onboarding-cafe'), array['ar','he'], 'restaurant', true, 'Main', '1 Darb Street', 'Haifa')), false, 'exact completion retry is predictable');
select is((select count(*) from core.locations), 1::bigint, 'retry does not duplicate the location');
select is((select count(*) from core.audit_events where action_key = 'business.onboarding_completed'), 1::bigint, 'retry does not duplicate completion audit');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000001502', true);
select is(pg_temp.capture_sqlstate($$select * from core.complete_first_business_onboarding((select id from core.businesses where slug = 'onboarding-cafe'), array['ar'], '', false, '', '', '')$$), '42501', 'another authenticated user cannot complete the tenant setup');

reset role;
select is((select count(*) from information_schema.routine_privileges where routine_schema = 'core' and routine_name = 'complete_first_business_onboarding' and grantee = 'anon'), 0::bigint, 'anon has no execute grant');

select * from finish();
rollback;
