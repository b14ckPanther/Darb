create function private.assert_restaurant_mutation_allowed(target_business_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  current_business_status core.business_status;
  restaurant_available boolean;
  restaurant_enabled boolean;
begin
  if caller_id is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;
  if target_business_id is null
    or not private.has_permission(target_business_id, 'restaurant.manage') then
    raise exception 'RESTAURANT_MANAGE_REQUIRED' using errcode = '42501';
  end if;

  select business.status into current_business_status
  from core.businesses as business
  where business.id = target_business_id
  for update;
  if not found then
    raise exception 'BUSINESS_ACCESS_DENIED' using errcode = '42501';
  end if;
  if current_business_status <> 'active' then
    raise exception 'RESTAURANT_BUSINESS_NOT_ACTIVE' using errcode = '55000';
  end if;

  select module.is_available into restaurant_available
  from core.modules as module
  where module.key = 'restaurant';
  if not found or not restaurant_available then
    raise exception 'RESTAURANT_MODULE_UNAVAILABLE' using errcode = '55000';
  end if;

  select state.is_enabled into restaurant_enabled
  from core.business_modules as state
  where state.business_id = target_business_id
    and state.module_key = 'restaurant';
  if not found or not restaurant_enabled then
    raise exception 'RESTAURANT_MODULE_DISABLED' using errcode = '55000';
  end if;

  return caller_id;
end;
$$;

comment on function private.assert_restaurant_mutation_allowed(uuid) is
  'Derives the caller and requires Restaurant management permission, an active business, and an effectively enabled Restaurant capability.';

create function private.write_restaurant_audit(
  target_business_id uuid,
  target_action_key text,
  target_entity_type text,
  target_entity_id uuid,
  target_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;
  insert into core.audit_events (
    actor_kind, actor_user_id, business_id, action_key, entity_type, entity_id, metadata
  ) values (
    'user', auth.uid(), target_business_id, target_action_key,
    target_entity_type, target_entity_id::text, coalesce(target_metadata, '{}'::jsonb)
  );
end;
$$;

create function restaurant.save_configuration(
  target_business_id uuid,
  requested_publicly_active boolean
)
returns table (business_id uuid, is_publicly_active boolean, changed boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid;
  previous_value boolean;
begin
  caller_id := private.assert_restaurant_mutation_allowed(target_business_id);
  if requested_publicly_active is null then
    raise exception 'INVALID_RESTAURANT_CONFIGURATION' using errcode = '22023';
  end if;

  select configuration.is_publicly_active into previous_value
  from restaurant.configurations as configuration
  where configuration.business_id = target_business_id
  for update;

  if found and previous_value = requested_publicly_active then
    return query select target_business_id, previous_value, false;
    return;
  end if;

  insert into restaurant.configurations (business_id, is_publicly_active, created_by)
  values (target_business_id, requested_publicly_active, caller_id)
  on conflict on constraint configurations_pkey do update
  set is_publicly_active = excluded.is_publicly_active;

  perform private.write_restaurant_audit(
    target_business_id, 'restaurant.configuration_updated', 'restaurant.configuration',
    target_business_id, jsonb_build_object('is_publicly_active', requested_publicly_active)
  );
  return query select target_business_id, requested_publicly_active, true;
end;
$$;

create function restaurant.save_menu(
  target_business_id uuid,
  target_menu_id uuid,
  requested_internal_name text,
  requested_publication_status text,
  requested_lifecycle_status text,
  requested_display_order integer
)
returns table (menu_id uuid, created boolean, changed boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid;
  normalized_name text := btrim(requested_internal_name);
  normalized_publication restaurant.publication_status;
  normalized_lifecycle restaurant.lifecycle_status;
  current_menu restaurant.menus%rowtype;
  resolved_id uuid;
  was_archived boolean := false;
begin
  caller_id := private.assert_restaurant_mutation_allowed(target_business_id);
  if normalized_name is null or char_length(normalized_name) not between 1 and 160
    or requested_publication_status not in ('draft', 'published')
    or requested_lifecycle_status not in ('active', 'archived')
    or requested_display_order not between 0 and 1000000 then
    raise exception 'INVALID_RESTAURANT_MENU' using errcode = '22023';
  end if;
  normalized_publication := requested_publication_status::restaurant.publication_status;
  normalized_lifecycle := requested_lifecycle_status::restaurant.lifecycle_status;

  if target_menu_id is null then
    if normalized_lifecycle <> 'active' then
      raise exception 'INVALID_RESTAURANT_LIFECYCLE' using errcode = '22023';
    end if;
    insert into restaurant.menus (
      business_id, internal_name, publication_status, lifecycle_status, display_order, created_by
    ) values (
      target_business_id, normalized_name, normalized_publication, normalized_lifecycle,
      requested_display_order, caller_id
    ) returning id into resolved_id;
    perform private.write_restaurant_audit(
      target_business_id, 'restaurant.menu_created', 'restaurant.menu', resolved_id,
      jsonb_build_object('publication_status', normalized_publication)
    );
    return query select resolved_id, true, true;
    return;
  end if;

  select menu.* into current_menu
  from restaurant.menus as menu
  where menu.business_id = target_business_id and menu.id = target_menu_id
  for update;
  if not found then raise exception 'RESTAURANT_MENU_NOT_FOUND' using errcode = '22023'; end if;
  if current_menu.lifecycle_status = 'archived' then
    raise exception 'RESTAURANT_ENTITY_ARCHIVED' using errcode = '55000';
  end if;
  if current_menu.internal_name = normalized_name
    and current_menu.publication_status = normalized_publication
    and current_menu.lifecycle_status = normalized_lifecycle
    and current_menu.display_order = requested_display_order then
    return query select current_menu.id, false, false;
    return;
  end if;
  was_archived := normalized_lifecycle = 'archived';
  update restaurant.menus set
    internal_name = normalized_name,
    publication_status = normalized_publication,
    lifecycle_status = normalized_lifecycle,
    display_order = requested_display_order
  where id = current_menu.id;
  perform private.write_restaurant_audit(
    target_business_id,
    case when was_archived then 'restaurant.menu_archived' else 'restaurant.menu_updated' end,
    'restaurant.menu', current_menu.id,
    jsonb_build_object('publication_status', normalized_publication, 'lifecycle_status', normalized_lifecycle)
  );
  return query select current_menu.id, false, true;
end;
$$;

create function restaurant.save_category(
  target_business_id uuid,
  target_category_id uuid,
  target_menu_id uuid,
  requested_internal_name text,
  requested_image_media_asset_id uuid,
  requested_visible boolean,
  requested_lifecycle_status text,
  requested_display_order integer
)
returns table (category_id uuid, created boolean, changed boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid;
  normalized_name text := btrim(requested_internal_name);
  normalized_lifecycle restaurant.lifecycle_status;
  current_category restaurant.categories%rowtype;
  resolved_id uuid;
begin
  caller_id := private.assert_restaurant_mutation_allowed(target_business_id);
  if normalized_name is null or char_length(normalized_name) not between 1 and 160
    or requested_visible is null or requested_lifecycle_status not in ('active', 'archived')
    or requested_display_order not between 0 and 1000000 then
    raise exception 'INVALID_RESTAURANT_CATEGORY' using errcode = '22023';
  end if;
  normalized_lifecycle := requested_lifecycle_status::restaurant.lifecycle_status;
  perform 1 from restaurant.menus as menu
  where menu.business_id = target_business_id and menu.id = target_menu_id
    and menu.lifecycle_status = 'active';
  if not found then raise exception 'RESTAURANT_MENU_NOT_FOUND' using errcode = '22023'; end if;

  if target_category_id is null then
    if normalized_lifecycle <> 'active' then raise exception 'INVALID_RESTAURANT_LIFECYCLE' using errcode = '22023'; end if;
    insert into restaurant.categories (
      business_id, menu_id, internal_name, image_media_asset_id, is_visible,
      lifecycle_status, display_order, created_by
    ) values (
      target_business_id, target_menu_id, normalized_name, requested_image_media_asset_id,
      requested_visible, normalized_lifecycle, requested_display_order, caller_id
    ) returning id into resolved_id;
    perform private.write_restaurant_audit(
      target_business_id, 'restaurant.category_created', 'restaurant.category', resolved_id,
      jsonb_build_object('menu_id', target_menu_id)
    );
    return query select resolved_id, true, true;
    return;
  end if;

  select category.* into current_category
  from restaurant.categories as category
  where category.business_id = target_business_id and category.id = target_category_id
  for update;
  if not found then raise exception 'RESTAURANT_CATEGORY_NOT_FOUND' using errcode = '22023'; end if;
  if current_category.lifecycle_status = 'archived' then raise exception 'RESTAURANT_ENTITY_ARCHIVED' using errcode = '55000'; end if;
  if current_category.menu_id = target_menu_id and current_category.internal_name = normalized_name
    and current_category.image_media_asset_id is not distinct from requested_image_media_asset_id
    and current_category.is_visible = requested_visible
    and current_category.lifecycle_status = normalized_lifecycle
    and current_category.display_order = requested_display_order then
    return query select current_category.id, false, false;
    return;
  end if;
  update restaurant.categories set
    menu_id = target_menu_id, internal_name = normalized_name,
    image_media_asset_id = requested_image_media_asset_id, is_visible = requested_visible,
    lifecycle_status = normalized_lifecycle, display_order = requested_display_order
  where id = current_category.id;
  perform private.write_restaurant_audit(
    target_business_id,
    case when normalized_lifecycle = 'archived' then 'restaurant.category_archived' else 'restaurant.category_updated' end,
    'restaurant.category', current_category.id,
    jsonb_build_object('menu_id', target_menu_id, 'lifecycle_status', normalized_lifecycle)
  );
  return query select current_category.id, false, true;
end;
$$;

create function restaurant.save_item(
  target_business_id uuid,
  target_item_id uuid,
  target_menu_id uuid,
  target_category_id uuid,
  requested_internal_name text,
  requested_base_price_minor bigint,
  requested_image_media_asset_id uuid,
  requested_visible boolean,
  requested_availability_status text,
  requested_lifecycle_status text,
  requested_display_order integer
)
returns table (item_id uuid, created boolean, changed boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid;
  normalized_name text := btrim(requested_internal_name);
  normalized_availability restaurant.availability_status;
  normalized_lifecycle restaurant.lifecycle_status;
  current_item restaurant.items%rowtype;
  resolved_id uuid;
  action_key text;
begin
  caller_id := private.assert_restaurant_mutation_allowed(target_business_id);
  if normalized_name is null or char_length(normalized_name) not between 1 and 160
    or requested_base_price_minor not between 0 and 999999999
    or requested_visible is null or requested_availability_status not in ('available', 'sold_out')
    or requested_lifecycle_status not in ('active', 'archived')
    or requested_display_order not between 0 and 1000000 then
    raise exception 'INVALID_RESTAURANT_ITEM' using errcode = '22023';
  end if;
  normalized_availability := requested_availability_status::restaurant.availability_status;
  normalized_lifecycle := requested_lifecycle_status::restaurant.lifecycle_status;
  perform 1 from restaurant.categories as category
  where category.business_id = target_business_id and category.id = target_category_id
    and category.menu_id = target_menu_id and category.lifecycle_status = 'active';
  if not found then raise exception 'RESTAURANT_CATEGORY_NOT_FOUND' using errcode = '22023'; end if;

  if target_item_id is null then
    if normalized_lifecycle <> 'active' then raise exception 'INVALID_RESTAURANT_LIFECYCLE' using errcode = '22023'; end if;
    insert into restaurant.items (
      business_id, menu_id, category_id, internal_name, base_price_minor,
      image_media_asset_id, is_visible, availability_status, lifecycle_status,
      display_order, created_by
    ) values (
      target_business_id, target_menu_id, target_category_id, normalized_name,
      requested_base_price_minor, requested_image_media_asset_id, requested_visible,
      normalized_availability, normalized_lifecycle, requested_display_order, caller_id
    ) returning id into resolved_id;
    perform private.write_restaurant_audit(
      target_business_id, 'restaurant.item_created', 'restaurant.item', resolved_id,
      jsonb_build_object('category_id', target_category_id)
    );
    return query select resolved_id, true, true;
    return;
  end if;

  select item.* into current_item from restaurant.items as item
  where item.business_id = target_business_id and item.id = target_item_id for update;
  if not found then raise exception 'RESTAURANT_ITEM_NOT_FOUND' using errcode = '22023'; end if;
  if current_item.lifecycle_status = 'archived' then raise exception 'RESTAURANT_ENTITY_ARCHIVED' using errcode = '55000'; end if;
  if current_item.menu_id = target_menu_id and current_item.category_id = target_category_id
    and current_item.internal_name = normalized_name and current_item.base_price_minor = requested_base_price_minor
    and current_item.image_media_asset_id is not distinct from requested_image_media_asset_id
    and current_item.is_visible = requested_visible
    and current_item.availability_status = normalized_availability
    and current_item.lifecycle_status = normalized_lifecycle
    and current_item.display_order = requested_display_order then
    return query select current_item.id, false, false;
    return;
  end if;
  action_key := case
    when normalized_lifecycle = 'archived' then 'restaurant.item_archived'
    when current_item.availability_status <> normalized_availability
      and current_item.menu_id = target_menu_id and current_item.category_id = target_category_id
      and current_item.internal_name = normalized_name and current_item.base_price_minor = requested_base_price_minor
      and current_item.image_media_asset_id is not distinct from requested_image_media_asset_id
      and current_item.is_visible = requested_visible and current_item.display_order = requested_display_order
      then 'restaurant.item_availability_changed'
    else 'restaurant.item_updated'
  end;
  update restaurant.items set
    menu_id = target_menu_id, category_id = target_category_id, internal_name = normalized_name,
    base_price_minor = requested_base_price_minor, image_media_asset_id = requested_image_media_asset_id,
    is_visible = requested_visible, availability_status = normalized_availability,
    lifecycle_status = normalized_lifecycle, display_order = requested_display_order
  where id = current_item.id;
  perform private.write_restaurant_audit(
    target_business_id, action_key, 'restaurant.item', current_item.id,
    jsonb_build_object('category_id', target_category_id, 'availability_status', normalized_availability,
      'lifecycle_status', normalized_lifecycle)
  );
  return query select current_item.id, false, true;
end;
$$;

create function restaurant.save_item_variant(
  target_business_id uuid,
  target_variant_id uuid,
  target_item_id uuid,
  requested_internal_name text,
  requested_price_minor bigint,
  requested_visible boolean,
  requested_availability_status text,
  requested_lifecycle_status text,
  requested_display_order integer
)
returns table (variant_id uuid, created boolean, changed boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid;
  normalized_name text := btrim(requested_internal_name);
  normalized_availability restaurant.availability_status;
  normalized_lifecycle restaurant.lifecycle_status;
  current_variant restaurant.item_variants%rowtype;
  resolved_id uuid;
begin
  caller_id := private.assert_restaurant_mutation_allowed(target_business_id);
  if normalized_name is null or char_length(normalized_name) not between 1 and 160
    or requested_price_minor not between 0 and 999999999 or requested_visible is null
    or requested_availability_status not in ('available', 'sold_out')
    or requested_lifecycle_status not in ('active', 'archived')
    or requested_display_order not between 0 and 1000000 then
    raise exception 'INVALID_RESTAURANT_VARIANT' using errcode = '22023';
  end if;
  normalized_availability := requested_availability_status::restaurant.availability_status;
  normalized_lifecycle := requested_lifecycle_status::restaurant.lifecycle_status;
  perform 1 from restaurant.items as item where item.business_id = target_business_id
    and item.id = target_item_id and item.lifecycle_status = 'active';
  if not found then raise exception 'RESTAURANT_ITEM_NOT_FOUND' using errcode = '22023'; end if;
  if target_variant_id is null then
    if normalized_lifecycle <> 'active' then raise exception 'INVALID_RESTAURANT_LIFECYCLE' using errcode = '22023'; end if;
    insert into restaurant.item_variants (
      business_id, item_id, internal_name, price_minor, is_visible,
      availability_status, lifecycle_status, display_order, created_by
    ) values (
      target_business_id, target_item_id, normalized_name, requested_price_minor,
      requested_visible, normalized_availability, normalized_lifecycle, requested_display_order, caller_id
    ) returning id into resolved_id;
    perform private.write_restaurant_audit(
      target_business_id, 'restaurant.variant_created', 'restaurant.item_variant', resolved_id,
      jsonb_build_object('item_id', target_item_id)
    );
    return query select resolved_id, true, true; return;
  end if;
  select variant.* into current_variant from restaurant.item_variants as variant
  where variant.business_id = target_business_id and variant.id = target_variant_id for update;
  if not found then raise exception 'RESTAURANT_VARIANT_NOT_FOUND' using errcode = '22023'; end if;
  if current_variant.lifecycle_status = 'archived' then raise exception 'RESTAURANT_ENTITY_ARCHIVED' using errcode = '55000'; end if;
  if current_variant.item_id = target_item_id and current_variant.internal_name = normalized_name
    and current_variant.price_minor = requested_price_minor and current_variant.is_visible = requested_visible
    and current_variant.availability_status = normalized_availability
    and current_variant.lifecycle_status = normalized_lifecycle
    and current_variant.display_order = requested_display_order then
    return query select current_variant.id, false, false; return;
  end if;
  update restaurant.item_variants set
    item_id = target_item_id, internal_name = normalized_name, price_minor = requested_price_minor,
    is_visible = requested_visible, availability_status = normalized_availability,
    lifecycle_status = normalized_lifecycle, display_order = requested_display_order
  where id = current_variant.id;
  perform private.write_restaurant_audit(
    target_business_id,
    case when normalized_lifecycle = 'archived' then 'restaurant.variant_archived' else 'restaurant.variant_updated' end,
    'restaurant.item_variant', current_variant.id,
    jsonb_build_object('item_id', target_item_id, 'lifecycle_status', normalized_lifecycle)
  );
  return query select current_variant.id, false, true;
end;
$$;

create function restaurant.save_modifier_group(
  target_business_id uuid,
  target_modifier_group_id uuid,
  requested_internal_name text,
  requested_visible boolean,
  requested_lifecycle_status text
)
returns table (modifier_group_id uuid, created boolean, changed boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid;
  normalized_name text := btrim(requested_internal_name);
  normalized_lifecycle restaurant.lifecycle_status;
  current_group restaurant.modifier_groups%rowtype;
  resolved_id uuid;
begin
  caller_id := private.assert_restaurant_mutation_allowed(target_business_id);
  if normalized_name is null or char_length(normalized_name) not between 1 and 160
    or requested_visible is null or requested_lifecycle_status not in ('active', 'archived') then
    raise exception 'INVALID_RESTAURANT_MODIFIER_GROUP' using errcode = '22023';
  end if;
  normalized_lifecycle := requested_lifecycle_status::restaurant.lifecycle_status;
  if target_modifier_group_id is null then
    if normalized_lifecycle <> 'active' then raise exception 'INVALID_RESTAURANT_LIFECYCLE' using errcode = '22023'; end if;
    insert into restaurant.modifier_groups (
      business_id, internal_name, is_visible, lifecycle_status, created_by
    ) values (target_business_id, normalized_name, requested_visible, normalized_lifecycle, caller_id)
    returning id into resolved_id;
    perform private.write_restaurant_audit(
      target_business_id, 'restaurant.modifier_group_created', 'restaurant.modifier_group', resolved_id
    );
    return query select resolved_id, true, true; return;
  end if;
  select modifier_group.* into current_group from restaurant.modifier_groups as modifier_group
  where modifier_group.business_id = target_business_id and modifier_group.id = target_modifier_group_id for update;
  if not found then raise exception 'RESTAURANT_MODIFIER_GROUP_NOT_FOUND' using errcode = '22023'; end if;
  if current_group.lifecycle_status = 'archived' then raise exception 'RESTAURANT_ENTITY_ARCHIVED' using errcode = '55000'; end if;
  if current_group.internal_name = normalized_name and current_group.is_visible = requested_visible
    and current_group.lifecycle_status = normalized_lifecycle then
    return query select current_group.id, false, false; return;
  end if;
  update restaurant.modifier_groups set internal_name = normalized_name,
    is_visible = requested_visible, lifecycle_status = normalized_lifecycle
  where id = current_group.id;
  perform private.write_restaurant_audit(
    target_business_id,
    case when normalized_lifecycle = 'archived' then 'restaurant.modifier_group_archived' else 'restaurant.modifier_group_updated' end,
    'restaurant.modifier_group', current_group.id,
    jsonb_build_object('lifecycle_status', normalized_lifecycle)
  );
  return query select current_group.id, false, true;
end;
$$;

create function restaurant.save_modifier(
  target_business_id uuid,
  target_modifier_id uuid,
  target_modifier_group_id uuid,
  requested_internal_name text,
  requested_price_delta_minor bigint,
  requested_visible boolean,
  requested_availability_status text,
  requested_lifecycle_status text,
  requested_display_order integer
)
returns table (modifier_id uuid, created boolean, changed boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid;
  normalized_name text := btrim(requested_internal_name);
  normalized_availability restaurant.availability_status;
  normalized_lifecycle restaurant.lifecycle_status;
  current_modifier restaurant.modifiers%rowtype;
  resolved_id uuid;
begin
  caller_id := private.assert_restaurant_mutation_allowed(target_business_id);
  if normalized_name is null or char_length(normalized_name) not between 1 and 160
    or requested_price_delta_minor not between 0 and 999999999 or requested_visible is null
    or requested_availability_status not in ('available', 'sold_out')
    or requested_lifecycle_status not in ('active', 'archived')
    or requested_display_order not between 0 and 1000000 then
    raise exception 'INVALID_RESTAURANT_MODIFIER' using errcode = '22023';
  end if;
  normalized_availability := requested_availability_status::restaurant.availability_status;
  normalized_lifecycle := requested_lifecycle_status::restaurant.lifecycle_status;
  perform 1 from restaurant.modifier_groups as modifier_group
  where modifier_group.business_id = target_business_id and modifier_group.id = target_modifier_group_id
    and modifier_group.lifecycle_status = 'active';
  if not found then raise exception 'RESTAURANT_MODIFIER_GROUP_NOT_FOUND' using errcode = '22023'; end if;
  if target_modifier_id is null then
    if normalized_lifecycle <> 'active' then raise exception 'INVALID_RESTAURANT_LIFECYCLE' using errcode = '22023'; end if;
    insert into restaurant.modifiers (
      business_id, modifier_group_id, internal_name, price_delta_minor, is_visible,
      availability_status, lifecycle_status, display_order, created_by
    ) values (
      target_business_id, target_modifier_group_id, normalized_name, requested_price_delta_minor,
      requested_visible, normalized_availability, normalized_lifecycle, requested_display_order, caller_id
    ) returning id into resolved_id;
    perform private.write_restaurant_audit(
      target_business_id, 'restaurant.modifier_created', 'restaurant.modifier', resolved_id,
      jsonb_build_object('modifier_group_id', target_modifier_group_id)
    );
    return query select resolved_id, true, true; return;
  end if;
  select modifier.* into current_modifier from restaurant.modifiers as modifier
  where modifier.business_id = target_business_id and modifier.id = target_modifier_id for update;
  if not found then raise exception 'RESTAURANT_MODIFIER_NOT_FOUND' using errcode = '22023'; end if;
  if current_modifier.lifecycle_status = 'archived' then raise exception 'RESTAURANT_ENTITY_ARCHIVED' using errcode = '55000'; end if;
  if current_modifier.modifier_group_id = target_modifier_group_id
    and current_modifier.internal_name = normalized_name
    and current_modifier.price_delta_minor = requested_price_delta_minor
    and current_modifier.is_visible = requested_visible
    and current_modifier.availability_status = normalized_availability
    and current_modifier.lifecycle_status = normalized_lifecycle
    and current_modifier.display_order = requested_display_order then
    return query select current_modifier.id, false, false; return;
  end if;
  update restaurant.modifiers set modifier_group_id = target_modifier_group_id,
    internal_name = normalized_name, price_delta_minor = requested_price_delta_minor,
    is_visible = requested_visible, availability_status = normalized_availability,
    lifecycle_status = normalized_lifecycle, display_order = requested_display_order
  where id = current_modifier.id;
  perform private.write_restaurant_audit(
    target_business_id,
    case when normalized_lifecycle = 'archived' then 'restaurant.modifier_archived' else 'restaurant.modifier_updated' end,
    'restaurant.modifier', current_modifier.id,
    jsonb_build_object('modifier_group_id', target_modifier_group_id, 'lifecycle_status', normalized_lifecycle)
  );
  return query select current_modifier.id, false, true;
end;
$$;

create function restaurant.save_translation(
  target_business_id uuid,
  requested_entity_type text,
  target_entity_id uuid,
  requested_locale_code text,
  requested_name text,
  requested_description text default null
)
returns table (entity_type restaurant.translatable_entity_type, entity_id uuid, locale_code core.locale_code, changed boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_type restaurant.translatable_entity_type;
  normalized_locale core.locale_code;
  normalized_name text := btrim(requested_name);
  normalized_description text := nullif(btrim(requested_description), '');
  affected integer;
begin
  perform private.assert_restaurant_mutation_allowed(target_business_id);
  if requested_entity_type not in ('menu', 'category', 'item', 'item_variant', 'modifier_group', 'modifier')
    or requested_locale_code not in ('ar', 'he', 'en')
    or normalized_name is null or char_length(normalized_name) not between 1 and 160
    or normalized_description is not null and char_length(normalized_description) > 4000 then
    raise exception 'INVALID_RESTAURANT_TRANSLATION' using errcode = '22023';
  end if;
  normalized_type := requested_entity_type::restaurant.translatable_entity_type;
  normalized_locale := requested_locale_code::core.locale_code;

  if normalized_type = 'menu' then
    perform 1 from restaurant.menus where business_id = target_business_id and id = target_entity_id and lifecycle_status = 'active';
    if not found then raise exception 'RESTAURANT_ENTITY_NOT_FOUND' using errcode = '22023'; end if;
    insert into restaurant.menu_translations (business_id, menu_id, locale_code, name, description)
    values (target_business_id, target_entity_id, normalized_locale, normalized_name, normalized_description)
    on conflict on constraint menu_translations_pkey do update
      set name = excluded.name, description = excluded.description
      where (restaurant.menu_translations.name, restaurant.menu_translations.description)
        is distinct from (excluded.name, excluded.description);
  elsif normalized_type = 'category' then
    perform 1 from restaurant.categories where business_id = target_business_id and id = target_entity_id and lifecycle_status = 'active';
    if not found then raise exception 'RESTAURANT_ENTITY_NOT_FOUND' using errcode = '22023'; end if;
    insert into restaurant.category_translations (business_id, category_id, locale_code, name, description)
    values (target_business_id, target_entity_id, normalized_locale, normalized_name, normalized_description)
    on conflict on constraint category_translations_pkey do update
      set name = excluded.name, description = excluded.description
      where (restaurant.category_translations.name, restaurant.category_translations.description)
        is distinct from (excluded.name, excluded.description);
  elsif normalized_type = 'item' then
    perform 1 from restaurant.items where business_id = target_business_id and id = target_entity_id and lifecycle_status = 'active';
    if not found then raise exception 'RESTAURANT_ENTITY_NOT_FOUND' using errcode = '22023'; end if;
    insert into restaurant.item_translations (business_id, item_id, locale_code, name, description)
    values (target_business_id, target_entity_id, normalized_locale, normalized_name, normalized_description)
    on conflict on constraint item_translations_pkey do update
      set name = excluded.name, description = excluded.description
      where (restaurant.item_translations.name, restaurant.item_translations.description)
        is distinct from (excluded.name, excluded.description);
  elsif normalized_type = 'item_variant' then
    if normalized_description is not null then raise exception 'RESTAURANT_TRANSLATION_DESCRIPTION_UNSUPPORTED' using errcode = '22023'; end if;
    perform 1 from restaurant.item_variants where business_id = target_business_id and id = target_entity_id and lifecycle_status = 'active';
    if not found then raise exception 'RESTAURANT_ENTITY_NOT_FOUND' using errcode = '22023'; end if;
    insert into restaurant.item_variant_translations (business_id, item_variant_id, locale_code, name)
    values (target_business_id, target_entity_id, normalized_locale, normalized_name)
    on conflict on constraint item_variant_translations_pkey do update
      set name = excluded.name where restaurant.item_variant_translations.name is distinct from excluded.name;
  elsif normalized_type = 'modifier_group' then
    perform 1 from restaurant.modifier_groups where business_id = target_business_id and id = target_entity_id and lifecycle_status = 'active';
    if not found then raise exception 'RESTAURANT_ENTITY_NOT_FOUND' using errcode = '22023'; end if;
    insert into restaurant.modifier_group_translations (business_id, modifier_group_id, locale_code, name, description)
    values (target_business_id, target_entity_id, normalized_locale, normalized_name, normalized_description)
    on conflict on constraint modifier_group_translations_pkey do update
      set name = excluded.name, description = excluded.description
      where (restaurant.modifier_group_translations.name, restaurant.modifier_group_translations.description)
        is distinct from (excluded.name, excluded.description);
  else
    if normalized_description is not null then raise exception 'RESTAURANT_TRANSLATION_DESCRIPTION_UNSUPPORTED' using errcode = '22023'; end if;
    perform 1 from restaurant.modifiers where business_id = target_business_id and id = target_entity_id and lifecycle_status = 'active';
    if not found then raise exception 'RESTAURANT_ENTITY_NOT_FOUND' using errcode = '22023'; end if;
    insert into restaurant.modifier_translations (business_id, modifier_id, locale_code, name)
    values (target_business_id, target_entity_id, normalized_locale, normalized_name)
    on conflict on constraint modifier_translations_pkey do update
      set name = excluded.name where restaurant.modifier_translations.name is distinct from excluded.name;
  end if;

  get diagnostics affected = row_count;
  if affected = 0 then
    return query select normalized_type, target_entity_id, normalized_locale, false;
    return;
  end if;
  perform private.write_restaurant_audit(
    target_business_id, 'restaurant.translation_saved', 'restaurant.' || normalized_type::text,
    target_entity_id, jsonb_build_object('locale_code', normalized_locale)
  );
  return query select normalized_type, target_entity_id, normalized_locale, true;
end;
$$;

create function restaurant.set_item_modifier_group(
  target_business_id uuid,
  target_item_id uuid,
  target_modifier_group_id uuid,
  requested_minimum_selections integer,
  requested_maximum_selections integer,
  requested_display_order integer
)
returns table (item_id uuid, modifier_group_id uuid, changed boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare affected integer;
begin
  perform private.assert_restaurant_mutation_allowed(target_business_id);
  if requested_minimum_selections not between 0 and 100
    or requested_maximum_selections not between 1 and 100
    or requested_minimum_selections > requested_maximum_selections
    or requested_display_order not between 0 and 1000000 then
    raise exception 'INVALID_RESTAURANT_MODIFIER_ASSIGNMENT' using errcode = '22023';
  end if;
  perform 1 from restaurant.items where business_id = target_business_id and id = target_item_id and lifecycle_status = 'active';
  if not found then raise exception 'RESTAURANT_ITEM_NOT_FOUND' using errcode = '22023'; end if;
  perform 1 from restaurant.modifier_groups where business_id = target_business_id and id = target_modifier_group_id and lifecycle_status = 'active';
  if not found then raise exception 'RESTAURANT_MODIFIER_GROUP_NOT_FOUND' using errcode = '22023'; end if;
  insert into restaurant.item_modifier_groups (
    business_id, item_id, modifier_group_id, minimum_selections, maximum_selections, display_order
  ) values (
    target_business_id, target_item_id, target_modifier_group_id,
    requested_minimum_selections, requested_maximum_selections, requested_display_order
  ) on conflict on constraint item_modifier_groups_pkey do update set
    minimum_selections = excluded.minimum_selections,
    maximum_selections = excluded.maximum_selections,
    display_order = excluded.display_order
  where (restaurant.item_modifier_groups.minimum_selections,
    restaurant.item_modifier_groups.maximum_selections,
    restaurant.item_modifier_groups.display_order)
    is distinct from (excluded.minimum_selections, excluded.maximum_selections, excluded.display_order);
  get diagnostics affected = row_count;
  if affected = 0 then return query select target_item_id, target_modifier_group_id, false; return; end if;
  perform private.write_restaurant_audit(
    target_business_id, 'restaurant.item_modifier_group_assigned', 'restaurant.item', target_item_id,
    jsonb_build_object('modifier_group_id', target_modifier_group_id,
      'minimum_selections', requested_minimum_selections, 'maximum_selections', requested_maximum_selections)
  );
  return query select target_item_id, target_modifier_group_id, true;
end;
$$;

create function restaurant.remove_item_modifier_group(
  target_business_id uuid,
  target_item_id uuid,
  target_modifier_group_id uuid
)
returns table (item_id uuid, modifier_group_id uuid, changed boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare affected integer;
begin
  perform private.assert_restaurant_mutation_allowed(target_business_id);
  delete from restaurant.item_modifier_groups as assignment
  where assignment.business_id = target_business_id
    and assignment.item_id = target_item_id
    and assignment.modifier_group_id = target_modifier_group_id;
  get diagnostics affected = row_count;
  if affected = 0 then return query select target_item_id, target_modifier_group_id, false; return; end if;
  perform private.write_restaurant_audit(
    target_business_id, 'restaurant.item_modifier_group_removed', 'restaurant.item', target_item_id,
    jsonb_build_object('modifier_group_id', target_modifier_group_id)
  );
  return query select target_item_id, target_modifier_group_id, true;
end;
$$;

create function restaurant.set_item_location_availability(
  target_business_id uuid,
  target_item_id uuid,
  target_location_id uuid,
  requested_availability_status text
)
returns table (item_id uuid, location_id uuid, availability_status restaurant.availability_status, changed boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_availability restaurant.availability_status;
  current_availability restaurant.availability_status;
  affected integer;
begin
  perform private.assert_restaurant_mutation_allowed(target_business_id);
  perform 1 from restaurant.items where business_id = target_business_id and id = target_item_id and lifecycle_status = 'active';
  if not found then raise exception 'RESTAURANT_ITEM_NOT_FOUND' using errcode = '22023'; end if;
  perform 1 from core.locations where business_id = target_business_id and id = target_location_id and status <> 'archived';
  if not found then raise exception 'RESTAURANT_LOCATION_NOT_FOUND' using errcode = '22023'; end if;

  if requested_availability_status is null then
    delete from restaurant.item_location_availability as location_availability
    where location_availability.business_id = target_business_id
      and location_availability.item_id = target_item_id
      and location_availability.location_id = target_location_id;
    get diagnostics affected = row_count;
    if affected = 0 then return query select target_item_id, target_location_id, null::restaurant.availability_status, false; return; end if;
    perform private.write_restaurant_audit(
      target_business_id, 'restaurant.item_location_availability_changed', 'restaurant.item', target_item_id,
      jsonb_build_object('location_id', target_location_id, 'override', null)
    );
    return query select target_item_id, target_location_id, null::restaurant.availability_status, true; return;
  end if;
  if requested_availability_status not in ('available', 'sold_out') then
    raise exception 'INVALID_RESTAURANT_AVAILABILITY' using errcode = '22023';
  end if;
  normalized_availability := requested_availability_status::restaurant.availability_status;
  select availability.availability_status into current_availability
  from restaurant.item_location_availability as availability
  where availability.business_id = target_business_id and availability.item_id = target_item_id
    and availability.location_id = target_location_id for update;
  if found and current_availability = normalized_availability then
    return query select target_item_id, target_location_id, normalized_availability, false; return;
  end if;
  insert into restaurant.item_location_availability (
    business_id, item_id, location_id, availability_status
  ) values (target_business_id, target_item_id, target_location_id, normalized_availability)
  on conflict on constraint item_location_availability_pkey do update
    set availability_status = excluded.availability_status;
  perform private.write_restaurant_audit(
    target_business_id, 'restaurant.item_location_availability_changed', 'restaurant.item', target_item_id,
    jsonb_build_object('location_id', target_location_id, 'override', normalized_availability)
  );
  return query select target_item_id, target_location_id, normalized_availability, true;
end;
$$;

comment on function restaurant.save_translation(uuid, text, uuid, text, text, text) is
  'Upserts one supported translation entity through fixed branches; it is not dynamic SQL or a generic JSON command.';
comment on function restaurant.set_item_location_availability(uuid, uuid, uuid, text) is
  'Sets an explicit location availability override, or removes it when the requested state is null so base availability is inherited.';

revoke execute on function private.assert_restaurant_mutation_allowed(uuid)
  from public, anon, authenticated, service_role;
revoke execute on function private.write_restaurant_audit(uuid, text, text, uuid, jsonb)
  from public, anon, authenticated, service_role;

revoke execute on all functions in schema restaurant from public, anon, authenticated, service_role;
grant execute on function restaurant.save_configuration(uuid, boolean) to authenticated;
grant execute on function restaurant.save_menu(uuid, uuid, text, text, text, integer) to authenticated;
grant execute on function restaurant.save_category(uuid, uuid, uuid, text, uuid, boolean, text, integer) to authenticated;
grant execute on function restaurant.save_item(uuid, uuid, uuid, uuid, text, bigint, uuid, boolean, text, text, integer) to authenticated;
grant execute on function restaurant.save_item_variant(uuid, uuid, uuid, text, bigint, boolean, text, text, integer) to authenticated;
grant execute on function restaurant.save_modifier_group(uuid, uuid, text, boolean, text) to authenticated;
grant execute on function restaurant.save_modifier(uuid, uuid, uuid, text, bigint, boolean, text, text, integer) to authenticated;
grant execute on function restaurant.save_translation(uuid, text, uuid, text, text, text) to authenticated;
grant execute on function restaurant.set_item_modifier_group(uuid, uuid, uuid, integer, integer, integer) to authenticated;
grant execute on function restaurant.remove_item_modifier_group(uuid, uuid, uuid) to authenticated;
grant execute on function restaurant.set_item_location_availability(uuid, uuid, uuid, text) to authenticated;
