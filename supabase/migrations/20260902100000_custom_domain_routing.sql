create type core.domain_routing_status as enum (
  'unconfigured',
  'provisioning',
  'live',
  'failed',
  'disconnected'
);

alter table core.business_domains
  add column target_module_key text references core.modules (key)
    on update cascade on delete restrict,
  add column routing_status core.domain_routing_status not null default 'unconfigured',
  add column routing_checked_at timestamptz,
  add column routing_live_at timestamptz;

-- Phase 6 claims did not identify an engine or deployment. Preserve ownership, but
-- conservatively remove the old business-wide primary marker until an explicit
-- target has been connected and attested live.
update core.business_domains
set is_primary = false
where is_primary;

drop index core.business_domains_one_primary_per_business_idx;
alter table core.business_domains
  drop constraint business_domains_primary_check,
  add constraint business_domains_routing_state_check check (
    (
      routing_status = 'live'
      and status = 'verified'
      and target_module_key is not null
      and routing_checked_at is not null
      and routing_live_at is not null
    )
    or (
      routing_status <> 'live'
      and routing_live_at is null
    )
  ),
  add constraint business_domains_primary_check check (
    not is_primary
    or (
      status = 'verified'
      and routing_status = 'live'
      and target_module_key is not null
    )
  );

create unique index business_domains_one_primary_per_target_idx
  on core.business_domains (business_id, target_module_key)
  where is_primary and target_module_key is not null;

create index business_domains_public_routing_idx
  on core.business_domains (hostname, target_module_key)
  where status = 'verified' and routing_status = 'live';

comment on column core.business_domains.target_module_key is
  'Explicit public capability destination. A null target is intentionally unroutable.';
comment on column core.business_domains.routing_status is
  'Deployment routing lifecycle, independent from Phase 6 DNS ownership verification.';
comment on column core.business_domains.routing_checked_at is
  'Last trusted provider-attestation time; it does not represent ownership verification.';
comment on column core.business_domains.routing_live_at is
  'Time the trusted provider boundary most recently attested this hostname live.';
comment on index core.business_domains_one_primary_per_target_idx is
  'At most one primary live custom hostname per business and public capability.';

create function core.set_business_domain_target(
  target_business_id uuid,
  target_domain_id uuid,
  requested_module_key text
)
returns setof core.business_domains
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  normalized_module_key text := btrim(requested_module_key);
  current_domain core.business_domains%rowtype;
  updated_domain core.business_domains%rowtype;
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
    join core.businesses as business
      on business.id = domain.business_id
      and business.status = 'active'
    where domain.business_id = target_business_id
      and domain.id = target_domain_id
    for update of domain;

  if not found then
    raise exception 'BUSINESS_DOMAIN_ACCESS_DENIED' using errcode = '42501';
  end if;

  if current_domain.status <> 'verified' then
    raise exception 'DOMAIN_MUST_BE_VERIFIED' using errcode = '55000';
  end if;

  if normalized_module_key is null
    or normalized_module_key !~ '^[a-z][a-z0-9_]*$'
    or not exists (
      select 1
      from core.modules as module
      join core.business_modules as state
        on state.business_id = target_business_id
        and state.module_key = module.key
        and state.is_enabled
      where module.key = normalized_module_key
        and module.is_available
    ) then
    raise exception 'DOMAIN_TARGET_UNAVAILABLE' using errcode = '55000';
  end if;

  if current_domain.target_module_key is not distinct from normalized_module_key then
    return next current_domain;
    return;
  end if;

  update core.business_domains as domain
    set target_module_key = normalized_module_key,
        routing_status = 'unconfigured',
        routing_checked_at = null,
        routing_live_at = null,
        is_primary = false
    where domain.id = target_domain_id
    returning domain.* into updated_domain;

  insert into core.audit_events (
    actor_kind, actor_user_id, business_id, action_key,
    entity_type, entity_id, metadata
  ) values (
    'user', caller_id, target_business_id, 'business.domain_target_changed',
    'core.business_domain', target_domain_id::text,
    jsonb_build_object(
      'hostname', updated_domain.hostname,
      'previous_module_key', current_domain.target_module_key,
      'new_module_key', updated_domain.target_module_key
    )
  );

  return next updated_domain;
end;
$$;

