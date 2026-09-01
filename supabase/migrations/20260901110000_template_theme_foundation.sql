insert into core.permissions (key, description, scope)
values (
  'appearance.manage',
  'Manage business template selection and controlled theme overrides',
  'business'
)
on conflict (key) do nothing;

create function private.theme_json_is_valid(theme jsonb, require_complete boolean)
returns boolean
language plpgsql
immutable
security definer
set search_path = ''
as $$
declare
  key_name text;
  color_value text;
  required_top_keys constant text[] := array[
    'colors', 'density', 'layout', 'motion', 'shadow', 'shape', 'typography'
  ];
  color_keys constant text[] := array[
    'page', 'surface', 'elevated', 'primary', 'onPrimary', 'accent',
    'textPrimary', 'textSecondary', 'textMuted', 'border', 'success', 'warning', 'danger'
  ];
  layout_keys constant text[] := array[
    'cardImageRatio', 'contentWidth', 'heroTreatment', 'sectionSpacing'
  ];
  shape_keys constant text[] := array['border', 'radius'];
  typography_keys constant text[] := array[
    'bodyWeight', 'headingWeight', 'lineHeight', 'scale', 'tracking'
  ];
begin
  if theme is null
    or jsonb_typeof(theme) <> 'object'
    or octet_length(theme::text) > 16384 then
    return false;
  end if;

  if exists (
    select 1 from jsonb_object_keys(theme) as supplied(key)
    where not supplied.key = any(required_top_keys)
  ) then
    return false;
  end if;

  if require_complete and exists (
    select 1 from unnest(required_top_keys) as required(key)
    where not theme ? required.key
  ) then
    return false;
  end if;

  if theme ? 'colors' then
    if jsonb_typeof(theme -> 'colors') <> 'object'
      or exists (
        select 1 from jsonb_object_keys(theme -> 'colors') as supplied(key)
        where not supplied.key = any(color_keys)
      )
      or (require_complete and exists (
        select 1 from unnest(color_keys) as required(key)
        where not (theme -> 'colors') ? required.key
      )) then
      return false;
    end if;

    for key_name, color_value in
      select color.key, color.value #>> '{}'
      from jsonb_each(theme -> 'colors') as color(key, value)
    loop
      if jsonb_typeof((theme -> 'colors') -> key_name) <> 'string'
        or color_value !~ '^#[0-9A-F]{6}$' then
        return false;
      end if;
    end loop;
  elsif require_complete then
    return false;
  end if;

  if theme ? 'density'
    and (jsonb_typeof(theme -> 'density') <> 'string'
      or theme ->> 'density' not in ('compact', 'comfortable', 'spacious')) then
    return false;
  end if;
  if theme ? 'motion'
    and (jsonb_typeof(theme -> 'motion') <> 'string'
      or theme ->> 'motion' not in ('reduced', 'subtle', 'expressive')) then
    return false;
  end if;
  if theme ? 'shadow'
    and (jsonb_typeof(theme -> 'shadow') <> 'string'
      or theme ->> 'shadow' not in ('none', 'subtle', 'medium', 'strong')) then
    return false;
  end if;

  if theme ? 'layout' then
    if jsonb_typeof(theme -> 'layout') <> 'object'
      or exists (
        select 1 from jsonb_object_keys(theme -> 'layout') as supplied(key)
        where not supplied.key = any(layout_keys)
      )
      or (require_complete and exists (
        select 1 from unnest(layout_keys) as required(key)
        where not (theme -> 'layout') ? required.key
      )) then
      return false;
    end if;
    if ((theme -> 'layout') ? 'cardImageRatio' and (theme #>> '{layout,cardImageRatio}') not in ('square', 'landscape', 'portrait'))
      or ((theme -> 'layout') ? 'contentWidth' and (theme #>> '{layout,contentWidth}') not in ('focused', 'balanced', 'wide'))
      or ((theme -> 'layout') ? 'heroTreatment' and (theme #>> '{layout,heroTreatment}') not in ('minimal', 'split', 'immersive'))
      or ((theme -> 'layout') ? 'sectionSpacing' and (theme #>> '{layout,sectionSpacing}') not in ('compact', 'comfortable', 'spacious')) then
      return false;
    end if;
  elsif require_complete then
    return false;
  end if;

  if theme ? 'shape' then
    if jsonb_typeof(theme -> 'shape') <> 'object'
      or exists (
        select 1 from jsonb_object_keys(theme -> 'shape') as supplied(key)
        where not supplied.key = any(shape_keys)
      )
      or (require_complete and exists (
        select 1 from unnest(shape_keys) as required(key)
        where not (theme -> 'shape') ? required.key
      )) then
      return false;
    end if;
    if ((theme -> 'shape') ? 'border' and (theme #>> '{shape,border}') not in ('none', 'hairline', 'defined'))
      or ((theme -> 'shape') ? 'radius' and (theme #>> '{shape,radius}') not in ('soft', 'rounded', 'bold')) then
      return false;
    end if;
  elsif require_complete then
    return false;
  end if;

  if theme ? 'typography' then
    if jsonb_typeof(theme -> 'typography') <> 'object'
      or exists (
        select 1 from jsonb_object_keys(theme -> 'typography') as supplied(key)
        where not supplied.key = any(typography_keys)
      )
      or (require_complete and exists (
        select 1 from unnest(typography_keys) as required(key)
        where not (theme -> 'typography') ? required.key
      )) then
      return false;
    end if;
    if ((theme -> 'typography') ? 'bodyWeight' and (theme #>> '{typography,bodyWeight}') not in ('400', '500'))
      or ((theme -> 'typography') ? 'headingWeight' and (theme #>> '{typography,headingWeight}') not in ('600', '700', '800'))
      or ((theme -> 'typography') ? 'lineHeight' and (theme #>> '{typography,lineHeight}') not in ('snug', 'comfortable', 'airy'))
      or ((theme -> 'typography') ? 'scale' and (theme #>> '{typography,scale}') not in ('compact', 'balanced', 'generous'))
      or ((theme -> 'typography') ? 'tracking' and (theme #>> '{typography,tracking}') not in ('tight', 'normal', 'open')) then
      return false;
    end if;
  elsif require_complete then
    return false;
  end if;

  return true;
end;
$$;

create function private.merge_theme_json(base_theme jsonb, overrides jsonb)
returns jsonb
language sql
immutable
security definer
set search_path = ''
as $$
  select (base_theme || overrides)
    || jsonb_build_object('colors', (base_theme -> 'colors') || coalesce(overrides -> 'colors', '{}'::jsonb))
    || jsonb_build_object('layout', (base_theme -> 'layout') || coalesce(overrides -> 'layout', '{}'::jsonb))
    || jsonb_build_object('shape', (base_theme -> 'shape') || coalesce(overrides -> 'shape', '{}'::jsonb))
    || jsonb_build_object('typography', (base_theme -> 'typography') || coalesce(overrides -> 'typography', '{}'::jsonb));
$$;

create function private.theme_relative_luminance(hex_color text)
returns double precision
language plpgsql
immutable
security definer
set search_path = ''
as $$
declare
  bytes bytea := decode(substr(hex_color, 2), 'hex');
  channel double precision;
  red double precision;
  green double precision;
  blue double precision;
begin
  channel := get_byte(bytes, 0)::double precision / 255;
  red := case when channel <= 0.03928 then channel / 12.92 else power((channel + 0.055) / 1.055, 2.4) end;
  channel := get_byte(bytes, 1)::double precision / 255;
  green := case when channel <= 0.03928 then channel / 12.92 else power((channel + 0.055) / 1.055, 2.4) end;
  channel := get_byte(bytes, 2)::double precision / 255;
  blue := case when channel <= 0.03928 then channel / 12.92 else power((channel + 0.055) / 1.055, 2.4) end;
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
end;
$$;

create function private.theme_contrast_ratio(foreground text, background text)
returns double precision
language sql
immutable
security definer
set search_path = ''
as $$
  select (greatest(private.theme_relative_luminance(foreground), private.theme_relative_luminance(background)) + 0.05)
    / (least(private.theme_relative_luminance(foreground), private.theme_relative_luminance(background)) + 0.05);
$$;

create function private.theme_has_safe_critical_contrast(theme jsonb)
returns boolean
language sql
immutable
security definer
set search_path = ''
as $$
  select private.theme_json_is_valid(theme, true)
    and private.theme_contrast_ratio(theme #>> '{colors,textPrimary}', theme #>> '{colors,page}') >= 4.5
    and private.theme_contrast_ratio(theme #>> '{colors,textPrimary}', theme #>> '{colors,surface}') >= 4.5
    and private.theme_contrast_ratio(theme #>> '{colors,onPrimary}', theme #>> '{colors,primary}') >= 4.5;
$$;

create function private.theme_changed_paths(previous_theme jsonb, next_theme jsonb)
returns text[]
language sql
immutable
security definer
set search_path = ''
as $$
  with paths(path) as (
    values
      ('colors.page'), ('colors.surface'), ('colors.elevated'), ('colors.primary'),
      ('colors.onPrimary'), ('colors.accent'), ('colors.textPrimary'),
      ('colors.textSecondary'), ('colors.textMuted'), ('colors.border'),
      ('colors.success'), ('colors.warning'), ('colors.danger'),
      ('typography.bodyWeight'), ('typography.headingWeight'),
      ('typography.lineHeight'), ('typography.scale'), ('typography.tracking'),
      ('shape.border'), ('shape.radius'), ('density'), ('shadow'), ('motion'),
      ('layout.cardImageRatio'), ('layout.contentWidth'),
      ('layout.heroTreatment'), ('layout.sectionSpacing')
  )
  select coalesce(array_agg(path order by path), array[]::text[])
  from paths
  where previous_theme #> string_to_array(path, '.')
    is distinct from next_theme #> string_to_array(path, '.');
$$;

revoke execute on function private.theme_json_is_valid(jsonb, boolean) from public, anon, authenticated, service_role;
revoke execute on function private.merge_theme_json(jsonb, jsonb) from public, anon, authenticated, service_role;
revoke execute on function private.theme_relative_luminance(text) from public, anon, authenticated, service_role;
revoke execute on function private.theme_contrast_ratio(text, text) from public, anon, authenticated, service_role;
revoke execute on function private.theme_has_safe_critical_contrast(jsonb) from public, anon, authenticated, service_role;
revoke execute on function private.theme_changed_paths(jsonb, jsonb) from public, anon, authenticated, service_role;

create table core.templates (
  key text primary key,
  module_key text not null references core.modules (key) on update cascade on delete restrict,
  display_name text not null,
  description text not null,
  is_available boolean not null default true,
  is_default boolean not null default false,
  sort_order integer not null default 0,
  template_version integer not null default 1,
  theme_schema_version integer not null default 1,
  default_theme jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint templates_module_key_key_unique unique (module_key, key),
  constraint templates_key_check check (key ~ '^[a-z][a-z0-9_]*(?:-[a-z0-9_]+)*$'),
  constraint templates_display_name_check check (char_length(btrim(display_name)) between 1 and 80),
  constraint templates_description_check check (char_length(btrim(description)) between 1 and 240),
  constraint templates_sort_order_check check (sort_order >= 0),
  constraint templates_version_check check (template_version > 0 and theme_schema_version > 0),
  constraint templates_default_theme_check check (
    private.theme_has_safe_critical_contrast(default_theme)
  )
);

create unique index templates_one_default_per_module_idx
  on core.templates (module_key)
  where is_default;

create trigger templates_set_updated_at
before update on core.templates
for each row execute function private.set_updated_at();

comment on table core.templates is
  'Platform-owned rendering compositions scoped to a module context; tenant callers cannot define templates.';
comment on column core.templates.default_theme is
  'Validated complete semantic token defaults for this template, not arbitrary CSS.';
comment on column core.templates.is_available is
  'Unavailable templates cannot be newly selected; retained tenant selections resolve through a safe fallback.';

create table core.business_visual_settings (
  business_id uuid not null references core.businesses (id) on delete cascade,
  module_key text not null references core.modules (key) on update cascade on delete restrict,
  template_key text not null,
  theme_overrides jsonb not null default '{}'::jsonb,
  theme_schema_version integer not null default 1,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (business_id, module_key),
  constraint business_visual_settings_template_fk foreign key (module_key, template_key)
    references core.templates (module_key, key) on update cascade on delete restrict,
  constraint business_visual_settings_overrides_check check (
    private.theme_json_is_valid(theme_overrides, false)
  ),
  constraint business_visual_settings_schema_version_check check (theme_schema_version > 0)
);

create trigger business_visual_settings_set_updated_at
before update on core.business_visual_settings
for each row execute function private.set_updated_at();

comment on table core.business_visual_settings is
  'Tenant template selection and closed semantic theme overrides per module context; absence resolves to the available platform default.';

insert into core.templates (
  key, module_key, display_name, description, is_default, sort_order, default_theme
)
values
  (
    'foundation-canvas',
    'pages',
    'Canvas',
    'A calm, spatial composition foundation for future customer-facing page experiences.',
    true,
    10,
    '{
      "colors": {
        "page": "#F5F1E8", "surface": "#FFFDF8", "elevated": "#FFFFFF",
        "primary": "#154734", "onPrimary": "#FFFFFF", "accent": "#B98232",
        "textPrimary": "#14251E", "textSecondary": "#475A51", "textMuted": "#677970",
        "border": "#D6D8D2", "success": "#1C7251", "warning": "#80520F", "danger": "#A33D3D"
      },
      "typography": {
        "headingWeight": 700, "bodyWeight": 400, "scale": "balanced",
        "tracking": "normal", "lineHeight": "comfortable"
      },
      "shape": { "radius": "rounded", "border": "hairline" },
      "density": "comfortable", "shadow": "subtle", "motion": "subtle",
      "layout": {
        "contentWidth": "balanced", "sectionSpacing": "comfortable",
        "heroTreatment": "split", "cardImageRatio": "landscape"
      }
    }'::jsonb
  ),
  (
    'foundation-editorial',
    'pages',
    'Editorial',
    'A typography-led composition foundation for future narrative page experiences.',
    false,
    20,
    '{
      "colors": {
        "page": "#F4EFE8", "surface": "#FAF7F1", "elevated": "#FFFFFF",
        "primary": "#4A253F", "onPrimary": "#FFFFFF", "accent": "#A9572E",
        "textPrimary": "#24151E", "textSecondary": "#5E4E57", "textMuted": "#786B73",
        "border": "#D9CFD5", "success": "#2D6A4F", "warning": "#80520F", "danger": "#A13F4B"
      },
      "typography": {
        "headingWeight": 800, "bodyWeight": 400, "scale": "generous",
        "tracking": "tight", "lineHeight": "airy"
      },
      "shape": { "radius": "soft", "border": "hairline" },
      "density": "spacious", "shadow": "none", "motion": "subtle",
      "layout": {
        "contentWidth": "focused", "sectionSpacing": "spacious",
        "heroTreatment": "minimal", "cardImageRatio": "portrait"
      }
    }'::jsonb
  );

alter table core.templates enable row level security;
alter table core.business_visual_settings enable row level security;

create policy templates_select_authenticated
on core.templates
for select
to authenticated
using (true);

create policy business_visual_settings_select_active_membership
on core.business_visual_settings
for select
to authenticated
using ((select private.has_active_membership(business_id)));

grant all on core.templates, core.business_visual_settings to service_role;
grant select on core.templates, core.business_visual_settings to authenticated;

create function private.backfill_phase7_owner_permissions()
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
        'media.manage', 'domains.manage', 'audit.view'
      )
    group by membership.id, membership.business_id, membership.user_id
    having count(distinct assignment.permission_key) = 9
  )
  insert into core.membership_permissions (
    business_id, membership_id, permission_key, location_id, granted_by
  )
  select eligible.business_id, eligible.id, 'appearance.manage', null, eligible.user_id
  from eligible_memberships as eligible
  on conflict do nothing;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

comment on function private.backfill_phase7_owner_permissions() is
  'Idempotently extends only active memberships holding the complete approved Phase 6 owner bundle.';
revoke execute on function private.backfill_phase7_owner_permissions()
  from public, anon, authenticated, service_role;
select private.backfill_phase7_owner_permissions();

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
    ('audit.view'::text)
  ) as owner_permission(permission_key);
  get diagnostics inserted_permission_count = row_count;
  if inserted_permission_count <> 10 then
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
  'Atomically creates the caller first business, locale, membership, ten-permission owner bundle, and audit event.';

drop function core.current_user_business_access(uuid);
create function core.current_user_business_access(target_business_id uuid)
returns table (
  can_manage_business boolean,
  can_read_all_locations boolean,
  can_manage_all_locations boolean,
  can_manage_modules boolean,
  can_manage_media boolean,
  can_manage_domains boolean,
  can_manage_appearance boolean,
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
    private.has_permission(target_business_id, 'media.manage'),
    private.has_permission(target_business_id, 'domains.manage'),
    private.has_permission(target_business_id, 'appearance.manage'),
    private.has_permission(target_business_id, 'audit.view'),
    private.is_super_admin();
$$;

comment on function core.current_user_business_access(uuid) is
  'Returns the compact database-authoritative access snapshot required by implemented admin navigation.';

create function core.set_business_appearance(
  target_business_id uuid,
  target_module_key text,
  target_template_key text,
  requested_theme_overrides jsonb
)
returns table (
  module_key text,
  template_key text,
  changed boolean,
  template_changed boolean,
  theme_changed boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  normalized_module_key text := btrim(target_module_key);
  normalized_template_key text := btrim(target_template_key);
  business_status core.business_status;
  selected_template core.templates%rowtype;
  default_template core.templates%rowtype;
  current_settings core.business_visual_settings%rowtype;
  current_row_exists boolean := false;
  previous_template_key text;
  previous_overrides jsonb := '{}'::jsonb;
  previous_resolved jsonb;
  requested_resolved jsonb;
  did_template_change boolean;
  did_theme_change boolean;
  changed_paths text[];
begin
  if caller_id is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;
  if normalized_module_key is null or normalized_module_key !~ '^[a-z][a-z0-9_]*$'
    or normalized_template_key is null or normalized_template_key !~ '^[a-z][a-z0-9_]*(?:-[a-z0-9_]+)*$' then
    raise exception 'APPEARANCE_TARGET_INVALID' using errcode = '22023';
  end if;
  if not private.has_permission(target_business_id, 'appearance.manage') then
    raise exception 'APPEARANCE_MANAGE_REQUIRED' using errcode = '42501';
  end if;
  select business.status into business_status from core.businesses as business
  where business.id = target_business_id for update;
  if not found then raise exception 'BUSINESS_ACCESS_DENIED' using errcode = '42501'; end if;
  if business_status <> 'active' then
    raise exception 'BUSINESS_APPEARANCE_INACTIVE' using errcode = '55000';
  end if;
  if not exists (
    select 1 from core.business_modules as state
    join core.modules as module on module.key = state.module_key
    where state.business_id = target_business_id
      and state.module_key = normalized_module_key
      and state.is_enabled and module.is_available
  ) then
    raise exception 'MODULE_NOT_ENABLED' using errcode = '55000';
  end if;
  select template.* into selected_template from core.templates as template
  where template.key = normalized_template_key and template.module_key = normalized_module_key;
  if not found then raise exception 'TEMPLATE_NOT_FOUND' using errcode = '22023'; end if;
  if not selected_template.is_available then
    raise exception 'TEMPLATE_UNAVAILABLE' using errcode = '55000';
  end if;
  select template.* into default_template from core.templates as template
  where template.module_key = normalized_module_key and template.is_default and template.is_available;
  if not found then raise exception 'DEFAULT_TEMPLATE_UNAVAILABLE' using errcode = '55000'; end if;
  if not private.theme_json_is_valid(requested_theme_overrides, false) then
    raise exception 'THEME_OVERRIDES_INVALID' using errcode = '22023';
  end if;
  requested_resolved := private.merge_theme_json(selected_template.default_theme, requested_theme_overrides);
  if not private.theme_has_safe_critical_contrast(requested_resolved) then
    raise exception 'THEME_CONTRAST_UNSAFE' using errcode = '22023';
  end if;

  select settings.* into current_settings from core.business_visual_settings as settings
  where settings.business_id = target_business_id and settings.module_key = normalized_module_key
  for update;
  current_row_exists := found;
  if current_row_exists then
    previous_template_key := current_settings.template_key;
    previous_overrides := current_settings.theme_overrides;
    select private.merge_theme_json(template.default_theme, previous_overrides)
      into previous_resolved from core.templates as template where template.key = previous_template_key;
  else
    previous_template_key := default_template.key;
    previous_resolved := default_template.default_theme;
  end if;

  did_template_change := previous_template_key is distinct from normalized_template_key;
  did_theme_change := previous_overrides is distinct from requested_theme_overrides;
  if not did_template_change and not did_theme_change then
    return query select normalized_module_key, normalized_template_key, false, false, false;
    return;
  end if;

  insert into core.business_visual_settings (
    business_id, module_key, template_key, theme_overrides, theme_schema_version, updated_by
  ) values (
    target_business_id, normalized_module_key, normalized_template_key,
    requested_theme_overrides, selected_template.theme_schema_version, caller_id
  )
  on conflict on constraint business_visual_settings_pkey do update set
    template_key = excluded.template_key,
    theme_overrides = excluded.theme_overrides,
    theme_schema_version = excluded.theme_schema_version,
    updated_by = excluded.updated_by;

  if did_template_change then
    insert into core.audit_events (
      actor_kind, actor_user_id, business_id, action_key, entity_type, entity_id, metadata
    ) values (
      'user', caller_id, target_business_id, 'business.template_changed',
      'core.business_visual_setting', normalized_module_key,
      jsonb_build_object('module_key', normalized_module_key,
        'previous_template_key', previous_template_key, 'new_template_key', normalized_template_key)
    );
  end if;
  if did_theme_change then
    changed_paths := private.theme_changed_paths(previous_resolved, requested_resolved);
    insert into core.audit_events (
      actor_kind, actor_user_id, business_id, action_key, entity_type, entity_id, metadata
    ) values (
      'user', caller_id, target_business_id, 'business.theme_updated',
      'core.business_visual_setting', normalized_module_key,
      jsonb_build_object('module_key', normalized_module_key,
        'template_key', normalized_template_key, 'changed_tokens', to_jsonb(changed_paths))
    );
  end if;

  return query select normalized_module_key, normalized_template_key, true,
    did_template_change, did_theme_change;
end;
$$;

create function core.reset_business_theme_overrides(
  target_business_id uuid,
  target_module_key text
)
returns table (module_key text, template_key text, changed boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  normalized_module_key text := btrim(target_module_key);
  business_status core.business_status;
  current_settings core.business_visual_settings%rowtype;
  current_row_exists boolean := false;
begin
  if caller_id is null then raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501'; end if;
  if normalized_module_key is null or normalized_module_key !~ '^[a-z][a-z0-9_]*$' then
    raise exception 'APPEARANCE_TARGET_INVALID' using errcode = '22023';
  end if;
  if not private.has_permission(target_business_id, 'appearance.manage') then
    raise exception 'APPEARANCE_MANAGE_REQUIRED' using errcode = '42501';
  end if;
  select business.status into business_status from core.businesses as business
  where business.id = target_business_id for update;
  if not found then raise exception 'BUSINESS_ACCESS_DENIED' using errcode = '42501'; end if;
  if business_status <> 'active' then raise exception 'BUSINESS_APPEARANCE_INACTIVE' using errcode = '55000'; end if;
  if not exists (
    select 1 from core.business_modules as state
    join core.modules as module on module.key = state.module_key
    where state.business_id = target_business_id and state.module_key = normalized_module_key
      and state.is_enabled and module.is_available
  ) then raise exception 'MODULE_NOT_ENABLED' using errcode = '55000'; end if;

  select settings.* into current_settings from core.business_visual_settings as settings
  where settings.business_id = target_business_id and settings.module_key = normalized_module_key
  for update;
  current_row_exists := found;
  if not current_row_exists then
    return query select normalized_module_key, null::text, false;
    return;
  end if;
  if current_settings.theme_overrides = '{}'::jsonb then
    return query select normalized_module_key, current_settings.template_key, false;
    return;
  end if;

  update core.business_visual_settings as settings
  set theme_overrides = '{}'::jsonb, updated_by = caller_id
  where settings.business_id = target_business_id and settings.module_key = normalized_module_key;
  insert into core.audit_events (
    actor_kind, actor_user_id, business_id, action_key, entity_type, entity_id, metadata
  ) values (
    'user', caller_id, target_business_id, 'business.theme_reset',
    'core.business_visual_setting', normalized_module_key,
    jsonb_build_object('module_key', normalized_module_key, 'template_key', current_settings.template_key)
  );
  return query select normalized_module_key, current_settings.template_key, true;
end;
$$;

comment on function core.set_business_appearance(uuid, text, text, jsonb) is
  'Atomically selects an available template, validates closed semantic overrides and critical contrast, and audits actual changes.';
comment on function core.reset_business_theme_overrides(uuid, text) is
  'Atomically resets persisted overrides for an enabled module and audits only an actual reset.';

revoke execute on function core.current_user_business_access(uuid)
  from public, anon, authenticated, service_role;
revoke execute on function core.set_business_appearance(uuid, text, text, jsonb)
  from public, anon, authenticated, service_role;
revoke execute on function core.reset_business_theme_overrides(uuid, text)
  from public, anon, authenticated, service_role;
grant execute on function core.current_user_business_access(uuid) to authenticated;
grant execute on function core.set_business_appearance(uuid, text, text, jsonb) to authenticated;
grant execute on function core.reset_business_theme_overrides(uuid, text) to authenticated;
