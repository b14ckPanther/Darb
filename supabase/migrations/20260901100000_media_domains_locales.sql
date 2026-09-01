create type core.media_kind as enum ('image', 'video');
create type core.media_status as enum ('pending', 'active', 'archived');
create type core.domain_status as enum ('pending', 'verified', 'failed', 'disabled');
create type core.domain_verification_method as enum ('dns_txt');

create table core.media_assets (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references core.businesses (id) on delete cascade,
  storage_bucket text not null,
  storage_path text not null unique,
  media_kind core.media_kind not null,
  mime_type text not null,
  byte_size bigint not null,
  width integer,
  height integer,
  duration_ms integer,
  alt_text text,
  original_filename text not null,
  status core.media_status not null default 'pending',
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint media_assets_business_id_id_key unique (business_id, id),
  constraint media_assets_bucket_kind_check check (
    (media_kind = 'image' and storage_bucket = 'tenant-media-images')
    or (media_kind = 'video' and storage_bucket = 'tenant-media-videos')
  ),
  constraint media_assets_storage_path_check check (
    storage_path like business_id::text || '/' || id::text || '/%'
    and storage_path !~ '[[:cntrl:]\\]'
    and char_length(storage_path) between 75 and 500
  ),
  constraint media_assets_kind_mime_check check (
    (media_kind = 'image' and mime_type in (
      'image/avif',
      'image/jpeg',
      'image/png',
      'image/webp'
    ))
    or (media_kind = 'video' and mime_type in ('video/mp4', 'video/webm'))
  ),
  constraint media_assets_byte_size_check check (
    byte_size > 0
    and (
      (media_kind = 'image' and byte_size <= 10485760)
      or (media_kind = 'video' and byte_size <= 104857600)
    )
  ),
  constraint media_assets_dimensions_check check (
    (width is null and height is null)
    or (
      width between 1 and 50000
      and height between 1 and 50000
    )
  ),
  constraint media_assets_duration_check check (
    (media_kind = 'image' and duration_ms is null)
    or (media_kind = 'video' and (duration_ms is null or duration_ms > 0))
  ),
  constraint media_assets_alt_text_check check (
    alt_text is null
    or char_length(btrim(alt_text)) between 1 and 500
  ),
  constraint media_assets_original_filename_check check (
    char_length(btrim(original_filename)) between 1 and 255
    and original_filename !~ '[[:cntrl:]/\\]'
  )
);

comment on table core.media_assets is
  'Shared tenant media metadata. Storage objects use immutable business and asset UUID paths.';
comment on column core.media_assets.status is
  'Pending reserves an upload path, active is usable, and archived is retained without physical deletion.';

create index media_assets_business_status_created_idx
  on core.media_assets (business_id, status, created_at desc);

create table core.business_domains (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references core.businesses (id) on delete cascade,
  hostname text not null unique,
  status core.domain_status not null default 'pending',
  verification_token text not null,
  verification_method core.domain_verification_method not null default 'dns_txt',
  verification_checked_at timestamptz,
  verified_at timestamptz,
  is_primary boolean not null default false,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_domains_business_id_id_key unique (business_id, id),
  constraint business_domains_hostname_check check (
    char_length(hostname) between 4 and 253
    and hostname = lower(hostname)
    and hostname !~ '[[:space:]/:@]'
    and hostname ~ '^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?[.])+[a-z](?:[a-z0-9-]{0,61}[a-z0-9])?$'
    and hostname <> 'darb.co.il'
    and hostname not like '%.darb.co.il'
  ),
  constraint business_domains_token_check check (
    verification_token ~ '^[a-f0-9]{64}$'
  ),
  constraint business_domains_verified_at_check check (
    (status = 'verified' and verified_at is not null)
    or (status <> 'verified' and verified_at is null)
  ),
  constraint business_domains_primary_check check (
    not is_primary or status = 'verified'
  )
);

comment on table core.business_domains is
  'Canonical tenant custom-domain claims with DNS TXT verification and retained lifecycle history.';
comment on column core.business_domains.verification_token is
  'Server-generated DNS proof value. It must never be accepted from a tenant caller or written to audit metadata.';

create index business_domains_business_status_idx
  on core.business_domains (business_id, status, created_at desc);
create unique index business_domains_one_primary_per_business_idx
  on core.business_domains (business_id)
  where is_primary;

create table core.business_locales (
  business_id uuid not null references core.businesses (id) on delete cascade,
  locale_code core.locale_code not null,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (business_id, locale_code)
);

comment on table core.business_locales is
  'Enabled locale set for a business. core.businesses.default_locale remains the canonical default.';

insert into core.business_locales (business_id, locale_code, is_enabled)
select business.id, business.default_locale, true
from core.businesses as business
on conflict (business_id, locale_code)
do update set is_enabled = true;

create trigger media_assets_set_updated_at
before update on core.media_assets
for each row execute function private.set_updated_at();

create trigger business_domains_set_updated_at
before update on core.business_domains
for each row execute function private.set_updated_at();

create trigger business_locales_set_updated_at
before update on core.business_locales
for each row execute function private.set_updated_at();

create function private.sync_business_default_locale()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into core.business_locales (business_id, locale_code, is_enabled)
  values (new.id, new.default_locale, true)
  on conflict (business_id, locale_code)
  do update set is_enabled = true;

  return new;
end;
$$;

comment on function private.sync_business_default_locale() is
  'Keeps every inserted or changed business default locale present and enabled.';

create trigger businesses_sync_default_locale
after insert or update of default_locale on core.businesses
for each row execute function private.sync_business_default_locale();

