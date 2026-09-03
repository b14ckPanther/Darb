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

insert into auth.users (
  id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-00000000b1a1', 'authenticated', 'authenticated', 'branding-owner@example.test', '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-00000000b1a2', 'authenticated', 'authenticated', 'branding-reader@example.test', '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-00000000b1b1', 'authenticated', 'authenticated', 'branding-other@example.test', '{}', '{}', now(), now());

insert into core.businesses (id, slug, display_name, default_locale, status)
values
  ('b1000000-0000-0000-0000-000000000001', 'branding-business-a', 'Branding Business A', 'en', 'active'),
  ('b2000000-0000-0000-0000-000000000002', 'branding-business-b', 'Branding Business B', 'ar', 'active'),
  ('b3000000-0000-0000-0000-000000000003', 'branding-suspended', 'Branding Suspended', 'en', 'suspended'),
  ('b4000000-0000-0000-0000-000000000004', 'branding-archived', 'Branding Archived', 'en', 'archived');

insert into core.memberships (id, business_id, user_id, status)
values
  ('b1100000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000b1a1', 'active'),
  ('b1110000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000b1a2', 'active'),
  ('b2100000-0000-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-00000000b1b1', 'active'),
  ('b3100000-0000-0000-0000-000000000003', 'b3000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-00000000b1a1', 'active'),
  ('b4100000-0000-0000-0000-000000000004', 'b4000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-00000000b1a1', 'active');

insert into core.membership_permissions (business_id, membership_id, permission_key)
values
  ('b1000000-0000-0000-0000-000000000001', 'b1100000-0000-0000-0000-000000000001', 'appearance.manage'),
  ('b2000000-0000-0000-0000-000000000002', 'b2100000-0000-0000-0000-000000000002', 'appearance.manage'),
  ('b3000000-0000-0000-0000-000000000003', 'b3100000-0000-0000-0000-000000000003', 'appearance.manage'),
  ('b4000000-0000-0000-0000-000000000004', 'b4100000-0000-0000-0000-000000000004', 'appearance.manage');

insert into core.business_modules (business_id, module_key, is_enabled)
values
  ('b1000000-0000-0000-0000-000000000001', 'restaurant', true),
  ('b2000000-0000-0000-0000-000000000002', 'restaurant', true),
  ('b3000000-0000-0000-0000-000000000003', 'restaurant', true),
  ('b4000000-0000-0000-0000-000000000004', 'restaurant', true);

insert into restaurant.configurations (business_id, is_publicly_active)
values
  ('b1000000-0000-0000-0000-000000000001', true),
  ('b2000000-0000-0000-0000-000000000002', true);

insert into restaurant.menus (
  id, business_id, internal_name, publication_status, lifecycle_status, display_order
)
values
  ('b1200000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'Branding menu', 'published', 'active', 10),
  ('b2200000-0000-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000002', 'Other menu', 'published', 'active', 10);

insert into restaurant.menu_translations (business_id, menu_id, locale_code, name)
values
  ('b1000000-0000-0000-0000-000000000001', 'b1200000-0000-0000-0000-000000000001', 'en', 'Branding menu'),
  ('b2000000-0000-0000-0000-000000000002', 'b2200000-0000-0000-0000-000000000002', 'ar', 'قائمة أخرى');

insert into core.media_assets (
  id, business_id, storage_bucket, storage_path, media_kind, mime_type,
  byte_size, width, height, duration_ms, alt_text, original_filename, status
)
values
  (
    'b1300000-0000-0000-0000-000000000001',
    'b1000000-0000-0000-0000-000000000001',
    'tenant-media-images',
    'b1000000-0000-0000-0000-000000000001/b1300000-0000-0000-0000-000000000001/asset.webp',
    'image', 'image/webp', 2048, 1200, 800, null, 'Restaurant logo', 'logo-internal.webp', 'active'
  ),
  (
    'b1310000-0000-0000-0000-000000000001',
    'b1000000-0000-0000-0000-000000000001',
    'tenant-media-images',
    'b1000000-0000-0000-0000-000000000001/b1310000-0000-0000-0000-000000000001/asset.jpg',
    'image', 'image/jpeg', 4096, 1800, 1000, null, 'Restaurant cover', 'cover-internal.jpg', 'active'
  ),
  (
    'b1320000-0000-0000-0000-000000000001',
    'b1000000-0000-0000-0000-000000000001',
    'tenant-media-videos',
    'b1000000-0000-0000-0000-000000000001/b1320000-0000-0000-0000-000000000001/asset.mp4',
    'video', 'video/mp4', 8192, 1920, 1080, 12000, 'Restaurant hero video', 'hero-internal.mp4', 'active'
  ),
  (
    'b1330000-0000-0000-0000-000000000001',
    'b1000000-0000-0000-0000-000000000001',
    'tenant-media-images',
    'b1000000-0000-0000-0000-000000000001/b1330000-0000-0000-0000-000000000001/asset.png',
    'image', 'image/png', 1024, 500, 500, null, null, 'pending-internal.png', 'pending'
  ),
  (
    'b2300000-0000-0000-0000-000000000002',
    'b2000000-0000-0000-0000-000000000002',
    'tenant-media-images',
    'b2000000-0000-0000-0000-000000000002/b2300000-0000-0000-0000-000000000002/asset.webp',
    'image', 'image/webp', 2048, 900, 900, null, 'Other business asset', 'other-internal.webp', 'active'
  );

select has_table('core', 'module_media_roles', 'platform module media-role registry exists');
select has_table('core', 'business_media_assignments', 'tenant branding assignments exist');
select has_function(
  'core',
  'set_business_media_assignment',
  array['uuid', 'text', 'text', 'uuid'],
  'branding assignment has one narrow audited RPC'
);
select results_eq(
  $$select module_key, key, allowed_media_kinds, is_available, sort_order
      from core.module_media_roles where module_key = 'restaurant' order by sort_order$$,
  $$values
      ('restaurant'::text, 'logo'::text, array['image']::core.media_kind[], true, 10),
      ('restaurant'::text, 'hero'::text, array['image','video']::core.media_kind[], true, 20)$$,
  'Restaurant branding roles and kind eligibility are deterministic'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'core.business_media_assignments'::regclass),
  'tenant branding assignments have RLS enabled'
);
select ok(
  not has_table_privilege('authenticated', 'core.business_media_assignments', 'insert'),
  'authenticated callers cannot bypass the audited assignment RPC'
);
select ok(
  not has_table_privilege('authenticated', 'core.module_media_roles', 'insert'),
  'tenant callers cannot create arbitrary branding roles'
);
select ok(
  has_function_privilege(
    'authenticated',
    'core.set_business_media_assignment(uuid,text,text,uuid)',
    'execute'
  ),
  'authenticated callers may execute the guarded assignment RPC'
);
select ok(
  not has_function_privilege(
    'anon',
    'core.set_business_media_assignment(uuid,text,text,uuid)',
    'execute'
  ),
  'anonymous callers have no assignment RPC grant'
);
select ok(
  not has_function_privilege(
    'authenticated',
    'private.get_restaurant_publication_base(text)',
    'execute'
  ),
  'the preserved base projection is not directly callable by authenticated clients'
);

set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select is(
  pg_temp.capture_sqlstate($$select * from core.business_media_assignments$$),
  '42501',
  'anonymous callers cannot read assignment rows'
);
select is(
  pg_temp.capture_sqlstate($$select * from core.set_business_media_assignment(
    'b1000000-0000-0000-0000-000000000001', 'restaurant', 'logo',
    'b1300000-0000-0000-0000-000000000001'
  )$$),
  '42501',
  'anonymous callers cannot assign branding media'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000b1a2', true);
select is(
  pg_temp.capture_sqlstate($$select * from core.set_business_media_assignment(
    'b1000000-0000-0000-0000-000000000001', 'restaurant', 'logo',
    'b1300000-0000-0000-0000-000000000001'
  )$$),
  '42501',
  'business membership without appearance.manage cannot assign branding media'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000b1a1', true);
select results_eq(
  $$select module_key, role_key, media_asset_id, changed
      from core.set_business_media_assignment(
        'b1000000-0000-0000-0000-000000000001', 'restaurant', 'logo',
        'b1300000-0000-0000-0000-000000000001'
      )$$,
  $$values ('restaurant'::text, 'logo'::text,
    'b1300000-0000-0000-0000-000000000001'::uuid, true)$$,
  'appearance manager can assign an active same-tenant image as Restaurant logo'
);
select results_eq(
  $$select changed from core.set_business_media_assignment(
    'b1000000-0000-0000-0000-000000000001', 'restaurant', 'logo',
    'b1300000-0000-0000-0000-000000000001'
  )$$,
  $$values (false)$$,
  'repeating the same assignment is an explicit no-op'
);
select results_eq(
  $$select changed from core.set_business_media_assignment(
    'b1000000-0000-0000-0000-000000000001', 'restaurant', 'hero',
    'b1320000-0000-0000-0000-000000000001'
  )$$,
  $$values (true)$$,
  'Restaurant hero accepts an active same-tenant video'
);
select is(
  pg_temp.capture_sqlstate($$select * from core.set_business_media_assignment(
    'b1000000-0000-0000-0000-000000000001', 'restaurant', 'logo',
    'b1320000-0000-0000-0000-000000000001'
  )$$),
  '22023',
  'Restaurant logo rejects video assets'
);
select is(
  pg_temp.capture_sqlstate($$select * from core.set_business_media_assignment(
    'b1000000-0000-0000-0000-000000000001', 'restaurant', 'hero',
    'b2300000-0000-0000-0000-000000000002'
  )$$),
  '22023',
  'cross-tenant media assignment is rejected without revealing the asset'
);
select is(
  pg_temp.capture_sqlstate($$select * from core.set_business_media_assignment(
    'b1000000-0000-0000-0000-000000000001', 'restaurant', 'hero',
    'b1330000-0000-0000-0000-000000000001'
  )$$),
  '22023',
  'pending media cannot be assigned'
);
select is(
  pg_temp.capture_sqlstate($$select * from core.set_business_media_assignment(
    'b1000000-0000-0000-0000-000000000001', 'restaurant', 'unknown_role',
    'b1300000-0000-0000-0000-000000000001'
  )$$),
  '55000',
  'ungoverned role keys are rejected'
);
select is(
  pg_temp.capture_sqlstate($$select * from core.set_business_media_assignment(
    'b2000000-0000-0000-0000-000000000002', 'restaurant', 'logo',
    'b1300000-0000-0000-0000-000000000001'
  )$$),
  '42501',
  'a tenant manager cannot mutate another business assignment'
);

reset role;
select is(
  (select count(*)::integer from core.audit_events
    where business_id = 'b1000000-0000-0000-0000-000000000001'
      and action_key = 'business.branding_media_assigned'),
  2,
  'only actual logo and hero assignments emit assignment audit events'
);
select ok(
  (select bool_and(
      not metadata ? 'storage_path'
      and not metadata ? 'storage_bucket'
      and not metadata ? 'mime_type'
    ) from core.audit_events
    where business_id = 'b1000000-0000-0000-0000-000000000001'
      and action_key = 'business.branding_media_assigned'),
  'branding audit metadata excludes storage and MIME details'
);

set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select is(
  public.get_restaurant_publication('branding-business-a') #>> '{branding,logo,altText}',
  'Restaurant logo',
  'the public projection resolves the active assigned logo'
);
select is(
  public.get_restaurant_publication('branding-business-a') #>> '{branding,hero,mediaKind}',
  'video',
  'the public projection resolves assigned hero video safely'
);
select is(
  public.get_restaurant_publication('branding-business-a') #>> '{branding,hero,mimeType}',
  'video/mp4',
  'the public hero payload exposes only the delivery MIME needed by the renderer'
);
select ok(
  not (public.get_restaurant_publication('branding-business-a')::text like '%hero-internal.mp4%'),
  'the public projection does not expose original filenames'
);
select is(
  public.get_restaurant_publication('branding-business-b') #> '{branding,logo}',
  'null'::jsonb,
  'one tenant cannot resolve another tenant branding assignment'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000b1a1', true);
select results_eq(
  $$select media_asset_id, changed from core.set_business_media_assignment(
    'b1000000-0000-0000-0000-000000000001', 'restaurant', 'hero', null
  )$$,
  $$values (null::uuid, true)$$,
  'an assigned branding role can be removed explicitly'
);
select results_eq(
  $$select changed from core.set_business_media_assignment(
    'b1000000-0000-0000-0000-000000000001', 'restaurant', 'hero', null
  )$$,
  $$values (false)$$,
  'repeated removal is an explicit no-op'
);

reset role;
select is(
  (select count(*)::integer from core.audit_events
    where business_id = 'b1000000-0000-0000-0000-000000000001'
      and action_key = 'business.branding_media_removed'),
  1,
  'only the actual removal emits a removal audit event'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000b1a1', true);
select is(
  pg_temp.capture_sqlstate($$select * from core.set_business_media_assignment(
    'b3000000-0000-0000-0000-000000000003', 'restaurant', 'logo',
    'b1300000-0000-0000-0000-000000000001'
  )$$),
  '55000',
  'suspended businesses cannot mutate branding assignments'
);
select is(
  pg_temp.capture_sqlstate($$select * from core.set_business_media_assignment(
    'b4000000-0000-0000-0000-000000000004', 'restaurant', 'logo',
    'b1300000-0000-0000-0000-000000000001'
  )$$),
  '55000',
  'archived businesses cannot mutate branding assignments'
);

reset role;
update core.business_modules
  set is_enabled = false
  where business_id = 'b1000000-0000-0000-0000-000000000001'
    and module_key = 'restaurant';
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000b1a1', true);
select is(
  pg_temp.capture_sqlstate($$select * from core.set_business_media_assignment(
    'b1000000-0000-0000-0000-000000000001', 'restaurant', 'hero',
    'b1310000-0000-0000-0000-000000000001'
  )$$),
  '55000',
  'disabled module state blocks branding mutation without deleting retained assignments'
);

reset role;
update core.business_modules
  set is_enabled = true
  where business_id = 'b1000000-0000-0000-0000-000000000001'
    and module_key = 'restaurant';
update core.media_assets
  set status = 'archived'
  where id = 'b1300000-0000-0000-0000-000000000001';
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select is(
  public.get_restaurant_publication('branding-business-a') #> '{branding,logo}',
  'null'::jsonb,
  'archiving assigned media retains history but makes public branding fall back safely'
);

reset role;
select is(
  pg_temp.capture_sqlstate($$insert into core.business_media_assignments (
    business_id, module_key, role_key, media_asset_id
  ) values (
    'b1000000-0000-0000-0000-000000000001', 'restaurant', 'hero',
    'b2300000-0000-0000-0000-000000000002'
  )$$),
  '22023',
  'assignment validation rejects cross-business media even for a trusted direct writer'
);
select is(
  pg_temp.capture_sqlstate($$insert into core.business_media_assignments (
    business_id, module_key, role_key, media_asset_id
  ) values (
    'b1000000-0000-0000-0000-000000000001', 'restaurant', 'hero',
    'b1330000-0000-0000-0000-000000000001'
  )$$),
  '22023',
  'validation trigger rejects incomplete media for trusted direct writers'
);

select * from finish();
rollback;
