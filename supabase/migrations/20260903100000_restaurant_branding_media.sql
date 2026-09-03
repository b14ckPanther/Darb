create table core.module_media_roles (
  module_key text not null references core.modules (key) on update cascade on delete restrict,
  key text not null,
  display_name text not null,
  description text not null,
  allowed_media_kinds core.media_kind[] not null,
  is_available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (module_key, key),
  constraint module_media_roles_key_check check (key ~ '^[a-z][a-z0-9_]*$'),
  constraint module_media_roles_display_name_check check (
    char_length(btrim(display_name)) between 1 and 80
  ),
  constraint module_media_roles_description_check check (
    char_length(btrim(description)) between 1 and 240
  ),
  constraint module_media_roles_allowed_kinds_check check (
    cardinality(allowed_media_kinds) between 1 and 2
  ),
  constraint module_media_roles_sort_order_check check (sort_order between 0 and 1000000)
);

comment on table core.module_media_roles is
  'Platform-owned registry of governed media roles supported by a module rendering context.';
comment on column core.module_media_roles.allowed_media_kinds is
  'Closed media-kind eligibility for this role; MIME and lifecycle validation still use core.media_assets.';

insert into core.module_media_roles (
  module_key,
  key,
  display_name,
  description,
  allowed_media_kinds,
  sort_order
)
values
  (
    'restaurant',
    'logo',
    'Restaurant logo',
    'Primary tenant identity shown in the Restaurant customer experience.',
    array['image']::core.media_kind[],
    10
  ),
  (
    'restaurant',
    'hero',
    'Restaurant hero',
    'Image or silent video presented in the Restaurant customer experience hero.',
    array['image', 'video']::core.media_kind[],
    20
  );

create table core.business_media_assignments (
  business_id uuid not null,
  module_key text not null,
  role_key text not null,
  media_asset_id uuid not null,
  assigned_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (business_id, module_key, role_key),
  constraint business_media_assignments_module_fk foreign key (business_id, module_key)
    references core.business_modules (business_id, module_key) on update cascade on delete cascade,
  constraint business_media_assignments_role_fk foreign key (module_key, role_key)
    references core.module_media_roles (module_key, key) on update cascade on delete restrict,
  constraint business_media_assignments_asset_fk foreign key (business_id, media_asset_id)
    references core.media_assets (business_id, id) on delete restrict
);

comment on table core.business_media_assignments is
  'One tenant media assignment per governed module role. Absence resolves to the renderer fallback.';

create index business_media_assignments_asset_idx
  on core.business_media_assignments (business_id, media_asset_id);

create trigger business_media_assignments_set_updated_at
before update on core.business_media_assignments
for each row execute function private.set_updated_at();

create function private.validate_business_media_assignment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  accepted_kinds core.media_kind[];
  selected_kind core.media_kind;
  selected_status core.media_status;
begin
  select role.allowed_media_kinds
    into accepted_kinds
    from core.module_media_roles as role
    where role.module_key = new.module_key
      and role.key = new.role_key
      and role.is_available;

  if not found then
    raise exception 'MEDIA_ROLE_NOT_AVAILABLE' using errcode = '55000';
  end if;

  select asset.media_kind, asset.status
    into selected_kind, selected_status
    from core.media_assets as asset
    where asset.business_id = new.business_id
      and asset.id = new.media_asset_id;

  if not found
    or selected_status <> 'active'
    or not (selected_kind = any(accepted_kinds)) then
    raise exception 'MEDIA_ASSET_NOT_ELIGIBLE' using errcode = '22023';
  end if;

  return new;
end;
$$;

comment on function private.validate_business_media_assignment() is
  'Defends same-tenant, active-asset, governed-role, and media-kind invariants for every writer.';

create trigger business_media_assignments_validate
before insert or update on core.business_media_assignments
for each row execute function private.validate_business_media_assignment();