create function private.protect_business_default_locale()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_default core.locale_code;
begin
  select business.default_locale
    into current_default
    from core.businesses as business
    where business.id = old.business_id;

  if not found then
    return coalesce(new, old);
  end if;

  if old.locale_code = current_default
    and (
      tg_op = 'DELETE'
      or new.locale_code is distinct from old.locale_code
      or not new.is_enabled
    ) then
    raise exception 'DEFAULT_LOCALE_MUST_REMAIN_ENABLED' using errcode = '23514';
  end if;

  return coalesce(new, old);
end;
$$;

comment on function private.protect_business_default_locale() is
  'Prevents direct disable, reassignment, or deletion of the current business default locale.';

create trigger business_locales_protect_default
before update or delete on core.business_locales
for each row execute function private.protect_business_default_locale();

insert into core.permissions (key, description, scope)
values
  ('media.manage', 'Register, update, and archive shared business media', 'business'),
  ('domains.manage', 'Manage and verify custom business domains', 'business')
on conflict (key) do nothing;

create function private.backfill_phase6_owner_permissions()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  inserted_count integer;
begin
  with eligible_memberships as (
    select membership.id, membership.business_id, membership.user_id
    from core.memberships as membership
    join core.membership_permissions as assignment
      on assignment.membership_id = membership.id
      and assignment.business_id = membership.business_id
      and assignment.location_id is null
    where membership.status = 'active'
      and assignment.permission_key in (
        'business.manage',
        'locations.read',
        'locations.manage',
        'memberships.manage',
        'permissions.manage',
        'modules.manage',
        'audit.view'
      )
    group by membership.id, membership.business_id, membership.user_id
    having count(distinct assignment.permission_key) = 7
  )
  insert into core.membership_permissions (
    business_id,
    membership_id,
    permission_key,
    location_id,
    granted_by
  )
  select
    eligible.business_id,
    eligible.id,
    new_permission.permission_key,
    null,
    eligible.user_id
  from eligible_memberships as eligible
  cross join (
    values ('media.manage'::text), ('domains.manage'::text)
  ) as new_permission(permission_key)
  on conflict do nothing;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

comment on function private.backfill_phase6_owner_permissions() is
  'Idempotently extends only active memberships that already hold the complete original owner bundle.';

revoke execute on function private.backfill_phase6_owner_permissions()
  from public, anon, authenticated, service_role;

select private.backfill_phase6_owner_permissions();

