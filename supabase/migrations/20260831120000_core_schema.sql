create schema if not exists core;
create schema if not exists private;

comment on schema core is 'Darb core platform and tenant data exposed through the Data API under RLS.';
comment on schema private is 'Non-exposed authorization helpers and privileged platform data.';

create type core.locale_code as enum ('ar', 'he', 'en');
create type core.business_status as enum ('active', 'suspended', 'archived');
create type core.location_status as enum ('active', 'inactive', 'archived');
create type core.membership_status as enum ('active', 'suspended');
create type core.permission_scope as enum ('business', 'business_or_location');
create type core.audit_actor_kind as enum ('user', 'system', 'service');

create table core.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  preferred_locale core.locale_code,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_check check (
    display_name is null
    or char_length(btrim(display_name)) between 1 and 120
  )
);

comment on table core.profiles is 'Minimal application profile linked one-to-one with auth.users.';

create table core.businesses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  display_name text not null,
  status core.business_status not null default 'active',
  default_locale core.locale_code not null,
  currency_code text not null default 'ILS',
  timezone text not null default 'Asia/Jerusalem',
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint businesses_slug_check check (
    char_length(slug) between 3 and 63
    and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  constraint businesses_display_name_check check (
    char_length(btrim(display_name)) between 1 and 160
  ),
  constraint businesses_currency_code_check check (currency_code ~ '^[A-Z]{3}$'),
  constraint businesses_timezone_check check (char_length(btrim(timezone)) between 1 and 100)
);

comment on table core.businesses is 'Canonical tenant identity independent of any product engine.';

create table core.locations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references core.businesses (id) on delete cascade,
  display_name text not null,
  status core.location_status not null default 'active',
  address_line text,
  locality text,
  postal_code text,
  country_code text not null default 'IL',
  timezone text,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint locations_business_id_id_key unique (business_id, id),
  constraint locations_display_name_check check (
    char_length(btrim(display_name)) between 1 and 160
  ),
  constraint locations_address_line_check check (
    address_line is null
    or char_length(btrim(address_line)) between 1 and 500
  ),
  constraint locations_locality_check check (
    locality is null
    or char_length(btrim(locality)) between 1 and 160
  ),
  constraint locations_postal_code_check check (
    postal_code is null
    or char_length(btrim(postal_code)) between 1 and 32
  ),
  constraint locations_country_code_check check (country_code ~ '^[A-Z]{2}$'),
  constraint locations_timezone_check check (
    timezone is null
    or char_length(btrim(timezone)) between 1 and 100
  )
);

comment on table core.locations is 'Reusable business locations with no engine-specific fields.';

create index locations_business_status_idx on core.locations (business_id, status);

create table core.memberships (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references core.businesses (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  status core.membership_status not null default 'active',
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint memberships_business_user_key unique (business_id, user_id),
  constraint memberships_business_id_id_key unique (business_id, id)
);

comment on table core.memberships is 'A user relationship to one business; invitations are modeled separately later.';

create index memberships_user_active_idx
  on core.memberships (user_id, business_id)
  where status = 'active';

create table core.modules (
  key text primary key,
  description text not null,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  constraint modules_key_check check (key ~ '^[a-z][a-z0-9_]*$'),
  constraint modules_description_check check (
    char_length(btrim(description)) between 1 and 240
  )
);

comment on table core.modules is 'Platform module registry; rows are platform reference data, not tenant configuration.';

create table core.permissions (
  key text primary key,
  description text not null,
  scope core.permission_scope not null,
  module_key text references core.modules (key) on update cascade on delete restrict,
  created_at timestamptz not null default now(),
  constraint permissions_key_check check (
    key ~ '^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+$'
  ),
  constraint permissions_description_check check (
    char_length(btrim(description)) between 1 and 240
  )
);

comment on table core.permissions is 'Stable permission-key registry with allowed assignment scope.';

create table core.membership_permissions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  membership_id uuid not null,
  permission_key text not null references core.permissions (key) on update cascade on delete restrict,
  location_id uuid,
  granted_by uuid default auth.uid() references auth.users (id) on delete set null,
  granted_at timestamptz not null default now(),
  constraint membership_permissions_membership_fk foreign key (business_id, membership_id)
    references core.memberships (business_id, id) on delete cascade,
  constraint membership_permissions_location_fk foreign key (business_id, location_id)
    references core.locations (business_id, id) on delete cascade
);

comment on table core.membership_permissions is 'Composable business-wide or location-scoped permission assignments.';

