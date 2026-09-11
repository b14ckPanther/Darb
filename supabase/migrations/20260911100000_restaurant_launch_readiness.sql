-- Restaurant launch-readiness: governed per-location public contact details and regular hours.

create table restaurant.location_public_profiles (
  business_id uuid not null,
  location_id uuid not null,
  public_phone text,
  public_email text,
  website_url text,
  whatsapp_phone text,
  map_url text,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (business_id, location_id),
  constraint location_public_profiles_location_fk foreign key (business_id, location_id)
    references core.locations (business_id, id) on delete cascade,
  constraint location_public_profiles_phone_check check (
    public_phone is null or public_phone ~ '^\+[1-9][0-9]{7,14}$'
  ),
  constraint location_public_profiles_email_check check (
    public_email is null or (
      char_length(public_email) between 3 and 254
      and public_email ~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'
    )
  ),
  constraint location_public_profiles_website_check check (
    website_url is null or (
      char_length(website_url) between 9 and 2048
      and website_url ~ '^https://[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?(?::[0-9]{1,5})?(?:[/#?][^[:space:][:cntrl:]]*)?$'
    )
  ),
  constraint location_public_profiles_whatsapp_check check (
    whatsapp_phone is null or whatsapp_phone ~ '^\+[1-9][0-9]{7,14}$'
  ),
  constraint location_public_profiles_map_check check (
    map_url is null or (
      char_length(map_url) between 9 and 2048
      and map_url ~ '^https://[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?(?::[0-9]{1,5})?(?:[/#?][^[:space:][:cntrl:]]*)?$'
    )
  )
);

comment on table restaurant.location_public_profiles is
  'Allow-listed public contact details for a canonical core location. Absence means no additional public contact data.';

create table restaurant.location_opening_intervals (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  location_id uuid not null,
  iso_weekday smallint not null,
  opens_at time without time zone not null,
  closes_at time without time zone not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint location_opening_intervals_location_fk foreign key (business_id, location_id)
    references core.locations (business_id, id) on delete cascade,
  constraint location_opening_intervals_business_location_day_time_key
    unique (business_id, location_id, iso_weekday, opens_at, closes_at),
  constraint location_opening_intervals_weekday_check check (iso_weekday between 1 and 7),
  constraint location_opening_intervals_duration_check check (opens_at <> closes_at)
);

comment on table restaurant.location_opening_intervals is
  'Canonical regular weekly opening intervals using ISO weekdays in the owning location timezone. A close time before its open time crosses midnight.';

create index location_opening_intervals_location_order_idx
  on restaurant.location_opening_intervals (
    business_id, location_id, iso_weekday, opens_at, closes_at
  );

create trigger location_public_profiles_set_updated_at
before update on restaurant.location_public_profiles
for each row execute function private.set_updated_at();

create trigger location_opening_intervals_set_updated_at
before update on restaurant.location_opening_intervals
for each row execute function private.set_updated_at();

alter table restaurant.location_public_profiles enable row level security;
alter table restaurant.location_opening_intervals enable row level security;

create policy restaurant_location_public_profiles_select_authorized
on restaurant.location_public_profiles for select to authenticated using (
  (select private.has_permission(business_id, 'restaurant.read'))
  or (select private.has_permission(business_id, 'restaurant.manage'))
);

create policy restaurant_location_opening_intervals_select_authorized
on restaurant.location_opening_intervals for select to authenticated using (
  (select private.has_permission(business_id, 'restaurant.read'))
  or (select private.has_permission(business_id, 'restaurant.manage'))
);

revoke all on restaurant.location_public_profiles,
  restaurant.location_opening_intervals from public, anon, authenticated, service_role;
grant all on restaurant.location_public_profiles,
  restaurant.location_opening_intervals to service_role;
grant select on restaurant.location_public_profiles,
  restaurant.location_opening_intervals to authenticated;

