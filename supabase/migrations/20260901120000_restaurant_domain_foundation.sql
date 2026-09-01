create schema if not exists restaurant;

comment on schema restaurant is
  'Tenant-owned Restaurant Engine domain data. Public reads require a separate explicit boundary.';

create type restaurant.lifecycle_status as enum ('active', 'archived');
create type restaurant.publication_status as enum ('draft', 'published');
create type restaurant.availability_status as enum ('available', 'sold_out');
create type restaurant.translatable_entity_type as enum (
  'menu',
  'category',
  'item',
  'item_variant',
  'modifier_group',
  'modifier'
);

create table restaurant.configurations (
  business_id uuid primary key references core.businesses (id) on delete cascade,
  is_publicly_active boolean not null default false,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table restaurant.configurations is
  'One optional Restaurant Engine configuration per business. Absence means unconfigured and not publicly active.';

create table restaurant.menus (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references core.businesses (id) on delete cascade,
  internal_name text not null,
  publication_status restaurant.publication_status not null default 'draft',
  lifecycle_status restaurant.lifecycle_status not null default 'active',
  display_order integer not null default 0,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint menus_business_id_id_key unique (business_id, id),
  constraint menus_internal_name_check check (char_length(btrim(internal_name)) between 1 and 160),
  constraint menus_display_order_check check (display_order between 0 and 1000000)
);

create table restaurant.menu_translations (
  business_id uuid not null,
  menu_id uuid not null,
  locale_code core.locale_code not null,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (business_id, menu_id, locale_code),
  constraint menu_translations_menu_fk foreign key (business_id, menu_id)
    references restaurant.menus (business_id, id) on delete cascade,
  constraint menu_translations_locale_fk foreign key (business_id, locale_code)
    references core.business_locales (business_id, locale_code) on delete restrict,
  constraint menu_translations_name_check check (char_length(btrim(name)) between 1 and 160),
  constraint menu_translations_description_check check (
    description is null or char_length(btrim(description)) between 1 and 2000
  )
);

create table restaurant.categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  menu_id uuid not null,
  internal_name text not null,
  image_media_asset_id uuid,
  is_visible boolean not null default true,
  lifecycle_status restaurant.lifecycle_status not null default 'active',
  display_order integer not null default 0,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_business_id_id_key unique (business_id, id),
  constraint categories_business_menu_id_id_key unique (business_id, menu_id, id),
  constraint categories_menu_fk foreign key (business_id, menu_id)
    references restaurant.menus (business_id, id) on delete cascade,
  constraint categories_image_fk foreign key (business_id, image_media_asset_id)
    references core.media_assets (business_id, id) on delete restrict,
  constraint categories_internal_name_check check (char_length(btrim(internal_name)) between 1 and 160),
  constraint categories_display_order_check check (display_order between 0 and 1000000)
);

create table restaurant.category_translations (
  business_id uuid not null,
  category_id uuid not null,
  locale_code core.locale_code not null,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (business_id, category_id, locale_code),
  constraint category_translations_category_fk foreign key (business_id, category_id)
    references restaurant.categories (business_id, id) on delete cascade,
  constraint category_translations_locale_fk foreign key (business_id, locale_code)
    references core.business_locales (business_id, locale_code) on delete restrict,
  constraint category_translations_name_check check (char_length(btrim(name)) between 1 and 160),
  constraint category_translations_description_check check (
    description is null or char_length(btrim(description)) between 1 and 1000
  )
);

create table restaurant.items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  menu_id uuid not null,
  category_id uuid not null,
  internal_name text not null,
  base_price_minor bigint not null,
  image_media_asset_id uuid,
  is_visible boolean not null default true,
  availability_status restaurant.availability_status not null default 'available',
  lifecycle_status restaurant.lifecycle_status not null default 'active',
  display_order integer not null default 0,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint items_business_id_id_key unique (business_id, id),
  constraint items_business_category_id_id_key unique (business_id, category_id, id),
  constraint items_category_fk foreign key (business_id, menu_id, category_id)
    references restaurant.categories (business_id, menu_id, id) on delete cascade,
  constraint items_image_fk foreign key (business_id, image_media_asset_id)
    references core.media_assets (business_id, id) on delete restrict,
  constraint items_internal_name_check check (char_length(btrim(internal_name)) between 1 and 160),
  constraint items_base_price_minor_check check (base_price_minor between 0 and 999999999),
  constraint items_display_order_check check (display_order between 0 and 1000000)
);

