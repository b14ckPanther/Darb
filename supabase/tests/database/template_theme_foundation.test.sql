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

insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-0000000007a1', 'authenticated', 'authenticated', 'appearance-owner@example.test', '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-0000000007a2', 'authenticated', 'authenticated', 'appearance-reader@example.test', '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-0000000007b1', 'authenticated', 'authenticated', 'appearance-other@example.test', '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-0000000007c1', 'authenticated', 'authenticated', 'appearance-super@example.test', '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-0000000007d1', 'authenticated', 'authenticated', 'appearance-lifecycle@example.test', '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-0000000007e1', 'authenticated', 'authenticated', 'appearance-backfill-owner@example.test', '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-0000000007e2', 'authenticated', 'authenticated', 'appearance-backfill-partial@example.test', '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-0000000007f1', 'authenticated', 'authenticated', 'appearance-bootstrap@example.test', '{}', '{}', now(), now());

insert into core.businesses (id, slug, display_name, default_locale, status)
values
  ('70000000-0000-0000-0000-000000000001', 'appearance-business-a', 'Appearance Business A', 'en', 'active'),
  ('70000000-0000-0000-0000-000000000002', 'appearance-business-b', 'Appearance Business B', 'he', 'active'),
  ('70000000-0000-0000-0000-000000000003', 'appearance-suspended', 'Appearance Suspended', 'ar', 'suspended'),
  ('70000000-0000-0000-0000-000000000004', 'appearance-archived', 'Appearance Archived', 'en', 'archived'),
  ('70000000-0000-0000-0000-000000000005', 'appearance-backfill-a', 'Appearance Backfill A', 'en', 'active'),
  ('70000000-0000-0000-0000-000000000006', 'appearance-backfill-b', 'Appearance Backfill B', 'en', 'active');

insert into core.memberships (id, business_id, user_id)
values
  ('71000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000007a1'),
  ('71000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000007a2'),
  ('71000000-0000-0000-0000-000000000003', '70000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000007b1'),
  ('71000000-0000-0000-0000-000000000004', '70000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-0000000007d1'),
  ('71000000-0000-0000-0000-000000000005', '70000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-0000000007d1'),
  ('71000000-0000-0000-0000-000000000006', '70000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-0000000007e1'),
  ('71000000-0000-0000-0000-000000000007', '70000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-0000000007e2');

insert into core.membership_permissions (business_id, membership_id, permission_key)
values
  ('70000000-0000-0000-0000-000000000001', '71000000-0000-0000-0000-000000000001', 'appearance.manage'),
  ('70000000-0000-0000-0000-000000000001', '71000000-0000-0000-0000-000000000001', 'modules.manage'),
  ('70000000-0000-0000-0000-000000000002', '71000000-0000-0000-0000-000000000003', 'appearance.manage'),
  ('70000000-0000-0000-0000-000000000002', '71000000-0000-0000-0000-000000000003', 'modules.manage'),
  ('70000000-0000-0000-0000-000000000003', '71000000-0000-0000-0000-000000000004', 'appearance.manage'),
  ('70000000-0000-0000-0000-000000000004', '71000000-0000-0000-0000-000000000005', 'appearance.manage');

insert into core.membership_permissions (business_id, membership_id, permission_key)
select '70000000-0000-0000-0000-000000000005', '71000000-0000-0000-0000-000000000006', key
from unnest(array[
  'business.manage', 'locations.read', 'locations.manage', 'memberships.manage',
  'permissions.manage', 'modules.manage', 'media.manage', 'domains.manage', 'audit.view'
]) as bundle(key);
insert into core.membership_permissions (business_id, membership_id, permission_key)
values
  ('70000000-0000-0000-0000-000000000006', '71000000-0000-0000-0000-000000000007', 'business.manage'),
  ('70000000-0000-0000-0000-000000000006', '71000000-0000-0000-0000-000000000007', 'modules.manage');

insert into core.business_modules (business_id, module_key, is_enabled)
values
  ('70000000-0000-0000-0000-000000000001', 'pages', true),
  ('70000000-0000-0000-0000-000000000002', 'pages', true),
  ('70000000-0000-0000-0000-000000000003', 'pages', true),
  ('70000000-0000-0000-0000-000000000004', 'pages', true);

insert into private.super_admins (user_id, reason)
values ('00000000-0000-0000-0000-0000000007c1', 'Transaction-scoped appearance security test');