create unique index membership_permissions_business_scope_key
  on core.membership_permissions (membership_id, permission_key)
  where location_id is null;

create unique index membership_permissions_location_scope_key
  on core.membership_permissions (membership_id, permission_key, location_id)
  where location_id is not null;

create index membership_permissions_business_lookup_idx
  on core.membership_permissions (business_id, permission_key, location_id, membership_id);

create table core.business_modules (
  business_id uuid not null references core.businesses (id) on delete cascade,
  module_key text not null references core.modules (key) on update cascade on delete restrict,
  is_enabled boolean not null default true,
  updated_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (business_id, module_key)
);

comment on table core.business_modules is 'Data-driven module enablement per business; billing is intentionally separate.';

create table core.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_kind core.audit_actor_kind not null,
  actor_user_id uuid references auth.users (id) on delete set null,
  business_id uuid references core.businesses (id) on delete restrict,
  action_key text not null,
  entity_type text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  constraint audit_events_actor_check check (
    actor_kind <> 'user'
    or actor_user_id is not null
  ),
  constraint audit_events_action_key_check check (
    action_key ~ '^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+$'
  ),
  constraint audit_events_entity_type_check check (
    entity_type is null
    or entity_type ~ '^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)*$'
  ),
  constraint audit_events_entity_pair_check check (
    (entity_type is null) = (entity_id is null)
  ),
  constraint audit_events_metadata_check check (jsonb_typeof(metadata) = 'object')
);

comment on table core.audit_events is 'Append-oriented security and administration events written by trusted server paths.';

create index audit_events_business_time_idx
  on core.audit_events (business_id, occurred_at desc)
  where business_id is not null;

create index audit_events_actor_time_idx
  on core.audit_events (actor_user_id, occurred_at desc)
  where actor_user_id is not null;

create table private.super_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  granted_by uuid references auth.users (id) on delete set null,
  reason text not null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  constraint super_admins_reason_check check (
    char_length(btrim(reason)) between 1 and 500
  ),
  constraint super_admins_revoked_at_check check (
    revoked_at is null
    or revoked_at >= granted_at
  )
);

comment on table private.super_admins is 'Narrow platform-level super-admin assignments, separate from tenant memberships.';

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on core.profiles
for each row execute function private.set_updated_at();

create trigger businesses_set_updated_at
before update on core.businesses
for each row execute function private.set_updated_at();

create trigger locations_set_updated_at
before update on core.locations
for each row execute function private.set_updated_at();

create trigger memberships_set_updated_at
before update on core.memberships
for each row execute function private.set_updated_at();

create trigger business_modules_set_updated_at
before update on core.business_modules
for each row execute function private.set_updated_at();

create function private.create_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into core.profiles (id)
  values (new.id)
  on conflict (id) do nothing;

  return new;
end;
$$;

comment on function private.create_profile_for_auth_user() is
  'Creates only the profile identity row; untrusted auth metadata is not copied automatically.';

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.create_profile_for_auth_user();

create function private.validate_membership_permission_scope()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  allowed_scope core.permission_scope;
begin
  select permission.scope
    into allowed_scope
    from core.permissions as permission
    where permission.key = new.permission_key;

  if allowed_scope is null then
    raise exception 'Unknown permission key: %', new.permission_key
      using errcode = '23503';
  end if;

  if new.location_id is not null and allowed_scope = 'business' then
    raise exception 'Permission % cannot be assigned at location scope', new.permission_key
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger membership_permissions_validate_scope
before insert or update on core.membership_permissions
for each row execute function private.validate_membership_permission_scope();

insert into core.modules (key, description)
values
  ('restaurant', 'Restaurant operations engine'),
  ('booking', 'Booking and appointment engine'),
  ('pages', 'Managed pages and publishing engine'),
  ('commerce', 'Commerce engine')
on conflict (key) do nothing;

insert into core.permissions (key, description, scope)
values
  ('business.manage', 'Manage core business settings', 'business'),
  ('locations.read', 'Read permitted business locations', 'business_or_location'),
  ('locations.manage', 'Create or manage permitted business locations', 'business_or_location'),
  ('memberships.manage', 'Manage business membership lifecycle', 'business'),
  ('permissions.manage', 'Delegate permissions without exceeding the grantor scope', 'business_or_location'),
  ('modules.manage', 'Manage business module enablement', 'business'),
  ('audit.view', 'Read business-scoped audit events', 'business')
on conflict (key) do nothing;
