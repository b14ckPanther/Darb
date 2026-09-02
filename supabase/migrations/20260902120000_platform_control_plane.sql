-- Phase 14: narrow, authenticated platform-operator projections and lifecycle mutation.

create index businesses_platform_created_idx
  on core.businesses (created_at desc, id);
create index memberships_user_business_idx
  on core.memberships (user_id, business_id);
create index business_modules_enabled_module_business_idx
  on core.business_modules (module_key, business_id)
  where is_enabled;
create index business_locales_enabled_locale_business_idx
  on core.business_locales (locale_code, business_id)
  where is_enabled;
create index business_domains_platform_state_created_idx
  on core.business_domains (status, routing_status, created_at desc, id);
create index audit_events_platform_time_idx
  on core.audit_events (occurred_at desc, id desc);

create function private.platform_page_is_valid(requested_page integer, requested_page_size integer)
returns boolean
language sql
immutable
security definer
set search_path = ''
as $$
  select requested_page between 1 and 1000000
    and requested_page_size between 1 and 100;
$$;

revoke execute on function private.platform_page_is_valid(integer, integer)
  from public, anon, authenticated, service_role;

create function core.get_platform_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_super_admin() then
    raise exception 'PLATFORM_ADMIN_REQUIRED' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'businesses', jsonb_build_object(
      'total', (select count(*) from core.businesses),
      'active', (select count(*) from core.businesses where status = 'active'),
      'suspended', (select count(*) from core.businesses where status = 'suspended'),
      'archived', (select count(*) from core.businesses where status = 'archived')
    ),
    'users', (select count(*) from auth.users),
    'memberships', (select count(*) from core.memberships),
    'restaurant_enabled_businesses', (
      select count(*)
      from core.business_modules as state
      join core.businesses as business on business.id = state.business_id
      join core.modules as module on module.key = state.module_key
      where state.module_key = 'restaurant'
        and state.is_enabled
        and module.is_available
        and business.status = 'active'
    ),
    'live_domains', (
      select count(*)
      from core.business_domains
      where status = 'verified' and routing_status = 'live'
    ),
    'templates', (select count(*) from core.templates),
    'available_modules', (select count(*) from core.modules where is_available),
    'active_super_admins', (
      select count(*) from private.super_admins where revoked_at is null
    )
  );
end;
$$;

comment on function core.get_platform_overview() is
  'Super-admin-only operational totals with no invented product analytics.';

