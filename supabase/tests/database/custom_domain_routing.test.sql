begin;
create extension if not exists pgtap with schema extensions;

create function pg_temp.capture_sqlstate(statement text)
returns text language plpgsql as $$
begin execute statement; return null;
exception when others then return sqlstate;
end;
$$;

select no_plan();

insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-0000000012a1', 'authenticated', 'authenticated', 'phase12-owner-a@example.test', '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-0000000012a2', 'authenticated', 'authenticated', 'phase12-reader-a@example.test', '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-0000000012b1', 'authenticated', 'authenticated', 'phase12-owner-b@example.test', '{}'::jsonb, '{}'::jsonb, now(), now());

insert into core.businesses (id, slug, display_name, default_locale, status)
values
  ('12000000-0000-0000-0000-000000000001', 'phase12-a', 'Phase 12 A', 'en', 'active'),
  ('12000000-0000-0000-0000-000000000002', 'phase12-b', 'Phase 12 B', 'ar', 'active');

insert into core.business_modules (business_id, module_key, is_enabled)
values
  ('12000000-0000-0000-0000-000000000001', 'restaurant', true),
  ('12000000-0000-0000-0000-000000000001', 'pages', true),
  ('12000000-0000-0000-0000-000000000002', 'restaurant', true);

insert into core.memberships (id, business_id, user_id, status)
values
  ('12100000-0000-0000-0000-000000000001', '12000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000012a1', 'active'),
  ('12100000-0000-0000-0000-000000000002', '12000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000012a2', 'active'),
  ('12100000-0000-0000-0000-000000000003', '12000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000012b1', 'active');

insert into core.membership_permissions (business_id, membership_id, permission_key, location_id, granted_by)
values
  ('12000000-0000-0000-0000-000000000001', '12100000-0000-0000-0000-000000000001', 'domains.manage', null, '00000000-0000-0000-0000-0000000012a1'),
  ('12000000-0000-0000-0000-000000000002', '12100000-0000-0000-0000-000000000003', 'domains.manage', null, '00000000-0000-0000-0000-0000000012b1');

select has_column('core', 'business_domains', 'target_module_key', 'domain target is explicit');
select has_column('core', 'business_domains', 'routing_status', 'routing state is separate from ownership');
select enum_has_labels('core', 'domain_routing_status', array['unconfigured','provisioning','live','failed','disconnected'], 'routing lifecycle is canonical');
select has_function('public', 'resolve_public_domain', array['text'], 'anonymous-safe exact-host resolver exists');
select has_function('public', 'resolve_public_restaurant_primary_domain', array['text'], 'platform canonical-host resolver exists');

