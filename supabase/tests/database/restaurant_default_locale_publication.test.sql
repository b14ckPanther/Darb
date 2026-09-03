begin;

create extension if not exists pgtap with schema extensions;

select no_plan();

select has_function(
  'restaurant',
  'save_localized_menu',
  array['uuid', 'uuid', 'text', 'text', 'text', 'integer'],
  'localized menu mutation boundary exists'
);
select has_function(
  'restaurant',
  'save_localized_category',
  array['uuid', 'uuid', 'uuid', 'text', 'uuid', 'boolean', 'text', 'integer'],
  'localized category mutation boundary exists'
);
select has_function(
  'restaurant',
  'save_localized_item',
  array[
    'uuid', 'uuid', 'uuid', 'uuid', 'text', 'bigint', 'uuid', 'boolean',
    'text', 'text', 'integer'
  ],
  'localized item mutation boundary exists'
);
select ok(
  has_function_privilege(
    'authenticated',
    'restaurant.save_localized_menu(uuid,uuid,text,text,text,integer)',
    'execute'
  ),
  'authenticated callers may execute the guarded localized menu RPC'
);
select ok(
  not has_function_privilege(
    'anon',
    'restaurant.save_localized_menu(uuid,uuid,text,text,text,integer)',
    'execute'
  ),
  'anonymous callers cannot execute the localized menu RPC'
);
select ok(
  not has_function_privilege(
    'authenticated',
    'private.ensure_restaurant_default_translation(uuid,text,uuid,text)',
    'execute'
  ),
  'the default-translation helper remains private'
);
select is(
  (
    select count(*)::integer
    from pg_proc as procedure
    join pg_namespace as namespace on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'restaurant'
      and procedure.proname in (
        'save_localized_menu',
        'save_localized_category',
        'save_localized_item',
        'save_localized_item_variant',
        'save_localized_modifier_group',
        'save_localized_modifier'
      )
      and procedure.prosecdef
      and procedure.proconfig @> array['search_path=""']
  ),
  6,
  'all localized mutation wrappers use guarded definer rights and an empty search path'
);
select is(
  (
    select count(*)::integer
    from pg_proc as procedure
    join pg_namespace as namespace on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'restaurant'
      and procedure.proname like 'save_localized_%'
      and has_function_privilege('service_role', procedure.oid, 'execute')
  ),
  0,
  'service role is not conceptually granted tenant localized mutation functions'
);

insert into auth.users (
  id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  'de100000-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'restaurant-localized-save@example.test',
  '{}',
  '{}',
  now(),
  now()
);

insert into private.super_admins (user_id, reason)
values (
  'de100000-0000-0000-0000-000000000001',
  'Transaction-scoped Restaurant localized-save test'
);

insert into core.businesses (id, slug, display_name, default_locale, status)
values (
  'de200000-0000-0000-0000-000000000001',
  'localized-save-test',
  'Localized save test',
  'ar',
  'active'
);

insert into core.business_modules (business_id, module_key, is_enabled)
values ('de200000-0000-0000-0000-000000000001', 'restaurant', true);

create temporary table localized_save_ids (key text primary key, id uuid) on commit drop;
grant select, insert, update, delete on localized_save_ids to authenticated;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'de100000-0000-0000-0000-000000000001', true);

select results_eq(
  $$select changed from restaurant.save_configuration(
    'de200000-0000-0000-0000-000000000001', true
  )$$,
  $$values (true)$$,
  'the public Restaurant gate can be enabled for the fixture'
);