create function core.list_platform_businesses(
  requested_query text default null,
  requested_status text default null,
  requested_module_key text default null,
  requested_locale text default null,
  requested_domain_status text default null,
  requested_page integer default 1,
  requested_page_size integer default 25
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  normalized_query text := nullif(btrim(requested_query), '');
  normalized_status text := nullif(btrim(requested_status), '');
  normalized_module_key text := nullif(btrim(requested_module_key), '');
  normalized_locale text := nullif(btrim(requested_locale), '');
  normalized_domain_status text := nullif(btrim(requested_domain_status), '');
  page_offset integer;
begin
  if not private.is_super_admin() then
    raise exception 'PLATFORM_ADMIN_REQUIRED' using errcode = '42501';
  end if;
  if not private.platform_page_is_valid(requested_page, requested_page_size) then
    raise exception 'INVALID_PLATFORM_PAGE' using errcode = '22023';
  end if;
  if normalized_query is not null and char_length(normalized_query) > 120 then
    raise exception 'INVALID_PLATFORM_QUERY' using errcode = '22023';
  end if;
  if normalized_status is not null and normalized_status not in ('active', 'suspended', 'archived') then
    raise exception 'INVALID_BUSINESS_STATUS_FILTER' using errcode = '22023';
  end if;
  if normalized_module_key is not null and not exists (
    select 1 from core.modules where key = normalized_module_key
  ) then
    raise exception 'INVALID_MODULE_FILTER' using errcode = '22023';
  end if;
  if normalized_locale is not null and normalized_locale not in ('ar', 'he', 'en') then
    raise exception 'INVALID_LOCALE_FILTER' using errcode = '22023';
  end if;
  if normalized_domain_status is not null
    and normalized_domain_status not in ('none', 'pending', 'verified', 'failed', 'disabled', 'live', 'provisioning', 'unconfigured', 'disconnected') then
    raise exception 'INVALID_DOMAIN_STATUS_FILTER' using errcode = '22023';
  end if;

  page_offset := (requested_page - 1) * requested_page_size;

  return (
    with filtered as materialized (
      select business.*
      from core.businesses as business
      where (
        normalized_query is null
        or business.display_name ilike '%' || normalized_query || '%'
        or business.slug ilike '%' || normalized_query || '%'
      )
      and (normalized_status is null or business.status::text = normalized_status)
      and (
        normalized_module_key is null
        or exists (
          select 1 from core.business_modules as state
          where state.business_id = business.id
            and state.module_key = normalized_module_key
            and state.is_enabled
        )
      )
      and (
        normalized_locale is null
        or exists (
          select 1 from core.business_locales as locale
          where locale.business_id = business.id
            and locale.locale_code::text = normalized_locale
            and locale.is_enabled
        )
      )
      and (
        normalized_domain_status is null
        or (normalized_domain_status = 'none' and not exists (
          select 1 from core.business_domains as domain where domain.business_id = business.id
        ))
        or (normalized_domain_status in ('pending', 'verified', 'failed', 'disabled') and exists (
          select 1 from core.business_domains as domain
          where domain.business_id = business.id and domain.status::text = normalized_domain_status
        ))
        or (normalized_domain_status in ('live', 'provisioning', 'unconfigured', 'disconnected') and exists (
          select 1 from core.business_domains as domain
          where domain.business_id = business.id and domain.routing_status::text = normalized_domain_status
        ))
      )
    ), page_rows as (
      select filtered.*
      from filtered
      order by filtered.created_at desc, filtered.id
      limit requested_page_size offset page_offset
    )
    select jsonb_build_object(
      'page', requested_page,
      'page_size', requested_page_size,
      'total', (select count(*) from filtered),
      'items', coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'id', business.id,
            'slug', business.slug,
            'display_name', business.display_name,
            'status', business.status,
            'default_locale', business.default_locale,
            'currency_code', business.currency_code,
            'timezone', business.timezone,
            'created_at', business.created_at,
            'updated_at', business.updated_at,
            'location_count', (select count(*) from core.locations where business_id = business.id),
            'membership_count', (select count(*) from core.memberships where business_id = business.id),
            'enabled_modules', coalesce((
              select jsonb_agg(state.module_key order by module.sort_order, state.module_key)
              from core.business_modules as state
              join core.modules as module on module.key = state.module_key
              where state.business_id = business.id and state.is_enabled
            ), '[]'::jsonb),
            'enabled_locales', coalesce((
              select jsonb_agg(locale.locale_code order by locale.locale_code)
              from core.business_locales as locale
              where locale.business_id = business.id and locale.is_enabled
            ), '[]'::jsonb),
            'domain_count', (select count(*) from core.business_domains where business_id = business.id),
            'live_domain_count', (
              select count(*) from core.business_domains
              where business_id = business.id and status = 'verified' and routing_status = 'live'
            )
          ) order by business.created_at desc, business.id
        )
        from page_rows as business
      ), '[]'::jsonb)
    )
  );
end;
$$;

comment on function core.list_platform_businesses(text, text, text, text, text, integer, integer) is
  'Super-admin-only paginated tenant directory with bounded filters and operational aggregates.';