create table restaurant.item_translations (
  business_id uuid not null,
  item_id uuid not null,
  locale_code core.locale_code not null,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (business_id, item_id, locale_code),
  constraint item_translations_item_fk foreign key (business_id, item_id)
    references restaurant.items (business_id, id) on delete cascade,
  constraint item_translations_locale_fk foreign key (business_id, locale_code)
    references core.business_locales (business_id, locale_code) on delete restrict,
  constraint item_translations_name_check check (char_length(btrim(name)) between 1 and 160),
  constraint item_translations_description_check check (
    description is null or char_length(btrim(description)) between 1 and 4000
  )
);

create table restaurant.item_variants (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  item_id uuid not null,
  internal_name text not null,
  price_minor bigint not null,
  is_visible boolean not null default true,
  availability_status restaurant.availability_status not null default 'available',
  lifecycle_status restaurant.lifecycle_status not null default 'active',
  display_order integer not null default 0,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint item_variants_business_id_id_key unique (business_id, id),
  constraint item_variants_item_fk foreign key (business_id, item_id)
    references restaurant.items (business_id, id) on delete cascade,
  constraint item_variants_internal_name_check check (char_length(btrim(internal_name)) between 1 and 160),
  constraint item_variants_price_minor_check check (price_minor between 0 and 999999999),
  constraint item_variants_display_order_check check (display_order between 0 and 1000000)
);

create table restaurant.item_variant_translations (
  business_id uuid not null,
  item_variant_id uuid not null,
  locale_code core.locale_code not null,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (business_id, item_variant_id, locale_code),
  constraint item_variant_translations_variant_fk foreign key (business_id, item_variant_id)
    references restaurant.item_variants (business_id, id) on delete cascade,
  constraint item_variant_translations_locale_fk foreign key (business_id, locale_code)
    references core.business_locales (business_id, locale_code) on delete restrict,
  constraint item_variant_translations_name_check check (char_length(btrim(name)) between 1 and 160)
);

create table restaurant.modifier_groups (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references core.businesses (id) on delete cascade,
  internal_name text not null,
  is_visible boolean not null default true,
  lifecycle_status restaurant.lifecycle_status not null default 'active',
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint modifier_groups_business_id_id_key unique (business_id, id),
  constraint modifier_groups_internal_name_check check (char_length(btrim(internal_name)) between 1 and 160)
);

create table restaurant.modifier_group_translations (
  business_id uuid not null,
  modifier_group_id uuid not null,
  locale_code core.locale_code not null,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (business_id, modifier_group_id, locale_code),
  constraint modifier_group_translations_group_fk foreign key (business_id, modifier_group_id)
    references restaurant.modifier_groups (business_id, id) on delete cascade,
  constraint modifier_group_translations_locale_fk foreign key (business_id, locale_code)
    references core.business_locales (business_id, locale_code) on delete restrict,
  constraint modifier_group_translations_name_check check (char_length(btrim(name)) between 1 and 160),
  constraint modifier_group_translations_description_check check (
    description is null or char_length(btrim(description)) between 1 and 1000
  )
);

create table restaurant.modifiers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  modifier_group_id uuid not null,
  internal_name text not null,
  price_delta_minor bigint not null default 0,
  is_visible boolean not null default true,
  availability_status restaurant.availability_status not null default 'available',
  lifecycle_status restaurant.lifecycle_status not null default 'active',
  display_order integer not null default 0,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint modifiers_business_id_id_key unique (business_id, id),
  constraint modifiers_group_fk foreign key (business_id, modifier_group_id)
    references restaurant.modifier_groups (business_id, id) on delete cascade,
  constraint modifiers_internal_name_check check (char_length(btrim(internal_name)) between 1 and 160),
  constraint modifiers_price_delta_minor_check check (price_delta_minor between 0 and 999999999),
  constraint modifiers_display_order_check check (display_order between 0 and 1000000)
);

create table restaurant.modifier_translations (
  business_id uuid not null,
  modifier_id uuid not null,
  locale_code core.locale_code not null,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (business_id, modifier_id, locale_code),
  constraint modifier_translations_modifier_fk foreign key (business_id, modifier_id)
    references restaurant.modifiers (business_id, id) on delete cascade,
  constraint modifier_translations_locale_fk foreign key (business_id, locale_code)
    references core.business_locales (business_id, locale_code) on delete restrict,
  constraint modifier_translations_name_check check (char_length(btrim(name)) between 1 and 160)
);

