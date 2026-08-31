create function private.is_valid_timezone(candidate text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from pg_catalog.pg_timezone_names as timezone
    where timezone.name = candidate
  );
$$;

comment on function private.is_valid_timezone(text) is
  'Validates an exact IANA timezone name against the PostgreSQL timezone catalogue.';

create function core.current_user_business_access(target_business_id uuid)
returns table (
  can_manage_business boolean,
  can_read_all_locations boolean,
  can_manage_all_locations boolean,
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
    private.has_permission(target_business_id, 'audit.view'),
    private.is_super_admin();
$$;

comment on function core.current_user_business_access(uuid) is
  'Returns the small database-authoritative business-wide access snapshot used by admin navigation.';

create function core.update_business_settings(
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
    and (
      normalized_status = 'suspended'
      or current_business.status = 'suspended'
    ) then
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

comment on function core.update_business_settings(uuid, text, text, text, text, text) is
  'Atomically updates authorized core business settings and writes a redacted business.updated audit event.';

create function core.create_location(
  target_business_id uuid,
  requested_display_name text,
  requested_address_line text,
  requested_locality text,
  requested_postal_code text,
  requested_country_code text,
  requested_timezone text
)
returns setof core.locations
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  normalized_display_name text := btrim(requested_display_name);
  normalized_address_line text := nullif(btrim(requested_address_line), '');
  normalized_locality text := nullif(btrim(requested_locality), '');
  normalized_postal_code text := nullif(btrim(requested_postal_code), '');
  normalized_country_code text := upper(btrim(requested_country_code));
  normalized_timezone text := nullif(btrim(requested_timezone), '');
  created_location core.locations%rowtype;
begin
  if caller_id is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;

  if not private.has_permission(target_business_id, 'locations.manage') then
    raise exception 'BUSINESS_LOCATION_MANAGE_REQUIRED' using errcode = '42501';
  end if;

  perform 1 from core.businesses as business where business.id = target_business_id;
  if not found then
    raise exception 'BUSINESS_ACCESS_DENIED' using errcode = '42501';
  end if;

  if normalized_display_name is null
    or char_length(normalized_display_name) not between 1 and 160 then
    raise exception 'INVALID_LOCATION_DISPLAY_NAME' using errcode = '22023';
  end if;

  if normalized_address_line is not null
    and char_length(normalized_address_line) not between 1 and 500 then
    raise exception 'INVALID_LOCATION_ADDRESS' using errcode = '22023';
  end if;

  if normalized_locality is not null
    and char_length(normalized_locality) not between 1 and 160 then
    raise exception 'INVALID_LOCATION_LOCALITY' using errcode = '22023';
  end if;

  if normalized_postal_code is not null
    and char_length(normalized_postal_code) not between 1 and 32 then
    raise exception 'INVALID_LOCATION_POSTAL_CODE' using errcode = '22023';
  end if;

  if normalized_country_code is null or normalized_country_code !~ '^[A-Z]{2}$' then
    raise exception 'INVALID_LOCATION_COUNTRY_CODE' using errcode = '22023';
  end if;

  if normalized_timezone is not null
    and (
      char_length(normalized_timezone) not between 1 and 100
      or not private.is_valid_timezone(normalized_timezone)
    ) then
    raise exception 'INVALID_TIMEZONE' using errcode = '22023';
  end if;

  insert into core.locations (
    business_id,
    display_name,
    status,
    address_line,
    locality,
    postal_code,
    country_code,
    timezone,
    created_by
  )
  values (
    target_business_id,
    normalized_display_name,
    'active',
    normalized_address_line,
    normalized_locality,
    normalized_postal_code,
    normalized_country_code,
    normalized_timezone,
    caller_id
  )
  returning * into created_location;

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
    'location.created',
    'core.location',
    created_location.id::text,
    jsonb_build_object('status', 'active')
  );

  return next created_location;
end;
$$;

comment on function core.create_location(uuid, text, text, text, text, text, text) is
  'Atomically creates a location with business-wide locations.manage and writes a redacted audit event.';

create function core.update_location(
  target_business_id uuid,
  target_location_id uuid,
  requested_display_name text,
  requested_status text,
  requested_address_line text,
  requested_locality text,
  requested_postal_code text,
  requested_country_code text,
  requested_timezone text
)
returns setof core.locations
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  normalized_display_name text := btrim(requested_display_name);
  normalized_address_line text := nullif(btrim(requested_address_line), '');
  normalized_locality text := nullif(btrim(requested_locality), '');
  normalized_postal_code text := nullif(btrim(requested_postal_code), '');
  normalized_country_code text := upper(btrim(requested_country_code));
  normalized_timezone text := nullif(btrim(requested_timezone), '');
  normalized_status core.location_status;
  current_location core.locations%rowtype;
  updated_location core.locations%rowtype;
  changed_fields text[];
begin
  if caller_id is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;

  if not private.has_permission(target_business_id, 'locations.manage', target_location_id) then
    raise exception 'LOCATION_MANAGE_REQUIRED' using errcode = '42501';
  end if;

  select location.*
    into current_location
    from core.locations as location
    where location.business_id = target_business_id
      and location.id = target_location_id
    for update;

  if not found then
    raise exception 'LOCATION_ACCESS_DENIED' using errcode = '42501';
  end if;

  if current_location.status = 'archived' then
    raise exception 'LOCATION_ARCHIVED' using errcode = 'P0001';
  end if;

  if requested_status not in ('active', 'inactive') then
    raise exception 'INVALID_LOCATION_STATUS' using errcode = '22023';
  end if;

  normalized_status := requested_status::core.location_status;

  if normalized_display_name is null
    or char_length(normalized_display_name) not between 1 and 160 then
    raise exception 'INVALID_LOCATION_DISPLAY_NAME' using errcode = '22023';
  end if;

  if normalized_address_line is not null
    and char_length(normalized_address_line) not between 1 and 500 then
    raise exception 'INVALID_LOCATION_ADDRESS' using errcode = '22023';
  end if;

  if normalized_locality is not null
    and char_length(normalized_locality) not between 1 and 160 then
    raise exception 'INVALID_LOCATION_LOCALITY' using errcode = '22023';
  end if;

  if normalized_postal_code is not null
    and char_length(normalized_postal_code) not between 1 and 32 then
    raise exception 'INVALID_LOCATION_POSTAL_CODE' using errcode = '22023';
  end if;

  if normalized_country_code is null or normalized_country_code !~ '^[A-Z]{2}$' then
    raise exception 'INVALID_LOCATION_COUNTRY_CODE' using errcode = '22023';
  end if;

  if normalized_timezone is not null
    and (
      char_length(normalized_timezone) not between 1 and 100
      or not private.is_valid_timezone(normalized_timezone)
    ) then
    raise exception 'INVALID_TIMEZONE' using errcode = '22023';
  end if;

  changed_fields := array_remove(array[
    case when current_location.display_name is distinct from normalized_display_name then 'display_name' end,
    case when current_location.status is distinct from normalized_status then 'status' end,
    case when current_location.address_line is distinct from normalized_address_line then 'address_line' end,
    case when current_location.locality is distinct from normalized_locality then 'locality' end,
    case when current_location.postal_code is distinct from normalized_postal_code then 'postal_code' end,
    case when current_location.country_code is distinct from normalized_country_code then 'country_code' end,
    case when current_location.timezone is distinct from normalized_timezone then 'timezone' end
  ], null);

  if cardinality(changed_fields) = 0 then
    return next current_location;
    return;
  end if;

  update core.locations as location
    set display_name = normalized_display_name,
        status = normalized_status,
        address_line = normalized_address_line,
        locality = normalized_locality,
        postal_code = normalized_postal_code,
        country_code = normalized_country_code,
        timezone = normalized_timezone
    where location.business_id = target_business_id
      and location.id = target_location_id
    returning location.* into updated_location;

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
    'location.updated',
    'core.location',
    target_location_id::text,
    jsonb_build_object('changed_fields', to_jsonb(changed_fields))
  );

  return next updated_location;