create function core.get_platform_business_detail(target_business_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if not private.is_super_admin() then
    raise exception 'PLATFORM_ADMIN_REQUIRED' using errcode = '42501';
  end if;
  if target_business_id is null then
    raise exception 'BUSINESS_NOT_FOUND' using errcode = '22023';
  end if;

  select jsonb_build_object(
    'business', jsonb_build_object(
      'id', business.id,
      'slug', business.slug,
      'display_name', business.display_name,
      'status', business.status,
      'default_locale', business.default_locale,
      'currency_code', business.currency_code,
      'timezone', business.timezone,
      'created_at', business.created_at,
      'updated_at', business.updated_at
    ),
    'locations', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', location.id,
        'display_name', location.display_name,
        'status', location.status,
        'address_line', location.address_line,
        'locality', location.locality,
        'postal_code', location.postal_code,
        'country_code', location.country_code,
        'timezone', location.timezone
      ) order by location.status, location.display_name, location.id)
      from core.locations as location where location.business_id = business.id
    ), '[]'::jsonb),
    'membership_count', (select count(*) from core.memberships where business_id = business.id),
    'active_membership_count', (
      select count(*) from core.memberships where business_id = business.id and status = 'active'
    ),
    'locales', coalesce((
      select jsonb_agg(jsonb_build_object('code', locale.locale_code, 'is_enabled', locale.is_enabled)
        order by locale.locale_code)
      from core.business_locales as locale where locale.business_id = business.id
    ), '[]'::jsonb),
    'modules', coalesce((
      select jsonb_agg(jsonb_build_object(
        'key', module.key,
        'display_name', module.display_name,
        'is_enabled', coalesce(state.is_enabled, false),
        'is_available', module.is_available,
        'is_effective', coalesce(state.is_enabled, false) and module.is_available and business.status = 'active'
      ) order by module.sort_order, module.key)
      from core.modules as module
      left join core.business_modules as state
        on state.business_id = business.id and state.module_key = module.key
    ), '[]'::jsonb),
    'domains', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', domain.id,
        'business_id', business.id,
        'business_slug', business.slug,
        'business_name', business.display_name,
        'hostname', domain.hostname,
        'status', domain.status,
        'routing_status', domain.routing_status,
        'target_module_key', domain.target_module_key,
        'is_primary', domain.is_primary,
        'verification_checked_at', domain.verification_checked_at,
        'verified_at', domain.verified_at,
        'routing_checked_at', domain.routing_checked_at,
        'routing_live_at', domain.routing_live_at,
        'created_at', domain.created_at,
        'updated_at', domain.updated_at
      ) order by domain.is_primary desc, domain.created_at desc)
      from core.business_domains as domain where domain.business_id = business.id
    ), '[]'::jsonb),
    'appearances', coalesce((
      select jsonb_agg(jsonb_build_object(
        'module_key', setting.module_key,
        'template_key', setting.template_key,
        'template_display_name', template.display_name,
        'template_available', template.is_available,
        'updated_at', setting.updated_at
      ) order by setting.module_key)
      from core.business_visual_settings as setting
      join core.templates as template
        on template.module_key = setting.module_key and template.key = setting.template_key
      where setting.business_id = business.id
    ), '[]'::jsonb),
    'restaurant', jsonb_build_object(
      'module_enabled', coalesce((
        select state.is_enabled from core.business_modules as state
        where state.business_id = business.id and state.module_key = 'restaurant'
      ), false),
      'configured', exists(select 1 from restaurant.configurations where business_id = business.id),
      'publicly_active', coalesce((
        select configuration.is_publicly_active
        from restaurant.configurations as configuration where configuration.business_id = business.id
      ), false),
      'menu_count', (select count(*) from restaurant.menus where business_id = business.id),
      'published_menu_count', (
        select count(*) from restaurant.menus
        where business_id = business.id and publication_status = 'published' and lifecycle_status = 'active'
      ),
      'item_count', (select count(*) from restaurant.items where business_id = business.id)
    )
  ) into result
  from core.businesses as business
  where business.id = target_business_id;

  return result;
end;
$$;

comment on function core.get_platform_business_detail(uuid) is
  'Super-admin-only tenant inspection projection excluding proof tokens, actors, and theme payloads.';