create table restaurant.item_modifier_groups (
  business_id uuid not null,
  item_id uuid not null,
  modifier_group_id uuid not null,
  minimum_selections integer not null default 0,
  maximum_selections integer not null default 1,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (business_id, item_id, modifier_group_id),
  constraint item_modifier_groups_item_fk foreign key (business_id, item_id)
    references restaurant.items (business_id, id) on delete cascade,
  constraint item_modifier_groups_group_fk foreign key (business_id, modifier_group_id)
    references restaurant.modifier_groups (business_id, id) on delete restrict,
  constraint item_modifier_groups_selections_check check (
    minimum_selections between 0 and 100
    and maximum_selections between 1 and 100
    and minimum_selections <= maximum_selections
  ),
  constraint item_modifier_groups_display_order_check check (display_order between 0 and 1000000)
);

create table restaurant.item_location_availability (
  business_id uuid not null,
  item_id uuid not null,
  location_id uuid not null,
  availability_status restaurant.availability_status not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (business_id, item_id, location_id),
  constraint item_location_availability_item_fk foreign key (business_id, item_id)
    references restaurant.items (business_id, id) on delete cascade,
  constraint item_location_availability_location_fk foreign key (business_id, location_id)
    references core.locations (business_id, id) on delete cascade
);

comment on column restaurant.items.base_price_minor is
  'Absolute base/default price in the owning business currency integer minor units.';
comment on column restaurant.item_variants.price_minor is
  'Absolute variant price in the owning business currency integer minor units; it is not a delta.';
comment on column restaurant.modifiers.price_delta_minor is
  'Non-negative amount added to the selected item or variant price, in business currency minor units.';
comment on table restaurant.item_modifier_groups is
  'Reusable modifier-group assignment; selection requirements belong to this item-specific relationship.';
comment on table restaurant.item_location_availability is
  'Optional location override. An absent row inherits the item base availability; this is not inventory.';

create index menus_business_state_order_idx
  on restaurant.menus (business_id, lifecycle_status, publication_status, display_order, id);
create index categories_menu_state_order_idx
  on restaurant.categories (business_id, menu_id, lifecycle_status, is_visible, display_order, id);
create index items_category_state_order_idx
  on restaurant.items (business_id, category_id, lifecycle_status, is_visible, display_order, id);
create index item_variants_item_state_order_idx
  on restaurant.item_variants (business_id, item_id, lifecycle_status, is_visible, display_order, id);
create index modifier_groups_business_state_idx
  on restaurant.modifier_groups (business_id, lifecycle_status, id);
create index modifiers_group_state_order_idx
  on restaurant.modifiers (business_id, modifier_group_id, lifecycle_status, is_visible, display_order, id);
create index item_modifier_groups_item_order_idx
  on restaurant.item_modifier_groups (business_id, item_id, display_order, modifier_group_id);
create index item_location_availability_location_idx
  on restaurant.item_location_availability (business_id, location_id, item_id);
create index menu_translations_locale_idx
  on restaurant.menu_translations (business_id, locale_code, menu_id);
create index category_translations_locale_idx
  on restaurant.category_translations (business_id, locale_code, category_id);
create index item_translations_locale_idx
  on restaurant.item_translations (business_id, locale_code, item_id);
create index item_variant_translations_locale_idx
  on restaurant.item_variant_translations (business_id, locale_code, item_variant_id);
create index modifier_group_translations_locale_idx
  on restaurant.modifier_group_translations (business_id, locale_code, modifier_group_id);
create index modifier_translations_locale_idx
  on restaurant.modifier_translations (business_id, locale_code, modifier_id);

create function private.validate_restaurant_image_asset()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  asset_id uuid;
begin
  asset_id := new.image_media_asset_id;
  if asset_id is null then
    return new;
  end if;

  perform 1
  from core.media_assets as asset
  where asset.business_id = new.business_id
    and asset.id = asset_id
    and asset.media_kind = 'image'
    and asset.status = 'active';

  if not found then
    raise exception 'RESTAURANT_IMAGE_UNAVAILABLE' using errcode = '23514';
  end if;
  return new;
end;
$$;

comment on function private.validate_restaurant_image_asset() is
  'Accepts only an active image owned by the same business at attachment time; retained references survive later archival.';