create or replace function core.bootstrap_first_business(
  requested_display_name text,
  requested_slug text,
  requested_default_locale text
)
returns table (
  business_id uuid,
  business_slug text,
  business_display_name text,
  business_default_locale core.locale_code,
  was_created boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  normalized_display_name text := btrim(requested_display_name);
  normalized_slug text := lower(btrim(requested_slug));
  normalized_locale core.locale_code;
  existing_business core.businesses%rowtype;
  created_business core.businesses%rowtype;
  created_membership_id uuid;
  inserted_permission_count integer;
begin
  if caller_id is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;

  perform 1
  from auth.users as auth_user
  where auth_user.id = caller_id
  for update;

  if not found then
    raise exception 'AUTHENTICATED_USER_NOT_FOUND' using errcode = '42501';
  end if;

  if normalized_display_name is null
    or char_length(normalized_display_name) not between 1 and 160 then
    raise exception 'INVALID_BUSINESS_DISPLAY_NAME' using errcode = '22023';
  end if;

  if normalized_slug is null
    or char_length(normalized_slug) not between 3 and 63
    or normalized_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'INVALID_BUSINESS_SLUG' using errcode = '22023';
  end if;

  if requested_default_locale not in ('ar', 'he', 'en') then
    raise exception 'INVALID_DEFAULT_LOCALE' using errcode = '22023';
  end if;

  normalized_locale := requested_default_locale::core.locale_code;

  select business.*
    into existing_business
    from core.memberships as membership
    join core.businesses as business on business.id = membership.business_id
    where membership.user_id = caller_id
      and membership.status = 'active'
    order by membership.joined_at, membership.id
    limit 1;

  if found then
    if existing_business.created_by = caller_id
      and existing_business.slug = normalized_slug
      and existing_business.display_name = normalized_display_name
      and existing_business.default_locale = normalized_locale then
      return query
      select
        existing_business.id,
        existing_business.slug,
        existing_business.display_name,
        existing_business.default_locale,
        false;
      return;
    end if;

    raise exception 'FIRST_BUSINESS_ALREADY_BOOTSTRAPPED' using errcode = 'P0001';
  end if;

  insert into core.businesses (
    slug,
    display_name,
    default_locale,
    created_by
  )
  values (
    normalized_slug,
    normalized_display_name,
    normalized_locale,
    caller_id
  )
  returning * into created_business;

  insert into core.memberships (
    business_id,
    user_id,
    status,
    created_by
  )
  values (
    created_business.id,
    caller_id,
    'active',
    caller_id
  )
  returning id into created_membership_id;

  insert into core.membership_permissions (
    business_id,
    membership_id,
    permission_key,
    location_id,
    granted_by
  )
  select
    created_business.id,
    created_membership_id,
    owner_permission.permission_key,
    null,
    caller_id
  from (
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
  ) as owner_permission(permission_key);

  get diagnostics inserted_permission_count = row_count;

  if inserted_permission_count <> 9 then
    raise exception 'OWNER_PERMISSION_BUNDLE_INCOMPLETE' using errcode = '55000';
  end if;

  insert into core.audit_events (
    actor_kind,
    actor_user_id,
    business_id,
    action_key,
    entity_type,
    entity_id,
    metadata
  )
  values (
    'user',
    caller_id,
    created_business.id,
    'business.created',
    'core.business',
    created_business.id::text,
    jsonb_build_object('source', 'first_business_bootstrap')
  );

  return query
  select
    created_business.id,
    created_business.slug,
    created_business.display_name,
    created_business.default_locale,
    true;
end;
$$;

comment on function core.bootstrap_first_business(text, text, text) is
  'Atomically creates the caller first business, enabled default locale, owner membership, current permission bundle, and audit event.';

drop function core.current_user_business_access(uuid);

create function core.current_user_business_access(target_business_id uuid)
returns table (
  can_manage_business boolean,
  can_read_all_locations boolean,
  can_manage_all_locations boolean,
  can_manage_modules boolean,
  can_manage_media boolean,
  can_manage_domains boolean,
  can_view_audit boolean,
  is_super_admin boolean
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    private.has_permission(target_business_id, 'business.manage'),
    private.has_permission(target_business_id, 'locations.read'),
    private.has_permission(target_business_id, 'locations.manage'),
    private.has_permission(target_business_id, 'modules.manage'),
    private.has_permission(target_business_id, 'media.manage'),
    private.has_permission(target_business_id, 'domains.manage'),
    private.has_permission(target_business_id, 'audit.view'),
    private.is_super_admin();
$$;

comment on function core.current_user_business_access(uuid) is
  'Returns the compact database-authoritative access snapshot required by implemented admin navigation.';

create function private.media_file_extension(target_mime_type text)
returns text
language sql
immutable
security definer
set search_path = ''
as $$
  select case target_mime_type
    when 'image/avif' then 'avif'
    when 'image/jpeg' then 'jpg'
    when 'image/png' then 'png'
    when 'image/webp' then 'webp'
    when 'video/mp4' then 'mp4'
    when 'video/webm' then 'webm'
  end;
$$;

create function core.register_media_asset(
  target_business_id uuid,
  requested_original_filename text,
  requested_media_kind text,
  requested_mime_type text,
  requested_byte_size bigint,
  requested_width integer default null,
  requested_height integer default null,
  requested_duration_ms integer default null,
  requested_alt_text text default null
)
returns setof core.media_assets
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  normalized_filename text := btrim(requested_original_filename);
  normalized_mime_type text := lower(btrim(requested_mime_type));
  normalized_alt_text text := nullif(btrim(requested_alt_text), '');
  normalized_kind core.media_kind;
  file_extension text;
  current_business_status core.business_status;
  asset_id uuid := extensions.gen_random_uuid();
  created_asset core.media_assets%rowtype;
begin
  if caller_id is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;

  if not private.has_permission(target_business_id, 'media.manage') then
    raise exception 'MEDIA_MANAGE_REQUIRED' using errcode = '42501';
  end if;

  select business.status
    into current_business_status
    from core.businesses as business
    where business.id = target_business_id
    for update;

  if not found then
    raise exception 'BUSINESS_ACCESS_DENIED' using errcode = '42501';
  end if;

  if current_business_status <> 'active' then
    raise exception 'BUSINESS_MEDIA_NOT_ACTIVE' using errcode = '55000';
  end if;

  if requested_media_kind not in ('image', 'video') then
    raise exception 'INVALID_MEDIA_KIND' using errcode = '22023';
  end if;

  normalized_kind := requested_media_kind::core.media_kind;
  file_extension := private.media_file_extension(normalized_mime_type);

  if file_extension is null
    or (normalized_kind = 'image' and normalized_mime_type not like 'image/%')
    or (normalized_kind = 'video' and normalized_mime_type not like 'video/%') then
    raise exception 'INVALID_MEDIA_MIME_TYPE' using errcode = '22023';
  end if;

  if normalized_filename is null
    or char_length(normalized_filename) not between 1 and 255
    or normalized_filename ~ '[[:cntrl:]/\\]' then
    raise exception 'INVALID_MEDIA_FILENAME' using errcode = '22023';
  end if;

  if (
    normalized_mime_type = 'image/jpeg'
    and lower(normalized_filename) !~ '[.](jpg|jpeg)$'
  ) or (
    normalized_mime_type <> 'image/jpeg'
    and lower(normalized_filename) !~ ('[.]' || file_extension || '$')
  ) then
    raise exception 'MEDIA_EXTENSION_MISMATCH' using errcode = '22023';
  end if;

  if requested_byte_size is null
    or requested_byte_size <= 0
    or (normalized_kind = 'image' and requested_byte_size > 10485760)
    or (normalized_kind = 'video' and requested_byte_size > 104857600) then
    raise exception 'INVALID_MEDIA_SIZE' using errcode = '22023';
  end if;

  if (requested_width is null) <> (requested_height is null)
    or requested_width is not null and requested_width not between 1 and 50000
    or requested_height is not null and requested_height not between 1 and 50000 then
    raise exception 'INVALID_MEDIA_DIMENSIONS' using errcode = '22023';
  end if;

  if normalized_kind = 'image' and requested_duration_ms is not null
    or requested_duration_ms is not null and requested_duration_ms <= 0 then
    raise exception 'INVALID_MEDIA_DURATION' using errcode = '22023';
  end if;

  if normalized_alt_text is not null
    and char_length(normalized_alt_text) not between 1 and 500 then
    raise exception 'INVALID_MEDIA_ALT_TEXT' using errcode = '22023';
  end if;

  insert into core.media_assets (
    id,
    business_id,
    storage_bucket,
    storage_path,
    media_kind,
    mime_type,
    byte_size,
    width,
    height,
    duration_ms,
    alt_text,
    original_filename,
    status,
    created_by
  )
  values (
    asset_id,
    target_business_id,
    case normalized_kind
      when 'image' then 'tenant-media-images'
      when 'video' then 'tenant-media-videos'
    end,
    target_business_id::text || '/' || asset_id::text || '/asset.' || file_extension,
    normalized_kind,
    normalized_mime_type,
    requested_byte_size,
    requested_width,
    requested_height,
    requested_duration_ms,
    normalized_alt_text,
    normalized_filename,
    'pending',
    caller_id
  )
  returning * into created_asset;

  return next created_asset;
end;
$$;

comment on function core.register_media_asset(uuid, text, text, text, bigint, integer, integer, integer, text) is
  'Reserves one immutable, tenant-derived Storage path after validating media metadata and media.manage.';

create function core.complete_media_asset(
  target_business_id uuid,
  target_media_asset_id uuid
)
returns setof core.media_assets
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  current_asset core.media_assets%rowtype;
  completed_asset core.media_assets%rowtype;
begin
  if caller_id is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;

  if not private.has_permission(target_business_id, 'media.manage') then
    raise exception 'MEDIA_MANAGE_REQUIRED' using errcode = '42501';
  end if;

  select asset.*
    into current_asset
    from core.media_assets as asset
    join core.businesses as business on business.id = asset.business_id
    where asset.business_id = target_business_id
      and asset.id = target_media_asset_id
      and business.status = 'active'
    for update of asset;

  if not found then
    raise exception 'MEDIA_ASSET_ACCESS_DENIED' using errcode = '42501';
  end if;

  if current_asset.status = 'active' then
    return next current_asset;
    return;
  end if;

  if current_asset.status = 'archived' then
    raise exception 'MEDIA_ASSET_ARCHIVED' using errcode = '55000';
  end if;

  if not exists (
    select 1
    from storage.objects as storage_object
    where storage_object.bucket_id = current_asset.storage_bucket
      and storage_object.name = current_asset.storage_path
      and storage_object.owner_id = caller_id::text
      and storage_object.metadata ->> 'mimetype' = current_asset.mime_type
      and case
        when storage_object.metadata ->> 'size' ~ '^[0-9]+$'
          then (storage_object.metadata ->> 'size')::bigint = current_asset.byte_size
        else false
      end
  ) then
    raise exception 'MEDIA_UPLOAD_NOT_FOUND' using errcode = '55000';
  end if;

  update core.media_assets as asset
    set status = 'active'
    where asset.business_id = target_business_id
      and asset.id = target_media_asset_id
    returning asset.* into completed_asset;

  insert into core.audit_events (
    actor_kind,
    actor_user_id,
    business_id,
    action_key,
    entity_type,
    entity_id,
    metadata
  )
  values (
    'user',
    caller_id,
    target_business_id,
    'business.media_registered',
    'core.media_asset',
    target_media_asset_id::text,
    jsonb_build_object(
      'media_kind', completed_asset.media_kind::text,
      'mime_type', completed_asset.mime_type,
      'byte_size', completed_asset.byte_size
    )
  );

  return next completed_asset;
end;
$$;

create function core.update_media_asset_alt_text(
  target_business_id uuid,
  target_media_asset_id uuid,
  requested_alt_text text
)
returns setof core.media_assets
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  normalized_alt_text text := nullif(btrim(requested_alt_text), '');
  current_asset core.media_assets%rowtype;
  updated_asset core.media_assets%rowtype;
begin
  if caller_id is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;

  if not private.has_permission(target_business_id, 'media.manage') then
    raise exception 'MEDIA_MANAGE_REQUIRED' using errcode = '42501';
  end if;

  if normalized_alt_text is not null
    and char_length(normalized_alt_text) not between 1 and 500 then
    raise exception 'INVALID_MEDIA_ALT_TEXT' using errcode = '22023';
  end if;

  select asset.*
    into current_asset
    from core.media_assets as asset
    join core.businesses as business on business.id = asset.business_id
    where asset.business_id = target_business_id
      and asset.id = target_media_asset_id
      and business.status = 'active'
    for update of asset;

  if not found then
    raise exception 'MEDIA_ASSET_ACCESS_DENIED' using errcode = '42501';
  end if;

  if current_asset.status <> 'active' then
    raise exception 'MEDIA_ASSET_NOT_ACTIVE' using errcode = '55000';
  end if;

  if current_asset.alt_text is not distinct from normalized_alt_text then
    return next current_asset;
    return;
  end if;

  update core.media_assets as asset
    set alt_text = normalized_alt_text
    where asset.business_id = target_business_id
      and asset.id = target_media_asset_id
    returning asset.* into updated_asset;

  insert into core.audit_events (
    actor_kind,
    actor_user_id,
    business_id,
    action_key,
    entity_type,
    entity_id,
    metadata
  )
  values (
    'user',
    caller_id,
    target_business_id,
    'business.media_updated',
    'core.media_asset',
    target_media_asset_id::text,
    jsonb_build_object('changed_fields', jsonb_build_array('alt_text'))
  );

  return next updated_asset;
end;
$$;

create function core.archive_media_asset(
  target_business_id uuid,
  target_media_asset_id uuid
)
returns setof core.media_assets
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  current_asset core.media_assets%rowtype;
  archived_asset core.media_assets%rowtype;
begin
  if caller_id is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;

  if not private.has_permission(target_business_id, 'media.manage') then
    raise exception 'MEDIA_MANAGE_REQUIRED' using errcode = '42501';
  end if;

  select asset.*
    into current_asset
    from core.media_assets as asset
    join core.businesses as business on business.id = asset.business_id
    where asset.business_id = target_business_id
      and asset.id = target_media_asset_id
      and business.status = 'active'
    for update of asset;

  if not found then
    raise exception 'MEDIA_ASSET_ACCESS_DENIED' using errcode = '42501';
  end if;

  if current_asset.status = 'archived' then
    return next current_asset;
    return;
  end if;

  update core.media_assets as asset
    set status = 'archived'
    where asset.business_id = target_business_id
      and asset.id = target_media_asset_id
    returning asset.* into archived_asset;

  insert into core.audit_events (
    actor_kind,
    actor_user_id,
    business_id,
    action_key,
    entity_type,
    entity_id,
    metadata
  )
  values (
    'user',
    caller_id,
    target_business_id,
    'business.media_archived',
    'core.media_asset',
    target_media_asset_id::text,
    jsonb_build_object('previous_status', current_asset.status::text)
  );

  return next archived_asset;
end;
$$;

create function private.normalize_domain_hostname(candidate text)
returns text
language sql
immutable
security definer
set search_path = ''
as $$
  select lower(regexp_replace(btrim(candidate), '[.]+$', ''));
$$;

create function private.is_reserved_darb_hostname(candidate text)
returns boolean
language sql
immutable
security definer
set search_path = ''
as $$
  select candidate = 'darb.co.il' or candidate like '%.darb.co.il';
$$;

create function core.add_business_domain(
  target_business_id uuid,
  requested_hostname text
)
returns setof core.business_domains
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  normalized_hostname text := private.normalize_domain_hostname(requested_hostname);
  current_business_status core.business_status;
  created_domain core.business_domains%rowtype;
begin
  if caller_id is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;

  if not private.has_permission(target_business_id, 'domains.manage') then
    raise exception 'DOMAINS_MANAGE_REQUIRED' using errcode = '42501';
  end if;

  select business.status
    into current_business_status
    from core.businesses as business
    where business.id = target_business_id
    for update;

  if not found then
    raise exception 'BUSINESS_ACCESS_DENIED' using errcode = '42501';
  end if;

  if current_business_status <> 'active' then
    raise exception 'BUSINESS_DOMAINS_NOT_ACTIVE' using errcode = '55000';
  end if;

  if requested_hostname is null
    or requested_hostname ~* '^[a-z][a-z0-9+.-]*://'
    or btrim(requested_hostname) ~ '[/@:[:space:]]'
    or normalized_hostname is null
    or char_length(normalized_hostname) not between 4 and 253
    or normalized_hostname !~ '^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?[.])+[a-z](?:[a-z0-9-]{0,61}[a-z0-9])?$' then
    raise exception 'INVALID_DOMAIN_HOSTNAME' using errcode = '22023';
  end if;

  if private.is_reserved_darb_hostname(normalized_hostname) then
    raise exception 'DOMAIN_HOSTNAME_RESERVED' using errcode = '22023';
  end if;

  insert into core.business_domains (
    business_id,
    hostname,
    status,
    verification_token,
    verification_method,
    created_by
  )
  values (
    target_business_id,
    normalized_hostname,
    'pending',
    encode(extensions.gen_random_bytes(32), 'hex'),
    'dns_txt',
    caller_id
  )
  returning * into created_domain;

  insert into core.audit_events (
    actor_kind,
    actor_user_id,
    business_id,
    action_key,
    entity_type,
    entity_id,
    metadata
  )
  values (
    'user',
    caller_id,
    target_business_id,
    'business.domain_added',
    'core.business_domain',
    created_domain.id::text,
    jsonb_build_object('hostname', created_domain.hostname, 'status', 'pending')
  );

  return next created_domain;
end;
$$;

create function core.restart_business_domain_verification(
  target_business_id uuid,
  target_domain_id uuid
)
returns setof core.business_domains
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  current_domain core.business_domains%rowtype;
  restarted_domain core.business_domains%rowtype;
begin
  if caller_id is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;

  if not private.has_permission(target_business_id, 'domains.manage') then
    raise exception 'DOMAINS_MANAGE_REQUIRED' using errcode = '42501';
  end if;

  select domain.*
    into current_domain
    from core.business_domains as domain
    join core.businesses as business on business.id = domain.business_id
    where domain.business_id = target_business_id
      and domain.id = target_domain_id
      and business.status = 'active'
    for update of domain;

  if not found then
    raise exception 'BUSINESS_DOMAIN_ACCESS_DENIED' using errcode = '42501';
  end if;

  update core.business_domains as domain
    set status = 'pending',
        verification_token = encode(extensions.gen_random_bytes(32), 'hex'),
        verification_checked_at = null,
        verified_at = null,
        is_primary = false
    where domain.id = target_domain_id
    returning domain.* into restarted_domain;

  insert into core.audit_events (
    actor_kind,
    actor_user_id,
    business_id,
    action_key,
    entity_type,
    entity_id,
    metadata
  )
  values (
    'user',
    caller_id,
    target_business_id,
    'business.domain_verification_restarted',
    'core.business_domain',
    target_domain_id::text,
    jsonb_build_object(
      'hostname', restarted_domain.hostname,
      'previous_status', current_domain.status::text
    )
  );

  return next restarted_domain;
end;
$$;

create function core.record_business_domain_verification(
  target_domain_id uuid,
  requesting_user_id uuid,
  verification_succeeded boolean
)
returns setof core.business_domains
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_domain core.business_domains%rowtype;
  updated_domain core.business_domains%rowtype;
  user_is_authorized boolean;
  action_key text;
begin
  if requesting_user_id is null or verification_succeeded is null then
    raise exception 'INVALID_DOMAIN_VERIFICATION_ATTESTATION' using errcode = '22023';
  end if;

  select domain.*
    into current_domain
    from core.business_domains as domain
    join core.businesses as business on business.id = domain.business_id
    where domain.id = target_domain_id
      and business.status = 'active'
    for update of domain;

  if not found then
    if exists (
      select 1
      from core.business_domains as domain
      where domain.id = target_domain_id
    ) then
      raise exception 'BUSINESS_DOMAINS_NOT_ACTIVE' using errcode = '55000';
    end if;

    raise exception 'BUSINESS_DOMAIN_NOT_FOUND' using errcode = '22023';
  end if;

  select
    exists (
      select 1
      from private.super_admins as super_admin
      where super_admin.user_id = requesting_user_id
        and super_admin.revoked_at is null
    )
    or exists (
      select 1
      from core.memberships as membership
      join core.membership_permissions as assignment
        on assignment.membership_id = membership.id
        and assignment.business_id = membership.business_id
      where membership.user_id = requesting_user_id
        and membership.business_id = current_domain.business_id
        and membership.status = 'active'
        and assignment.permission_key = 'domains.manage'
        and assignment.location_id is null
    )
    into user_is_authorized;

  if not user_is_authorized then
    raise exception 'DOMAINS_MANAGE_REQUIRED' using errcode = '42501';
  end if;

  if current_domain.status = 'disabled' then
    raise exception 'BUSINESS_DOMAIN_DISABLED' using errcode = '55000';
  end if;

  update core.business_domains as domain
    set status = case
          when verification_succeeded then 'verified'::core.domain_status
          else 'failed'::core.domain_status
        end,
        verification_checked_at = now(),
        verified_at = case when verification_succeeded then now() else null end,
        is_primary = case when verification_succeeded then domain.is_primary else false end
    where domain.id = target_domain_id
    returning domain.* into updated_domain;

  action_key := case
    when verification_succeeded then 'business.domain_verified'
    else 'business.domain_verification_failed'
  end;

  if current_domain.status is distinct from updated_domain.status then
    insert into core.audit_events (
      actor_kind,
      actor_user_id,
      business_id,
      action_key,
      entity_type,
      entity_id,
      metadata
    )
    values (
      'user',
      requesting_user_id,
      current_domain.business_id,
      action_key,
      'core.business_domain',
      target_domain_id::text,
      jsonb_build_object(
        'hostname', current_domain.hostname,
        'previous_status', current_domain.status::text,
        'new_status', updated_domain.status::text
      )
    );
  end if;

  return next updated_domain;
end;
$$;

comment on function core.record_business_domain_verification(uuid, uuid, boolean) is
  'Service-only external DNS attestation boundary. It rechecks the initiating authenticated user permission and never accepts or returns DNS proof through audit metadata.';

create function core.set_business_domain_primary(
  target_business_id uuid,
  target_domain_id uuid
)
returns setof core.business_domains
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  current_domain core.business_domains%rowtype;
  current_primary_hostname text;
  updated_domain core.business_domains%rowtype;
begin
  if caller_id is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;

  if not private.has_permission(target_business_id, 'domains.manage') then
    raise exception 'DOMAINS_MANAGE_REQUIRED' using errcode = '42501';
  end if;

  perform 1
  from core.businesses as business
  where business.id = target_business_id
    and business.status = 'active'
  for update;

  if not found then
    raise exception 'BUSINESS_DOMAINS_NOT_ACTIVE' using errcode = '55000';
  end if;

  select domain.*
    into current_domain
    from core.business_domains as domain
    where domain.business_id = target_business_id
      and domain.id = target_domain_id
    for update;

  if not found then
    raise exception 'BUSINESS_DOMAIN_ACCESS_DENIED' using errcode = '42501';
  end if;

  if current_domain.status <> 'verified' then
    raise exception 'DOMAIN_MUST_BE_VERIFIED' using errcode = '55000';
  end if;

  if current_domain.is_primary then
    return next current_domain;
    return;
  end if;

  select domain.hostname
    into current_primary_hostname
    from core.business_domains as domain
    where domain.business_id = target_business_id
      and domain.is_primary;

  update core.business_domains as domain
    set is_primary = false
    where domain.business_id = target_business_id
      and domain.is_primary;

  update core.business_domains as domain
    set is_primary = true
    where domain.business_id = target_business_id
      and domain.id = target_domain_id
    returning domain.* into updated_domain;

  insert into core.audit_events (
    actor_kind,
    actor_user_id,
    business_id,
    action_key,
    entity_type,
    entity_id,
    metadata
  )
  values (
    'user',
    caller_id,
    target_business_id,
    'business.domain_primary_changed',
    'core.business_domain',
    target_domain_id::text,
    jsonb_build_object(
      'hostname', updated_domain.hostname,
      'previous_hostname', current_primary_hostname
    )
  );

  return next updated_domain;
end;
$$;

create function core.disable_business_domain(
  target_business_id uuid,
  target_domain_id uuid
)
returns setof core.business_domains
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  current_domain core.business_domains%rowtype;
  disabled_domain core.business_domains%rowtype;
begin
  if caller_id is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;

  if not private.has_permission(target_business_id, 'domains.manage') then
    raise exception 'DOMAINS_MANAGE_REQUIRED' using errcode = '42501';
  end if;

  select domain.*
    into current_domain
    from core.business_domains as domain
    join core.businesses as business on business.id = domain.business_id
    where domain.business_id = target_business_id
      and domain.id = target_domain_id
      and business.status = 'active'
    for update of domain;

  if not found then
    raise exception 'BUSINESS_DOMAIN_ACCESS_DENIED' using errcode = '42501';
  end if;

  if current_domain.status = 'disabled' then
    return next current_domain;
    return;
  end if;

  update core.business_domains as domain
    set status = 'disabled',
        verified_at = null,
        is_primary = false
    where domain.id = target_domain_id
    returning domain.* into disabled_domain;

  insert into core.audit_events (
    actor_kind,
    actor_user_id,
    business_id,
    action_key,
    entity_type,
    entity_id,
    metadata
  )
  values (
    'user',
    caller_id,
    target_business_id,
    'business.domain_disabled',
    'core.business_domain',
    target_domain_id::text,
    jsonb_build_object(
      'hostname', current_domain.hostname,
      'previous_status', current_domain.status::text,
      'was_primary', current_domain.is_primary
    )
  );

  return next disabled_domain;
end;
$$;

create function core.update_business_locales(
  target_business_id uuid,
  requested_default_locale text,
  requested_enabled_locales text[]
)
returns table (
  default_locale core.locale_code,
  enabled_locales core.locale_code[],
  changed boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  normalized_default core.locale_code;
  normalized_enabled core.locale_code[];
  current_default core.locale_code;
  current_enabled core.locale_code[];
  state_changed boolean;
begin
  if caller_id is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;

  if not private.has_permission(target_business_id, 'business.manage') then
    raise exception 'BUSINESS_MANAGE_REQUIRED' using errcode = '42501';
  end if;

  if requested_default_locale not in ('ar', 'he', 'en') then
    raise exception 'INVALID_DEFAULT_LOCALE' using errcode = '22023';
  end if;

  if requested_enabled_locales is null
    or cardinality(requested_enabled_locales) not between 1 and 3
    or exists (
      select 1
      from unnest(requested_enabled_locales) as locale(value)
      where locale.value not in ('ar', 'he', 'en')
    ) then
    raise exception 'INVALID_ENABLED_LOCALES' using errcode = '22023';
  end if;

  select array_agg(distinct locale.value::core.locale_code order by locale.value::core.locale_code)
    into normalized_enabled
    from unnest(requested_enabled_locales) as locale(value);

  normalized_default := requested_default_locale::core.locale_code;

  if normalized_default <> all(normalized_enabled) then
    raise exception 'DEFAULT_LOCALE_MUST_REMAIN_ENABLED' using errcode = '23514';
  end if;

  select business.default_locale
    into current_default
    from core.businesses as business
    where business.id = target_business_id
      and business.status = 'active'
    for update;

  if not found then
    raise exception 'BUSINESS_LOCALES_NOT_ACTIVE' using errcode = '55000';
  end if;

  select coalesce(array_agg(locale.locale_code order by locale.locale_code), '{}'::core.locale_code[])
    into current_enabled
    from core.business_locales as locale
    where locale.business_id = target_business_id
      and locale.is_enabled;

  state_changed := current_default is distinct from normalized_default
    or current_enabled is distinct from normalized_enabled;

  if not state_changed then
    return query select current_default, current_enabled, false;
    return;
  end if;

  insert into core.business_locales (business_id, locale_code, is_enabled)
  select target_business_id, locale.value, true
  from unnest(normalized_enabled) as locale(value)
  on conflict (business_id, locale_code)
  do update set is_enabled = true;

  update core.businesses as business
    set default_locale = normalized_default
    where business.id = target_business_id;

  update core.business_locales as locale
    set is_enabled = false
    where locale.business_id = target_business_id
      and locale.locale_code <> all(normalized_enabled)
      and locale.is_enabled;

  insert into core.audit_events (
    actor_kind,
    actor_user_id,
    business_id,
    action_key,
    entity_type,
    entity_id,
    metadata
  )
  values (
    'user',
    caller_id,
    target_business_id,
    'business.locales_updated',
    'core.business',
    target_business_id::text,
    jsonb_build_object(
      'previous_default_locale', current_default::text,
      'new_default_locale', normalized_default::text,
      'previous_enabled_locales', to_jsonb(current_enabled),
      'new_enabled_locales', to_jsonb(normalized_enabled)
    )
  );

  return query select normalized_default, normalized_enabled, true;
end;
$$;

create or replace function core.update_business_settings(
  target_business_id uuid,
  requested_display_name text,
  requested_slug text,
  requested_default_locale text,
  requested_timezone text,
  requested_status text
)
returns setof core.businesses
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  normalized_display_name text := btrim(requested_display_name);
  normalized_slug text := lower(btrim(requested_slug));
  normalized_timezone text := btrim(requested_timezone);
  normalized_locale core.locale_code;
  normalized_status core.business_status;
  current_business core.businesses%rowtype;
  updated_business core.businesses%rowtype;
  changed_fields text[];
  caller_is_super_admin boolean;
begin
  if caller_id is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;

  if not private.has_permission(target_business_id, 'business.manage') then
    raise exception 'BUSINESS_MANAGE_REQUIRED' using errcode = '42501';
  end if;

  select business.*
    into current_business
    from core.businesses as business
    where business.id = target_business_id
    for update;

  if not found then
    raise exception 'BUSINESS_ACCESS_DENIED' using errcode = '42501';
  end if;

  if normalized_display_name is null
    or char_length(normalized_display_name) not between 1 and 160 then
    raise exception 'INVALID_BUSINESS_DISPLAY_NAME' using errcode = '22023';
  end if;

  if normalized_slug is null
    or char_length(normalized_slug) not between 3 and 63
    or normalized_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'INVALID_BUSINESS_SLUG' using errcode = '22023';
  end if;

  if requested_default_locale not in ('ar', 'he', 'en') then
    raise exception 'INVALID_DEFAULT_LOCALE' using errcode = '22023';
  end if;

  if normalized_timezone is null
    or char_length(normalized_timezone) not between 1 and 100
    or not private.is_valid_timezone(normalized_timezone) then
    raise exception 'INVALID_TIMEZONE' using errcode = '22023';
  end if;

  if requested_status not in ('active', 'suspended', 'archived') then
    raise exception 'INVALID_BUSINESS_STATUS' using errcode = '22023';
  end if;

  normalized_locale := requested_default_locale::core.locale_code;
  normalized_status := requested_status::core.business_status;
  caller_is_super_admin := private.is_super_admin();

  if not caller_is_super_admin
    and (normalized_status = 'suspended' or current_business.status = 'suspended') then
    raise exception 'BUSINESS_STATUS_PLATFORM_CONTROLLED' using errcode = '42501';
  end if;

  changed_fields := array_remove(array[
    case when current_business.display_name is distinct from normalized_display_name then 'display_name' end,
    case when current_business.slug is distinct from normalized_slug then 'slug' end,
    case when current_business.default_locale is distinct from normalized_locale then 'default_locale' end,
    case when current_business.timezone is distinct from normalized_timezone then 'timezone' end,
    case when current_business.status is distinct from normalized_status then 'status' end
  ], null);

  if cardinality(changed_fields) = 0 then
    return next current_business;
    return;
  end if;

  update core.businesses as business
    set display_name = normalized_display_name,
        slug = normalized_slug,
        default_locale = normalized_locale,
        timezone = normalized_timezone,
        status = normalized_status
    where business.id = target_business_id
    returning business.* into updated_business;

  insert into core.audit_events (
    actor_kind,
    actor_user_id,
    business_id,
    action_key,
    entity_type,
    entity_id,
    metadata
  )
  values (
    'user',
    caller_id,
    target_business_id,
    'business.updated',
    'core.business',
    target_business_id::text,
    jsonb_build_object('changed_fields', to_jsonb(changed_fields))
  );

  return next updated_business;
end;
$$;

alter table core.media_assets enable row level security;
alter table core.business_domains enable row level security;
alter table core.business_locales enable row level security;

grant select on core.media_assets to authenticated;
grant select on core.business_domains to authenticated;
grant select on core.business_locales to authenticated;
grant all on core.media_assets, core.business_domains, core.business_locales to service_role;

create policy media_assets_select_active_membership
on core.media_assets
for select
to authenticated
using ((select private.has_active_membership(business_id)));

create policy business_domains_select_active_membership
on core.business_domains
for select
to authenticated
using ((select private.has_active_membership(business_id)));

create policy business_locales_select_active_membership
on core.business_locales
for select
to authenticated
using ((select private.has_active_membership(business_id)));

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values
  (
    'tenant-media-images',
    'tenant-media-images',
    true,
    10485760,
    array['image/avif', 'image/jpeg', 'image/png', 'image/webp']::text[]
  ),
  (
    'tenant-media-videos',
    'tenant-media-videos',
    true,
    104857600,
    array['video/mp4', 'video/webm']::text[]
  )
on conflict (id)
do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy tenant_media_objects_insert_reserved_path
on storage.objects
for insert
to authenticated
with check (
  bucket_id in ('tenant-media-images', 'tenant-media-videos')
  and owner_id = (select auth.uid())::text
  and exists (
    select 1
    from core.media_assets as asset
    where asset.storage_bucket = bucket_id
      and asset.storage_path = name
      and asset.status = 'pending'
      and asset.created_by = (select auth.uid())
      and (select private.has_permission(asset.business_id, 'media.manage'))
  )
);

create policy tenant_media_objects_select_active_membership
on storage.objects
for select
to authenticated
using (
  bucket_id in ('tenant-media-images', 'tenant-media-videos')
  and exists (
    select 1
    from core.media_assets as asset
    where asset.storage_bucket = bucket_id
      and asset.storage_path = name
      and (select private.has_active_membership(asset.business_id))
  )
);

revoke update (default_locale) on core.businesses from authenticated;

revoke execute on function private.media_file_extension(text)
  from public, anon, authenticated, service_role;
revoke execute on function private.normalize_domain_hostname(text)
  from public, anon, authenticated, service_role;
revoke execute on function private.is_reserved_darb_hostname(text)
  from public, anon, authenticated, service_role;

revoke execute on function core.bootstrap_first_business(text, text, text)
  from public, anon, authenticated, service_role;
revoke execute on function core.current_user_business_access(uuid)
  from public, anon, authenticated, service_role;
revoke execute on function core.register_media_asset(uuid, text, text, text, bigint, integer, integer, integer, text)
  from public, anon, authenticated, service_role;
revoke execute on function core.complete_media_asset(uuid, uuid)
  from public, anon, authenticated, service_role;
revoke execute on function core.update_media_asset_alt_text(uuid, uuid, text)
  from public, anon, authenticated, service_role;
revoke execute on function core.archive_media_asset(uuid, uuid)
  from public, anon, authenticated, service_role;
revoke execute on function core.add_business_domain(uuid, text)
  from public, anon, authenticated, service_role;
revoke execute on function core.restart_business_domain_verification(uuid, uuid)
  from public, anon, authenticated, service_role;
revoke execute on function core.record_business_domain_verification(uuid, uuid, boolean)
  from public, anon, authenticated, service_role;
revoke execute on function core.set_business_domain_primary(uuid, uuid)
  from public, anon, authenticated, service_role;
revoke execute on function core.disable_business_domain(uuid, uuid)
  from public, anon, authenticated, service_role;
revoke execute on function core.update_business_locales(uuid, text, text[])
  from public, anon, authenticated, service_role;

grant execute on function core.bootstrap_first_business(text, text, text) to authenticated;
grant execute on function core.current_user_business_access(uuid) to authenticated;
grant execute on function core.register_media_asset(uuid, text, text, text, bigint, integer, integer, integer, text)
  to authenticated;
grant execute on function core.complete_media_asset(uuid, uuid) to authenticated;
grant execute on function core.update_media_asset_alt_text(uuid, uuid, text) to authenticated;
grant execute on function core.archive_media_asset(uuid, uuid) to authenticated;
grant execute on function core.add_business_domain(uuid, text) to authenticated;
grant execute on function core.restart_business_domain_verification(uuid, uuid) to authenticated;
grant execute on function core.set_business_domain_primary(uuid, uuid) to authenticated;
grant execute on function core.disable_business_domain(uuid, uuid) to authenticated;
grant execute on function core.update_business_locales(uuid, text, text[]) to authenticated;
grant execute on function core.record_business_domain_verification(uuid, uuid, boolean)
  to service_role;