create function core.list_platform_users(
  requested_query text default null,
  requested_page integer default 1,
  requested_page_size integer default 25
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  normalized_query text := nullif(btrim(requested_query), '');
  page_offset integer;
begin
  if not private.is_super_admin() then
    raise exception 'PLATFORM_ADMIN_REQUIRED' using errcode = '42501';
  end if;
  if not private.platform_page_is_valid(requested_page, requested_page_size) then
    raise exception 'INVALID_PLATFORM_PAGE' using errcode = '22023';
  end if;
  if normalized_query is not null and char_length(normalized_query) > 160 then
    raise exception 'INVALID_PLATFORM_QUERY' using errcode = '22023';
  end if;
  page_offset := (requested_page - 1) * requested_page_size;

  return (
    with filtered as materialized (
      select auth_user.id, auth_user.email, auth_user.created_at
      from auth.users as auth_user
      where normalized_query is null
        or auth_user.email ilike '%' || normalized_query || '%'
        or auth_user.id::text = normalized_query
    ), page_rows as (
      select * from filtered order by created_at desc, id limit requested_page_size offset page_offset
    )
    select jsonb_build_object(
      'page', requested_page,
      'page_size', requested_page_size,
      'total', (select count(*) from filtered),
      'items', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', auth_user.id,
          'email', auth_user.email,
          'created_at', auth_user.created_at,
          'is_super_admin', exists(
            select 1 from private.super_admins as administrator
            where administrator.user_id = auth_user.id and administrator.revoked_at is null
          ),
          'business_count', (
            select count(distinct membership.business_id)
            from core.memberships as membership where membership.user_id = auth_user.id
          ),
          'active_membership_count', (
            select count(*) from core.memberships as membership
            where membership.user_id = auth_user.id and membership.status = 'active'
          ),
          'memberships', coalesce((
            select jsonb_agg(jsonb_build_object(
              'id', membership.id,
              'business_id', business.id,
              'business_slug', business.slug,
              'business_name', business.display_name,
              'status', membership.status,
              'permission_keys', coalesce((
                select jsonb_agg(permission.permission_key order by permission.permission_key)
                from core.membership_permissions as permission
                where permission.membership_id = membership.id
                  and permission.business_id = membership.business_id
                  and permission.location_id is null
              ), '[]'::jsonb)
            ) order by business.display_name, business.id)
            from core.memberships as membership
            join core.businesses as business on business.id = membership.business_id
            where membership.user_id = auth_user.id
          ), '[]'::jsonb)
        ) order by auth_user.created_at desc, auth_user.id)
        from page_rows as auth_user
      ), '[]'::jsonb)
    )
  );
end;
$$;

comment on function core.list_platform_users(text, integer, integer) is
  'Super-admin-only allowlisted Auth identity and tenant-membership projection.';

create function core.list_platform_super_admins()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_super_admin() then
    raise exception 'PLATFORM_ADMIN_REQUIRED' using errcode = '42501';
  end if;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'user_id', administrator.user_id,
      'email', auth_user.email,
      'granted_at', administrator.granted_at,
      'revoked_at', administrator.revoked_at,
      'state', case when administrator.revoked_at is null then 'active' else 'revoked' end
    ) order by (administrator.revoked_at is null) desc, administrator.granted_at, administrator.user_id)
    from private.super_admins as administrator
    join auth.users as auth_user on auth_user.id = administrator.user_id
  ), '[]'::jsonb);
end;
$$;

comment on function core.list_platform_super_admins() is
  'Read-only super-admin roster with allowlisted identity fields; promotion and revocation remain operational.';

create function core.list_platform_modules()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_super_admin() then
    raise exception 'PLATFORM_ADMIN_REQUIRED' using errcode = '42501';
  end if;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'key', module.key,
      'display_name', module.display_name,
      'description', module.description,
      'is_available', module.is_available,
      'sort_order', module.sort_order,
      'enabled_business_count', (
        select count(*) from core.business_modules as state
        where state.module_key = module.key and state.is_enabled
      ),
      'effective_business_count', (
        select count(*)
        from core.business_modules as state
        join core.businesses as business on business.id = state.business_id
        where state.module_key = module.key
          and state.is_enabled and module.is_available and business.status = 'active'
      )
    ) order by module.sort_order, module.key)
    from core.modules as module
  ), '[]'::jsonb);
