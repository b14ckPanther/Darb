alter table core.modules
  add column display_name text,
  add column sort_order integer not null default 0;

update core.modules
set display_name = case key
  when 'restaurant' then 'Restaurant'
  when 'booking' then 'Booking'
  when 'pages' then 'Pages'
  when 'commerce' then 'Commerce'
end,
description = case key
  when 'restaurant' then 'Capability state reserved for future restaurant operations.'
  when 'booking' then 'Capability state reserved for future bookings and appointments.'
  when 'pages' then 'Capability state reserved for future managed pages and publishing.'
  when 'commerce' then 'Capability state reserved for future commerce operations.'
end,
sort_order = case key
  when 'restaurant' then 10
  when 'booking' then 20
  when 'pages' then 30
  when 'commerce' then 40
end
where key in ('restaurant', 'booking', 'pages', 'commerce');

alter table core.modules
  alter column display_name set not null,
  add constraint modules_display_name_check check (
    char_length(btrim(display_name)) between 1 and 80
  ),
  add constraint modules_sort_order_check check (sort_order >= 0);

comment on column core.modules.display_name is
  'Platform-controlled administrative label. Localization is intentionally deferred.';
comment on column core.modules.is_available is
  'Whether the platform permits new enablement. Existing tenant state is retained when false.';
comment on column core.modules.sort_order is
  'Stable platform-controlled ordering hint for administrative surfaces.';

alter table core.business_modules
  alter column is_enabled set default false;

comment on table core.business_modules is
  'Per-business administrative capability state. An absent row is disabled; billing and engine configuration are separate.';

revoke insert (business_id, module_key, is_enabled, updated_by)
  on core.business_modules from authenticated;
revoke update (is_enabled, updated_by)
  on core.business_modules from authenticated;

drop function core.current_user_business_access(uuid);

create function core.current_user_business_access(target_business_id uuid)
returns table (
  can_manage_business boolean,
  can_read_all_locations boolean,
  can_manage_all_locations boolean,
  can_manage_modules boolean,
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
    private.has_permission(target_business_id, 'audit.view'),
    private.is_super_admin();
$$;

comment on function core.current_user_business_access(uuid) is
  'Returns the small database-authoritative access snapshot required by implemented admin navigation.';

create function core.set_business_module_enabled(
  target_business_id uuid,
  target_module_key text,
  requested_enabled boolean
)
returns table (
  module_key text,
  is_enabled boolean,
  changed boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  normalized_module_key text := btrim(target_module_key);
  current_business_status core.business_status;
  module_is_available boolean;
  previous_enabled boolean := false;
  state_row_exists boolean := false;
  state_changed boolean := false;
begin
  if caller_id is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;

  if requested_enabled is null then
    raise exception 'INVALID_MODULE_STATE' using errcode = '22023';
  end if;

  if normalized_module_key is null
    or normalized_module_key !~ '^[a-z][a-z0-9_]*$' then
    raise exception 'MODULE_NOT_FOUND' using errcode = '22023';
  end if;

  if not private.has_permission(target_business_id, 'modules.manage') then
    raise exception 'MODULES_MANAGE_REQUIRED' using errcode = '42501';
  end if;

  select business.status
    into current_business_status
    from core.businesses as business
    where business.id = target_business_id
    for update;

  if not found then
    raise exception 'BUSINESS_ACCESS_DENIED' using errcode = '42501';
  end if;

  if current_business_status = 'archived' then
    raise exception 'BUSINESS_MODULES_ARCHIVED' using errcode = '55000';
  end if;

  if current_business_status = 'suspended' and not private.is_super_admin() then
    raise exception 'BUSINESS_MODULES_SUSPENDED' using errcode = '42501';
  end if;

  select module.is_available
    into module_is_available
    from core.modules as module
    where module.key = normalized_module_key;

  if not found then
    raise exception 'MODULE_NOT_FOUND' using errcode = '22023';
  end if;

  select state.is_enabled
    into previous_enabled
    from core.business_modules as state
    where state.business_id = target_business_id
      and state.module_key = normalized_module_key
    for update;

  state_row_exists := found;
  previous_enabled := coalesce(previous_enabled, false);

  if requested_enabled and not previous_enabled and not module_is_available then
    raise exception 'MODULE_UNAVAILABLE' using errcode = '55000';
  end if;

  state_changed := previous_enabled is distinct from requested_enabled;

  if not state_changed then
    return query
      select normalized_module_key, previous_enabled, false;
    return;
  end if;

  if requested_enabled then
    insert into core.business_modules (
      business_id,
      module_key,
      is_enabled,
      updated_by
    )
    values (
      target_business_id,
      normalized_module_key,
      true,
      caller_id
    )
    on conflict on constraint business_modules_pkey
    do update set
      is_enabled = excluded.is_enabled,
      updated_by = excluded.updated_by;
  elsif state_row_exists then
    update core.business_modules as state
      set is_enabled = false,
          updated_by = caller_id
      where state.business_id = target_business_id
        and state.module_key = normalized_module_key;
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
    target_business_id,
    case
      when requested_enabled then 'business.module_enabled'
      else 'business.module_disabled'
    end,
    'core.business_module',
    normalized_module_key,
    jsonb_build_object(
      'module_key', normalized_module_key,
      'previous_enabled', previous_enabled,
      'new_enabled', requested_enabled
    )
  );

  return query
    select normalized_module_key, requested_enabled, true;
end;
$$;

comment on function core.set_business_module_enabled(uuid, text, boolean) is
  'Atomically changes authorized business capability state and records an audit event; repeated requests are no-ops.';

revoke execute on function core.current_user_business_access(uuid)
  from public, anon, authenticated, service_role;
revoke execute on function core.set_business_module_enabled(uuid, text, boolean)
  from public, anon, authenticated, service_role;

grant execute on function core.current_user_business_access(uuid) to authenticated;
grant execute on function core.set_business_module_enabled(uuid, text, boolean)
  to authenticated;