insert into core.business_domains (id, business_id, hostname, status, verification_token, verification_method, verification_checked_at, verified_at)
values ('12200000-0000-0000-0000-000000000000', '12000000-0000-0000-0000-000000000001', 'legacy.example.test', 'verified', repeat('a', 64), 'dns_txt', now(), now());
select results_eq(
  $$select target_module_key, routing_status::text, is_primary from core.business_domains where id = '12200000-0000-0000-0000-000000000000'$$,
  $$values (null::text, 'unconfigured'::text, false)$$,
  'an ownership claim remains conservatively unassigned and unroutable'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000012a1', true);
select * from core.add_business_domain('12000000-0000-0000-0000-000000000001', 'menu-a.example.test');
select is(
  pg_temp.capture_sqlstate($$select * from core.set_business_domain_target(
    '12000000-0000-0000-0000-000000000001',
    (select id from core.business_domains where hostname = 'menu-a.example.test'), 'restaurant')$$),
  '55000', 'an unverified ownership claim cannot receive a routing target'
);

reset role; set local role service_role;
select * from core.record_business_domain_verification(
  (select id from core.business_domains where hostname = 'menu-a.example.test'),
  '00000000-0000-0000-0000-0000000012a1', true);

reset role; set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000012a2', true);
select is(
  pg_temp.capture_sqlstate($$select * from core.set_business_domain_target(
    '12000000-0000-0000-0000-000000000001',
    (select id from core.business_domains where hostname = 'menu-a.example.test'), 'restaurant')$$),
  '42501', 'a member without domains.manage cannot assign a target'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000012b1', true);
select is(
  pg_temp.capture_sqlstate($$select * from core.set_business_domain_target(
    '12000000-0000-0000-0000-000000000002',
    (select id from core.business_domains where hostname = 'menu-a.example.test'), 'restaurant')$$),
  '42501', 'a tenant cannot target another tenant domain'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000012a1', true);
select is(
  (select target_module_key from core.set_business_domain_target(
    '12000000-0000-0000-0000-000000000001',
    (select id from core.business_domains where hostname = 'menu-a.example.test'), 'restaurant')),
  'restaurant', 'an authorized owner can explicitly choose Restaurant'
);
select is(
  (select routing_status::text from core.begin_business_domain_routing(
    '12000000-0000-0000-0000-000000000001',
    (select id from core.business_domains where hostname = 'menu-a.example.test'))),
  'provisioning', 'connection starts in a non-live provisioning state'
);
select is(
  pg_temp.capture_sqlstate($$select * from core.record_business_domain_routing_attestation(
    (select id from core.business_domains where hostname = 'menu-a.example.test'),
    '00000000-0000-0000-0000-0000000012a1', 'live')$$),
  '42501', 'a browser-authenticated tenant cannot attest provider readiness'
);

reset role; set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select is(public.resolve_public_domain('menu-a.example.test'), null, 'provisioning domains fail closed publicly');
select is(
  pg_temp.capture_sqlstate($$select * from core.begin_business_domain_routing(
    '12000000-0000-0000-0000-000000000001',
    (select id from core.business_domains where hostname = 'menu-a.example.test'))$$),
  '42501', 'anonymous callers cannot begin deployment routing'
);
select is(
  pg_temp.capture_sqlstate($$select count(*) from core.business_domains$$),
  '42501', 'anonymous cannot read raw domain administration rows'
);

reset role; set local role service_role;
select is(
  (select routing_status::text from core.record_business_domain_routing_attestation(
    (select id from core.business_domains where hostname = 'menu-a.example.test'),
    '00000000-0000-0000-0000-0000000012a1', 'live')),
  'live', 'the service-only attestation boundary can record provider readiness'
);

reset role; set local role anon;
select is(
  public.resolve_public_domain('menu-a.example.test')->>'businessSlug',
  'phase12-a', 'an exact live hostname resolves to its public business slug'
);
select is(public.resolve_public_domain('MENU-A.EXAMPLE.TEST'), null, 'non-normalized host input fails closed');
select is(public.resolve_public_domain('menu-a.example.test,evil.test'), null, 'multi-value Host input fails closed');
select is(public.resolve_public_domain('admin.darb.co.il'), null, 'reserved Darb hosts never resolve as tenants');
select ok(
  not (public.resolve_public_domain('menu-a.example.test') ? 'businessId')
  and not (public.resolve_public_domain('menu-a.example.test') ? 'verificationToken'),
  'the public resolver exposes no tenant UUID or ownership token'
);

reset role; set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000012a1', true);
select is(
  (select is_primary from core.set_business_domain_primary(
    '12000000-0000-0000-0000-000000000001',
    (select id from core.business_domains where hostname = 'menu-a.example.test'))),
  true, 'only a verified live target can become primary'
);
reset role; set local role anon;
select is(public.resolve_public_restaurant_primary_domain('phase12-a'), 'menu-a.example.test', 'platform routes resolve the trusted primary Restaurant origin');

reset role;
update core.business_modules set is_enabled = false
where business_id = '12000000-0000-0000-0000-000000000001' and module_key = 'restaurant';
set local role anon;
select is(public.resolve_public_domain('menu-a.example.test'), null, 'disabled module state makes a retained live row unroutable');
reset role;
select is((select routing_status::text from core.business_domains where hostname = 'menu-a.example.test'), 'live', 'module disablement retains routing history without implying capability enablement');
update core.business_modules set is_enabled = true
where business_id = '12000000-0000-0000-0000-000000000001' and module_key = 'restaurant';

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000012a1', true);
select is(
  (select routing_status::text from core.disconnect_business_domain_routing(
    '12000000-0000-0000-0000-000000000001',
    (select id from core.business_domains where hostname = 'menu-a.example.test'))),
  'disconnected', 'disconnect revokes Darb routing before provider cleanup'
);
select is(
  (select routing_status::text from core.disconnect_business_domain_routing(
    '12000000-0000-0000-0000-000000000001',
    (select id from core.business_domains where hostname = 'menu-a.example.test'))),
  'disconnected', 'disconnect is idempotent'
);
select is((select is_primary from core.business_domains where hostname = 'menu-a.example.test'), false, 'disconnect clears canonical primary state');

reset role; set local role anon;
select is(public.resolve_public_domain('menu-a.example.test'), null, 'disconnected host fails closed immediately');

reset role;
select is(
  (select count(*)::integer from core.audit_events
   where business_id = '12000000-0000-0000-0000-000000000001'
     and action_key = 'business.domain_target_changed'),
  1, 'target changes are audited once'
);
select is(
  (select count(*)::integer from core.audit_events
   where business_id = '12000000-0000-0000-0000-000000000001'
     and action_key = 'business.domain_routing_activated'),
  1, 'actual live activation is audited once'
);
select is(
  (select count(*)::integer from core.audit_events
   where business_id = '12000000-0000-0000-0000-000000000001'
     and action_key = 'business.domain_routing_disconnected'),
  1, 'idempotent disconnect emits no duplicate audit event'
);
select is(
  (select count(*)::integer from core.audit_events where metadata::text like '%apiToken%'),
  0, 'provider credentials never enter audit metadata'
);

update core.businesses set status = 'suspended' where id = '12000000-0000-0000-0000-000000000001';
set local role anon;
select is(public.resolve_public_domain('menu-a.example.test'), null, 'suspended businesses never resolve publicly');
reset role; set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000012a1', true);
select is(
  pg_temp.capture_sqlstate($$select * from core.begin_business_domain_routing(
    '12000000-0000-0000-0000-000000000001',
    (select id from core.business_domains where hostname = 'menu-a.example.test'))$$),
  '55000', 'suspended business routing mutation fails closed'
);

select * from finish();
rollback;
