-- Platform-owned commercial authorization. Payment providers remain deliberately absent.

create type core.plan_status as enum ('active', 'archived');
create type core.commercial_assignment_source as enum ('starter', 'legacy', 'platform');
create type core.entitlement_override_decision as enum ('grant', 'deny');
create type core.initial_setup_status as enum (
  'requested', 'accepted', 'in_progress', 'completed', 'cancelled'
);

create table core.plans (
  key text primary key,
  display_name text not null,
  description text not null,
  status core.plan_status not null default 'active',
  is_available boolean not null default true,
  max_locations integer,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint plans_key_check check (key ~ '^[a-z][a-z0-9-]*$'),
  constraint plans_display_name_check check (char_length(btrim(display_name)) between 1 and 80),
  constraint plans_description_check check (char_length(btrim(description)) between 1 and 240),
  constraint plans_max_locations_check check (max_locations is null or max_locations > 0),
  constraint plans_sort_order_check check (sort_order >= 0)
);

create table core.plan_module_entitlements (
  plan_key text not null references core.plans (key) on update cascade on delete restrict,
  module_key text not null references core.modules (key) on update cascade on delete restrict,
  created_at timestamptz not null default now(),
  primary key (plan_key, module_key)
);

create table core.business_plan_assignments (
  business_id uuid primary key references core.businesses (id) on delete cascade,
  plan_key text not null references core.plans (key) on update cascade on delete restrict,
  source core.commercial_assignment_source not null,
  assigned_by uuid references auth.users (id) on delete set null,
  assigned_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table core.business_module_entitlement_overrides (
  business_id uuid not null references core.businesses (id) on delete cascade,
  module_key text not null references core.modules (key) on update cascade on delete restrict,
  decision core.entitlement_override_decision not null,
  reason text not null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (business_id, module_key),
  constraint entitlement_override_reason_check check (
    char_length(btrim(reason)) between 3 and 500
  )
);

create table core.business_initial_setup_services (
  business_id uuid primary key references core.businesses (id) on delete cascade,
  status core.initial_setup_status not null,
  requested_by uuid references auth.users (id) on delete set null,
  managed_by uuid references auth.users (id) on delete set null,
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint setup_service_completion_check check (
    (status = 'completed' and completed_at is not null)
    or (status <> 'completed' and completed_at is null)
  )
);

comment on table core.plans is
  'Platform-controlled commercial arrangements; display metadata never drives authorization.';
comment on table core.plan_module_entitlements is
  'Module capabilities included by a plan. Plan inclusion does not enable a module.';
comment on table core.business_plan_assignments is
  'One current platform-controlled commercial plan per business, independent of user identity.';
comment on table core.business_module_entitlement_overrides is
  'Explicit platform-only grant or deny decisions that take precedence over plan inclusion.';
comment on table core.business_initial_setup_services is
  'Optional Darb-assisted initial setup engagement, separate from plans and module entitlement.';

create trigger plans_set_updated_at before update on core.plans
for each row execute function private.set_updated_at();
create trigger business_plan_assignments_set_updated_at before update on core.business_plan_assignments
for each row execute function private.set_updated_at();
create trigger business_module_entitlement_overrides_set_updated_at
before update on core.business_module_entitlement_overrides
for each row execute function private.set_updated_at();
create trigger business_initial_setup_services_set_updated_at
before update on core.business_initial_setup_services
for each row execute function private.set_updated_at();

create index plan_module_entitlements_module_idx
  on core.plan_module_entitlements (module_key, plan_key);
create index business_plan_assignments_plan_idx
  on core.business_plan_assignments (plan_key, business_id);
create index business_module_entitlement_overrides_module_idx
  on core.business_module_entitlement_overrides (module_key, business_id);

insert into core.plans (key, display_name, description, is_available, sort_order)
values
  ('core-only', 'Core workspace', 'Business administration without a product engine.', true, 10),
  ('restaurant-starter', 'Restaurant Starter', 'Restaurant access with Darb core administration.', true, 20);

insert into core.plan_module_entitlements (plan_key, module_key)
values ('restaurant-starter', 'restaurant');

insert into core.business_plan_assignments (business_id, plan_key, source)
select
  business.id,
  case when exists (
    select 1 from core.business_modules as state
    where state.business_id = business.id
      and state.module_key = 'restaurant'
      and state.is_enabled
  ) then 'restaurant-starter' else 'core-only' end,
  'legacy'
from core.businesses as business;

create function private.assign_starter_business_plan()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into core.business_plan_assignments (business_id, plan_key, source, assigned_by)
  values (new.id, 'core-only', 'starter', new.created_by);
  return new;
end;
$$;

create trigger businesses_assign_starter_plan
after insert on core.businesses
for each row execute function private.assign_starter_business_plan();

revoke execute on function private.assign_starter_business_plan()
from public, anon, authenticated, service_role;

alter table core.plans enable row level security;
alter table core.plan_module_entitlements enable row level security;
alter table core.business_plan_assignments enable row level security;
alter table core.business_module_entitlement_overrides enable row level security;
alter table core.business_initial_setup_services enable row level security;

grant select on core.plans, core.plan_module_entitlements to authenticated;
revoke all on core.business_plan_assignments,
  core.business_module_entitlement_overrides,
  core.business_initial_setup_services from anon, authenticated, service_role;

create policy plans_select_authenticated on core.plans
for select to authenticated using (true);
create policy plan_module_entitlements_select_authenticated on core.plan_module_entitlements
for select to authenticated using (true);
create policy business_plan_assignments_select_members on core.business_plan_assignments
for select to authenticated using ((select private.has_active_membership(business_id)));
create policy business_module_entitlement_overrides_select_members
on core.business_module_entitlement_overrides
for select to authenticated using ((select private.has_active_membership(business_id)));
create policy business_initial_setup_services_select_members
on core.business_initial_setup_services
for select to authenticated using ((select private.has_active_membership(business_id)));

create function private.resolve_business_module_entitlement(
  target_business_id uuid,
  target_module_key text
)
returns table (is_entitled boolean, entitlement_source text, plan_key text)
language sql
stable
security definer
set search_path = ''
as $$
  with assignment as (
    select business_plan.plan_key
    from core.business_plan_assignments as business_plan
    join core.plans as plan on plan.key = business_plan.plan_key and plan.status = 'active'
    where business_plan.business_id = target_business_id
  ), decision as (
    select override.decision
    from core.business_module_entitlement_overrides as override
    where override.business_id = target_business_id
      and override.module_key = target_module_key
  )
  select
    case
      when (select decision from decision) = 'grant' then true
      when (select decision from decision) = 'deny' then false
      else exists (
        select 1 from core.plan_module_entitlements as entitlement
        where entitlement.plan_key = (select plan_key from assignment)
          and entitlement.module_key = target_module_key
      )
    end,
    case
      when (select decision from decision) = 'grant' then 'override_grant'
      when (select decision from decision) = 'deny' then 'override_deny'
      when exists (
        select 1 from core.plan_module_entitlements as entitlement
        where entitlement.plan_key = (select plan_key from assignment)
          and entitlement.module_key = target_module_key
      ) then 'plan'
      else 'none'
    end,
    (select plan_key from assignment);
$$;

create function private.business_has_effective_module_access(
  target_business_id uuid,
  target_module_key text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from core.businesses as business
    join core.business_modules as state
      on state.business_id = business.id
      and state.module_key = target_module_key
      and state.is_enabled
    join core.modules as module
      on module.key = state.module_key
      and module.is_available
    cross join lateral private.resolve_business_module_entitlement(
      business.id, target_module_key
    ) as entitlement
    where business.id = target_business_id
      and business.status = 'active'
      and entitlement.is_entitled
  );
$$;

revoke execute on function private.resolve_business_module_entitlement(uuid, text)
  from public, anon, authenticated, service_role;
revoke execute on function private.business_has_effective_module_access(uuid, text)
  from public, anon, authenticated, service_role;

create function core.get_business_module_access(target_business_id uuid)
returns table (
  module_key text,
  display_name text,
  description text,
  sort_order integer,
  platform_available boolean,
  entitled boolean,
  entitlement_source text,
  plan_key text,
  enabled boolean,
  effective boolean,
  unavailable_reason text,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not private.has_active_membership(target_business_id) then
    raise exception 'BUSINESS_ACCESS_DENIED' using errcode = '42501';
  end if;

  return query
  select
    module.key,
    module.display_name,
    module.description,
    module.sort_order,
    module.is_available,
    entitlement.is_entitled,
    entitlement.entitlement_source,
    entitlement.plan_key,
    coalesce(state.is_enabled, false),
    business.status = 'active'
      and module.is_available
      and entitlement.is_entitled
      and coalesce(state.is_enabled, false),
    case
      when business.status <> 'active' then 'business_inactive'
      when not module.is_available then 'platform_unavailable'
      when not entitlement.is_entitled then 'not_entitled'
      when not coalesce(state.is_enabled, false) then 'disabled'
      else null
    end,
    state.updated_at
  from core.businesses as business
  cross join core.modules as module
  cross join lateral private.resolve_business_module_entitlement(
    business.id, module.key
  ) as entitlement
  left join core.business_modules as state
    on state.business_id = business.id and state.module_key = module.key
  where business.id = target_business_id
  order by module.sort_order, module.key;
end;
$$;

create function core.get_business_commercial_summary(target_business_id uuid)
returns table (
  plan_key text,
  plan_display_name text,
  plan_description text,
  max_locations integer,
  current_locations bigint,
  initial_setup_status text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not private.has_active_membership(target_business_id) then
    raise exception 'BUSINESS_ACCESS_DENIED' using errcode = '42501';
  end if;

  return query
  select plan.key, plan.display_name, plan.description, plan.max_locations,
    (select count(*) from core.locations as location
      where location.business_id = target_business_id and location.status <> 'archived'),
    coalesce(setup.status::text, 'not_requested')
  from core.business_plan_assignments as assignment
  join core.plans as plan on plan.key = assignment.plan_key
  left join core.business_initial_setup_services as setup
    on setup.business_id = assignment.business_id
  where assignment.business_id = target_business_id;
end;
$$;

create or replace function core.set_business_module_enabled(
  target_business_id uuid,
  target_module_key text,
  requested_enabled boolean
)
returns table (module_key text, is_enabled boolean, changed boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  normalized_module_key text := btrim(target_module_key);
  current_business_status core.business_status;
  module_is_available boolean;
  module_is_entitled boolean;
  previous_enabled boolean := false;
  state_row_exists boolean := false;
begin
  if caller_id is null then raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501'; end if;
  if requested_enabled is null then raise exception 'INVALID_MODULE_STATE' using errcode = '22023'; end if;
  if normalized_module_key is null or normalized_module_key !~ '^[a-z][a-z0-9_]*$' then
    raise exception 'MODULE_NOT_FOUND' using errcode = '22023';
  end if;
  if not private.has_permission(target_business_id, 'modules.manage') then
    raise exception 'MODULES_MANAGE_REQUIRED' using errcode = '42501';
  end if;

  select business.status into current_business_status
  from core.businesses as business where business.id = target_business_id for update;
  if not found then raise exception 'BUSINESS_ACCESS_DENIED' using errcode = '42501'; end if;
  if current_business_status = 'archived' then raise exception 'BUSINESS_MODULES_ARCHIVED' using errcode = '55000'; end if;
  if current_business_status = 'suspended' and not private.is_super_admin() then
    raise exception 'BUSINESS_MODULES_SUSPENDED' using errcode = '42501';
  end if;

  select module.is_available into module_is_available
  from core.modules as module where module.key = normalized_module_key;
  if not found then raise exception 'MODULE_NOT_FOUND' using errcode = '22023'; end if;

  select entitlement.is_entitled into module_is_entitled
  from private.resolve_business_module_entitlement(target_business_id, normalized_module_key) as entitlement;

  select state.is_enabled into previous_enabled
  from core.business_modules as state
  where state.business_id = target_business_id and state.module_key = normalized_module_key
  for update;
  state_row_exists := found;
  previous_enabled := coalesce(previous_enabled, false);

  if requested_enabled and not previous_enabled and not module_is_available then
    raise exception 'MODULE_UNAVAILABLE' using errcode = '55000';
  end if;
  if requested_enabled and not previous_enabled and not coalesce(module_is_entitled, false) then
    raise exception 'MODULE_NOT_ENTITLED' using errcode = '42501';
  end if;
  if previous_enabled is not distinct from requested_enabled then
    return query select normalized_module_key, previous_enabled, false;
    return;
  end if;

  if requested_enabled then
    insert into core.business_modules (business_id, module_key, is_enabled, updated_by)
    values (target_business_id, normalized_module_key, true, caller_id)
    on conflict on constraint business_modules_pkey do update
      set is_enabled = excluded.is_enabled, updated_by = excluded.updated_by;
  elsif state_row_exists then
    update core.business_modules as state set is_enabled = false, updated_by = caller_id
    where state.business_id = target_business_id and state.module_key = normalized_module_key;
  end if;

  insert into core.audit_events (
    actor_kind, actor_user_id, business_id, action_key, entity_type, entity_id, metadata
  ) values (
    'user', caller_id, target_business_id,
    case when requested_enabled then 'business.module_enabled' else 'business.module_disabled' end,
    'core.business_module', normalized_module_key,
    jsonb_build_object('module_key', normalized_module_key, 'previous_enabled', previous_enabled,
      'new_enabled', requested_enabled)
  );
  return query select normalized_module_key, requested_enabled, true;
end;
$$;

create function private.enforce_business_location_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  location_limit integer;
  existing_count bigint;
begin
  if new.status = 'archived' then
    return new;
  end if;
  if tg_op = 'UPDATE'
    and old.business_id = new.business_id
    and old.status <> 'archived' then
    return new;
  end if;
  perform 1 from core.businesses where id = new.business_id for update;
  select plan.max_locations into location_limit
  from core.business_plan_assignments as assignment
  join core.plans as plan on plan.key = assignment.plan_key and plan.status = 'active'
  where assignment.business_id = new.business_id;

  if location_limit is not null then
    select count(*) into existing_count from core.locations
    where business_id = new.business_id and status <> 'archived';
    if existing_count >= location_limit then
      raise exception 'LOCATION_LIMIT_REACHED' using errcode = '55000';
    end if;
  end if;
  return new;
end;
$$;

create trigger locations_commercial_limit_guard
before insert or update of business_id, status on core.locations
for each row execute function private.enforce_business_location_limit();

revoke execute on function private.enforce_business_location_limit()
  from public, anon, authenticated, service_role;

create function core.request_business_initial_setup(target_business_id uuid)
returns table (status text, changed boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  previous_status core.initial_setup_status;
begin
  if caller_id is null or not private.has_permission(target_business_id, 'business.manage') then
    raise exception 'BUSINESS_MANAGE_REQUIRED' using errcode = '42501';
  end if;
  perform 1 from core.businesses as business
  where business.id = target_business_id and business.status = 'active' for update;
  if not found then raise exception 'BUSINESS_NOT_ACTIVE' using errcode = '55000'; end if;

  select service.status into previous_status from core.business_initial_setup_services as service
  where service.business_id = target_business_id for update;
  if found and previous_status = 'requested' then
    return query select previous_status::text, false;
    return;
  end if;
  if found and previous_status <> 'cancelled' then
    raise exception 'SETUP_SERVICE_ALREADY_MANAGED' using errcode = '55000';
  end if;

  insert into core.business_initial_setup_services (
    business_id, status, requested_by, managed_by, requested_at, completed_at
  ) values (target_business_id, 'requested', caller_id, null, now(), null)
  on conflict (business_id) do update set
    status = 'requested', requested_by = excluded.requested_by, managed_by = null,
    requested_at = excluded.requested_at, completed_at = null;
  insert into core.audit_events (
    actor_kind, actor_user_id, business_id, action_key, entity_type, entity_id, metadata
  ) values ('user', caller_id, target_business_id, 'business.initial_setup_requested',
    'core.business_initial_setup_service', target_business_id::text, '{}'::jsonb);
  return query select 'requested'::text, true;
end;
$$;

create function core.list_platform_plans()
returns table (
  plan_key text, display_name text, description text, status text, is_available boolean,
  max_locations integer, sort_order integer, assigned_businesses bigint
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_super_admin() then raise exception 'PLATFORM_ADMIN_REQUIRED' using errcode = '42501'; end if;
  return query select plan.key, plan.display_name, plan.description, plan.status::text,
    plan.is_available, plan.max_locations, plan.sort_order,
    (select count(*) from core.business_plan_assignments as assignment where assignment.plan_key = plan.key)
  from core.plans as plan order by plan.sort_order, plan.key;
end;
$$;

create function core.get_platform_business_commercial(target_business_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_super_admin() then raise exception 'PLATFORM_ADMIN_REQUIRED' using errcode = '42501'; end if;
  if not exists (select 1 from core.businesses where id = target_business_id) then return null; end if;
  return jsonb_build_object(
    'summary', (select to_jsonb(summary) from core.get_business_commercial_summary(target_business_id) as summary),
    'modules', (select coalesce(jsonb_agg(to_jsonb(access) order by access.sort_order, access.module_key), '[]'::jsonb)
      from core.get_business_module_access(target_business_id) as access),
    'overrides', (select coalesce(jsonb_agg(jsonb_build_object(
      'module_key', override.module_key, 'decision', override.decision,
      'reason', override.reason, 'updated_at', override.updated_at
    ) order by override.module_key), '[]'::jsonb)
      from core.business_module_entitlement_overrides as override
      where override.business_id = target_business_id)
  );
end;
$$;

create function core.set_platform_business_plan(target_business_id uuid, requested_plan_key text)
returns table (plan_key text, changed boolean)
language plpgsql security definer set search_path = '' as $$
declare
  caller_id uuid := auth.uid();
  normalized_plan_key text := btrim(requested_plan_key);
  previous_plan_key text;
begin
  if not private.is_super_admin() then raise exception 'PLATFORM_ADMIN_REQUIRED' using errcode = '42501'; end if;
  perform 1 from core.businesses where id = target_business_id for update;
  if not found then raise exception 'BUSINESS_NOT_FOUND' using errcode = '22023'; end if;
  perform 1 from core.plans where key = normalized_plan_key and status = 'active' and is_available;
  if not found then raise exception 'PLAN_UNAVAILABLE' using errcode = '22023'; end if;
  select assignment.plan_key into previous_plan_key from core.business_plan_assignments as assignment
  where assignment.business_id = target_business_id for update;
  if previous_plan_key = normalized_plan_key then
    return query select previous_plan_key, false; return;
  end if;
  insert into core.business_plan_assignments (business_id, plan_key, source, assigned_by)
  values (target_business_id, normalized_plan_key, 'platform', caller_id)
  on conflict (business_id) do update set plan_key = excluded.plan_key, source = excluded.source,
    assigned_by = excluded.assigned_by, assigned_at = now();
  insert into core.audit_events (
    actor_kind, actor_user_id, business_id, action_key, entity_type, entity_id, metadata
  ) values ('user', caller_id, target_business_id, 'platform.business_plan_changed',
    'core.business_plan_assignment', target_business_id::text,
    jsonb_build_object('previous_plan_key', previous_plan_key, 'new_plan_key', normalized_plan_key));
  return query select normalized_plan_key, true;
end;
$$;

create function core.set_platform_module_entitlement_override(
  target_business_id uuid, target_module_key text, requested_decision text, requested_reason text
)
returns table (decision text, changed boolean)
language plpgsql security definer set search_path = '' as $$
declare
  caller_id uuid := auth.uid();
  normalized_module_key text := btrim(target_module_key);
  normalized_decision text := nullif(btrim(requested_decision), '');
  normalized_reason text := btrim(requested_reason);
  previous_decision core.entitlement_override_decision;
  previous_reason text;
begin
  if not private.is_super_admin() then raise exception 'PLATFORM_ADMIN_REQUIRED' using errcode = '42501'; end if;
  perform 1 from core.businesses where id = target_business_id for update;
  if not found then raise exception 'BUSINESS_NOT_FOUND' using errcode = '22023'; end if;
  perform 1 from core.modules where key = normalized_module_key;
  if not found then raise exception 'MODULE_NOT_FOUND' using errcode = '22023'; end if;
  if normalized_decision is not null and normalized_decision not in ('grant', 'deny') then
    raise exception 'INVALID_OVERRIDE_DECISION' using errcode = '22023';
  end if;
  if normalized_decision is not null and char_length(normalized_reason) not between 3 and 500 then
    raise exception 'INVALID_OVERRIDE_REASON' using errcode = '22023';
  end if;
  select override.decision, override.reason into previous_decision, previous_reason
  from core.business_module_entitlement_overrides as override
  where override.business_id = target_business_id and override.module_key = normalized_module_key
  for update;
  if normalized_decision is null then
    if not found then return query select null::text, false; return; end if;
    delete from core.business_module_entitlement_overrides
    where business_id = target_business_id and module_key = normalized_module_key;
  elsif previous_decision::text = normalized_decision and previous_reason = normalized_reason then
    return query select normalized_decision, false; return;
  else
    insert into core.business_module_entitlement_overrides (
      business_id, module_key, decision, reason, updated_by
    ) values (target_business_id, normalized_module_key,
      normalized_decision::core.entitlement_override_decision, normalized_reason, caller_id)
    on conflict (business_id, module_key) do update set decision = excluded.decision,
      reason = excluded.reason, updated_by = excluded.updated_by;
  end if;
  insert into core.audit_events (
    actor_kind, actor_user_id, business_id, action_key, entity_type, entity_id, metadata
  ) values ('user', caller_id, target_business_id,
    case when normalized_decision is null then 'platform.entitlement_override_removed'
      else 'platform.entitlement_override_set' end,
    'core.business_module_entitlement_override', normalized_module_key,
    jsonb_build_object('module_key', normalized_module_key,
      'previous_decision', previous_decision, 'new_decision', normalized_decision));
  return query select normalized_decision, true;
end;
$$;

create function core.set_platform_initial_setup_status(
  target_business_id uuid, requested_status text
)
returns table (status text, changed boolean)
language plpgsql security definer set search_path = '' as $$
declare
  caller_id uuid := auth.uid();
  normalized_status text := btrim(requested_status);
  previous_status core.initial_setup_status;
begin
  if not private.is_super_admin() then raise exception 'PLATFORM_ADMIN_REQUIRED' using errcode = '42501'; end if;
  if normalized_status not in ('accepted', 'in_progress', 'completed', 'cancelled') then
    raise exception 'INVALID_SETUP_STATUS' using errcode = '22023';
  end if;
  perform 1 from core.businesses where id = target_business_id for update;
  if not found then raise exception 'BUSINESS_NOT_FOUND' using errcode = '22023'; end if;
  select service.status into previous_status from core.business_initial_setup_services as service
  where service.business_id = target_business_id for update;
  if not found then raise exception 'SETUP_SERVICE_NOT_REQUESTED' using errcode = '55000'; end if;
  if previous_status::text = normalized_status then
    return query select normalized_status, false; return;
  end if;
  if not (
    (previous_status = 'requested' and normalized_status in ('accepted', 'cancelled'))
    or (previous_status = 'accepted' and normalized_status in ('in_progress', 'cancelled'))
    or (previous_status = 'in_progress' and normalized_status in ('completed', 'cancelled'))
  ) then raise exception 'INVALID_SETUP_TRANSITION' using errcode = '55000'; end if;
  update core.business_initial_setup_services set
    status = normalized_status::core.initial_setup_status,
    managed_by = caller_id,
    completed_at = case when normalized_status = 'completed' then now() else null end
  where business_id = target_business_id;
  insert into core.audit_events (
    actor_kind, actor_user_id, business_id, action_key, entity_type, entity_id, metadata
  ) values ('user', caller_id, target_business_id, 'platform.initial_setup_status_changed',
    'core.business_initial_setup_service', target_business_id::text,
    jsonb_build_object('previous_status', previous_status, 'new_status', normalized_status));
  return query select normalized_status, true;
end;
$$;

-- New businesses begin with Core access; only the database-owned onboarding policy may upgrade it.
create or replace function core.bootstrap_first_business(
  requested_display_name text, requested_slug text, requested_default_locale text
)
returns table (
  business_id uuid, business_slug text, business_display_name text,
  business_default_locale core.locale_code, was_created boolean
)
language plpgsql security definer set search_path = '' as $$
declare
  caller_id uuid := auth.uid(); normalized_display_name text := btrim(requested_display_name);
  normalized_slug text := lower(btrim(requested_slug)); normalized_locale core.locale_code;
  existing_business core.businesses%rowtype; created_business core.businesses%rowtype;
  created_membership_id uuid; inserted_permission_count integer;
begin
  if caller_id is null then raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501'; end if;
  perform 1 from auth.users as auth_user where auth_user.id = caller_id for update;
  if not found then raise exception 'AUTHENTICATED_USER_NOT_FOUND' using errcode = '42501'; end if;
  if normalized_display_name is null or char_length(normalized_display_name) not between 1 and 160 then
    raise exception 'INVALID_BUSINESS_DISPLAY_NAME' using errcode = '22023'; end if;
  if normalized_slug is null or char_length(normalized_slug) not between 3 and 63
    or normalized_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'INVALID_BUSINESS_SLUG' using errcode = '22023'; end if;
  if requested_default_locale not in ('ar', 'he', 'en') then
    raise exception 'INVALID_DEFAULT_LOCALE' using errcode = '22023'; end if;
  normalized_locale := requested_default_locale::core.locale_code;
  select business.* into existing_business from core.memberships as membership
  join core.businesses as business on business.id = membership.business_id
  where membership.user_id = caller_id and membership.status = 'active'
  order by membership.joined_at, membership.id limit 1;
  if found then
    if existing_business.created_by = caller_id and existing_business.slug = normalized_slug
      and existing_business.display_name = normalized_display_name
      and existing_business.default_locale = normalized_locale then
      return query select existing_business.id, existing_business.slug,
        existing_business.display_name, existing_business.default_locale, false; return;
    end if;
    raise exception 'FIRST_BUSINESS_ALREADY_BOOTSTRAPPED' using errcode = 'P0001';
  end if;
  insert into core.businesses (slug, display_name, default_locale, created_by)
  values (normalized_slug, normalized_display_name, normalized_locale, caller_id)
  returning * into created_business;
  insert into core.memberships (business_id, user_id, status, created_by)
  values (created_business.id, caller_id, 'active', caller_id) returning id into created_membership_id;
  insert into core.membership_permissions (business_id, membership_id, permission_key, location_id, granted_by)
  select created_business.id, created_membership_id, owner_permission.permission_key, null, caller_id
  from (values ('business.manage'::text), ('locations.read'::text), ('locations.manage'::text),
    ('memberships.manage'::text), ('permissions.manage'::text), ('modules.manage'::text),
    ('media.manage'::text), ('domains.manage'::text), ('appearance.manage'::text),
    ('restaurant.read'::text), ('restaurant.manage'::text), ('audit.view'::text)
  ) as owner_permission(permission_key);
  get diagnostics inserted_permission_count = row_count;
  if inserted_permission_count <> 12 then
    raise exception 'OWNER_PERMISSION_BUNDLE_INCOMPLETE' using errcode = '55000'; end if;
  update core.business_plan_assignments as assignment
  set source = 'starter', assigned_by = caller_id
  where assignment.business_id = created_business.id;
  insert into core.audit_events (actor_kind, actor_user_id, business_id, action_key, entity_type, entity_id, metadata)
  values ('user', caller_id, created_business.id, 'business.created', 'core.business',
    created_business.id::text, jsonb_build_object('source', 'first_business_bootstrap'));
  return query select created_business.id, created_business.slug,
    created_business.display_name, created_business.default_locale, true;
end;
$$;

create or replace function core.complete_first_business_onboarding(
  target_business_id uuid, requested_enabled_locales text[], requested_module_key text,
  requested_create_location boolean, requested_location_name text,
  requested_location_address text, requested_location_locality text
)
returns table (
  business_id uuid, business_slug text, enabled_module_key text, location_id uuid,
  completed_at timestamptz, was_completed boolean
)
language plpgsql security definer set search_path = '' as $$
declare
  caller_id uuid := auth.uid(); current_business core.businesses%rowtype;
  normalized_module_key text := nullif(btrim(requested_module_key), '');
  normalized_location_name text := btrim(requested_location_name);
  normalized_location_address text := btrim(requested_location_address);
  normalized_location_locality text := btrim(requested_location_locality);
  created_location_id uuid; existing_module_key text; completion_time timestamptz;
begin
  if caller_id is null then raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501'; end if;
  select business.* into current_business from core.businesses as business
  where business.id = target_business_id and business.status = 'active'
    and business.created_by = caller_id and private.has_permission(business.id, 'business.manage')
  for update;
  if not found then raise exception 'ONBOARDING_BUSINESS_ACCESS_DENIED' using errcode = '42501'; end if;
  if current_business.onboarding_completed_at is not null then
    select location.id into created_location_id from core.locations as location
    where location.business_id = current_business.id order by location.created_at, location.id limit 1;
    select state.module_key into existing_module_key from core.business_modules as state
    where state.business_id = current_business.id and state.is_enabled order by state.module_key limit 1;
    return query select current_business.id, current_business.slug, existing_module_key,
      created_location_id, current_business.onboarding_completed_at, false; return;
  end if;
  if requested_enabled_locales is null or cardinality(requested_enabled_locales) not between 1 and 3
    or current_business.default_locale::text <> all(requested_enabled_locales)
    or exists (select 1 from unnest(requested_enabled_locales) as locale(value)
      where locale.value not in ('ar', 'he', 'en')) then
    raise exception 'INVALID_ONBOARDING_LOCALES' using errcode = '22023'; end if;
  if normalized_module_key is not null and normalized_module_key <> 'restaurant' then
    raise exception 'ONBOARDING_MODULE_NOT_OFFERED' using errcode = '22023'; end if;
  if normalized_module_key = 'restaurant' then
    perform 1 from core.modules where key = 'restaurant' and is_available;
    if not found then raise exception 'ONBOARDING_MODULE_UNAVAILABLE' using errcode = '22023'; end if;
    update core.business_plan_assignments as assignment
    set plan_key = 'restaurant-starter', source = 'starter',
      assigned_by = caller_id, assigned_at = now()
    where assignment.business_id = current_business.id;
  end if;
  if coalesce(requested_create_location, false) then
    if normalized_location_name is null or char_length(normalized_location_name) not between 1 and 160 then
      raise exception 'INVALID_LOCATION_DISPLAY_NAME' using errcode = '22023'; end if;
    select created.id into created_location_id from core.create_location(current_business.id,
      normalized_location_name, normalized_location_address, normalized_location_locality,
      '', 'IL', '') as created;
  elsif normalized_module_key = 'restaurant' then
    raise exception 'RESTAURANT_ONBOARDING_LOCATION_REQUIRED' using errcode = '22023';
  end if;
  perform core.update_business_locales(current_business.id,
    current_business.default_locale::text, requested_enabled_locales);
  if normalized_module_key is not null then
    perform core.set_business_module_enabled(current_business.id, normalized_module_key, true);
  end if;
  completion_time := clock_timestamp();
  update core.businesses set onboarding_completed_at = completion_time where id = current_business.id;
  insert into core.audit_events (actor_kind, actor_user_id, business_id, action_key, entity_type, entity_id, metadata)
  values ('user', caller_id, current_business.id, 'business.onboarding_completed', 'core.business',
    current_business.id::text, jsonb_build_object('module_key', normalized_module_key,
      'location_created', created_location_id is not null, 'enabled_locales', to_jsonb(requested_enabled_locales),
      'plan_key', case when normalized_module_key = 'restaurant' then 'restaurant-starter' else 'core-only' end));
  return query select current_business.id, current_business.slug, normalized_module_key,
    created_location_id, completion_time, true;
end;
$$;

create or replace function private.assert_restaurant_mutation_allowed(target_business_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare caller_id uuid := auth.uid(); current_business_status core.business_status;
begin
  if caller_id is null then raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501'; end if;
  if target_business_id is null or not private.has_permission(target_business_id, 'restaurant.manage') then
    raise exception 'RESTAURANT_MANAGE_REQUIRED' using errcode = '42501'; end if;
  select status into current_business_status from core.businesses where id = target_business_id for update;
  if not found then raise exception 'BUSINESS_ACCESS_DENIED' using errcode = '42501'; end if;
  if current_business_status <> 'active' then
    raise exception 'RESTAURANT_BUSINESS_NOT_ACTIVE' using errcode = '55000'; end if;
  if not private.business_has_effective_module_access(target_business_id, 'restaurant') then
    raise exception 'RESTAURANT_ACCESS_UNAVAILABLE' using errcode = '55000'; end if;
  return caller_id;
end;
$$;

-- Preserve the established appearance/media implementations behind an entitlement-aware boundary.
alter function core.set_business_appearance(uuid, text, text, jsonb)
  set schema private;
alter function core.reset_business_theme_overrides(uuid, text)
  set schema private;
alter function core.set_business_media_assignment(uuid, text, text, uuid)
  set schema private;

revoke execute on function private.set_business_appearance(uuid, text, text, jsonb),
  private.reset_business_theme_overrides(uuid, text),
  private.set_business_media_assignment(uuid, text, text, uuid)
from public, anon, authenticated, service_role;

create function core.set_business_appearance(
  target_business_id uuid, target_module_key text, target_template_key text,
  requested_theme_overrides jsonb
)
returns table (
  module_key text, template_key text, changed boolean,
  template_changed boolean, theme_changed boolean
)
language plpgsql security definer set search_path = '' as $$
begin
  if not private.business_has_effective_module_access(target_business_id, btrim(target_module_key)) then
    raise exception 'MODULE_ACCESS_UNAVAILABLE' using errcode = '55000';
  end if;
  return query select * from private.set_business_appearance(
    target_business_id, target_module_key, target_template_key, requested_theme_overrides
  );
end;
$$;

create function core.reset_business_theme_overrides(
  target_business_id uuid, target_module_key text
)
returns table (module_key text, template_key text, changed boolean)
language plpgsql security definer set search_path = '' as $$
begin
  if not private.business_has_effective_module_access(target_business_id, btrim(target_module_key)) then
    raise exception 'MODULE_ACCESS_UNAVAILABLE' using errcode = '55000';
  end if;
  return query select * from private.reset_business_theme_overrides(
    target_business_id, target_module_key
  );
end;
$$;

create function core.set_business_media_assignment(
  target_business_id uuid, target_module_key text, target_role_key text,
  target_media_asset_id uuid
)
returns table (module_key text, role_key text, media_asset_id uuid, changed boolean)
language plpgsql security definer set search_path = '' as $$
begin
  if not private.business_has_effective_module_access(target_business_id, btrim(target_module_key)) then
    raise exception 'MODULE_ACCESS_UNAVAILABLE' using errcode = '55000';
  end if;
  return query select * from private.set_business_media_assignment(
    target_business_id, target_module_key, target_role_key, target_media_asset_id
  );
end;
$$;

revoke execute on function core.set_business_appearance(uuid, text, text, jsonb),
  core.reset_business_theme_overrides(uuid, text),
  core.set_business_media_assignment(uuid, text, text, uuid)
from public, anon, authenticated, service_role;
grant execute on function core.set_business_appearance(uuid, text, text, jsonb),
  core.reset_business_theme_overrides(uuid, text),
  core.set_business_media_assignment(uuid, text, text, uuid)
to authenticated;

create or replace function public.get_restaurant_publication(requested_business_slug text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select case when not exists (
    select 1 from core.businesses as business
    where business.slug = lower(btrim(requested_business_slug))
      and private.business_has_effective_module_access(business.id, 'restaurant')
  ) then null when publication.payload is null then null else publication.payload || jsonb_build_object(
    'branding', jsonb_build_object(
      'logo', (select jsonb_build_object('mediaKind', asset.media_kind, 'mimeType', asset.mime_type,
        'storageBucket', asset.storage_bucket, 'storagePath', asset.storage_path, 'altText', asset.alt_text,
        'width', asset.width, 'height', asset.height, 'durationMs', asset.duration_ms)
        from core.businesses as business join core.business_media_assignments as assignment
          on assignment.business_id = business.id and assignment.module_key = 'restaurant' and assignment.role_key = 'logo'
        join core.module_media_roles as role on role.module_key = assignment.module_key
          and role.key = assignment.role_key and role.is_available
        join core.media_assets as asset on asset.business_id = assignment.business_id
          and asset.id = assignment.media_asset_id and asset.status = 'active' and asset.media_kind = 'image'
        where business.slug = publication.payload #>> '{business,slug}'),
      'hero', (select jsonb_build_object('mediaKind', asset.media_kind, 'mimeType', asset.mime_type,
        'storageBucket', asset.storage_bucket, 'storagePath', asset.storage_path, 'altText', asset.alt_text,
        'width', asset.width, 'height', asset.height, 'durationMs', asset.duration_ms)
        from core.businesses as business join core.business_media_assignments as assignment
          on assignment.business_id = business.id and assignment.module_key = 'restaurant' and assignment.role_key = 'hero'
        join core.module_media_roles as role on role.module_key = assignment.module_key
          and role.key = assignment.role_key and role.is_available
        join core.media_assets as asset on asset.business_id = assignment.business_id
          and asset.id = assignment.media_asset_id and asset.status = 'active'
          and asset.media_kind = any(role.allowed_media_kinds)
        where business.slug = publication.payload #>> '{business,slug}')
    )) end
  from (
    select private.get_restaurant_publication_base(requested_business_slug) as payload
  ) as publication;
$$;

create or replace function public.resolve_public_domain(requested_hostname text)
returns jsonb language sql stable security definer set search_path = '' as $$
  with candidate as (
    select domain.business_id, domain.hostname, domain.target_module_key, domain.is_primary,
      business.slug as business_slug
    from core.business_domains as domain
    join core.businesses as business on business.id = domain.business_id and business.status = 'active'
    where requested_hostname is not null and requested_hostname = lower(btrim(requested_hostname))
      and requested_hostname !~ '[,:/\\[:space:]]'
      and requested_hostname ~ '^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?[.])+[a-z](?:[a-z0-9-]{0,61}[a-z0-9])?$'
      and not private.is_reserved_darb_hostname(requested_hostname)
      and domain.hostname = requested_hostname and domain.status = 'verified'
      and domain.routing_status = 'live' and domain.target_module_key = 'restaurant'
      and private.business_has_effective_module_access(domain.business_id, domain.target_module_key)
  )
  select jsonb_build_object('hostname', candidate.hostname, 'businessSlug', candidate.business_slug,
    'targetModuleKey', candidate.target_module_key, 'isPrimary', candidate.is_primary,
    'primaryHostname', (select primary_domain.hostname from core.business_domains as primary_domain
      where primary_domain.business_id = candidate.business_id
        and primary_domain.target_module_key = candidate.target_module_key
        and primary_domain.status = 'verified' and primary_domain.routing_status = 'live'
        and primary_domain.is_primary)) from candidate;
$$;

create or replace function public.resolve_public_restaurant_primary_domain(requested_business_slug text)
returns text language sql stable security definer set search_path = '' as $$
  select domain.hostname from core.businesses as business
  join core.business_domains as domain on domain.business_id = business.id
    and domain.target_module_key = 'restaurant' and domain.status = 'verified'
    and domain.routing_status = 'live' and domain.is_primary
  where requested_business_slug is not null
    and requested_business_slug = lower(btrim(requested_business_slug))
    and requested_business_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    and business.slug = requested_business_slug
    and private.business_has_effective_module_access(business.id, 'restaurant');
$$;

create or replace function public.list_public_restaurant_sitemap()
returns table (
  business_slug text, default_locale core.locale_code,
  locales core.locale_code[], primary_hostname text
)
language sql stable security definer set search_path = '' as $$
  select business.slug, business.default_locale, locale_state.locales,
    (select domain.hostname from core.business_domains as domain
      where domain.business_id = business.id and domain.target_module_key = 'restaurant'
        and domain.status = 'verified' and domain.routing_status = 'live' and domain.is_primary)
  from core.businesses as business
  join restaurant.configurations as configuration on configuration.business_id = business.id
    and configuration.is_publicly_active
  cross join lateral (select array_agg(locale.locale_code order by
      case when locale.locale_code = business.default_locale then 0 else 1 end,
      array_position(array['ar','he','en']::core.locale_code[], locale.locale_code)) as locales
    from core.business_locales as locale where locale.business_id = business.id and locale.is_enabled
  ) as locale_state
  where private.business_has_effective_module_access(business.id, 'restaurant')
    and locale_state.locales is not null
    and exists (select 1 from core.templates where module_key = 'restaurant' and is_available)
    and exists (select 1 from restaurant.menus as menu
      join restaurant.menu_translations as translation on translation.business_id = menu.business_id
        and translation.menu_id = menu.id
      join core.business_locales as locale on locale.business_id = translation.business_id
        and locale.locale_code = translation.locale_code and locale.is_enabled
      where menu.business_id = business.id and menu.publication_status = 'published'
        and menu.lifecycle_status = 'active')
  order by business.slug;
$$;

revoke execute on function core.get_business_module_access(uuid),
  core.get_business_commercial_summary(uuid), core.request_business_initial_setup(uuid),
  core.list_platform_plans(), core.get_platform_business_commercial(uuid),
  core.set_platform_business_plan(uuid, text),
  core.set_platform_module_entitlement_override(uuid, text, text, text),
  core.set_platform_initial_setup_status(uuid, text)
from public, anon, authenticated, service_role;
grant execute on function core.get_business_module_access(uuid),
  core.get_business_commercial_summary(uuid), core.request_business_initial_setup(uuid),
  core.list_platform_plans(), core.get_platform_business_commercial(uuid),
  core.set_platform_business_plan(uuid, text),
  core.set_platform_module_entitlement_override(uuid, text, text, text),
  core.set_platform_initial_setup_status(uuid, text)
to authenticated;

-- Preserve the existing narrowly reviewed public grants after replacement.
revoke execute on function public.get_restaurant_publication(text),
  public.resolve_public_domain(text), public.resolve_public_restaurant_primary_domain(text),
  public.list_public_restaurant_sitemap()
from public, anon, authenticated, service_role;
grant execute on function public.get_restaurant_publication(text),
  public.resolve_public_domain(text), public.resolve_public_restaurant_primary_domain(text),
  public.list_public_restaurant_sitemap()
to anon, authenticated;