end;
$$;

create function core.list_platform_templates()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_super_admin() then
    raise exception 'PLATFORM_ADMIN_REQUIRED' using errcode = '42501';
  end if;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'key', template.key,
      'module_key', template.module_key,
      'display_name', template.display_name,
      'description', template.description,
      'is_available', template.is_available,
      'is_default', template.is_default,
      'sort_order', template.sort_order,
      'template_version', template.template_version,
      'theme_schema_version', template.theme_schema_version,
      'selected_business_count', (
        select count(*) from core.business_visual_settings as setting
        where setting.module_key = template.module_key and setting.template_key = template.key
      )
    ) order by template.module_key, template.sort_order, template.key)
    from core.templates as template
  ), '[]'::jsonb);
end;
$$;

comment on function core.list_platform_modules() is
  'Read-only platform module registry with tenant adoption counts.';
comment on function core.list_platform_templates() is
  'Read-only template registry without theme documents or tenant overrides.';

create function core.list_platform_domains(
  requested_query text default null,
  requested_ownership_status text default null,
  requested_routing_status text default null,
  requested_module_key text default null,
  requested_primary boolean default null,
  requested_page integer default 1,
  requested_page_size integer default 25
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  normalized_query text := nullif(btrim(requested_query), '');
  normalized_ownership_status text := nullif(btrim(requested_ownership_status), '');
  normalized_routing_status text := nullif(btrim(requested_routing_status), '');
  normalized_module_key text := nullif(btrim(requested_module_key), '');
  page_offset integer;
begin
  if not private.is_super_admin() then
    raise exception 'PLATFORM_ADMIN_REQUIRED' using errcode = '42501';
  end if;
  if not private.platform_page_is_valid(requested_page, requested_page_size) then
    raise exception 'INVALID_PLATFORM_PAGE' using errcode = '22023';
  end if;
  if normalized_query is not null and char_length(normalized_query) > 253 then
    raise exception 'INVALID_PLATFORM_QUERY' using errcode = '22023';
  end if;
  if normalized_ownership_status is not null
    and normalized_ownership_status not in ('pending', 'verified', 'failed', 'disabled') then
    raise exception 'INVALID_DOMAIN_STATUS_FILTER' using errcode = '22023';
  end if;
  if normalized_routing_status is not null
    and normalized_routing_status not in ('unconfigured', 'provisioning', 'live', 'failed', 'disconnected') then
    raise exception 'INVALID_ROUTING_STATUS_FILTER' using errcode = '22023';
  end if;
  if normalized_module_key is not null and not exists (
    select 1 from core.modules where key = normalized_module_key
  ) then
    raise exception 'INVALID_MODULE_FILTER' using errcode = '22023';
  end if;
  page_offset := (requested_page - 1) * requested_page_size;

  return (
    with filtered as materialized (
      select domain.*, business.slug as business_slug, business.display_name as business_name
      from core.business_domains as domain
      join core.businesses as business on business.id = domain.business_id
      where (normalized_query is null
        or domain.hostname ilike '%' || normalized_query || '%'
        or business.slug ilike '%' || normalized_query || '%'
        or business.display_name ilike '%' || normalized_query || '%')
        and (normalized_ownership_status is null or domain.status::text = normalized_ownership_status)
        and (normalized_routing_status is null or domain.routing_status::text = normalized_routing_status)
        and (normalized_module_key is null or domain.target_module_key = normalized_module_key)
        and (requested_primary is null or domain.is_primary = requested_primary)
    ), page_rows as (
      select * from filtered order by created_at desc, id limit requested_page_size offset page_offset
    )
    select jsonb_build_object(
      'page', requested_page,
      'page_size', requested_page_size,
      'total', (select count(*) from filtered),
      'items', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', domain.id,
          'business_id', domain.business_id,
          'business_slug', domain.business_slug,
          'business_name', domain.business_name,
          'hostname', domain.hostname,
          'ownership_status', domain.status,
          'routing_status', domain.routing_status,
          'target_module_key', domain.target_module_key,
          'is_primary', domain.is_primary,
          'verification_checked_at', domain.verification_checked_at,
          'verified_at', domain.verified_at,
          'routing_checked_at', domain.routing_checked_at,
          'routing_live_at', domain.routing_live_at,
          'created_at', domain.created_at,
          'updated_at', domain.updated_at
        ) order by domain.created_at desc, domain.id)
        from page_rows as domain
      ), '[]'::jsonb)
    )
  );