create function private.validate_restaurant_translation_locale()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform 1
  from core.business_locales as locale
  where locale.business_id = new.business_id
    and locale.locale_code = new.locale_code
    and locale.is_enabled;

  if not found then
    raise exception 'RESTAURANT_LOCALE_NOT_ENABLED' using errcode = '23514';
  end if;
  return new;
end;
$$;

comment on function private.validate_restaurant_translation_locale() is
  'Requires the locale to be enabled when restaurant content is inserted or changed; disabling a locale retains existing translations.';

create trigger categories_validate_image
before insert or update of business_id, image_media_asset_id on restaurant.categories
for each row execute function private.validate_restaurant_image_asset();
create trigger items_validate_image
before insert or update of business_id, image_media_asset_id on restaurant.items
for each row execute function private.validate_restaurant_image_asset();

create trigger menu_translations_validate_locale
before insert or update of business_id, locale_code on restaurant.menu_translations
for each row execute function private.validate_restaurant_translation_locale();
create trigger category_translations_validate_locale
before insert or update of business_id, locale_code on restaurant.category_translations
for each row execute function private.validate_restaurant_translation_locale();
create trigger item_translations_validate_locale
before insert or update of business_id, locale_code on restaurant.item_translations
for each row execute function private.validate_restaurant_translation_locale();
create trigger item_variant_translations_validate_locale
before insert or update of business_id, locale_code on restaurant.item_variant_translations
for each row execute function private.validate_restaurant_translation_locale();
create trigger modifier_group_translations_validate_locale
before insert or update of business_id, locale_code on restaurant.modifier_group_translations
for each row execute function private.validate_restaurant_translation_locale();
create trigger modifier_translations_validate_locale
before insert or update of business_id, locale_code on restaurant.modifier_translations
for each row execute function private.validate_restaurant_translation_locale();

create trigger configurations_set_updated_at before update on restaurant.configurations
for each row execute function private.set_updated_at();
create trigger menus_set_updated_at before update on restaurant.menus
for each row execute function private.set_updated_at();
create trigger menu_translations_set_updated_at before update on restaurant.menu_translations
for each row execute function private.set_updated_at();
create trigger categories_set_updated_at before update on restaurant.categories
for each row execute function private.set_updated_at();
create trigger category_translations_set_updated_at before update on restaurant.category_translations
for each row execute function private.set_updated_at();
create trigger items_set_updated_at before update on restaurant.items
for each row execute function private.set_updated_at();
create trigger item_translations_set_updated_at before update on restaurant.item_translations
for each row execute function private.set_updated_at();
create trigger item_variants_set_updated_at before update on restaurant.item_variants
for each row execute function private.set_updated_at();
create trigger item_variant_translations_set_updated_at before update on restaurant.item_variant_translations
for each row execute function private.set_updated_at();
create trigger modifier_groups_set_updated_at before update on restaurant.modifier_groups
for each row execute function private.set_updated_at();
create trigger modifier_group_translations_set_updated_at before update on restaurant.modifier_group_translations
for each row execute function private.set_updated_at();
create trigger modifiers_set_updated_at before update on restaurant.modifiers
for each row execute function private.set_updated_at();
create trigger modifier_translations_set_updated_at before update on restaurant.modifier_translations
for each row execute function private.set_updated_at();
create trigger item_modifier_groups_set_updated_at before update on restaurant.item_modifier_groups
for each row execute function private.set_updated_at();
create trigger item_location_availability_set_updated_at before update on restaurant.item_location_availability
for each row execute function private.set_updated_at();

insert into core.permissions (key, description, scope, module_key)
values
  ('restaurant.read', 'Read Restaurant Engine configuration and menu content', 'business', 'restaurant'),
  ('restaurant.manage', 'Manage Restaurant Engine configuration and menu content', 'business', 'restaurant')
on conflict (key) do nothing;

create function private.backfill_phase9_owner_permissions()
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
        'business.manage', 'locations.read', 'locations.manage',
        'memberships.manage', 'permissions.manage', 'modules.manage',
        'media.manage', 'domains.manage', 'appearance.manage', 'audit.view'
      )
    group by membership.id, membership.business_id, membership.user_id
    having count(distinct assignment.permission_key) = 10
  )
  insert into core.membership_permissions (
    business_id, membership_id, permission_key, location_id, granted_by
  )
  select eligible.business_id, eligible.id, permission.key, null, eligible.user_id
  from eligible_memberships as eligible
  cross join (values ('restaurant.read'::text), ('restaurant.manage'::text)) as permission(key)
  on conflict do nothing;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

