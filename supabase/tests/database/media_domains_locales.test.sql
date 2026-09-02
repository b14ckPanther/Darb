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

select no_plan();

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
  ('00000000-0000-0000-0000-0000000006a1', 'authenticated', 'authenticated', 'phase6-owner-a@example.test', '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-0000000006a2', 'authenticated', 'authenticated', 'phase6-reader-a@example.test', '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-0000000006b1', 'authenticated', 'authenticated', 'phase6-owner-b@example.test', '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-0000000006c1', 'authenticated', 'authenticated', 'phase6-existing-owner@example.test', '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-0000000006c2', 'authenticated', 'authenticated', 'phase6-ordinary-member@example.test', '{}'::jsonb, '{}'::jsonb, now(), now());

insert into core.businesses (id, slug, display_name, default_locale, status)
values
  ('60000000-0000-0000-0000-000000000001', 'phase6-business-a', 'Phase 6 Business A', 'en', 'active'),
  ('60000000-0000-0000-0000-000000000002', 'phase6-business-b', 'Phase 6 Business B', 'he', 'active'),
  ('60000000-0000-0000-0000-000000000003', 'phase6-existing-business', 'Phase 6 Existing Business', 'ar', 'active');

insert into core.business_modules (business_id, module_key, is_enabled)
values
  ('60000000-0000-0000-0000-000000000001', 'restaurant', true),
  ('60000000-0000-0000-0000-000000000002', 'restaurant', true);

insert into core.memberships (id, business_id, user_id, status)
values
  ('62000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000006a1', 'active'),
  ('62000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000006a2', 'active'),
  ('62000000-0000-0000-0000-000000000003', '60000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000006b1', 'active'),
  ('62000000-0000-0000-0000-000000000004', '60000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-0000000006c1', 'active'),
  ('62000000-0000-0000-0000-000000000005', '60000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-0000000006c2', 'active');

insert into core.membership_permissions (
  business_id,
  membership_id,
  permission_key,
  location_id,
  granted_by
)
select
  membership.business_id,
  membership.id,
  permission.permission_key,
  null,
  membership.user_id
from (
  values
    ('62000000-0000-0000-0000-000000000001'::uuid, '60000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-0000000006a1'::uuid),
    ('62000000-0000-0000-0000-000000000003'::uuid, '60000000-0000-0000-0000-000000000002'::uuid, '00000000-0000-0000-0000-0000000006b1'::uuid)
) as membership(id, business_id, user_id)
cross join (
  values
    ('business.manage'::text),
    ('locations.read'::text),
    ('locations.manage'::text),
    ('memberships.manage'::text),
    ('permissions.manage'::text),
    ('modules.manage'::text),
    ('media.manage'::text),
    ('domains.manage'::text),
    ('audit.view'::text)
) as permission(permission_key);

insert into core.membership_permissions (
  business_id,
  membership_id,
  permission_key,
  location_id,
  granted_by
)
select
  '60000000-0000-0000-0000-000000000003',
  '62000000-0000-0000-0000-000000000004',
  permission.permission_key,
  null,
  '00000000-0000-0000-0000-0000000006c1'
from (
  values
    ('business.manage'::text),
    ('locations.read'::text),
    ('locations.manage'::text),
    ('memberships.manage'::text),
    ('permissions.manage'::text),
    ('modules.manage'::text),
    ('audit.view'::text)
) as permission(permission_key);

insert into core.membership_permissions (
  business_id,
  membership_id,
  permission_key,
  location_id,
  granted_by
)
values (
  '60000000-0000-0000-0000-000000000003',
  '62000000-0000-0000-0000-000000000005',
  'business.manage',
  null,
  '00000000-0000-0000-0000-0000000006c1'
);

-- Permission and deterministic owner-bundle evolution.
select set_eq(
  $$select key from core.permissions where key in ('media.manage', 'domains.manage')$$,
  $$values ('media.manage'::text), ('domains.manage'::text)$$,
  'the two Phase 6 permissions are canonical registry rows'
);

select is(
  private.backfill_phase6_owner_permissions(),
  2,
  'the backfill adds both new permissions to a complete original owner bundle'
);

select set_eq(
  $$select permission_key
      from core.membership_permissions
      where membership_id = '62000000-0000-0000-0000-000000000004'
        and permission_key in ('media.manage', 'domains.manage')$$,
  $$values ('media.manage'::text), ('domains.manage'::text)$$,
  'an eligible existing owner receives media and domain management'
);