end;
$$;

comment on function core.list_platform_domains(text, text, text, text, boolean, integer, integer) is
  'Paginated global domain operations projection excluding ownership proof and provider payloads.';

create function core.list_platform_audit_events(
  requested_business_id uuid default null,
  requested_actor_query text default null,
  requested_action_query text default null,
  requested_resource_category text default null,
  requested_from timestamptz default null,
  requested_to timestamptz default null,
  requested_page integer default 1,
  requested_page_size integer default 25
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  normalized_actor_query text := nullif(btrim(requested_actor_query), '');
  normalized_action_query text := nullif(btrim(requested_action_query), '');
  normalized_resource_category text := nullif(btrim(requested_resource_category), '');
  page_offset integer;
begin
  if not private.is_super_admin() then
    raise exception 'PLATFORM_ADMIN_REQUIRED' using errcode = '42501';
  end if;
  if not private.platform_page_is_valid(requested_page, requested_page_size) then
    raise exception 'INVALID_PLATFORM_PAGE' using errcode = '22023';
  end if;
  if coalesce(char_length(normalized_actor_query), 0) > 160
    or coalesce(char_length(normalized_action_query), 0) > 120
    or coalesce(char_length(normalized_resource_category), 0) > 80
    or (requested_from is not null and requested_to is not null and requested_from > requested_to) then
    raise exception 'INVALID_AUDIT_FILTER' using errcode = '22023';
  end if;
  page_offset := (requested_page - 1) * requested_page_size;

  return (
    with filtered as materialized (
      select event.*, business.slug as business_slug, business.display_name as business_name,
        actor.email as actor_email
      from core.audit_events as event
      left join core.businesses as business on business.id = event.business_id
      left join auth.users as actor on actor.id = event.actor_user_id
      where (requested_business_id is null or event.business_id = requested_business_id)
        and (normalized_actor_query is null
          or actor.email ilike '%' || normalized_actor_query || '%'
          or event.actor_user_id::text = normalized_actor_query)
        and (normalized_action_query is null or event.action_key ilike '%' || normalized_action_query || '%')
        and (normalized_resource_category is null
          or event.entity_type ilike normalized_resource_category || '%'
          or event.action_key ilike normalized_resource_category || '.%')
        and (requested_from is null or event.occurred_at >= requested_from)
        and (requested_to is null or event.occurred_at <= requested_to)
    ), page_rows as (
      select * from filtered order by occurred_at desc, id desc limit requested_page_size offset page_offset
    )
    select jsonb_build_object(
      'page', requested_page,
      'page_size', requested_page_size,
      'total', (select count(*) from filtered),
      'items', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', event.id,
          'actor_kind', event.actor_kind,
          'actor_user_id', event.actor_user_id,
          'actor_email', event.actor_email,
          'business_id', event.business_id,
          'business_slug', event.business_slug,
          'business_name', event.business_name,
          'action_key', event.action_key,
          'entity_type', event.entity_type,
          'entity_id', event.entity_id,
          'occurred_at', event.occurred_at
        ) order by event.occurred_at desc, event.id desc)
        from page_rows as event
      ), '[]'::jsonb)
    )
  );
end;
$$;

comment on function core.list_platform_audit_events(uuid, text, text, text, timestamptz, timestamptz, integer, integer) is
  'Paginated platform audit projection; metadata is deliberately excluded from the browser contract.';