comment on function private.backfill_phase9_owner_permissions() is
  'Idempotently extends only active memberships holding the complete approved Phase 8 owner bundle.';
revoke execute on function private.backfill_phase9_owner_permissions()
  from public, anon, authenticated, service_role;
select private.backfill_phase9_owner_permissions();

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
  perform 1 from auth.users as auth_user where auth_user.id = caller_id for update;
  if not found then
    raise exception 'AUTHENTICATED_USER_NOT_FOUND' using errcode = '42501';
  end if;
  if normalized_display_name is null or char_length(normalized_display_name) not between 1 and 160 then
    raise exception 'INVALID_BUSINESS_DISPLAY_NAME' using errcode = '22023';
  end if;
  if normalized_slug is null or char_length(normalized_slug) not between 3 and 63
    or normalized_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'INVALID_BUSINESS_SLUG' using errcode = '22023';
  end if;
  if requested_default_locale not in ('ar', 'he', 'en') then
    raise exception 'INVALID_DEFAULT_LOCALE' using errcode = '22023';
  end if;
  normalized_locale := requested_default_locale::core.locale_code;

  select business.* into existing_business
  from core.memberships as membership
  join core.businesses as business on business.id = membership.business_id
  where membership.user_id = caller_id and membership.status = 'active'
  order by membership.joined_at, membership.id limit 1;
  if found then
    if existing_business.created_by = caller_id
      and existing_business.slug = normalized_slug
      and existing_business.display_name = normalized_display_name
      and existing_business.default_locale = normalized_locale then
      return query select existing_business.id, existing_business.slug,
        existing_business.display_name, existing_business.default_locale, false;
      return;
    end if;
    raise exception 'FIRST_BUSINESS_ALREADY_BOOTSTRAPPED' using errcode = 'P0001';
  end if;

  insert into core.businesses (slug, display_name, default_locale, created_by)
  values (normalized_slug, normalized_display_name, normalized_locale, caller_id)
  returning * into created_business;
  insert into core.memberships (business_id, user_id, status, created_by)
  values (created_business.id, caller_id, 'active', caller_id)
  returning id into created_membership_id;
  insert into core.membership_permissions (
    business_id, membership_id, permission_key, location_id, granted_by
  )
  select created_business.id, created_membership_id, owner_permission.permission_key, null, caller_id
  from (values
    ('business.manage'::text), ('locations.read'::text), ('locations.manage'::text),
    ('memberships.manage'::text), ('permissions.manage'::text), ('modules.manage'::text),
    ('media.manage'::text), ('domains.manage'::text), ('appearance.manage'::text),
    ('restaurant.read'::text), ('restaurant.manage'::text), ('audit.view'::text)
  ) as owner_permission(permission_key);
  get diagnostics inserted_permission_count = row_count;
  if inserted_permission_count <> 12 then
    raise exception 'OWNER_PERMISSION_BUNDLE_INCOMPLETE' using errcode = '55000';
  end if;
  insert into core.audit_events (
    actor_kind, actor_user_id, business_id, action_key, entity_type, entity_id, metadata
  ) values (
    'user', caller_id, created_business.id, 'business.created', 'core.business',
    created_business.id::text, jsonb_build_object('source', 'first_business_bootstrap')
  );
  return query select created_business.id, created_business.slug,
    created_business.display_name, created_business.default_locale, true;
end;
$$;

comment on function core.bootstrap_first_business(text, text, text) is
  'Atomically creates the caller first business, locale, membership, twelve-permission owner bundle, and audit event.';

revoke all on schema restaurant from public, anon, authenticated, service_role;
grant usage on schema restaurant to authenticated, service_role;

alter default privileges for role postgres in schema restaurant
  revoke all on tables from public, anon, authenticated, service_role;
alter default privileges for role postgres in schema restaurant
  revoke all on sequences from public, anon, authenticated, service_role;
alter default privileges for role postgres in schema restaurant
  revoke execute on functions from public, anon, authenticated, service_role;

revoke all on all tables in schema restaurant from public, anon, authenticated, service_role;
revoke all on all sequences in schema restaurant from public, anon, authenticated, service_role;
grant all on all tables in schema restaurant to service_role;
grant select on all tables in schema restaurant to authenticated;

