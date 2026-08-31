revoke all on schema core from public, anon, authenticated, service_role;
grant usage on schema core to authenticated, service_role;

revoke all on schema private from public, anon, authenticated, service_role;
grant usage on schema private to authenticated;

alter default privileges for role postgres in schema core
  revoke all on tables from public, anon, authenticated, service_role;
alter default privileges for role postgres in schema core
  revoke all on sequences from public, anon, authenticated, service_role;
alter default privileges for role postgres in schema core
  revoke execute on functions from public, anon, authenticated, service_role;

alter default privileges for role postgres in schema private
  revoke all on tables from public, anon, authenticated, service_role;
alter default privileges for role postgres in schema private
  revoke all on sequences from public, anon, authenticated, service_role;
alter default privileges for role postgres in schema private
  revoke execute on functions from public, anon, authenticated, service_role;

revoke all on all tables in schema core from public, anon, authenticated, service_role;
revoke all on all sequences in schema core from public, anon, authenticated, service_role;
revoke execute on all functions in schema private from public, anon, authenticated, service_role;
revoke all on all tables in schema private from public, anon, authenticated, service_role;

grant all on all tables in schema core to service_role;
revoke update, delete, truncate on core.audit_events from service_role;

grant select on core.profiles to authenticated;
grant update (display_name, preferred_locale) on core.profiles to authenticated;

grant select on core.businesses to authenticated;
grant update (
  slug,
  display_name,
  status,
  default_locale,
  currency_code,
  timezone
) on core.businesses to authenticated;

grant select on core.locations to authenticated;
grant insert (
  business_id,
  display_name,
  status,
  address_line,
  locality,
  postal_code,
  country_code,
  timezone,
  created_by
) on core.locations to authenticated;
grant update (
  display_name,
  status,
  address_line,
  locality,
  postal_code,
  country_code,
  timezone
) on core.locations to authenticated;

grant select on core.memberships to authenticated;
grant insert (business_id, user_id, status, created_by) on core.memberships to authenticated;
grant update (status) on core.memberships to authenticated;

grant select on core.permissions to authenticated;
grant select on core.modules to authenticated;

grant select, delete on core.membership_permissions to authenticated;
grant insert (
  business_id,
  membership_id,
  permission_key,
  location_id,
  granted_by
) on core.membership_permissions to authenticated;

grant select on core.business_modules to authenticated;
grant insert (business_id, module_key, is_enabled, updated_by)
  on core.business_modules to authenticated;
grant update (is_enabled, updated_by) on core.business_modules to authenticated;

grant select on core.audit_events to authenticated;

create function private.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from private.super_admins as super_admin
      where super_admin.user_id = (select auth.uid())
        and super_admin.revoked_at is null
    );
$$;

comment on function private.is_super_admin() is
  'Checks only the caller identity against non-exposed active platform assignments.';

