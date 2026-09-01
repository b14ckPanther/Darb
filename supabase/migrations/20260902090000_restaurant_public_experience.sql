insert into core.templates (
  key,
  module_key,
  display_name,
  description,
  is_default,
  sort_order,
  default_theme
)
values (
  'restaurant-signature',
  'restaurant',
  'Signature',
  'An editorial, image-led composition for customer-facing Restaurant menus.',
  true,
  10,
  '{
    "colors": {
      "page": "#F6F0E6", "surface": "#FFFCF5", "elevated": "#FFFFFF",
      "primary": "#173C32", "onPrimary": "#FFFFFF", "accent": "#B35A36",
      "textPrimary": "#18231F", "textSecondary": "#4F5E58", "textMuted": "#68756F",
      "border": "#D5D2C8", "success": "#1E684B", "warning": "#8A5B17", "danger": "#A33D3D"
    },
    "typography": {
      "headingWeight": 700, "bodyWeight": 400, "scale": "generous",
      "tracking": "normal", "lineHeight": "comfortable"
    },
    "shape": { "radius": "rounded", "border": "hairline" },
    "density": "comfortable", "shadow": "subtle", "motion": "subtle",
    "layout": {
      "contentWidth": "wide", "sectionSpacing": "comfortable",
      "heroTreatment": "immersive", "cardImageRatio": "landscape"
    }
  }'::jsonb
);

comment on column core.templates.module_key is
  'Engine/capability context for the composition. Restaurant public rendering resolves only Restaurant templates.';