alter table restaurant.configurations enable row level security;
alter table restaurant.menus enable row level security;
alter table restaurant.menu_translations enable row level security;
alter table restaurant.categories enable row level security;
alter table restaurant.category_translations enable row level security;
alter table restaurant.items enable row level security;
alter table restaurant.item_translations enable row level security;
alter table restaurant.item_variants enable row level security;
alter table restaurant.item_variant_translations enable row level security;
alter table restaurant.modifier_groups enable row level security;
alter table restaurant.modifier_group_translations enable row level security;
alter table restaurant.modifiers enable row level security;
alter table restaurant.modifier_translations enable row level security;
alter table restaurant.item_modifier_groups enable row level security;
alter table restaurant.item_location_availability enable row level security;

create policy restaurant_configurations_select_authorized on restaurant.configurations
for select to authenticated using (
  (select private.has_permission(business_id, 'restaurant.read'))
  or (select private.has_permission(business_id, 'restaurant.manage'))
);
create policy restaurant_menus_select_authorized on restaurant.menus
for select to authenticated using (
  (select private.has_permission(business_id, 'restaurant.read'))
  or (select private.has_permission(business_id, 'restaurant.manage'))
);
create policy restaurant_menu_translations_select_authorized on restaurant.menu_translations
for select to authenticated using (
  (select private.has_permission(business_id, 'restaurant.read'))
  or (select private.has_permission(business_id, 'restaurant.manage'))
);
create policy restaurant_categories_select_authorized on restaurant.categories
for select to authenticated using (
  (select private.has_permission(business_id, 'restaurant.read'))
  or (select private.has_permission(business_id, 'restaurant.manage'))
);
create policy restaurant_category_translations_select_authorized on restaurant.category_translations
for select to authenticated using (
  (select private.has_permission(business_id, 'restaurant.read'))
  or (select private.has_permission(business_id, 'restaurant.manage'))
);
create policy restaurant_items_select_authorized on restaurant.items
for select to authenticated using (
  (select private.has_permission(business_id, 'restaurant.read'))
  or (select private.has_permission(business_id, 'restaurant.manage'))
);
create policy restaurant_item_translations_select_authorized on restaurant.item_translations
for select to authenticated using (
  (select private.has_permission(business_id, 'restaurant.read'))
  or (select private.has_permission(business_id, 'restaurant.manage'))
);
create policy restaurant_item_variants_select_authorized on restaurant.item_variants
for select to authenticated using (
  (select private.has_permission(business_id, 'restaurant.read'))
  or (select private.has_permission(business_id, 'restaurant.manage'))
);
create policy restaurant_item_variant_translations_select_authorized on restaurant.item_variant_translations
for select to authenticated using (
  (select private.has_permission(business_id, 'restaurant.read'))
  or (select private.has_permission(business_id, 'restaurant.manage'))
);
create policy restaurant_modifier_groups_select_authorized on restaurant.modifier_groups
for select to authenticated using (
  (select private.has_permission(business_id, 'restaurant.read'))
  or (select private.has_permission(business_id, 'restaurant.manage'))
);
create policy restaurant_modifier_group_translations_select_authorized on restaurant.modifier_group_translations
for select to authenticated using (
  (select private.has_permission(business_id, 'restaurant.read'))
  or (select private.has_permission(business_id, 'restaurant.manage'))
);
create policy restaurant_modifiers_select_authorized on restaurant.modifiers
for select to authenticated using (
  (select private.has_permission(business_id, 'restaurant.read'))
  or (select private.has_permission(business_id, 'restaurant.manage'))
);
create policy restaurant_modifier_translations_select_authorized on restaurant.modifier_translations
for select to authenticated using (
  (select private.has_permission(business_id, 'restaurant.read'))
  or (select private.has_permission(business_id, 'restaurant.manage'))
);
create policy restaurant_item_modifier_groups_select_authorized on restaurant.item_modifier_groups
for select to authenticated using (
  (select private.has_permission(business_id, 'restaurant.read'))
  or (select private.has_permission(business_id, 'restaurant.manage'))
);
create policy restaurant_item_location_availability_select_authorized on restaurant.item_location_availability
for select to authenticated using (
  (select private.has_permission(business_id, 'restaurant.read'))
  or (select private.has_permission(business_id, 'restaurant.manage'))
);

revoke execute on function private.validate_restaurant_image_asset()
  from public, anon, authenticated, service_role;
revoke execute on function private.validate_restaurant_translation_locale()
  from public, anon, authenticated, service_role;
