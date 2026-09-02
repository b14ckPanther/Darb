create function public.list_public_restaurant_sitemap()
returns table (
  business_slug text,
  default_locale core.locale_code,
  locales core.locale_code[],
  primary_hostname text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    business.slug as business_slug,
    business.default_locale,
    locale_state.locales,
    (
      select domain.hostname
      from core.business_domains as domain
      where domain.business_id = business.id
        and domain.target_module_key = 'restaurant'
        and domain.status = 'verified'
        and domain.routing_status = 'live'
        and domain.is_primary
    ) as primary_hostname
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
  cross join lateral (
    select array_agg(
      locale.locale_code
      order by
        case when locale.locale_code = business.default_locale then 0 else 1 end,
        array_position(array['ar', 'he', 'en']::core.locale_code[], locale.locale_code)
    ) as locales
    from core.business_locales as locale
    where locale.business_id = business.id
      and locale.is_enabled
  ) as locale_state
  where business.status = 'active'
    and locale_state.locales is not null
    and exists (
      select 1
      from core.templates as template
      where template.module_key = 'restaurant'
        and template.is_available
    )
    and exists (
      select 1
      from restaurant.menus as menu
      join restaurant.menu_translations as translation
        on translation.business_id = menu.business_id
        and translation.menu_id = menu.id
      join core.business_locales as locale
        on locale.business_id = translation.business_id
        and locale.locale_code = translation.locale_code
        and locale.is_enabled
      where menu.business_id = business.id
        and menu.publication_status = 'published'
        and menu.lifecycle_status = 'active'
    )
  order by business.slug;
$$;

comment on function public.list_public_restaurant_sitemap() is
  'Anonymous-safe discovery projection for indexable Restaurant experiences. It exposes only canonical slug, enabled locales, and an optional trusted primary hostname.';

revoke execute on function public.list_public_restaurant_sitemap()
  from public, anon, authenticated, service_role;
grant execute on function public.list_public_restaurant_sitemap()
  to anon, authenticated;