create function public.get_restaurant_publication(requested_business_slug text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with candidate_business as (
    select
      business.id,
      business.slug,
      business.display_name,
      business.default_locale,
      business.currency_code,
      business.timezone
    from core.businesses as business
    join core.business_modules as state
      on state.business_id = business.id
      and state.module_key = 'restaurant'
      and state.is_enabled
    join core.modules as module
      on module.key = state.module_key
      and module.is_available
    join restaurant.configurations as configuration
      on configuration.business_id = business.id
      and configuration.is_publicly_active
    where business.status = 'active'
      and business.slug = lower(btrim(requested_business_slug))
      and requested_business_slug is not null
      and lower(btrim(requested_business_slug)) ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  publication_context as (
    select
      business.*,
      template.key as template_key,
      template.template_version,
      template.theme_schema_version,
      template.default_theme,
      coalesce(settings.theme_overrides, '{}'::jsonb) as theme_overrides
    from candidate_business as business
    left join core.business_visual_settings as settings
      on settings.business_id = business.id
      and settings.module_key = 'restaurant'
    cross join lateral (
      select candidate.*
      from core.templates as candidate
      where candidate.module_key = 'restaurant'
        and candidate.is_available
      order by
        case when candidate.key = settings.template_key then 0 else 1 end,
        candidate.is_default desc,
        candidate.sort_order,
        candidate.key
      limit 1
    ) as template
  )
  select jsonb_build_object(
    'version', 1,
    'business', jsonb_build_object(
      'slug', business.slug,
      'displayName', business.display_name,
      'defaultLocale', business.default_locale,
      'currencyCode', business.currency_code,
      'timezone', business.timezone
    ),
    'locales', coalesce((
      select jsonb_agg(locale.locale_code order by
        case when locale.locale_code = business.default_locale then 0 else 1 end,
        array_position(array['ar', 'he', 'en']::core.locale_code[], locale.locale_code)
      )
      from core.business_locales as locale
      where locale.business_id = business.id
        and locale.is_enabled
    ), '[]'::jsonb),
    'locations', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', location.id,
        'displayName', location.display_name,
        'addressLine', location.address_line,
        'locality', location.locality,
        'postalCode', location.postal_code,
        'countryCode', location.country_code,
        'timezone', coalesce(location.timezone, business.timezone)
      ) order by location.display_name, location.id)
      from core.locations as location
      where location.business_id = business.id
        and location.status = 'active'
    ), '[]'::jsonb),
    'appearance', jsonb_build_object(
      'templateKey', business.template_key,
      'templateVersion', business.template_version,
      'themeSchemaVersion', business.theme_schema_version,
      'defaultTheme', business.default_theme,
      'overrides', business.theme_overrides
    ),
    'menus', coalesce((
      select jsonb_agg(menu.payload order by menu.display_order, menu.id)
      from (
        select
          menu.id,
          menu.display_order,
          jsonb_build_object(
            'id', menu.id,
            'translations', coalesce((
              select jsonb_agg(jsonb_build_object(
                'locale', translation.locale_code,
                'name', translation.name,
                'description', translation.description
              ) order by array_position(
                array['ar', 'he', 'en']::core.locale_code[], translation.locale_code
              ))
              from restaurant.menu_translations as translation
              join core.business_locales as locale
                on locale.business_id = translation.business_id
                and locale.locale_code = translation.locale_code
                and locale.is_enabled
              where translation.business_id = business.id
                and translation.menu_id = menu.id
            ), '[]'::jsonb),
            'categories', coalesce((
              select jsonb_agg(category.payload order by category.display_order, category.id)
              from (
                select
                  category.id,
                  category.display_order,
                  jsonb_build_object(
                    'id', category.id,
                    'translations', coalesce((
                      select jsonb_agg(jsonb_build_object(
                        'locale', translation.locale_code,
                        'name', translation.name,
                        'description', translation.description
                      ) order by array_position(
                        array['ar', 'he', 'en']::core.locale_code[], translation.locale_code
                      ))
                      from restaurant.category_translations as translation
                      join core.business_locales as locale
                        on locale.business_id = translation.business_id
                        and locale.locale_code = translation.locale_code
                        and locale.is_enabled
                      where translation.business_id = business.id
                        and translation.category_id = category.id
                    ), '[]'::jsonb),
                    'image', (
                      select jsonb_build_object(
                        'storageBucket', asset.storage_bucket,
                        'storagePath', asset.storage_path,
                        'altText', asset.alt_text,
                        'width', asset.width,
                        'height', asset.height
                      )
                      from core.media_assets as asset
                      where asset.business_id = business.id
                        and asset.id = category.image_media_asset_id
                        and asset.media_kind = 'image'
                        and asset.status = 'active'
                    ),
                    'items', coalesce((
                      select jsonb_agg(item.payload order by item.display_order, item.id)
                      from (
                        select
                          item.id,
                          item.display_order,
                          jsonb_build_object(
                            'id', item.id,
                            'basePriceMinor', item.base_price_minor,
                            'availabilityStatus', item.availability_status,
                            'translations', coalesce((
                              select jsonb_agg(jsonb_build_object(
                                'locale', translation.locale_code,
                                'name', translation.name,
                                'description', translation.description
                              ) order by array_position(
                                array['ar', 'he', 'en']::core.locale_code[], translation.locale_code
                              ))
                              from restaurant.item_translations as translation
                              join core.business_locales as locale
                                on locale.business_id = translation.business_id
                                and locale.locale_code = translation.locale_code
                                and locale.is_enabled
                              where translation.business_id = business.id
                                and translation.item_id = item.id
                            ), '[]'::jsonb),
                            'image', (
                              select jsonb_build_object(
                                'storageBucket', asset.storage_bucket,
                                'storagePath', asset.storage_path,
                                'altText', asset.alt_text,
                                'width', asset.width,
                                'height', asset.height
                              )
                              from core.media_assets as asset
                              where asset.business_id = business.id
                                and asset.id = item.image_media_asset_id
                                and asset.media_kind = 'image'
                                and asset.status = 'active'
                            ),
                            'locationAvailability', coalesce((
                              select jsonb_agg(jsonb_build_object(
                                'locationId', availability.location_id,
                                'availabilityStatus', availability.availability_status
                              ) order by availability.location_id)
                              from restaurant.item_location_availability as availability
                              join core.locations as location
                                on location.business_id = availability.business_id
                                and location.id = availability.location_id
                                and location.status = 'active'
                              where availability.business_id = business.id
                                and availability.item_id = item.id
                            ), '[]'::jsonb),
                            'variants', coalesce((
                              select jsonb_agg(jsonb_build_object(
                                'id', variant.id,
                                'priceMinor', variant.price_minor,
                                'availabilityStatus', variant.availability_status,
                                'translations', coalesce((
                                  select jsonb_agg(jsonb_build_object(
                                    'locale', translation.locale_code,
                                    'name', translation.name
                                  ) order by array_position(
                                    array['ar', 'he', 'en']::core.locale_code[], translation.locale_code
                                  ))
                                  from restaurant.item_variant_translations as translation
                                  join core.business_locales as locale
                                    on locale.business_id = translation.business_id
                                    and locale.locale_code = translation.locale_code
                                    and locale.is_enabled
                                  where translation.business_id = business.id
                                    and translation.item_variant_id = variant.id
                                ), '[]'::jsonb)
                              ) order by variant.display_order, variant.id)
                              from restaurant.item_variants as variant
                              where variant.business_id = business.id
                                and variant.item_id = item.id
                                and variant.lifecycle_status = 'active'
                                and variant.is_visible
                                and exists (
                                  select 1
                                  from restaurant.item_variant_translations as translation
                                  join core.business_locales as locale
                                    on locale.business_id = translation.business_id
                                    and locale.locale_code = translation.locale_code
                                    and locale.is_enabled
                                  where translation.business_id = business.id
                                    and translation.item_variant_id = variant.id
                                )
                            ), '[]'::jsonb),
                            'modifierGroups', coalesce((
                              select jsonb_agg(jsonb_build_object(
                                'id', modifier_group.id,
                                'minimumSelections', assignment.minimum_selections,
                                'maximumSelections', assignment.maximum_selections,
                                'translations', coalesce((
                                  select jsonb_agg(jsonb_build_object(
                                    'locale', translation.locale_code,
                                    'name', translation.name,
                                    'description', translation.description
                                  ) order by array_position(
                                    array['ar', 'he', 'en']::core.locale_code[], translation.locale_code
                                  ))
                                  from restaurant.modifier_group_translations as translation
                                  join core.business_locales as locale
                                    on locale.business_id = translation.business_id
                                    and locale.locale_code = translation.locale_code
                                    and locale.is_enabled
                                  where translation.business_id = business.id
                                    and translation.modifier_group_id = modifier_group.id
                                ), '[]'::jsonb),
                                'modifiers', coalesce((
                                  select jsonb_agg(jsonb_build_object(
                                    'id', modifier.id,
                                    'priceDeltaMinor', modifier.price_delta_minor,
                                    'availabilityStatus', modifier.availability_status,
                                    'translations', coalesce((
                                      select jsonb_agg(jsonb_build_object(
                                        'locale', translation.locale_code,
                                        'name', translation.name
                                      ) order by array_position(
                                        array['ar', 'he', 'en']::core.locale_code[], translation.locale_code
                                      ))
                                      from restaurant.modifier_translations as translation
                                      join core.business_locales as locale
                                        on locale.business_id = translation.business_id
                                        and locale.locale_code = translation.locale_code
                                        and locale.is_enabled
                                      where translation.business_id = business.id
                                        and translation.modifier_id = modifier.id
                                    ), '[]'::jsonb)
                                  ) order by modifier.display_order, modifier.id)
                                  from restaurant.modifiers as modifier
                                  where modifier.business_id = business.id
                                    and modifier.modifier_group_id = modifier_group.id
                                    and modifier.lifecycle_status = 'active'
                                    and modifier.is_visible
                                    and exists (
                                      select 1
                                      from restaurant.modifier_translations as translation
                                      join core.business_locales as locale
                                        on locale.business_id = translation.business_id
                                        and locale.locale_code = translation.locale_code
                                        and locale.is_enabled
                                      where translation.business_id = business.id
                                        and translation.modifier_id = modifier.id
                                    )
                                ), '[]'::jsonb)
                              ) order by assignment.display_order, modifier_group.id)
                              from restaurant.item_modifier_groups as assignment
                              join restaurant.modifier_groups as modifier_group
                                on modifier_group.business_id = assignment.business_id
                                and modifier_group.id = assignment.modifier_group_id
                              where assignment.business_id = business.id
                                and assignment.item_id = item.id
                                and modifier_group.lifecycle_status = 'active'
                                and modifier_group.is_visible
                                and exists (
                                  select 1
                                  from restaurant.modifier_group_translations as translation
                                  join core.business_locales as locale
                                    on locale.business_id = translation.business_id
                                    and locale.locale_code = translation.locale_code
                                    and locale.is_enabled
                                  where translation.business_id = business.id
                                    and translation.modifier_group_id = modifier_group.id
                                )
                            ), '[]'::jsonb)
                          ) as payload
                        from restaurant.items as item
                        where item.business_id = business.id
                          and item.menu_id = menu.id
                          and item.category_id = category.id
                          and item.lifecycle_status = 'active'
                          and item.is_visible
                          and exists (
                            select 1
                            from restaurant.item_translations as translation
                            join core.business_locales as locale
                              on locale.business_id = translation.business_id
                              and locale.locale_code = translation.locale_code
                              and locale.is_enabled
                            where translation.business_id = business.id
                              and translation.item_id = item.id
                          )
                      ) as item
                    ), '[]'::jsonb)
                  ) as payload
                from restaurant.categories as category
                where category.business_id = business.id
                  and category.menu_id = menu.id
                  and category.lifecycle_status = 'active'
                  and category.is_visible
                  and exists (
                    select 1
                    from restaurant.category_translations as translation
                    join core.business_locales as locale
                      on locale.business_id = translation.business_id
                      and locale.locale_code = translation.locale_code
                      and locale.is_enabled
                    where translation.business_id = business.id
                      and translation.category_id = category.id
                  )
              ) as category
            ), '[]'::jsonb)
          ) as payload
        from restaurant.menus as menu
        where menu.business_id = business.id
          and menu.publication_status = 'published'
          and menu.lifecycle_status = 'active'
          and exists (
            select 1
            from restaurant.menu_translations as translation
            join core.business_locales as locale
              on locale.business_id = translation.business_id
              and locale.locale_code = translation.locale_code
              and locale.is_enabled
            where translation.business_id = business.id
              and translation.menu_id = menu.id
          )
      ) as menu
    ), '[]'::jsonb)
  )
  from publication_context as business;
$$;

comment on function public.get_restaurant_publication(text) is
  'Anonymous-safe Restaurant render projection. It fail-closes on business, capability, configuration, template, publication, visibility, lifecycle, locale, media, and tenant ownership gates.';

revoke execute on function public.get_restaurant_publication(text)
  from public, anon, authenticated, service_role;
grant execute on function public.get_restaurant_publication(text)
  to anon, authenticated;
