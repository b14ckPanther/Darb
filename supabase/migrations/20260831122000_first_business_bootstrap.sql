create function core.current_user_is_super_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select private.is_super_admin();
$$;

comment on function core.current_user_is_super_admin() is
  'Exposes only the authenticated caller super-admin decision; private assignments remain unexposed.';

create function core.current_user_has_permission(
  target_business_id uuid,
  target_permission_key text,
  target_location_id uuid default null
)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select private.has_permission(
    target_business_id,
    target_permission_key,
    target_location_id
  );
$$;

comment on function core.current_user_has_permission(uuid, text, uuid) is
  'Exposes the existing database authorization decision without duplicating permission logic in applications.';

create function core.bootstrap_first_business(
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
    raise exception 'AUTHENTICATION_REQUIRED'
      using errcode = '42501';
  end if;

  perform 1
  from auth.users as auth_user
  where auth_user.id = caller_id
  for update;

  if not found then
    raise exception 'AUTHENTICATED_USER_NOT_FOUND'
      using errcode = '42501';
  end if;

  if normalized_display_name is null
    or char_length(normalized_display_name) not between 1 and 160 then
    raise exception 'INVALID_BUSINESS_DISPLAY_NAME'
      using errcode = '22023';
  end if;

  if normalized_slug is null
    or char_length(normalized_slug) not between 3 and 63
    or normalized_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'INVALID_BUSINESS_SLUG'
      using errcode = '22023';
  end if;

  if requested_default_locale not in ('ar', 'he', 'en') then
    raise exception 'INVALID_DEFAULT_LOCALE'
      using errcode = '22023';
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

    raise exception 'FIRST_BUSINESS_ALREADY_BOOTSTRAPPED'
      using errcode = 'P0001';
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
      ('audit.view'::text)
  ) as owner_permission(permission_key);

  get diagnostics inserted_permission_count = row_count;

  if inserted_permission_count <> 7 then
    raise exception 'OWNER_PERMISSION_BUNDLE_INCOMPLETE'
      using errcode = '55000';
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
  'Atomically creates the authenticated caller first business, owner membership, fixed permission bundle, and audit event.';

revoke execute on function core.current_user_is_super_admin()
  from public, anon, authenticated, service_role;
revoke execute on function core.current_user_has_permission(uuid, text, uuid)
  from public, anon, authenticated, service_role;
revoke execute on function core.bootstrap_first_business(text, text, text)
  from public, anon, authenticated, service_role;

grant execute on function core.current_user_is_super_admin() to authenticated;
grant execute on function core.current_user_has_permission(uuid, text, uuid) to authenticated;
grant execute on function core.bootstrap_first_business(text, text, text) to authenticated;