create function private.has_active_membership(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_super_admin()
    or exists (
      select 1
      from core.memberships as membership
      where membership.business_id = target_business_id
        and membership.user_id = (select auth.uid())
        and membership.status = 'active'
    );
$$;

create function private.has_permission(
  target_business_id uuid,
  target_permission_key text,
  target_location_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_super_admin()
    or exists (
      select 1
      from core.memberships as membership
      join core.membership_permissions as assignment
        on assignment.membership_id = membership.id
        and assignment.business_id = membership.business_id
      where membership.business_id = target_business_id
        and membership.user_id = (select auth.uid())
        and membership.status = 'active'
        and assignment.permission_key = target_permission_key
        and (
          assignment.location_id is null
          or (
            target_location_id is not null
            and assignment.location_id = target_location_id
          )
        )
    );
$$;

comment on function private.has_permission(uuid, text, uuid) is
  'Resolves effective caller permission at business or optional location scope without recursive RLS.';

create function private.can_grant_permission(
  target_business_id uuid,
  target_permission_key text,
  target_location_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_permission(
      target_business_id,
      'permissions.manage',
      target_location_id
    )
    and private.has_permission(
      target_business_id,
      target_permission_key,
      target_location_id
    );
$$;

comment on function private.can_grant_permission(uuid, text, uuid) is
  'Prevents delegation beyond the caller permission and scope.';

revoke execute on function private.is_super_admin() from public, anon, service_role;
revoke execute on function private.has_active_membership(uuid) from public, anon, service_role;
revoke execute on function private.has_permission(uuid, text, uuid) from public, anon, service_role;
revoke execute on function private.can_grant_permission(uuid, text, uuid) from public, anon, service_role;

grant execute on function private.is_super_admin() to authenticated;
grant execute on function private.has_active_membership(uuid) to authenticated;
grant execute on function private.has_permission(uuid, text, uuid) to authenticated;
grant execute on function private.can_grant_permission(uuid, text, uuid) to authenticated;

alter table core.profiles enable row level security;
alter table core.businesses enable row level security;
alter table core.locations enable row level security;
alter table core.memberships enable row level security;
alter table core.permissions enable row level security;
alter table core.modules enable row level security;
alter table core.membership_permissions enable row level security;
alter table core.business_modules enable row level security;
alter table core.audit_events enable row level security;
alter table private.super_admins enable row level security;

create policy profiles_select_self_or_super_admin
on core.profiles
for select
to authenticated
using (
  id = (select auth.uid())
  or (select private.is_super_admin())
);

create policy profiles_update_self
on core.profiles
for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy businesses_select_active_membership
on core.businesses
for select
to authenticated
using ((select private.has_active_membership(id)));

create policy businesses_update_with_permission
on core.businesses
for update
to authenticated
using ((select private.has_permission(id, 'business.manage')))
with check ((select private.has_permission(id, 'business.manage')));

create policy locations_select_with_permission
on core.locations
for select
to authenticated
using (
  (select private.has_permission(business_id, 'locations.read', id))
  or (select private.has_permission(business_id, 'locations.manage', id))
);

create policy locations_insert_with_business_permission
on core.locations
for insert
to authenticated
with check (
  (select private.has_permission(business_id, 'locations.manage'))
  and created_by = (select auth.uid())
);

create policy locations_update_with_permission
on core.locations
for update
to authenticated
using ((select private.has_permission(business_id, 'locations.manage', id)))
with check ((select private.has_permission(business_id, 'locations.manage', id)));

create policy memberships_select_self_or_manager
on core.memberships
for select
to authenticated
using (
  user_id = (select auth.uid())
  or (select private.has_permission(business_id, 'memberships.manage'))
);

create policy memberships_insert_with_permission
on core.memberships
for insert
to authenticated
with check (
  (select private.has_permission(business_id, 'memberships.manage'))
  and created_by = (select auth.uid())
);

create policy memberships_update_with_permission
on core.memberships
for update
to authenticated
using ((select private.has_permission(business_id, 'memberships.manage')))
with check ((select private.has_permission(business_id, 'memberships.manage')));

create policy permissions_select_authenticated
on core.permissions
for select
to authenticated
using (true);

create policy modules_select_authenticated
on core.modules
for select
to authenticated
using (true);

create policy membership_permissions_select_self_or_manager
on core.membership_permissions
for select
to authenticated
using (
  exists (
    select 1
    from core.memberships as membership
    where membership.id = membership_id
      and membership.business_id = business_id
      and membership.user_id = (select auth.uid())
  )
  or (select private.has_permission(business_id, 'permissions.manage', location_id))
);

create policy membership_permissions_insert_without_escalation
on core.membership_permissions
for insert
to authenticated
with check (
  granted_by = (select auth.uid())
  and (select private.can_grant_permission(business_id, permission_key, location_id))
);

create policy membership_permissions_delete_without_escalation
on core.membership_permissions
for delete
to authenticated
using ((select private.can_grant_permission(business_id, permission_key, location_id)));

create policy business_modules_select_active_membership
on core.business_modules
for select
to authenticated
using ((select private.has_active_membership(business_id)));

create policy business_modules_insert_with_permission
on core.business_modules
for insert
to authenticated
with check (
  (select private.has_permission(business_id, 'modules.manage'))
  and updated_by = (select auth.uid())
);

create policy business_modules_update_with_permission
on core.business_modules
for update
to authenticated
using ((select private.has_permission(business_id, 'modules.manage')))
with check (
  (select private.has_permission(business_id, 'modules.manage'))
  and updated_by = (select auth.uid())
);

create policy audit_events_select_with_permission
on core.audit_events
for select
to authenticated
using (
  (select private.is_super_admin())
  or (
    business_id is not null
    and (select private.has_permission(business_id, 'audit.view'))
  )
);