create function core.set_business_media_assignment(
  target_business_id uuid,
  target_module_key text,
  target_role_key text,
  target_media_asset_id uuid
)
returns table (
  module_key text,
  role_key text,
  media_asset_id uuid,
  changed boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  normalized_module_key text := btrim(target_module_key);
  normalized_role_key text := btrim(target_role_key);
  business_status core.business_status;
  accepted_kinds core.media_kind[];
  selected_kind core.media_kind;
  current_assignment core.business_media_assignments%rowtype;
  current_assignment_exists boolean := false;
begin
  if caller_id is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;

  if normalized_module_key is null
    or normalized_module_key !~ '^[a-z][a-z0-9_]*$'
    or normalized_role_key is null
    or normalized_role_key !~ '^[a-z][a-z0-9_]*$' then
    raise exception 'MEDIA_ROLE_NOT_FOUND' using errcode = '22023';
  end if;

  if not private.has_permission(target_business_id, 'appearance.manage') then
    raise exception 'APPEARANCE_MANAGE_REQUIRED' using errcode = '42501';
  end if;

  select business.status
    into business_status
    from core.businesses as business
    where business.id = target_business_id
    for update;

  if not found then
    raise exception 'BUSINESS_ACCESS_DENIED' using errcode = '42501';
  end if;

  if business_status <> 'active' then
    raise exception 'BUSINESS_APPEARANCE_INACTIVE' using errcode = '55000';
  end if;

  if not exists (
    select 1
    from core.business_modules as state
    join core.modules as module
      on module.key = state.module_key
      and module.is_available
    where state.business_id = target_business_id
      and state.module_key = normalized_module_key
      and state.is_enabled
  ) then
    raise exception 'MODULE_NOT_ENABLED' using errcode = '55000';
  end if;

  select role.allowed_media_kinds
    into accepted_kinds
    from core.module_media_roles as role
    where role.module_key = normalized_module_key
      and role.key = normalized_role_key
      and role.is_available;

  if not found then
    raise exception 'MEDIA_ROLE_NOT_AVAILABLE' using errcode = '55000';
  end if;

  select assignment.*
    into current_assignment
    from core.business_media_assignments as assignment
    where assignment.business_id = target_business_id
      and assignment.module_key = normalized_module_key
      and assignment.role_key = normalized_role_key
    for update;

  current_assignment_exists := found;

  if target_media_asset_id is null then
    if not current_assignment_exists then
      return query select normalized_module_key, normalized_role_key, null::uuid, false;
      return;
    end if;

    delete from core.business_media_assignments as assignment
      where assignment.business_id = target_business_id
        and assignment.module_key = normalized_module_key
        and assignment.role_key = normalized_role_key;

    insert into core.audit_events (
      actor_kind,
      actor_user_id,
      business_id,
      action_key,
      entity_type,
      entity_id,
      metadata
    ) values (
      'user',
      caller_id,
      target_business_id,
      'business.branding_media_removed',
      'core.business_media_assignment',
      normalized_module_key || ':' || normalized_role_key,
      jsonb_build_object(
        'module_key', normalized_module_key,
        'role_key', normalized_role_key,
        'previous_media_asset_id', current_assignment.media_asset_id
      )
    );

    return query select normalized_module_key, normalized_role_key, null::uuid, true;
    return;
  end if;

  select asset.media_kind
    into selected_kind
    from core.media_assets as asset
    where asset.business_id = target_business_id
      and asset.id = target_media_asset_id
      and asset.status = 'active';

  if not found or not (selected_kind = any(accepted_kinds)) then
    raise exception 'MEDIA_ASSET_NOT_ELIGIBLE' using errcode = '22023';
  end if;

  if current_assignment_exists
    and current_assignment.media_asset_id = target_media_asset_id then
    return query
      select normalized_module_key, normalized_role_key, target_media_asset_id, false;
    return;
  end if;

  insert into core.business_media_assignments (
    business_id,
    module_key,
    role_key,
    media_asset_id,
    assigned_by
  ) values (
    target_business_id,
    normalized_module_key,
    normalized_role_key,
    target_media_asset_id,
    caller_id
  )
  on conflict on constraint business_media_assignments_pkey
  do update set
    media_asset_id = excluded.media_asset_id,
    assigned_by = excluded.assigned_by;

  insert into core.audit_events (
    actor_kind,
    actor_user_id,
    business_id,
    action_key,
    entity_type,
    entity_id,
    metadata
  ) values (
    'user',
    caller_id,
    target_business_id,
    'business.branding_media_assigned',
    'core.business_media_assignment',
    normalized_module_key || ':' || normalized_role_key,
    jsonb_build_object(
      'module_key', normalized_module_key,
      'role_key', normalized_role_key,
      'previous_media_asset_id',
        case when current_assignment_exists then current_assignment.media_asset_id else null end,
      'new_media_asset_id', target_media_asset_id,
      'media_kind', selected_kind
    )
  );

  return query select normalized_module_key, normalized_role_key, target_media_asset_id, true;
end;
$$;

comment on function core.set_business_media_assignment(uuid, text, text, uuid) is
  'Atomically assigns, replaces, or removes one governed module media role after caller, tenant, lifecycle, capability, role, and asset validation.';

alter table core.module_media_roles enable row level security;
alter table core.business_media_assignments enable row level security;

grant select on core.module_media_roles to authenticated;
grant select on core.business_media_assignments to authenticated;
grant all on core.module_media_roles, core.business_media_assignments to service_role;

create policy module_media_roles_select_authenticated
on core.module_media_roles
for select
to authenticated
using (true);

create policy business_media_assignments_select_active_membership
on core.business_media_assignments
for select
to authenticated
using ((select private.has_active_membership(business_id)));

revoke execute on function private.validate_business_media_assignment()
  from public, anon, authenticated, service_role;
revoke execute on function core.set_business_media_assignment(uuid, text, text, uuid)
  from public, anon, authenticated, service_role;
grant execute on function core.set_business_media_assignment(uuid, text, text, uuid)
  to authenticated;

-- Preserve the reviewed Phase 11 publication graph as an internal implementation detail, then
-- extend its single public boundary with governed Restaurant branding media.
alter function public.get_restaurant_publication(text) set schema private;
alter function private.get_restaurant_publication(text) rename to get_restaurant_publication_base;
revoke execute on function private.get_restaurant_publication_base(text)
  from public, anon, authenticated, service_role;

create function public.get_restaurant_publication(requested_business_slug text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when publication.payload is null then null
    else publication.payload || jsonb_build_object(
      'branding',
      jsonb_build_object(
        'logo', (
          select jsonb_build_object(
            'mediaKind', asset.media_kind,
            'mimeType', asset.mime_type,
            'storageBucket', asset.storage_bucket,
            'storagePath', asset.storage_path,
            'altText', asset.alt_text,
            'width', asset.width,
            'height', asset.height,
            'durationMs', asset.duration_ms
          )
          from core.businesses as business
          join core.business_media_assignments as assignment
            on assignment.business_id = business.id
            and assignment.module_key = 'restaurant'
            and assignment.role_key = 'logo'
          join core.module_media_roles as role
            on role.module_key = assignment.module_key
            and role.key = assignment.role_key
            and role.is_available
          join core.media_assets as asset
            on asset.business_id = assignment.business_id
            and asset.id = assignment.media_asset_id
            and asset.status = 'active'
            and asset.media_kind = 'image'
          where business.slug = publication.payload #>> '{business,slug}'
        ),
        'hero', (
          select jsonb_build_object(
            'mediaKind', asset.media_kind,
            'mimeType', asset.mime_type,
            'storageBucket', asset.storage_bucket,
            'storagePath', asset.storage_path,
            'altText', asset.alt_text,
            'width', asset.width,
            'height', asset.height,
            'durationMs', asset.duration_ms
          )
          from core.businesses as business
          join core.business_media_assignments as assignment
            on assignment.business_id = business.id
            and assignment.module_key = 'restaurant'
            and assignment.role_key = 'hero'
          join core.module_media_roles as role
            on role.module_key = assignment.module_key
            and role.key = assignment.role_key
            and role.is_available
          join core.media_assets as asset
            on asset.business_id = assignment.business_id
            and asset.id = assignment.media_asset_id
            and asset.status = 'active'
            and asset.media_kind = any(role.allowed_media_kinds)
          where business.slug = publication.payload #>> '{business,slug}'
        )
      )
    )
  end
  from (
    select private.get_restaurant_publication_base(requested_business_slug) as payload
  ) as publication;
$$;

comment on function public.get_restaurant_publication(text) is
  'Anonymous-safe Restaurant publication graph extended with active governed tenant logo and hero assignments; raw administration tables remain inaccessible.';

revoke execute on function public.get_restaurant_publication(text)
  from public, anon, authenticated, service_role;
grant execute on function public.get_restaurant_publication(text)
  to anon, authenticated;
