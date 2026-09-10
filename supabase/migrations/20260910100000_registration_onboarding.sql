alter table core.businesses
  add column onboarding_completed_at timestamptz;

update core.businesses
set onboarding_completed_at = coalesce(updated_at, created_at, now());

comment on column core.businesses.onboarding_completed_at is
  'Null only while a newly bootstrapped owner is completing the first-business setup flow.';

create function private.is_reserved_business_slug(candidate text)
returns boolean
language sql
immutable
security invoker
set search_path = ''
as $$
  select lower(btrim(candidate)) = any (array[
    'admin', 'api', 'app', 'book', 'booking', 'commerce', 'darb', 'help',
    'mail', 'pages', 'platform', 'rest', 'shop', 'status', 'support', 'www'
  ]::text[]);
$$;

create function private.enforce_business_slug_reservation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (tg_op = 'INSERT' or new.slug is distinct from old.slug)
    and private.is_reserved_business_slug(new.slug) then
    raise exception 'BUSINESS_SLUG_RESERVED' using errcode = '22023';
  end if;
  return new;
end;
$$;

create trigger businesses_reserved_slug_guard
before insert or update of slug on core.businesses
for each row execute function private.enforce_business_slug_reservation();

create function core.complete_first_business_onboarding(
  target_business_id uuid,
  requested_enabled_locales text[],
  requested_module_key text,
  requested_create_location boolean,
  requested_location_name text,
  requested_location_address text,
  requested_location_locality text
)
returns table (
  business_id uuid,
  business_slug text,
  enabled_module_key text,
  location_id uuid,
  completed_at timestamptz,
  was_completed boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  current_business core.businesses%rowtype;
  normalized_module_key text := nullif(btrim(requested_module_key), '');
  normalized_location_name text := btrim(requested_location_name);
  normalized_location_address text := btrim(requested_location_address);
  normalized_location_locality text := btrim(requested_location_locality);
  created_location_id uuid;
  existing_module_key text;
  completion_time timestamptz;
begin
  if caller_id is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;

  select business.* into current_business
  from core.businesses as business
  where business.id = target_business_id
    and business.status = 'active'
    and business.created_by = caller_id
    and private.has_permission(business.id, 'business.manage')
  for update;

  if not found then
    raise exception 'ONBOARDING_BUSINESS_ACCESS_DENIED' using errcode = '42501';
  end if;

  if current_business.onboarding_completed_at is not null then
    select location.id into created_location_id
    from core.locations as location
    where location.business_id = current_business.id
    order by location.created_at, location.id
    limit 1;

    select state.module_key into existing_module_key
    from core.business_modules as state
    where state.business_id = current_business.id and state.is_enabled
    order by state.module_key
    limit 1;

    return query select current_business.id, current_business.slug, existing_module_key,
      created_location_id, current_business.onboarding_completed_at, false;
    return;
  end if;

  if requested_enabled_locales is null
    or cardinality(requested_enabled_locales) not between 1 and 3
    or current_business.default_locale::text <> all(requested_enabled_locales)
    or exists (
      select 1 from unnest(requested_enabled_locales) as locale(value)
      where locale.value not in ('ar', 'he', 'en')
    ) then
    raise exception 'INVALID_ONBOARDING_LOCALES' using errcode = '22023';
  end if;

  if normalized_module_key is not null then
    perform 1 from core.modules as module
    where module.key = normalized_module_key and module.is_available;
    if not found then
      raise exception 'ONBOARDING_MODULE_UNAVAILABLE' using errcode = '22023';
    end if;
  end if;

  if coalesce(requested_create_location, false) then
    if normalized_location_name is null or char_length(normalized_location_name) not between 1 and 160 then
      raise exception 'INVALID_LOCATION_DISPLAY_NAME' using errcode = '22023';
    end if;

    select created.id into created_location_id
    from core.create_location(
      current_business.id,
      normalized_location_name,
      normalized_location_address,
      normalized_location_locality,
      '',
      'IL',
      ''
    ) as created;
  elsif normalized_module_key = 'restaurant' then
    raise exception 'RESTAURANT_ONBOARDING_LOCATION_REQUIRED' using errcode = '22023';
  end if;

  perform core.update_business_locales(
    current_business.id,
    current_business.default_locale::text,
    requested_enabled_locales
  );

  if normalized_module_key is not null then
    perform core.set_business_module_enabled(current_business.id, normalized_module_key, true);
  end if;

  completion_time := clock_timestamp();
  update core.businesses as business
  set onboarding_completed_at = completion_time
  where business.id = current_business.id;

  insert into core.audit_events (
    actor_kind, actor_user_id, business_id, action_key, entity_type, entity_id, metadata
  ) values (
    'user', caller_id, current_business.id, 'business.onboarding_completed',
    'core.business', current_business.id::text,
    jsonb_build_object(
      'module_key', normalized_module_key,
      'location_created', created_location_id is not null,
      'enabled_locales', to_jsonb(requested_enabled_locales)
    )
  );

  return query select current_business.id, current_business.slug, normalized_module_key,
    created_location_id, completion_time, true;
end;
$$;

comment on function core.complete_first_business_onboarding(uuid, text[], text, boolean, text, text, text) is
  'Atomically completes the creator-owned first-business setup using existing governed locale, module, and location mutations.';

revoke execute on function private.is_reserved_business_slug(text)
  from public, anon, authenticated, service_role;
revoke execute on function private.enforce_business_slug_reservation()
  from public, anon, authenticated, service_role;
revoke execute on function core.complete_first_business_onboarding(uuid, text[], text, boolean, text, text, text)
  from public, anon, authenticated, service_role;

grant execute on function core.complete_first_business_onboarding(uuid, text[], text, boolean, text, text, text)
  to authenticated;