create function core.set_platform_business_status(
  target_business_id uuid,
  requested_status text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  normalized_status text := nullif(btrim(requested_status), '');
  current_business core.businesses%rowtype;
  updated_business core.businesses%rowtype;
  action_key text;
begin
  if caller_id is null or not private.is_super_admin() then
    raise exception 'PLATFORM_ADMIN_REQUIRED' using errcode = '42501';
  end if;
  if target_business_id is null or normalized_status not in ('active', 'suspended', 'archived') then
    raise exception 'INVALID_BUSINESS_STATUS' using errcode = '22023';
  end if;

  select business.* into current_business
  from core.businesses as business
  where business.id = target_business_id
  for update;

  if not found then
    raise exception 'BUSINESS_NOT_FOUND' using errcode = 'P0002';
  end if;

  if current_business.status::text = normalized_status then
    return jsonb_build_object(
      'business_id', current_business.id,
      'status', current_business.status,
      'changed', false
    );
  end if;

  if current_business.status = 'active' and normalized_status = 'suspended' then
    action_key := 'platform.business_suspended';
  elsif current_business.status = 'active' and normalized_status = 'archived' then
    action_key := 'platform.business_archived';
  elsif current_business.status in ('suspended', 'archived') and normalized_status = 'active' then
    action_key := 'platform.business_reactivated';
  else
    raise exception 'INVALID_BUSINESS_STATUS_TRANSITION' using errcode = '55000';
  end if;

  update core.businesses as business
  set status = normalized_status::core.business_status
  where business.id = target_business_id
  returning business.* into updated_business;

  insert into core.audit_events (
    actor_kind, actor_user_id, business_id, action_key, entity_type, entity_id, metadata
  ) values (
    'user', caller_id, updated_business.id, action_key, 'core.business', updated_business.id::text,
    jsonb_build_object(
      'previous_status', current_business.status,
      'new_status', updated_business.status
    )
  );

  return jsonb_build_object(
    'business_id', updated_business.id,
    'status', updated_business.status,
    'changed', true
  );
end;
$$;

comment on function core.set_platform_business_status(uuid, text) is
  'Super-admin-only lifecycle transition with explicit transition rules and atomic audit emission.';

revoke execute on function core.get_platform_overview() from public, anon, service_role;
revoke execute on function core.list_platform_businesses(text, text, text, text, text, integer, integer)
  from public, anon, service_role;
revoke execute on function core.get_platform_business_detail(uuid) from public, anon, service_role;
revoke execute on function core.list_platform_users(text, integer, integer) from public, anon, service_role;
revoke execute on function core.list_platform_super_admins() from public, anon, service_role;
revoke execute on function core.list_platform_modules() from public, anon, service_role;
revoke execute on function core.list_platform_templates() from public, anon, service_role;
revoke execute on function core.list_platform_domains(text, text, text, text, boolean, integer, integer)
  from public, anon, service_role;
revoke execute on function core.list_platform_audit_events(uuid, text, text, text, timestamptz, timestamptz, integer, integer)
  from public, anon, service_role;
revoke execute on function core.set_platform_business_status(uuid, text)
  from public, anon, service_role;

grant execute on function core.get_platform_overview() to authenticated;
grant execute on function core.list_platform_businesses(text, text, text, text, text, integer, integer)
  to authenticated;
grant execute on function core.get_platform_business_detail(uuid) to authenticated;
grant execute on function core.list_platform_users(text, integer, integer) to authenticated;
grant execute on function core.list_platform_super_admins() to authenticated;
grant execute on function core.list_platform_modules() to authenticated;
grant execute on function core.list_platform_templates() to authenticated;
grant execute on function core.list_platform_domains(text, text, text, text, boolean, integer, integer)
  to authenticated;
grant execute on function core.list_platform_audit_events(uuid, text, text, text, timestamptz, timestamptz, integer, integer)
  to authenticated;
grant execute on function core.set_platform_business_status(uuid, text)
  to authenticated;