end;
$$;

comment on function core.update_location(uuid, uuid, text, text, text, text, text, text, text) is
  'Atomically updates an authorized non-archived location and writes a redacted audit event.';

create function core.archive_location(
  target_business_id uuid,
  target_location_id uuid
)
returns setof core.locations
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  current_location core.locations%rowtype;
  archived_location core.locations%rowtype;
begin
  if caller_id is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;

  if not private.has_permission(target_business_id, 'locations.manage', target_location_id) then
    raise exception 'LOCATION_MANAGE_REQUIRED' using errcode = '42501';
  end if;

  select location.*
    into current_location
    from core.locations as location
    where location.business_id = target_business_id
      and location.id = target_location_id
    for update;

  if not found then
    raise exception 'LOCATION_ACCESS_DENIED' using errcode = '42501';
  end if;

  if current_location.status = 'archived' then
    return next current_location;
    return;
  end if;

  update core.locations as location
    set status = 'archived'
    where location.business_id = target_business_id
      and location.id = target_location_id
    returning location.* into archived_location;

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
    'location.archived',
    'core.location',
    target_location_id::text,
    jsonb_build_object('previous_status', current_location.status::text)
  );

  return next archived_location;
end;
$$;

comment on function core.archive_location(uuid, uuid) is
  'Atomically archives an authorized location without deletion and writes a location.archived audit event.';

revoke execute on function private.is_valid_timezone(text)
  from public, anon, authenticated, service_role;

revoke execute on function core.current_user_business_access(uuid)
  from public, anon, authenticated, service_role;
revoke execute on function core.update_business_settings(uuid, text, text, text, text, text)
  from public, anon, authenticated, service_role;
revoke execute on function core.create_location(uuid, text, text, text, text, text, text)
  from public, anon, authenticated, service_role;
revoke execute on function core.update_location(uuid, uuid, text, text, text, text, text, text, text)
  from public, anon, authenticated, service_role;
revoke execute on function core.archive_location(uuid, uuid)
  from public, anon, authenticated, service_role;

grant execute on function core.current_user_business_access(uuid) to authenticated;
grant execute on function core.update_business_settings(uuid, text, text, text, text, text)
  to authenticated;
grant execute on function core.create_location(uuid, text, text, text, text, text, text)
  to authenticated;
grant execute on function core.update_location(uuid, uuid, text, text, text, text, text, text, text)
  to authenticated;
grant execute on function core.archive_location(uuid, uuid) to authenticated;