select is(
  (select count(*)::integer
    from core.membership_permissions
    where membership_id = '62000000-0000-0000-0000-000000000005'
      and permission_key in ('media.manage', 'domains.manage')),
  0,
  'an arbitrary membership is not broadened by owner backfill'
);

select is(
  private.backfill_phase6_owner_permissions(),
  0,
  'the owner backfill is idempotent'
);

-- Media schema, bucket, registration, Storage RLS, lifecycle, and audit.
select has_table('core', 'media_assets', 'shared core.media_assets exists');
select ok(
  (select relrowsecurity from pg_class
    where oid = 'core.media_assets'::regclass),
  'media assets have RLS enabled'
);
select results_eq(
  $$select public, file_size_limit, allowed_mime_types
      from storage.buckets
      where id in ('tenant-media-images', 'tenant-media-videos')
      order by id$$,
  $$values
    (true, 10485760::bigint, array['image/avif','image/jpeg','image/png','image/webp']::text[]),
    (true, 104857600::bigint, array['video/mp4','video/webm']::text[])$$,
  'the two shared public-delivery buckets enforce kind-specific upload limits'
);
select ok(
  not has_table_privilege('authenticated', 'core.media_assets', 'insert'),
  'authenticated callers cannot directly register media metadata'
);
select ok(
  not has_table_privilege('authenticated', 'core.media_assets', 'delete'),
  'authenticated callers cannot physically delete media metadata'
);
select has_function(
  'core',
  'register_media_asset',
  array['uuid','text','text','text','bigint','integer','integer','integer','text'],
  'media registration has one narrow metadata signature'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000006a1', true);

select is(
  (select status::text from core.register_media_asset(
    '60000000-0000-0000-0000-000000000001',
    'brand-photo.png',
    'image',
    'image/png',
    68,
    1,
    1,
    null,
    'Darb test mark'
  )),
  'pending',
  'authorized media.manage can reserve a validated upload'
);

select matches(
  (select storage_path from core.media_assets
    where business_id = '60000000-0000-0000-0000-000000000001'),
  '^60000000-0000-0000-0000-000000000001/[a-f0-9-]{36}/asset[.]png$',
  'the database derives an immutable business and asset UUID path'
);

select is(
  pg_temp.capture_sqlstate(
    $$select * from core.register_media_asset(
      '60000000-0000-0000-0000-000000000001',
      'script.svg',
      'image',
      'image/svg+xml',
      100,
      null,
      null,
      null,
      null
    )$$
  ),
  '22023',
  'unsupported executable-capable image MIME is rejected'
);

select is(
  pg_temp.capture_sqlstate(
    $$select * from core.register_media_asset(
      '60000000-0000-0000-0000-000000000001',
      '../escape.png',
      'image',
      'image/png',
      68,
      1,
      1,
      null,
      null
    )$$
  ),
  '22023',
  'path separators cannot enter server-derived media storage paths'
);

select is(
  pg_temp.capture_sqlstate(
    $$select * from core.register_media_asset(
      '60000000-0000-0000-0000-000000000001',
      'oversize.png',
      'image',
      'image/png',
      10485761,
      1,
      1,
      null,
      null
    )$$
  ),
  '22023',
  'the database enforces the exact 10 MiB image limit'
);

select is(
  pg_temp.capture_sqlstate(
    $$insert into storage.objects (bucket_id, name, owner_id, metadata)
      select
        'tenant-media-videos',
        asset.storage_path,
        '00000000-0000-0000-0000-0000000006a1',
        jsonb_build_object('mimetype', asset.mime_type, 'size', asset.byte_size + 1)
      from core.media_assets as asset
      where asset.business_id = '60000000-0000-0000-0000-000000000001'$$
  ),
  '42501',
  'Storage RLS rejects a reserved image path placed in the video bucket'
);

insert into storage.objects (bucket_id, name, owner_id, metadata)
select
  asset.storage_bucket,
  asset.storage_path,
  '00000000-0000-0000-0000-0000000006a1',
  jsonb_build_object('mimetype', asset.mime_type, 'size', asset.byte_size)
from core.media_assets as asset
where asset.business_id = '60000000-0000-0000-0000-000000000001';

select is(
  (select count(*)::integer from storage.objects where bucket_id like 'tenant-media-%'),
  1,
  'Storage RLS accepts only the caller reserved path and exact metadata'
);

select is(
  pg_temp.capture_sqlstate(
    $$insert into storage.objects (bucket_id, name, owner_id, metadata)
      values (
        'tenant-media-images',
        '60000000-0000-0000-0000-000000000002/61000000-0000-0000-0000-000000000099/asset.png',
        '00000000-0000-0000-0000-0000000006a1',
        '{"mimetype":"image/png","size":68}'::jsonb
      )$$
  ),
  '42501',
  'a caller cannot invent or cross tenants with a Storage path prefix'
);

select is(
  (select status::text from core.complete_media_asset(
    '60000000-0000-0000-0000-000000000001',
    (select id from core.media_assets
      where business_id = '60000000-0000-0000-0000-000000000001')
  )),
  'active',
  'the reserved asset becomes active only after its exact Storage object exists'
);

select is(
  (select count(*)::integer from core.audit_events
    where business_id = '60000000-0000-0000-0000-000000000001'
      and action_key = 'business.media_registered'),
  1,
  'media completion emits one registration audit event'
);

select is(
  (select alt_text from core.update_media_asset_alt_text(
    '60000000-0000-0000-0000-000000000001',
    (select id from core.media_assets
      where business_id = '60000000-0000-0000-0000-000000000001'),
    'Updated accessible description'
  )),
  'Updated accessible description',
  'media.manage can update active shared asset alternative text'
);
select is(
  (select count(*)::integer from core.audit_events
    where business_id = '60000000-0000-0000-0000-000000000001'
      and action_key = 'business.media_updated'),
  1,
  'an actual media metadata change emits one narrow audit event'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000006a2', true);

select is(
  (select count(*)::integer from core.media_assets
    where business_id = '60000000-0000-0000-0000-000000000001'),
  1,
  'an active tenant member can read relevant shared media metadata'
);

select is(
  pg_temp.capture_sqlstate(
    $$select * from core.register_media_asset(
      '60000000-0000-0000-0000-000000000001',
      'denied.png',
      'image',
      'image/png',
      68,
      1,
      1,
      null,
      null
    )$$
  ),
  '42501',
  'a member without media.manage cannot register an asset'
);

select is(
  pg_temp.capture_sqlstate(
    $$select * from core.archive_media_asset(
      '60000000-0000-0000-0000-000000000001',
      (select id from core.media_assets
        where business_id = '60000000-0000-0000-0000-000000000001')
    )$$
  ),
  '42501',
  'a member without media.manage cannot archive an asset'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000006b1', true);
select is(
  (select count(*)::integer from core.media_assets),
  0,
  'tenant B cannot read tenant A media metadata'
);
select is(
  (select count(*)::integer from storage.objects where bucket_id like 'tenant-media-%'),
  0,
  'tenant B cannot list tenant A Storage objects through SQL RLS'
);
with overwritten as (
  update storage.objects
    set metadata = metadata || '{"size":69}'::jsonb
    where bucket_id like 'tenant-media-%'
    returning 1
)
select is(
  (select count(*)::integer from overwritten),
  0,
  'authenticated callers cannot see or overwrite another tenant immutable media object'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000006a1', true);
select is(
  (select status::text from core.archive_media_asset(
    '60000000-0000-0000-0000-000000000001',
    (select id from core.media_assets
      where business_id = '60000000-0000-0000-0000-000000000001')
  )),
  'archived',
  'media.manage archives metadata without physical deletion'
);
select is(
  (select count(*)::integer from storage.objects where bucket_id like 'tenant-media-%'),
  1,
  'archiving deliberately retains the Storage object'
);
select results_eq(
  $$select actor_user_id, metadata ->> 'previous_status'
      from core.audit_events
      where action_key = 'business.media_archived'$$,
  $$values ('00000000-0000-0000-0000-0000000006a1'::uuid, 'active'::text)$$,
  'media archive audit derives the actor and keeps narrow metadata'
);

reset role;
update core.businesses
set status = 'archived'
where id = '60000000-0000-0000-0000-000000000001';
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000006a1', true);
select is(
  pg_temp.capture_sqlstate(
    $$select * from core.update_media_asset_alt_text(
      '60000000-0000-0000-0000-000000000001',
      (select id from core.media_assets
        where business_id = '60000000-0000-0000-0000-000000000001'),
      'Not allowed while archived'
    )$$
  ),
  '42501',
  'archived businesses cannot mutate retained media assets'
);
reset role;
update core.businesses
set status = 'active'
where id = '60000000-0000-0000-0000-000000000001';

set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select is(
  pg_temp.capture_sqlstate(
    $$select * from core.register_media_asset(
      '60000000-0000-0000-0000-000000000001',
      'anonymous.png',
      'image',
      'image/png',
      68,
      1,
      1,
      null,
      null
    )$$
  ),
  '42501',
  'anonymous callers cannot register media'
);
select is(
  pg_temp.capture_sqlstate(
    $$insert into storage.objects (bucket_id, name, owner_id, metadata)
      values ('tenant-media-images', 'anonymous/path.png', null, '{}'::jsonb)$$
  ),
  '42501',
  'anonymous callers cannot upload through Storage SQL'
);

-- Domain normalization, ownership, verification, primary state, lifecycle, and audit.
reset role;
select has_table('core', 'business_domains', 'core.business_domains exists');
select ok(
  (select relrowsecurity from pg_class
    where oid = 'core.business_domains'::regclass),
  'business domains have RLS enabled'
);
select hasnt_function(
  'core',
  'add_business_domain',
  array['uuid','text','text'],
  'domain add has no caller-selectable verification token argument'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000006a1', true);

select results_eq(
  $$select hostname, status::text, verification_method::text, is_primary
      from core.add_business_domain(
        '60000000-0000-0000-0000-000000000001',
        '  Portal.Example.COM.  '
      )$$,
  $$values ('portal.example.com'::text, 'pending'::text, 'dns_txt'::text, false)$$,
  'domain add normalizes case, surrounding whitespace, and a trailing dot'
);
select matches(
  (select verification_token from core.business_domains
    where hostname = 'portal.example.com'),
  '^[a-f0-9]{64}$',
  'the database generates a cryptographically strong verification token'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000006a2', true);
select is(
  pg_temp.capture_sqlstate(
    $$select * from core.add_business_domain(
      '60000000-0000-0000-0000-000000000001',
      'reader.example.com'
    )$$
  ),
  '42501',
  'an active member without domains.manage cannot add a domain'
);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000006a1', true);
select is(
  pg_temp.capture_sqlstate(
    $$select * from core.add_business_domain(
      '60000000-0000-0000-0000-000000000001',
      'https://bad.example.com/path'
    )$$
  ),
  '22023',
  'protocol and path input is rejected rather than silently rewritten'
);
select is(
  pg_temp.capture_sqlstate(
    $$select * from core.add_business_domain(
      '60000000-0000-0000-0000-000000000001',
      'admin.darb.co.il'
    )$$
  ),
  '22023',
  'Darb-owned and future Darb subdomains remain reserved'
);
select is(
  pg_temp.capture_sqlstate(
    $$select * from core.set_business_domain_primary(
      '60000000-0000-0000-0000-000000000001',
      (select id from core.business_domains where hostname = 'portal.example.com')
    )$$
  ),
  '55000',
  'an unverified domain cannot become primary'
);
select is(
  pg_temp.capture_sqlstate(
    $$select * from core.record_business_domain_verification(
      (select id from core.business_domains where hostname = 'portal.example.com'),
      '00000000-0000-0000-0000-0000000006a1',
      true
    )$$
  ),
  '42501',
  'a normal authenticated caller cannot attest its own DNS result'
);

reset role;
set local role service_role;
select is(
  (select status::text from core.record_business_domain_verification(
    (select id from core.business_domains where hostname = 'portal.example.com'),
    '00000000-0000-0000-0000-0000000006a1',
    false
  )),
  'failed',
  'a real negative DNS attestation records an honest failed state'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000006a1', true);
select results_eq(
  $$select status::text, verification_checked_at is null
      from core.restart_business_domain_verification(
        '60000000-0000-0000-0000-000000000001',
        (select id from core.business_domains where hostname = 'portal.example.com')
      )$$,
  $$values ('pending'::text, true)$$,
  'a failed claim can restart with a new server-generated proof'
);

reset role;
set local role service_role;
select results_eq(
  $$select status::text, verified_at is not null
      from core.record_business_domain_verification(
        (select id from core.business_domains where hostname = 'portal.example.com'),
        '00000000-0000-0000-0000-0000000006a1',
        true
      )$$,
  $$values ('verified'::text, true)$$,
  'the service-only external evidence boundary can record an authorized successful check'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000006a1', true);
select * from core.set_business_domain_target(
  '60000000-0000-0000-0000-000000000001',
  (select id from core.business_domains where hostname = 'portal.example.com'),
  'restaurant'
);
select * from core.begin_business_domain_routing(
  '60000000-0000-0000-0000-000000000001',
  (select id from core.business_domains where hostname = 'portal.example.com')
);
reset role;
set local role service_role;
select * from core.record_business_domain_routing_attestation(
  (select id from core.business_domains where hostname = 'portal.example.com'),
  '00000000-0000-0000-0000-0000000006a1',
  'live'
);
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000006a1', true);
select is(
  (select is_primary from core.set_business_domain_primary(
    '60000000-0000-0000-0000-000000000001',
    (select id from core.business_domains where hostname = 'portal.example.com')
  )),
  true,
  'a verified and live domain can atomically become primary'
);

select * from core.add_business_domain(
  '60000000-0000-0000-0000-000000000001',
  'second.example.com'
);

reset role;
set local role service_role;
select is(
  (select status::text from core.record_business_domain_verification(
    (select id from core.business_domains where hostname = 'second.example.com'),
    '00000000-0000-0000-0000-0000000006a1',
    true
  )),
  'verified',
  'a second domain may be independently verified'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000006a1', true);
select * from core.set_business_domain_target(
  '60000000-0000-0000-0000-000000000001',
  (select id from core.business_domains where hostname = 'second.example.com'),
  'restaurant'
);
select * from core.begin_business_domain_routing(
  '60000000-0000-0000-0000-000000000001',
  (select id from core.business_domains where hostname = 'second.example.com')
);
reset role;
set local role service_role;
select * from core.record_business_domain_routing_attestation(
  (select id from core.business_domains where hostname = 'second.example.com'),
  '00000000-0000-0000-0000-0000000006a1',
  'live'
);
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000006a1', true);
select is(
  (select is_primary from core.set_business_domain_primary(
    '60000000-0000-0000-0000-000000000001',
    (select id from core.business_domains where hostname = 'second.example.com')
  )),
  true,
  'primary designation can move to another verified live domain'
);

reset role;
select is(
  (select count(*)::integer from core.business_domains
    where business_id = '60000000-0000-0000-0000-000000000001'
      and is_primary),
  1,
  'the partial unique invariant preserves one primary domain per business target'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000006b1', true);
select is(
  pg_temp.capture_sqlstate(
    $$select * from core.add_business_domain(
      '60000000-0000-0000-0000-000000000002',
      'PORTAL.EXAMPLE.COM'
    )$$
  ),
  '23505',
  'normalized hostnames are globally unique across tenants'
);
select is(
  (select count(*)::integer from core.business_domains),
  0,
  'tenant B cannot read tenant A domain claims'
);
select is(
  pg_temp.capture_sqlstate(
    $$select * from core.disable_business_domain(
      '60000000-0000-0000-0000-000000000001',
      (select id from core.business_domains where hostname = 'second.example.com')
    )$$
  ),
  '42501',
  'tenant B cannot mutate tenant A domain state'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000006a1', true);
select results_eq(
  $$select status::text, is_primary
      from core.disable_business_domain(
        '60000000-0000-0000-0000-000000000001',
        (select id from core.business_domains where hostname = 'second.example.com')
      )$$,
  $$values ('disabled'::text, false)$$,
  'disable retains the claim and clears primary state'
);

reset role;
select set_eq(
  $$select action_key from core.audit_events
      where business_id = '60000000-0000-0000-0000-000000000001'
        and action_key like 'business.domain_%'$$,
  $$values
    ('business.domain_added'::text),
    ('business.domain_added'::text),
    ('business.domain_verification_failed'::text),
    ('business.domain_verification_restarted'::text),
    ('business.domain_verified'::text),
    ('business.domain_verified'::text),
    ('business.domain_target_changed'::text),
    ('business.domain_target_changed'::text),
    ('business.domain_connection_requested'::text),
    ('business.domain_connection_requested'::text),
    ('business.domain_routing_activated'::text),
    ('business.domain_routing_activated'::text),
    ('business.domain_primary_changed'::text),
    ('business.domain_primary_changed'::text),
    ('business.domain_disabled'::text)$$,
  'domain mutations emit the expected audited state transitions'
);
select is(
  (select count(*)::integer from core.audit_events
    where metadata::text like '%verification_token%'),
  0,
  'verification tokens never enter audit metadata'
);

update core.businesses
set status = 'suspended'
where id = '60000000-0000-0000-0000-000000000001';
set local role service_role;
select is(
  pg_temp.capture_sqlstate(
    $$select * from core.record_business_domain_verification(
      (select id from core.business_domains where hostname = 'portal.example.com'),
      '00000000-0000-0000-0000-0000000006a1',
      true
    )$$
  ),
  '55000',
  'DNS attestation cannot mutate a platform-suspended business domain'
);
reset role;
update core.businesses
set status = 'active'
where id = '60000000-0000-0000-0000-000000000001';

set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select is(
  pg_temp.capture_sqlstate(
    $$select * from core.add_business_domain(
      '60000000-0000-0000-0000-000000000001',
      'anonymous.example.com'
    )$$
  ),
  '42501',
  'anonymous callers cannot add a domain'
);

-- Business locale model, invariant, isolation, and audit.
reset role;
select has_table('core', 'business_locales', 'core.business_locales exists');
select ok(
  (select relrowsecurity from pg_class
    where oid = 'core.business_locales'::regclass),
  'business locales have RLS enabled'
);
select results_eq(
  $$select business_id, locale_code::text, is_enabled
      from core.business_locales
      where business_id = '60000000-0000-0000-0000-000000000003'$$,
  $$values ('60000000-0000-0000-0000-000000000003'::uuid, 'ar'::text, true)$$,
  'new and existing business rows always receive their enabled default locale'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000006a1', true);
select results_eq(
  $$select default_locale::text, enabled_locales::text[], changed
      from core.update_business_locales(
        '60000000-0000-0000-0000-000000000001',
        'en',
        array['en','ar']
      )$$,
  $$values ('en'::text, array['ar','en']::text[], true)$$,
  'business.manage can enable a second supported language'
);
select results_eq(
  $$select default_locale::text, enabled_locales::text[], changed
      from core.update_business_locales(
        '60000000-0000-0000-0000-000000000001',
        'ar',
        array['en','ar']
      )$$,
  $$values ('ar'::text, array['ar','en']::text[], true)$$,
  'default language changes atomically while retaining the previous enabled language'
);
select is(
  pg_temp.capture_sqlstate(
    $$select * from core.update_business_locales(
      '60000000-0000-0000-0000-000000000001',
      'ar',
      array['en']
    )$$
  ),
  '23514',
  'the current default cannot be omitted from enabled locales'
);
select is(
  pg_temp.capture_sqlstate(
    $$select * from core.update_business_locales(
      '60000000-0000-0000-0000-000000000001',
      'fr',
      array['fr']
    )$$
  ),
  '22023',
  'unsupported locales are rejected'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000006a2', true);
select is(
  pg_temp.capture_sqlstate(
    $$select * from core.update_business_locales(
      '60000000-0000-0000-0000-000000000001',
      'en',
      array['en']
    )$$
  ),
  '42501',
  'an active member without business.manage cannot mutate locale state'
);

reset role;
select is(
  pg_temp.capture_sqlstate(
    $$update core.business_locales
      set is_enabled = false
      where business_id = '60000000-0000-0000-0000-000000000001'
        and locale_code = 'ar'$$
  ),
  '23514',
  'the database trigger protects the default locale from direct disable'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000006b1', true);
select is(
  (select count(*)::integer from core.business_locales
    where business_id = '60000000-0000-0000-0000-000000000001'),
  0,
  'tenant B cannot read tenant A locale state'
);
select is(
  pg_temp.capture_sqlstate(
    $$select * from core.update_business_locales(
      '60000000-0000-0000-0000-000000000001',
      'he',
      array['he']
    )$$
  ),
  '42501',
  'tenant B cannot mutate tenant A locale state'
);

reset role;
select is(
  (select count(*)::integer from core.audit_events
    where business_id = '60000000-0000-0000-0000-000000000001'
      and action_key = 'business.locales_updated'),
  2,
  'actual locale transitions emit one audit event each'
);

set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select is(
  pg_temp.capture_sqlstate(
    $$select * from core.update_business_locales(
      '60000000-0000-0000-0000-000000000001',
      'en',
      array['en']
    )$$
  ),
  '42501',
  'anonymous callers cannot mutate business locale state'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000006a1', true);
select results_eq(
  $$select can_manage_media, can_manage_domains
      from core.current_user_business_access('60000000-0000-0000-0000-000000000001')$$,
  $$values (true, true)$$,
  'the business access snapshot includes only the two new navigation permissions'
);

select * from finish();

rollback;