create function restaurant.save_location_public_details(
  target_business_id uuid,
  target_location_id uuid,
  requested_public_phone text,
  requested_public_email text,
  requested_website_url text,
  requested_whatsapp_phone text,
  requested_map_url text,
  requested_opening_hours jsonb
)
returns table (location_id uuid, changed boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid;
  current_location core.locations%rowtype;
  normalized_phone text := nullif(btrim(requested_public_phone), '');
  normalized_email text := nullif(lower(btrim(requested_public_email)), '');
  normalized_website text := nullif(btrim(requested_website_url), '');
  normalized_whatsapp text := nullif(btrim(requested_whatsapp_phone), '');
  normalized_map text := nullif(btrim(requested_map_url), '');
  current_contact jsonb;
  requested_contact jsonb;
  current_hours jsonb;
  requested_hours jsonb;
begin
  caller_id := private.assert_restaurant_mutation_allowed(target_business_id);

  select location.* into current_location
  from core.locations as location
  where location.business_id = target_business_id
    and location.id = target_location_id
  for update;

  if not found then
    raise exception 'RESTAURANT_LOCATION_NOT_FOUND' using errcode = '22023';
  end if;
  if current_location.status = 'archived' then
    raise exception 'RESTAURANT_LOCATION_ARCHIVED' using errcode = '55000';
  end if;

  if normalized_phone is not null and normalized_phone !~ '^\+[1-9][0-9]{7,14}$' then
    raise exception 'INVALID_RESTAURANT_PUBLIC_PHONE' using errcode = '22023';
  end if;
  if normalized_email is not null and (
    char_length(normalized_email) not between 3 and 254
    or normalized_email !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'
  ) then
    raise exception 'INVALID_RESTAURANT_PUBLIC_EMAIL' using errcode = '22023';
  end if;
  if normalized_website is not null and (
    char_length(normalized_website) not between 9 and 2048
    or normalized_website !~ '^https://[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?(?::[0-9]{1,5})?(?:[/#?][^[:space:][:cntrl:]]*)?$'
  ) then
    raise exception 'INVALID_RESTAURANT_PUBLIC_URL' using errcode = '22023';
  end if;
  if normalized_whatsapp is not null and normalized_whatsapp !~ '^\+[1-9][0-9]{7,14}$' then
    raise exception 'INVALID_RESTAURANT_WHATSAPP_PHONE' using errcode = '22023';
  end if;
  if normalized_map is not null and (
    char_length(normalized_map) not between 9 and 2048
    or normalized_map !~ '^https://[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?(?::[0-9]{1,5})?(?:[/#?][^[:space:][:cntrl:]]*)?$'
  ) then
    raise exception 'INVALID_RESTAURANT_PUBLIC_URL' using errcode = '22023';
  end if;

  if requested_opening_hours is null
    or jsonb_typeof(requested_opening_hours) <> 'array'
    or jsonb_array_length(requested_opening_hours) > 56 then
    raise exception 'INVALID_RESTAURANT_OPENING_HOURS' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(requested_opening_hours) as entry(value)
    where jsonb_typeof(entry.value) <> 'object'
      or not (entry.value ? 'weekday' and entry.value ? 'opensAt' and entry.value ? 'closesAt')
      or (entry.value ->> 'weekday') !~ '^[1-7]$'
      or (entry.value ->> 'opensAt') !~ '^(?:[01][0-9]|2[0-3]):[0-5][0-9]$'
      or (entry.value ->> 'closesAt') !~ '^(?:[01][0-9]|2[0-3]):[0-5][0-9]$'
      or entry.value ->> 'opensAt' = entry.value ->> 'closesAt'
  ) then
    raise exception 'INVALID_RESTAURANT_OPENING_HOURS' using errcode = '22023';
  end if;

  -- Expand overnight rows into half-open week segments and reject every overlap.
  if exists (
    with parsed as (
      select row_number() over () as row_id,
        (entry.value ->> 'weekday')::integer as weekday,
        ((split_part(entry.value ->> 'opensAt', ':', 1)::integer * 60)
          + split_part(entry.value ->> 'opensAt', ':', 2)::integer) as open_minute,
        ((split_part(entry.value ->> 'closesAt', ':', 1)::integer * 60)
          + split_part(entry.value ->> 'closesAt', ':', 2)::integer) as close_minute
      from jsonb_array_elements(requested_opening_hours) as entry(value)
    ), ranges as (
      select row_id,
        ((weekday - 1) * 1440 + open_minute) as starts_at,
        ((weekday - 1) * 1440 + open_minute
          + case when close_minute > open_minute
            then close_minute - open_minute
            else 1440 - open_minute + close_minute end) as ends_at
      from parsed
    ), segments as (
      select row_id, starts_at, least(ends_at, 10080) as ends_at from ranges
      union all
      select row_id, 0, ends_at - 10080 from ranges where ends_at > 10080
    )
    select 1
    from segments as left_segment
    join segments as right_segment
      on left_segment.row_id < right_segment.row_id
      and left_segment.starts_at < right_segment.ends_at
      and right_segment.starts_at < left_segment.ends_at
  ) then
    raise exception 'OVERLAPPING_RESTAURANT_OPENING_HOURS' using errcode = '22023';
  end if;

  requested_contact := jsonb_strip_nulls(jsonb_build_object(
    'phone', normalized_phone,
    'email', normalized_email,
    'websiteUrl', normalized_website,
    'whatsappPhone', normalized_whatsapp,
    'mapUrl', normalized_map
  ));

  select coalesce(jsonb_strip_nulls(jsonb_build_object(
    'phone', profile.public_phone,
    'email', profile.public_email,
    'websiteUrl', profile.website_url,
    'whatsappPhone', profile.whatsapp_phone,
    'mapUrl', profile.map_url
  )), '{}'::jsonb)
  into current_contact
  from restaurant.location_public_profiles as profile
  where profile.business_id = target_business_id and profile.location_id = target_location_id;
  current_contact := coalesce(current_contact, '{}'::jsonb);

  select coalesce(jsonb_agg(jsonb_build_object(
    'weekday', (entry.value ->> 'weekday')::integer,
    'opensAt', entry.value ->> 'opensAt',
    'closesAt', entry.value ->> 'closesAt'
  ) order by (entry.value ->> 'weekday')::integer, entry.value ->> 'opensAt', entry.value ->> 'closesAt'), '[]'::jsonb)
  into requested_hours
  from jsonb_array_elements(requested_opening_hours) as entry(value);

  select coalesce(jsonb_agg(jsonb_build_object(
    'weekday', interval.iso_weekday,
    'opensAt', to_char(interval.opens_at, 'HH24:MI'),
    'closesAt', to_char(interval.closes_at, 'HH24:MI')
  ) order by interval.iso_weekday, interval.opens_at, interval.closes_at), '[]'::jsonb)
  into current_hours
  from restaurant.location_opening_intervals as interval
  where interval.business_id = target_business_id and interval.location_id = target_location_id;

  if current_contact = requested_contact and current_hours = requested_hours then
    return query select target_location_id, false;
    return;
  end if;

  if requested_contact = '{}'::jsonb then
    delete from restaurant.location_public_profiles as profile
    where profile.business_id = target_business_id and profile.location_id = target_location_id;
  else
    insert into restaurant.location_public_profiles (
      business_id, location_id, public_phone, public_email, website_url,
      whatsapp_phone, map_url, created_by
    ) values (
      target_business_id, target_location_id, normalized_phone, normalized_email,
      normalized_website, normalized_whatsapp, normalized_map, caller_id
    )
    on conflict on constraint location_public_profiles_pkey do update set
      public_phone = excluded.public_phone,
      public_email = excluded.public_email,
      website_url = excluded.website_url,
      whatsapp_phone = excluded.whatsapp_phone,
      map_url = excluded.map_url;
  end if;

  delete from restaurant.location_opening_intervals as interval
  where interval.business_id = target_business_id and interval.location_id = target_location_id;

  insert into restaurant.location_opening_intervals (
    business_id, location_id, iso_weekday, opens_at, closes_at
  )
  select target_business_id, target_location_id,
    (entry.value ->> 'weekday')::smallint,
    (entry.value ->> 'opensAt')::time,
    (entry.value ->> 'closesAt')::time
  from jsonb_array_elements(requested_hours) as entry(value);

  perform private.write_restaurant_audit(
    target_business_id,
    'restaurant.location_public_details_updated',
    'restaurant.location_public_profile',
    target_location_id,
    jsonb_build_object(
      'contact_fields', (select coalesce(jsonb_agg(key order by key), '[]'::jsonb)
        from jsonb_object_keys(requested_contact) as field(key)),
      'opening_interval_count', jsonb_array_length(requested_hours)
    )
  );

  return query select target_location_id, true;
