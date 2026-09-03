create function private.ensure_restaurant_default_translation(
  target_business_id uuid,
  requested_entity_type text,
  target_entity_id uuid,
  requested_name text
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  default_locale core.locale_code;
  normalized_name text := btrim(requested_name);
  affected integer := 0;
begin
  if requested_entity_type not in (
    'menu', 'category', 'item', 'item_variant', 'modifier_group', 'modifier'
  ) or normalized_name is null or char_length(normalized_name) not between 1 and 160 then
    raise exception 'INVALID_RESTAURANT_TRANSLATION' using errcode = '22023';
  end if;

  select business.default_locale
    into default_locale
    from core.businesses as business
    join core.business_locales as locale
      on locale.business_id = business.id
      and locale.locale_code = business.default_locale
      and locale.is_enabled
    where business.id = target_business_id;

  if not found then
    raise exception 'BUSINESS_DEFAULT_LOCALE_UNAVAILABLE' using errcode = '55000';
  end if;

  if requested_entity_type = 'menu' then
    insert into restaurant.menu_translations (business_id, menu_id, locale_code, name)
    values (target_business_id, target_entity_id, default_locale, normalized_name)
    on conflict on constraint menu_translations_pkey do nothing;
  elsif requested_entity_type = 'category' then
    insert into restaurant.category_translations (business_id, category_id, locale_code, name)
    values (target_business_id, target_entity_id, default_locale, normalized_name)
    on conflict on constraint category_translations_pkey do nothing;
  elsif requested_entity_type = 'item' then
    insert into restaurant.item_translations (business_id, item_id, locale_code, name)
    values (target_business_id, target_entity_id, default_locale, normalized_name)
    on conflict on constraint item_translations_pkey do nothing;
  elsif requested_entity_type = 'item_variant' then
    insert into restaurant.item_variant_translations (
      business_id, item_variant_id, locale_code, name
    ) values (target_business_id, target_entity_id, default_locale, normalized_name)
    on conflict on constraint item_variant_translations_pkey do nothing;
  elsif requested_entity_type = 'modifier_group' then
    insert into restaurant.modifier_group_translations (
      business_id, modifier_group_id, locale_code, name
    ) values (target_business_id, target_entity_id, default_locale, normalized_name)
    on conflict on constraint modifier_group_translations_pkey do nothing;
  else
    insert into restaurant.modifier_translations (business_id, modifier_id, locale_code, name)
    values (target_business_id, target_entity_id, default_locale, normalized_name)
    on conflict on constraint modifier_translations_pkey do nothing;
  end if;

  get diagnostics affected = row_count;
  if affected = 0 then
    return false;
  end if;

  perform private.write_restaurant_audit(
    target_business_id,
    'restaurant.translation_saved',
    'restaurant.' || requested_entity_type,
    target_entity_id,
    jsonb_build_object('locale_code', default_locale, 'source', 'default_locale_fallback')
  );
  return true;
end;
$$;

comment on function private.ensure_restaurant_default_translation(uuid, text, uuid, text) is
  'Creates a missing default-locale public name from the Admin-entered internal name without overwriting an explicit translation.';

create function restaurant.save_localized_menu(
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
  saved record;
  translation_created boolean := false;
begin
  select * into saved from restaurant.save_menu(
    target_business_id, target_menu_id, requested_internal_name,
    requested_publication_status, requested_lifecycle_status, requested_display_order
  );
  if requested_lifecycle_status = 'active' then
    translation_created := private.ensure_restaurant_default_translation(
      target_business_id, 'menu', saved.menu_id, requested_internal_name
    );
  end if;
  return query select saved.menu_id, saved.created, saved.changed or translation_created;
end;
$$;

create function restaurant.save_localized_category(
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
  saved record;
  translation_created boolean := false;
begin
  select * into saved from restaurant.save_category(
    target_business_id, target_category_id, target_menu_id, requested_internal_name,
    requested_image_media_asset_id, requested_visible, requested_lifecycle_status,
    requested_display_order
  );
  if requested_lifecycle_status = 'active' then
    translation_created := private.ensure_restaurant_default_translation(
      target_business_id, 'category', saved.category_id, requested_internal_name
    );
  end if;
  return query select saved.category_id, saved.created, saved.changed or translation_created;
end;
$$;

create function restaurant.save_localized_item(
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
  saved record;
  translation_created boolean := false;
begin
  select * into saved from restaurant.save_item(
    target_business_id, target_item_id, target_menu_id, target_category_id,
    requested_internal_name, requested_base_price_minor, requested_image_media_asset_id,
    requested_visible, requested_availability_status, requested_lifecycle_status,
    requested_display_order
  );
  if requested_lifecycle_status = 'active' then
    translation_created := private.ensure_restaurant_default_translation(
      target_business_id, 'item', saved.item_id, requested_internal_name
    );
  end if;
  return query select saved.item_id, saved.created, saved.changed or translation_created;
end;
$$;

create function restaurant.save_localized_item_variant(
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
  saved record;
  translation_created boolean := false;
begin
  select * into saved from restaurant.save_item_variant(
    target_business_id, target_variant_id, target_item_id, requested_internal_name,
    requested_price_minor, requested_visible, requested_availability_status,
    requested_lifecycle_status, requested_display_order
  );
  if requested_lifecycle_status = 'active' then
    translation_created := private.ensure_restaurant_default_translation(
      target_business_id, 'item_variant', saved.variant_id, requested_internal_name
    );
  end if;
  return query select saved.variant_id, saved.created, saved.changed or translation_created;
end;
$$;

create function restaurant.save_localized_modifier_group(
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
  saved record;
  translation_created boolean := false;
begin
  select * into saved from restaurant.save_modifier_group(
    target_business_id, target_modifier_group_id, requested_internal_name,
    requested_visible, requested_lifecycle_status
  );
  if requested_lifecycle_status = 'active' then
    translation_created := private.ensure_restaurant_default_translation(
      target_business_id, 'modifier_group', saved.modifier_group_id, requested_internal_name
    );
  end if;
  return query
    select saved.modifier_group_id, saved.created, saved.changed or translation_created;
end;
$$;

create function restaurant.save_localized_modifier(
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
  saved record;
  translation_created boolean := false;
begin
  select * into saved from restaurant.save_modifier(
    target_business_id, target_modifier_id, target_modifier_group_id,
    requested_internal_name, requested_price_delta_minor, requested_visible,
    requested_availability_status, requested_lifecycle_status, requested_display_order
  );
  if requested_lifecycle_status = 'active' then
    translation_created := private.ensure_restaurant_default_translation(
      target_business_id, 'modifier', saved.modifier_id, requested_internal_name
    );
  end if;
  return query select saved.modifier_id, saved.created, saved.changed or translation_created;
end;
$$;

comment on function restaurant.save_localized_menu(uuid, uuid, text, text, text, integer) is
  'Atomically saves a menu and supplies a missing default-locale public name.';
comment on function restaurant.save_localized_category(uuid, uuid, uuid, text, uuid, boolean, text, integer) is
  'Atomically saves a category and supplies a missing default-locale public name.';
comment on function restaurant.save_localized_item(uuid, uuid, uuid, uuid, text, bigint, uuid, boolean, text, text, integer) is
  'Atomically saves an item and supplies a missing default-locale public name.';
comment on function restaurant.save_localized_item_variant(uuid, uuid, uuid, text, bigint, boolean, text, text, integer) is
  'Atomically saves a variant and supplies a missing default-locale public name.';
comment on function restaurant.save_localized_modifier_group(uuid, uuid, text, boolean, text) is
  'Atomically saves a modifier group and supplies a missing default-locale public name.';
comment on function restaurant.save_localized_modifier(uuid, uuid, uuid, text, bigint, boolean, text, text, integer) is
  'Atomically saves a modifier and supplies a missing default-locale public name.';

revoke execute on function private.ensure_restaurant_default_translation(uuid, text, uuid, text)
  from public, anon, authenticated, service_role;
revoke execute on function restaurant.save_localized_menu(uuid, uuid, text, text, text, integer)
  from public, anon, authenticated, service_role;
revoke execute on function restaurant.save_localized_category(uuid, uuid, uuid, text, uuid, boolean, text, integer)
  from public, anon, authenticated, service_role;
revoke execute on function restaurant.save_localized_item(uuid, uuid, uuid, uuid, text, bigint, uuid, boolean, text, text, integer)
  from public, anon, authenticated, service_role;
revoke execute on function restaurant.save_localized_item_variant(uuid, uuid, uuid, text, bigint, boolean, text, text, integer)
  from public, anon, authenticated, service_role;
revoke execute on function restaurant.save_localized_modifier_group(uuid, uuid, text, boolean, text)
  from public, anon, authenticated, service_role;
revoke execute on function restaurant.save_localized_modifier(uuid, uuid, uuid, text, bigint, boolean, text, text, integer)
  from public, anon, authenticated, service_role;

grant execute on function restaurant.save_localized_menu(uuid, uuid, text, text, text, integer)
  to authenticated;
grant execute on function restaurant.save_localized_category(uuid, uuid, uuid, text, uuid, boolean, text, integer)
  to authenticated;
grant execute on function restaurant.save_localized_item(uuid, uuid, uuid, uuid, text, bigint, uuid, boolean, text, text, integer)
  to authenticated;
grant execute on function restaurant.save_localized_item_variant(uuid, uuid, uuid, text, bigint, boolean, text, text, integer)
  to authenticated;
grant execute on function restaurant.save_localized_modifier_group(uuid, uuid, text, boolean, text)
  to authenticated;
grant execute on function restaurant.save_localized_modifier(uuid, uuid, uuid, text, bigint, boolean, text, text, integer)
  to authenticated;

-- Existing records that were explicitly marked for public delivery are repaired once. The
-- renderer still consumes translation tables only; internal names are never projected directly.
insert into restaurant.menu_translations (business_id, menu_id, locale_code, name)
select menu.business_id, menu.id, business.default_locale, menu.internal_name
from restaurant.menus as menu
join core.businesses as business on business.id = menu.business_id
join core.business_locales as locale
  on locale.business_id = business.id
  and locale.locale_code = business.default_locale
  and locale.is_enabled
where menu.lifecycle_status = 'active'
  and menu.publication_status = 'published'
on conflict on constraint menu_translations_pkey do nothing;

insert into restaurant.category_translations (business_id, category_id, locale_code, name)
select category.business_id, category.id, business.default_locale, category.internal_name
from restaurant.categories as category
join restaurant.menus as menu
  on menu.business_id = category.business_id and menu.id = category.menu_id
join core.businesses as business on business.id = category.business_id
join core.business_locales as locale
  on locale.business_id = business.id
  and locale.locale_code = business.default_locale
  and locale.is_enabled
where menu.lifecycle_status = 'active'
  and menu.publication_status = 'published'
  and category.lifecycle_status = 'active'
  and category.is_visible
on conflict on constraint category_translations_pkey do nothing;

insert into restaurant.item_translations (business_id, item_id, locale_code, name)
select item.business_id, item.id, business.default_locale, item.internal_name
from restaurant.items as item
join restaurant.menus as menu
  on menu.business_id = item.business_id and menu.id = item.menu_id
join restaurant.categories as category
  on category.business_id = item.business_id and category.id = item.category_id
join core.businesses as business on business.id = item.business_id
join core.business_locales as locale
  on locale.business_id = business.id
  and locale.locale_code = business.default_locale
  and locale.is_enabled
where menu.lifecycle_status = 'active'
  and menu.publication_status = 'published'
  and category.lifecycle_status = 'active'
  and category.is_visible
  and item.lifecycle_status = 'active'
  and item.is_visible
on conflict on constraint item_translations_pkey do nothing;

insert into restaurant.item_variant_translations (
  business_id, item_variant_id, locale_code, name
)
select variant.business_id, variant.id, business.default_locale, variant.internal_name
from restaurant.item_variants as variant
join restaurant.items as item
  on item.business_id = variant.business_id and item.id = variant.item_id
join restaurant.menus as menu
  on menu.business_id = item.business_id and menu.id = item.menu_id
join restaurant.categories as category
  on category.business_id = item.business_id and category.id = item.category_id
join core.businesses as business on business.id = variant.business_id
join core.business_locales as locale
  on locale.business_id = business.id
  and locale.locale_code = business.default_locale
  and locale.is_enabled
where menu.lifecycle_status = 'active'
  and menu.publication_status = 'published'
  and category.lifecycle_status = 'active'
  and category.is_visible
  and item.lifecycle_status = 'active'
  and item.is_visible
  and variant.lifecycle_status = 'active'
  and variant.is_visible
on conflict on constraint item_variant_translations_pkey do nothing;

insert into restaurant.modifier_group_translations (
  business_id, modifier_group_id, locale_code, name
)
select distinct modifier_group.business_id, modifier_group.id,
  business.default_locale, modifier_group.internal_name
from restaurant.modifier_groups as modifier_group
join restaurant.item_modifier_groups as assignment
  on assignment.business_id = modifier_group.business_id
  and assignment.modifier_group_id = modifier_group.id
join restaurant.items as item
  on item.business_id = assignment.business_id and item.id = assignment.item_id
join restaurant.menus as menu
  on menu.business_id = item.business_id and menu.id = item.menu_id
join restaurant.categories as category
  on category.business_id = item.business_id and category.id = item.category_id
join core.businesses as business on business.id = modifier_group.business_id
join core.business_locales as locale
  on locale.business_id = business.id
  and locale.locale_code = business.default_locale
  and locale.is_enabled
where menu.lifecycle_status = 'active'
  and menu.publication_status = 'published'
  and category.lifecycle_status = 'active'
  and category.is_visible
  and item.lifecycle_status = 'active'
  and item.is_visible
  and modifier_group.lifecycle_status = 'active'
  and modifier_group.is_visible
on conflict on constraint modifier_group_translations_pkey do nothing;

insert into restaurant.modifier_translations (business_id, modifier_id, locale_code, name)
select distinct modifier.business_id, modifier.id, business.default_locale, modifier.internal_name
from restaurant.modifiers as modifier
join restaurant.modifier_groups as modifier_group
  on modifier_group.business_id = modifier.business_id
  and modifier_group.id = modifier.modifier_group_id
join restaurant.item_modifier_groups as assignment
  on assignment.business_id = modifier_group.business_id
  and assignment.modifier_group_id = modifier_group.id
join restaurant.items as item
  on item.business_id = assignment.business_id and item.id = assignment.item_id
join restaurant.menus as menu
  on menu.business_id = item.business_id and menu.id = item.menu_id
join restaurant.categories as category
  on category.business_id = item.business_id and category.id = item.category_id
join core.businesses as business on business.id = modifier.business_id
join core.business_locales as locale
  on locale.business_id = business.id
  and locale.locale_code = business.default_locale
  and locale.is_enabled
where menu.lifecycle_status = 'active'
  and menu.publication_status = 'published'
  and category.lifecycle_status = 'active'
  and category.is_visible
  and item.lifecycle_status = 'active'
  and item.is_visible
  and modifier_group.lifecycle_status = 'active'
  and modifier_group.is_visible
  and modifier.lifecycle_status = 'active'
  and modifier.is_visible
on conflict on constraint modifier_translations_pkey do nothing;