select has_table('core', 'templates', 'platform template registry exists');
select has_table('core', 'business_visual_settings', 'tenant visual settings exist separately');
select has_function('core', 'set_business_appearance', array['uuid', 'text', 'text', 'jsonb'], 'appearance has one narrow update RPC');
select has_function('core', 'reset_business_theme_overrides', array['uuid', 'text'], 'theme reset has one narrow RPC');
select ok(has_function_privilege('authenticated', 'core.set_business_appearance(uuid,text,text,jsonb)', 'execute'), 'authenticated callers may execute the guarded RPC');
select ok(not has_function_privilege('service_role', 'core.set_business_appearance(uuid,text,text,jsonb)', 'execute'), 'service role is not conceptually granted the tenant RPC');
select is((select scope::text from core.permissions where key = 'appearance.manage'), 'business', 'appearance.manage is business scoped');
select results_eq(
  $$select key, module_key, is_default, sort_order from core.templates order by sort_order$$,
  $$values ('foundation-canvas'::text, 'pages'::text, true, 10),
           ('foundation-editorial'::text, 'pages'::text, false, 20)$$,
  'the minimal platform template registry is deterministic'
);
select ok((select bool_and(private.theme_has_safe_critical_contrast(default_theme)) from core.templates), 'all platform defaults pass critical contrast');
select is((select count(*)::integer from core.business_visual_settings), 0, 'absence is the canonical default-template and empty-overrides state');
select ok(not has_table_privilege('authenticated', 'core.templates', 'insert'), 'tenant callers cannot create templates');
select ok(not has_table_privilege('authenticated', 'core.business_visual_settings', 'insert'), 'tenant callers cannot bypass the audited settings boundary');
select is(
  pg_temp.capture_sqlstate($$insert into core.templates (
    key, module_key, display_name, description, is_default, default_theme
  ) select 'unsafe-default', 'pages', 'Unsafe', 'Unsafe contrast test template', false,
    private.merge_theme_json(default_theme, '{"colors":{"primary":"#FFFFFF"}}')
    from core.templates where key = 'foundation-canvas'$$),
  '23514',
  'platform defaults cannot violate critical contrast'
);