insert into localized_save_ids
select 'menu', menu_id from restaurant.save_localized_menu(
  'de200000-0000-0000-0000-000000000001', null,
  'القائمة الرئيسية', 'published', 'active', 10
);
insert into localized_save_ids
select 'category', category_id from restaurant.save_localized_category(
  'de200000-0000-0000-0000-000000000001', null,
  (select id from localized_save_ids where key = 'menu'),
  'الأطباق', null, true, 'active', 10
);
insert into localized_save_ids
select 'item', item_id from restaurant.save_localized_item(
  'de200000-0000-0000-0000-000000000001', null,
  (select id from localized_save_ids where key = 'menu'),
  (select id from localized_save_ids where key = 'category'),
  'طبق اليوم', 4500, null, true, 'available', 'active', 10
);
insert into localized_save_ids
select 'variant', variant_id from restaurant.save_localized_item_variant(
  'de200000-0000-0000-0000-000000000001', null,
  (select id from localized_save_ids where key = 'item'),
  'كبير', 6200, true, 'available', 'active', 10
);
insert into localized_save_ids
select 'group', modifier_group_id from restaurant.save_localized_modifier_group(
  'de200000-0000-0000-0000-000000000001', null,
  'إضافات', true, 'active'
);
insert into localized_save_ids
select 'modifier', modifier_id from restaurant.save_localized_modifier(
  'de200000-0000-0000-0000-000000000001', null,
  (select id from localized_save_ids where key = 'group'),
  'إضافة', 500, true, 'available', 'active', 10
);

select results_eq(
  $$select name from restaurant.menu_translations where business_id =
    'de200000-0000-0000-0000-000000000001'$$,
  $$values ('القائمة الرئيسية'::text)$$,
  'menu save creates the missing default-locale public name'
);
select results_eq(
  $$select name from restaurant.category_translations where business_id =
    'de200000-0000-0000-0000-000000000001'$$,
  $$values ('الأطباق'::text)$$,
  'category save creates the missing default-locale public name'
);
select results_eq(
  $$select name from restaurant.item_translations where business_id =
    'de200000-0000-0000-0000-000000000001'$$,
  $$values ('طبق اليوم'::text)$$,
  'item save creates the missing default-locale public name'
);
select results_eq(
  $$select name from restaurant.item_variant_translations where business_id =
    'de200000-0000-0000-0000-000000000001'$$,
  $$values ('كبير'::text)$$,
  'variant save creates the missing default-locale public name'
);
select results_eq(
  $$select name from restaurant.modifier_group_translations where business_id =
    'de200000-0000-0000-0000-000000000001'$$,
  $$values ('إضافات'::text)$$,
  'modifier-group save creates the missing default-locale public name'
);
select results_eq(
  $$select name from restaurant.modifier_translations where business_id =
    'de200000-0000-0000-0000-000000000001'$$,
  $$values ('إضافة'::text)$$,
  'modifier save creates the missing default-locale public name'
);

select results_eq(
  $$select changed from restaurant.save_translation(
    'de200000-0000-0000-0000-000000000001', 'menu',
    (select id from localized_save_ids where key = 'menu'),
    'ar', 'اسم عام مخصص', null
  )$$,
  $$values (true)$$,
  'an explicit public translation remains independently editable'
);
select results_eq(
  $$select changed from restaurant.save_localized_menu(
    'de200000-0000-0000-0000-000000000001',
    (select id from localized_save_ids where key = 'menu'),
    'اسم داخلي جديد', 'published', 'active', 10
  )$$,
  $$values (true)$$,
  'later internal-name changes still succeed'
);
select results_eq(
  $$select name from restaurant.menu_translations where business_id =
    'de200000-0000-0000-0000-000000000001'$$,
  $$values ('اسم عام مخصص'::text)$$,
  'an explicit public translation is never overwritten by the fallback'
);

select results_eq(
  $$select public.get_restaurant_publication('localized-save-test')
    #>> '{menus,0,categories,0,items,0,translations,0,name}'$$,
  $$values ('طبق اليوم'::text)$$,
  'the same Admin-created tree is immediately present in the public projection'
);
select ok(
  public.get_restaurant_publication('localized-save-test')::text not like '%اسم داخلي جديد%',
  'the public projection still never exposes internal names'
);
select is(
  (
    select count(*)::integer
    from core.audit_events
    where business_id = 'de200000-0000-0000-0000-000000000001'
      and action_key = 'restaurant.translation_saved'
  ),
  7,
  'default translations and the explicit edit emit narrow audit events'
);

reset role;
select set_config('request.jwt.claim.sub', '', true);
set local role anon;
select throws_ok(
  $$select * from restaurant.save_localized_menu(
    'de200000-0000-0000-0000-000000000001', null,
    'ممنوع', 'published', 'active', 0
  )$$,
  42501,
  null,
  'anonymous callers cannot create localized Restaurant content'
);

reset role;
select * from finish();
rollback;