end;
$$;

comment on function restaurant.save_location_public_details(
  uuid, uuid, text, text, text, text, text, jsonb
) is
  'Atomically validates and saves allow-listed public contact details plus non-overlapping weekly opening intervals for one authorized location.';

revoke execute on function restaurant.save_location_public_details(
  uuid, uuid, text, text, text, text, text, jsonb
) from public, anon, authenticated, service_role;
grant execute on function restaurant.save_location_public_details(
  uuid, uuid, text, text, text, text, text, jsonb
) to authenticated;

-- Preserve the already reviewed capability/publication/branding gate and enrich only its
-- active-location projection. This avoids a second public or template-specific publication path.
alter function public.get_restaurant_publication(text) set schema private;
alter function private.get_restaurant_publication(text)
  rename to get_restaurant_publication_launch_base;
revoke execute on function private.get_restaurant_publication_launch_base(text)
  from public, anon, authenticated, service_role;

create function public.get_restaurant_publication(requested_business_slug text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with base as (
    select private.get_restaurant_publication_launch_base(requested_business_slug) as payload
  )
  select case
    when base.payload is null then null
    else jsonb_set(
      base.payload,
      '{locations}',
      coalesce((
        select jsonb_agg(
          location.value || jsonb_build_object(
            'contact', case
              when profile.business_id is null then null
              else jsonb_build_object(
                'phone', profile.public_phone,
                'email', profile.public_email,
                'websiteUrl', profile.website_url,
                'whatsappPhone', profile.whatsapp_phone,
                'mapUrl', profile.map_url
              )
            end,
            'openingHours', coalesce((
              select jsonb_agg(jsonb_build_object(
                'weekday', interval.iso_weekday,
                'opensAt', to_char(interval.opens_at, 'HH24:MI'),
                'closesAt', to_char(interval.closes_at, 'HH24:MI')
              ) order by interval.iso_weekday, interval.opens_at, interval.closes_at)
              from restaurant.location_opening_intervals as interval
              where interval.business_id = business.id
                and interval.location_id = (location.value ->> 'id')::uuid
            ), '[]'::jsonb)
          ) order by location.ordinality
        )
        from jsonb_array_elements(base.payload -> 'locations')
          with ordinality as location(value, ordinality)
        join core.businesses as business
          on business.slug = base.payload #>> '{business,slug}'
        left join restaurant.location_public_profiles as profile
          on profile.business_id = business.id
          and profile.location_id = (location.value ->> 'id')::uuid
      ), '[]'::jsonb),
      true
    )
  end
  from base;
$$;

comment on function public.get_restaurant_publication(text) is
  'Anonymous-safe Restaurant publication with governed branding, active-location contact details, and regular opening hours.';

revoke execute on function public.get_restaurant_publication(text)
  from public, anon, authenticated, service_role;
grant execute on function public.get_restaurant_publication(text)
  to anon, authenticated;