set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select is(pg_temp.capture_sqlstate($$select * from core.set_business_appearance(
  '70000000-0000-0000-0000-000000000001', 'pages', 'foundation-editorial', '{}'::jsonb
)$$), '42501', 'anonymous callers cannot mutate appearance');
select is(pg_temp.capture_sqlstate($$select * from core.reset_business_theme_overrides(
  '70000000-0000-0000-0000-000000000001', 'pages'
)$$), '42501', 'anonymous callers cannot reset appearance');
select is(
  pg_temp.capture_sqlstate($$select count(*) from core.templates$$),
  '42501',
  'anonymous callers cannot read platform templates'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000007a1', true);
select results_eq(
  $$select can_manage_appearance, is_super_admin from core.current_user_business_access('70000000-0000-0000-0000-000000000001')$$,
  $$values (true, false)$$,
  'the access snapshot exposes database-authoritative appearance access'
);
select is((select count(*)::integer from core.templates), 2, 'authenticated members can read platform templates');
select results_eq(
  $$select module_key, template_key, changed, template_changed, theme_changed
    from core.set_business_appearance('70000000-0000-0000-0000-000000000001', 'pages', 'foundation-editorial', '{}'::jsonb)$$,
  $$values ('pages'::text, 'foundation-editorial'::text, true, true, false)$$,
  'appearance.manage can select an available template for an enabled module'
);
select results_eq(
  $$select template_key, theme_overrides from core.business_visual_settings
    where business_id = '70000000-0000-0000-0000-000000000001' and module_key = 'pages'$$,
  $$values ('foundation-editorial'::text, '{}'::jsonb)$$,
  'template selection persists in one per-business and module row'
);

reset role;
select results_eq(
  $$select actor_user_id, action_key, metadata ->> 'previous_template_key', metadata ->> 'new_template_key'
    from core.audit_events where business_id = '70000000-0000-0000-0000-000000000001'$$,
  $$values ('00000000-0000-0000-0000-0000000007a1'::uuid, 'business.template_changed'::text,
    'foundation-canvas'::text, 'foundation-editorial'::text)$$,
  'template audit derives the actor and records narrow keys only'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000007a1', true);
select results_eq(
  $$select changed, template_changed, theme_changed from core.set_business_appearance(
    '70000000-0000-0000-0000-000000000001', 'pages', 'foundation-editorial', '{}'::jsonb)$$,
  $$values (false, false, false)$$,
  'repeated template selection is an explicit no-op'
);
select results_eq(
  $$select changed, template_changed, theme_changed from core.set_business_appearance(
    '70000000-0000-0000-0000-000000000001', 'pages', 'foundation-editorial',
    '{"colors":{"primary":"#2F1630","onPrimary":"#FFFFFF"},"shape":{"radius":"bold"},"motion":"expressive"}'::jsonb)$$,
  $$values (true, false, true)$$,
  'closed semantic overrides can be applied without changing composition'
);

reset role;
select is((select count(*)::integer from core.audit_events where business_id = '70000000-0000-0000-0000-000000000001' and action_key = 'business.template_changed'), 1, 'no-op template selection creates no duplicate audit');
select is((select count(*)::integer from core.audit_events where business_id = '70000000-0000-0000-0000-000000000001' and action_key = 'business.theme_updated'), 1, 'actual theme update emits one event');
select ok(
  (select metadata -> 'changed_tokens' ? 'colors.primary' and metadata -> 'changed_tokens' ? 'shape.radius'
   from core.audit_events where business_id = '70000000-0000-0000-0000-000000000001' and action_key = 'business.theme_updated'),
  'theme audit records changed token paths rather than the full payload'
);
select ok(
  (select not metadata ? 'theme_overrides' from core.audit_events
   where business_id = '70000000-0000-0000-0000-000000000001' and action_key = 'business.theme_updated'),
  'audit metadata does not copy the override document'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000007a1', true);
select is(pg_temp.capture_sqlstate($$select * from core.set_business_appearance(
  '70000000-0000-0000-0000-000000000001', 'pages', 'foundation-editorial', '{"css":"position:fixed"}'::jsonb
)$$), '22023', 'arbitrary CSS-shaped keys are rejected');
select is(pg_temp.capture_sqlstate($$select * from core.set_business_appearance(
  '70000000-0000-0000-0000-000000000001', 'pages', 'foundation-editorial', '{"colors":{"primary":"url(https://example.test)"}}'::jsonb
)$$), '22023', 'CSS URLs and non-canonical colors are rejected');
select is(pg_temp.capture_sqlstate($$select * from core.set_business_appearance(
  '70000000-0000-0000-0000-000000000001', 'pages', 'foundation-editorial', '{"colors":{"primary":"#FFFFFF","onPrimary":"#FFFFFF"}}'::jsonb
)$$), '22023', 'critical contrast violations are rejected in the database');
select is(pg_temp.capture_sqlstate($$select * from core.set_business_appearance(
  '70000000-0000-0000-0000-000000000001', 'restaurant', 'foundation-editorial', '{}'::jsonb
)$$), '55000', 'appearance requires an effectively enabled module');
select is(pg_temp.capture_sqlstate($$select * from core.set_business_appearance(
  '70000000-0000-0000-0000-000000000001', 'pages', 'missing-template', '{}'::jsonb
)$$), '22023', 'unknown templates are rejected');

reset role;
update core.templates set is_available = false where key = 'foundation-canvas';
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000007a1', true);
select is(pg_temp.capture_sqlstate($$select * from core.set_business_appearance(
  '70000000-0000-0000-0000-000000000001', 'pages', 'foundation-canvas', '{}'::jsonb
)$$), '55000', 'unavailable templates cannot be newly selected');
reset role;
update core.templates set is_available = true where key = 'foundation-canvas';

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000007a1', true);
select results_eq(
  $$select module_key, template_key, changed from core.reset_business_theme_overrides('70000000-0000-0000-0000-000000000001', 'pages')$$,
  $$values ('pages'::text, 'foundation-editorial'::text, true)$$,
  'reset removes actual overrides without changing template'
);
select results_eq(
  $$select changed from core.reset_business_theme_overrides('70000000-0000-0000-0000-000000000001', 'pages')$$,
  $$values (false)$$,
  'repeated reset is an explicit no-op'
);
reset role;
select is((select count(*)::integer from core.audit_events where business_id = '70000000-0000-0000-0000-000000000001' and action_key = 'business.theme_reset'), 1, 'only the actual reset emits an audit event');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000007a2', true);
select is(pg_temp.capture_sqlstate($$select * from core.set_business_appearance(
  '70000000-0000-0000-0000-000000000001', 'pages', 'foundation-canvas', '{}'::jsonb
)$$), '42501', 'membership alone does not grant appearance mutation');
select is((select count(*)::integer from core.business_visual_settings where business_id = '70000000-0000-0000-0000-000000000001'), 1, 'business members can read their tenant visual state');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000007b1', true);
select is(pg_temp.capture_sqlstate($$select * from core.set_business_appearance(
  '70000000-0000-0000-0000-000000000001', 'pages', 'foundation-canvas', '{}'::jsonb
)$$), '42501', 'cross-tenant appearance mutation is denied');
select is((select count(*)::integer from core.business_visual_settings where business_id = '70000000-0000-0000-0000-000000000001'), 0, 'cross-tenant appearance reads are denied by RLS');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000007d1', true);
select is(pg_temp.capture_sqlstate($$select * from core.set_business_appearance(
  '70000000-0000-0000-0000-000000000003', 'pages', 'foundation-canvas', '{}'::jsonb
)$$), '55000', 'suspended businesses cannot mutate appearance');
select is(pg_temp.capture_sqlstate($$select * from core.set_business_appearance(
  '70000000-0000-0000-0000-000000000004', 'pages', 'foundation-canvas', '{}'::jsonb
)$$), '55000', 'archived businesses cannot mutate appearance');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000007c1', true);
select results_eq(
  $$select can_manage_appearance, is_super_admin from core.current_user_business_access('70000000-0000-0000-0000-000000000003')$$,
  $$values (true, true)$$,
  'super-admin authorization remains explicit in the snapshot'
);
select is(pg_temp.capture_sqlstate($$select * from core.set_business_appearance(
  '70000000-0000-0000-0000-000000000003', 'pages', 'foundation-canvas', '{}'::jsonb
)$$), '55000', 'even super admins must reactivate a suspended tenant before appearance changes');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000007a1', true);
select is(pg_temp.capture_sqlstate($$insert into core.business_visual_settings (
  business_id, module_key, template_key, updated_by
) values (
  '70000000-0000-0000-0000-000000000001', 'pages', 'foundation-canvas', '00000000-0000-0000-0000-0000000007a1'
) on conflict (business_id, module_key) do update set template_key = excluded.template_key$$), '42501', 'authenticated callers cannot bypass audit with direct writes');
select is(pg_temp.capture_sqlstate($$insert into core.templates (
  key, module_key, display_name, description, default_theme
) select 'tenant-template', 'pages', 'Tenant', 'Tenant-defined template is prohibited', default_theme
  from core.templates where key = 'foundation-canvas'$$), '42501', 'tenant callers cannot define platform templates');

reset role;
select is(private.backfill_phase7_owner_permissions(), 1, 'narrow owner backfill adds only one eligible assignment');
select ok(exists(
  select 1 from core.membership_permissions where membership_id = '71000000-0000-0000-0000-000000000006' and permission_key = 'appearance.manage'
), 'complete Phase 6 owner bundle receives appearance.manage');
select ok(not exists(
  select 1 from core.membership_permissions where membership_id = '71000000-0000-0000-0000-000000000007' and permission_key = 'appearance.manage'
), 'partial broad membership is not expanded');
select is(private.backfill_phase7_owner_permissions(), 0, 'owner backfill is idempotent');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000007f1', true);
select results_eq(
  $$select was_created from core.bootstrap_first_business('Phase 7 Bootstrap', 'phase-7-bootstrap', 'en')$$,
  $$values (true)$$,
  'new first-business bootstrap remains available'
);
select is((
  select count(*)::integer from core.membership_permissions as assignment
  join core.memberships as membership on membership.id = assignment.membership_id
  where membership.user_id = '00000000-0000-0000-0000-0000000007f1' and assignment.location_id is null
), 12, 'new business owners receive the current reviewed twelve-permission bundle');
select ok(exists(
  select 1 from core.membership_permissions as assignment
  join core.memberships as membership on membership.id = assignment.membership_id
  where membership.user_id = '00000000-0000-0000-0000-0000000007f1' and assignment.permission_key = 'appearance.manage'
), 'new owner bundle includes appearance.manage');

select * from finish();
rollback;