create function core.begin_business_domain_routing(
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
  updated_domain core.business_domains%rowtype;
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
    join core.businesses as business
      on business.id = domain.business_id
      and business.status = 'active'
    join core.modules as module
      on module.key = domain.target_module_key
      and module.is_available
    join core.business_modules as state
      on state.business_id = domain.business_id
      and state.module_key = domain.target_module_key
      and state.is_enabled
    where domain.business_id = target_business_id
      and domain.id = target_domain_id
    for update of domain;

  if not found then
    raise exception 'DOMAIN_ROUTING_NOT_ALLOWED' using errcode = '55000';
  end if;

  if current_domain.status <> 'verified' then
    raise exception 'DOMAIN_MUST_BE_VERIFIED' using errcode = '55000';
  end if;

  if current_domain.routing_status = 'live' then
    return next current_domain;
    return;
  end if;

  update core.business_domains as domain
    set routing_status = 'provisioning',
        routing_checked_at = null,
        routing_live_at = null,
        is_primary = false
    where domain.id = target_domain_id
    returning domain.* into updated_domain;

  if current_domain.routing_status <> 'provisioning' then
    insert into core.audit_events (
      actor_kind, actor_user_id, business_id, action_key,
      entity_type, entity_id, metadata
    ) values (
      'user', caller_id, target_business_id, 'business.domain_connection_requested',
      'core.business_domain', target_domain_id::text,
      jsonb_build_object(
        'hostname', updated_domain.hostname,
        'module_key', updated_domain.target_module_key,
        'previous_routing_status', current_domain.routing_status::text
      )
    );
  end if;

  return next updated_domain;
end;
$$;

create function core.record_business_domain_routing_attestation(
  target_domain_id uuid,
  requesting_user_id uuid,
  attested_status core.domain_routing_status
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
  event_key text;
begin
  if requesting_user_id is null
    or attested_status not in ('provisioning', 'live', 'failed') then
    raise exception 'INVALID_DOMAIN_ROUTING_ATTESTATION' using errcode = '22023';
  end if;

  select domain.*
    into current_domain
    from core.business_domains as domain
    join core.businesses as business
      on business.id = domain.business_id
      and business.status = 'active'
    where domain.id = target_domain_id
    for update of domain;

  if not found then
    raise exception 'BUSINESS_DOMAIN_NOT_FOUND' using errcode = '22023';
  end if;

  select
    exists (
      select 1 from private.super_admins as super_admin
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
    ) into user_is_authorized;

  if not user_is_authorized then
    raise exception 'DOMAINS_MANAGE_REQUIRED' using errcode = '42501';
  end if;

  if current_domain.status <> 'verified'
    or current_domain.target_module_key is null
    or current_domain.routing_status not in ('provisioning', 'failed', 'live') then
    raise exception 'DOMAIN_ROUTING_ATTESTATION_STALE' using errcode = '55000';
  end if;

  if attested_status = 'live' and not exists (
    select 1
    from core.modules as module
    join core.business_modules as state
      on state.business_id = current_domain.business_id
      and state.module_key = module.key
      and state.is_enabled
    where module.key = current_domain.target_module_key
      and module.is_available
  ) then
    raise exception 'DOMAIN_TARGET_UNAVAILABLE' using errcode = '55000';
  end if;

  update core.business_domains as domain
    set routing_status = attested_status,
        routing_checked_at = now(),
        routing_live_at = case when attested_status = 'live' then now() else null end,
        is_primary = case when attested_status = 'live' then domain.is_primary else false end
    where domain.id = target_domain_id
    returning domain.* into updated_domain;

  if current_domain.routing_status is distinct from updated_domain.routing_status then
    event_key := case updated_domain.routing_status
      when 'live' then 'business.domain_routing_activated'
      when 'failed' then 'business.domain_routing_failed'
      else 'business.domain_routing_checked'
    end;

    insert into core.audit_events (
      actor_kind, actor_user_id, business_id, action_key,
      entity_type, entity_id, metadata
    ) values (
      'user', requesting_user_id, current_domain.business_id, event_key,
      'core.business_domain', target_domain_id::text,
      jsonb_build_object(
        'hostname', current_domain.hostname,
        'module_key', current_domain.target_module_key,
        'previous_routing_status', current_domain.routing_status::text,
        'new_routing_status', updated_domain.routing_status::text
      )
    );
  end if;

  return next updated_domain;
end;
$$;

comment on function core.record_business_domain_routing_attestation(uuid, uuid, core.domain_routing_status) is
  'Service-only provider attestation. It rechecks the initiating user and accepts only a narrow routing outcome, never arbitrary provider payloads.';

create function core.disconnect_business_domain_routing(
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
  updated_domain core.business_domains%rowtype;
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
    join core.businesses as business
      on business.id = domain.business_id
      and business.status = 'active'
    where domain.business_id = target_business_id
      and domain.id = target_domain_id
    for update of domain;

  if not found then
    raise exception 'BUSINESS_DOMAIN_ACCESS_DENIED' using errcode = '42501';
  end if;

  if current_domain.routing_status = 'disconnected' then
    return next current_domain;
    return;
  end if;

  update core.business_domains as domain
    set routing_status = 'disconnected',
        routing_checked_at = now(),
        routing_live_at = null,
        is_primary = false
    where domain.id = target_domain_id
    returning domain.* into updated_domain;

  insert into core.audit_events (
    actor_kind, actor_user_id, business_id, action_key,
    entity_type, entity_id, metadata
  ) values (
    'user', caller_id, target_business_id, 'business.domain_routing_disconnected',
    'core.business_domain', target_domain_id::text,
    jsonb_build_object(
      'hostname', current_domain.hostname,
      'module_key', current_domain.target_module_key,
      'previous_routing_status', current_domain.routing_status::text
    )
  );

  return next updated_domain;
end;
$$;

create or replace function core.restart_business_domain_verification(
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
  if caller_id is null then raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501'; end if;
  if not private.has_permission(target_business_id, 'domains.manage') then
    raise exception 'DOMAINS_MANAGE_REQUIRED' using errcode = '42501';
  end if;

  select domain.* into current_domain
  from core.business_domains as domain
  join core.businesses as business on business.id = domain.business_id
  where domain.business_id = target_business_id
    and domain.id = target_domain_id
    and business.status = 'active'
  for update of domain;
  if not found then raise exception 'BUSINESS_DOMAIN_ACCESS_DENIED' using errcode = '42501'; end if;

  update core.business_domains as domain
  set status = 'pending',
      verification_token = encode(extensions.gen_random_bytes(32), 'hex'),
      verification_checked_at = null,
      verified_at = null,
      routing_status = 'unconfigured',
      routing_checked_at = null,
      routing_live_at = null,
      is_primary = false
  where domain.id = target_domain_id
  returning domain.* into restarted_domain;

  insert into core.audit_events (
    actor_kind, actor_user_id, business_id, action_key, entity_type, entity_id, metadata
  ) values (
    'user', caller_id, target_business_id, 'business.domain_verification_restarted',
    'core.business_domain', target_domain_id::text,
    jsonb_build_object('hostname', restarted_domain.hostname, 'previous_status', current_domain.status::text)
  );
  return next restarted_domain;
end;
$$;

create or replace function core.record_business_domain_verification(
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
  event_key text;
begin
  if requesting_user_id is null or verification_succeeded is null then
    raise exception 'INVALID_DOMAIN_VERIFICATION_ATTESTATION' using errcode = '22023';
  end if;

  select domain.* into current_domain
  from core.business_domains as domain
  join core.businesses as business on business.id = domain.business_id
  where domain.id = target_domain_id and business.status = 'active'
  for update of domain;
  if not found then
    if exists (select 1 from core.business_domains as domain where domain.id = target_domain_id) then
      raise exception 'BUSINESS_DOMAINS_NOT_ACTIVE' using errcode = '55000';
    end if;
    raise exception 'BUSINESS_DOMAIN_NOT_FOUND' using errcode = '22023';
  end if;

  select exists (
    select 1 from private.super_admins as super_admin
    where super_admin.user_id = requesting_user_id and super_admin.revoked_at is null
  ) or exists (
    select 1 from core.memberships as membership
    join core.membership_permissions as assignment
      on assignment.membership_id = membership.id
      and assignment.business_id = membership.business_id
    where membership.user_id = requesting_user_id
      and membership.business_id = current_domain.business_id
      and membership.status = 'active'
      and assignment.permission_key = 'domains.manage'
      and assignment.location_id is null
  ) into user_is_authorized;

  if not user_is_authorized then raise exception 'DOMAINS_MANAGE_REQUIRED' using errcode = '42501'; end if;
  if current_domain.status = 'disabled' then raise exception 'BUSINESS_DOMAIN_DISABLED' using errcode = '55000'; end if;

  update core.business_domains as domain
  set status = case when verification_succeeded then 'verified'::core.domain_status else 'failed'::core.domain_status end,
      verification_checked_at = now(),
      verified_at = case when verification_succeeded then now() else null end,
      routing_status = case when verification_succeeded then domain.routing_status else 'unconfigured'::core.domain_routing_status end,
      routing_checked_at = case when verification_succeeded then domain.routing_checked_at else null end,
      routing_live_at = case when verification_succeeded then domain.routing_live_at else null end,
      is_primary = case when verification_succeeded then domain.is_primary else false end
  where domain.id = target_domain_id
  returning domain.* into updated_domain;

  event_key := case when verification_succeeded then 'business.domain_verified' else 'business.domain_verification_failed' end;
  if current_domain.status is distinct from updated_domain.status then
    insert into core.audit_events (
      actor_kind, actor_user_id, business_id, action_key, entity_type, entity_id, metadata
    ) values (
      'user', requesting_user_id, current_domain.business_id, event_key,
      'core.business_domain', target_domain_id::text,
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

create or replace function core.set_business_domain_primary(
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
  if caller_id is null then raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501'; end if;
  if not private.has_permission(target_business_id, 'domains.manage') then
    raise exception 'DOMAINS_MANAGE_REQUIRED' using errcode = '42501';
  end if;

  perform 1 from core.businesses as business
  where business.id = target_business_id and business.status = 'active' for update;
  if not found then raise exception 'BUSINESS_DOMAINS_NOT_ACTIVE' using errcode = '55000'; end if;

  select domain.* into current_domain
  from core.business_domains as domain
  where domain.business_id = target_business_id and domain.id = target_domain_id
  for update;
  if not found then raise exception 'BUSINESS_DOMAIN_ACCESS_DENIED' using errcode = '42501'; end if;

  if current_domain.status <> 'verified'
    or current_domain.routing_status <> 'live'
    or current_domain.target_module_key is null then
    raise exception 'DOMAIN_MUST_BE_LIVE' using errcode = '55000';
  end if;
  if current_domain.is_primary then return next current_domain; return; end if;

  select domain.hostname into current_primary_hostname
  from core.business_domains as domain
  where domain.business_id = target_business_id
    and domain.target_module_key = current_domain.target_module_key
    and domain.is_primary;

  update core.business_domains as domain set is_primary = false
  where domain.business_id = target_business_id
    and domain.target_module_key = current_domain.target_module_key
    and domain.is_primary;

  update core.business_domains as domain set is_primary = true
  where domain.id = target_domain_id returning domain.* into updated_domain;

  insert into core.audit_events (
    actor_kind, actor_user_id, business_id, action_key, entity_type, entity_id, metadata
  ) values (
    'user', caller_id, target_business_id, 'business.domain_primary_changed',
    'core.business_domain', target_domain_id::text,
    jsonb_build_object(
      'hostname', updated_domain.hostname,
      'module_key', updated_domain.target_module_key,
      'previous_hostname', current_primary_hostname
    )
  );
  return next updated_domain;
end;
$$;

create or replace function core.disable_business_domain(
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
  if caller_id is null then raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501'; end if;
  if not private.has_permission(target_business_id, 'domains.manage') then
    raise exception 'DOMAINS_MANAGE_REQUIRED' using errcode = '42501';
  end if;

  select domain.* into current_domain
  from core.business_domains as domain
  join core.businesses as business on business.id = domain.business_id
  where domain.business_id = target_business_id
    and domain.id = target_domain_id
    and business.status = 'active'
  for update of domain;
  if not found then raise exception 'BUSINESS_DOMAIN_ACCESS_DENIED' using errcode = '42501'; end if;
  if current_domain.status = 'disabled' then return next current_domain; return; end if;

  update core.business_domains as domain
  set status = 'disabled', verified_at = null,
      routing_status = 'disconnected', routing_checked_at = now(),
      routing_live_at = null, is_primary = false
  where domain.id = target_domain_id returning domain.* into disabled_domain;

  insert into core.audit_events (
    actor_kind, actor_user_id, business_id, action_key, entity_type, entity_id, metadata
  ) values (
    'user', caller_id, target_business_id, 'business.domain_disabled',
    'core.business_domain', target_domain_id::text,
    jsonb_build_object(
      'hostname', current_domain.hostname,
      'previous_status', current_domain.status::text,
      'previous_routing_status', current_domain.routing_status::text,
      'was_primary', current_domain.is_primary
    )
  );
  return next disabled_domain;
end;
$$;

create function public.resolve_public_domain(requested_hostname text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with candidate as (
    select
      domain.business_id,
      domain.hostname,
      domain.target_module_key,
      domain.is_primary,
      business.slug as business_slug
    from core.business_domains as domain
    join core.businesses as business
      on business.id = domain.business_id
      and business.status = 'active'
    join core.modules as module
      on module.key = domain.target_module_key
      and module.is_available
    join core.business_modules as state
      on state.business_id = domain.business_id
      and state.module_key = domain.target_module_key
      and state.is_enabled
    where requested_hostname is not null
      and requested_hostname = lower(btrim(requested_hostname))
      and requested_hostname !~ '[,:/\\[:space:]]'
      and requested_hostname ~ '^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?[.])+[a-z](?:[a-z0-9-]{0,61}[a-z0-9])?$'
      and not private.is_reserved_darb_hostname(requested_hostname)
      and domain.hostname = requested_hostname
      and domain.status = 'verified'
      and domain.routing_status = 'live'
      and domain.target_module_key = 'restaurant'
  )
  select jsonb_build_object(
    'hostname', candidate.hostname,
    'businessSlug', candidate.business_slug,
    'targetModuleKey', candidate.target_module_key,
    'isPrimary', candidate.is_primary,
    'primaryHostname', (
      select primary_domain.hostname
      from core.business_domains as primary_domain
      where primary_domain.business_id = candidate.business_id
        and primary_domain.target_module_key = candidate.target_module_key
        and primary_domain.status = 'verified'
        and primary_domain.routing_status = 'live'
        and primary_domain.is_primary
    )
  )
  from candidate;
$$;

create function public.resolve_public_restaurant_primary_domain(requested_business_slug text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select domain.hostname
  from core.businesses as business
  join core.business_modules as state
    on state.business_id = business.id
    and state.module_key = 'restaurant'
    and state.is_enabled
  join core.modules as module
    on module.key = state.module_key
    and module.is_available
  join core.business_domains as domain
    on domain.business_id = business.id
    and domain.target_module_key = 'restaurant'
    and domain.status = 'verified'
    and domain.routing_status = 'live'
    and domain.is_primary
  where requested_business_slug is not null
    and requested_business_slug = lower(btrim(requested_business_slug))
    and requested_business_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    and business.slug = requested_business_slug
    and business.status = 'active';
$$;

comment on function public.resolve_public_domain(text) is
  'Anonymous-safe exact-host resolver. Returns only a routable Restaurant target and canonical hostname; ownership tokens, UUIDs, and provider detail remain private.';
comment on function public.resolve_public_restaurant_primary_domain(text) is
  'Anonymous-safe canonical-origin lookup for the existing platform Restaurant route.';

revoke execute on function core.set_business_domain_target(uuid, uuid, text)
  from public, anon, authenticated, service_role;
revoke execute on function core.begin_business_domain_routing(uuid, uuid)
  from public, anon, authenticated, service_role;
revoke execute on function core.record_business_domain_routing_attestation(uuid, uuid, core.domain_routing_status)
  from public, anon, authenticated, service_role;
revoke execute on function core.disconnect_business_domain_routing(uuid, uuid)
  from public, anon, authenticated, service_role;
revoke execute on function public.resolve_public_domain(text)
  from public, anon, authenticated, service_role;
revoke execute on function public.resolve_public_restaurant_primary_domain(text)
  from public, anon, authenticated, service_role;

grant execute on function core.set_business_domain_target(uuid, uuid, text) to authenticated;
grant execute on function core.begin_business_domain_routing(uuid, uuid) to authenticated;
grant execute on function core.disconnect_business_domain_routing(uuid, uuid) to authenticated;
grant execute on function core.record_business_domain_routing_attestation(uuid, uuid, core.domain_routing_status)
  to service_role;
grant execute on function public.resolve_public_domain(text) to anon, authenticated;
grant execute on function public.resolve_public_restaurant_primary_domain(text) to anon, authenticated;
