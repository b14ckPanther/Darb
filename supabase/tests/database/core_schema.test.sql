begin;

create extension if not exists pgtap with schema extensions;

select plan(22);

select has_schema('core', 'core schema exists');
select has_schema('private', 'private schema exists');

select has_table('core', 'profiles', 'core.profiles exists');
select has_table('core', 'businesses', 'core.businesses exists');
select has_table('core', 'locations', 'core.locations exists');
select has_table('core', 'memberships', 'core.memberships exists');
select has_table('core', 'modules', 'core.modules exists');
select has_table('core', 'permissions', 'core.permissions exists');
select has_table('core', 'membership_permissions', 'core.membership_permissions exists');
select has_table('core', 'business_modules', 'core.business_modules exists');
select has_table('core', 'audit_events', 'core.audit_events exists');
select has_table('private', 'super_admins', 'private.super_admins exists');

select ok(
  (select cls.relrowsecurity from pg_catalog.pg_class as cls
    join pg_catalog.pg_namespace as namespace on namespace.oid = cls.relnamespace
    where namespace.nspname = 'core' and cls.relname = 'profiles'),
  'core.profiles has RLS enabled'
);

select ok(
  (select cls.relrowsecurity from pg_catalog.pg_class as cls
    join pg_catalog.pg_namespace as namespace on namespace.oid = cls.relnamespace
    where namespace.nspname = 'core' and cls.relname = 'businesses'),
  'core.businesses has RLS enabled'
);

select ok(
  (select cls.relrowsecurity from pg_catalog.pg_class as cls
    join pg_catalog.pg_namespace as namespace on namespace.oid = cls.relnamespace
    where namespace.nspname = 'core' and cls.relname = 'locations'),
  'core.locations has RLS enabled'
);

select ok(
  (select cls.relrowsecurity from pg_catalog.pg_class as cls
    join pg_catalog.pg_namespace as namespace on namespace.oid = cls.relnamespace
    where namespace.nspname = 'core' and cls.relname = 'memberships'),
  'core.memberships has RLS enabled'
);

select ok(
  (select cls.relrowsecurity from pg_catalog.pg_class as cls
    join pg_catalog.pg_namespace as namespace on namespace.oid = cls.relnamespace
    where namespace.nspname = 'core' and cls.relname = 'modules'),
  'core.modules has RLS enabled'
);

select ok(
  (select cls.relrowsecurity from pg_catalog.pg_class as cls
    join pg_catalog.pg_namespace as namespace on namespace.oid = cls.relnamespace
    where namespace.nspname = 'core' and cls.relname = 'permissions'),
  'core.permissions has RLS enabled'
);

select ok(
  (select cls.relrowsecurity from pg_catalog.pg_class as cls
    join pg_catalog.pg_namespace as namespace on namespace.oid = cls.relnamespace
    where namespace.nspname = 'core' and cls.relname = 'membership_permissions'),
  'core.membership_permissions has RLS enabled'
);

select ok(
  (select cls.relrowsecurity from pg_catalog.pg_class as cls
    join pg_catalog.pg_namespace as namespace on namespace.oid = cls.relnamespace
    where namespace.nspname = 'core' and cls.relname = 'business_modules'),
  'core.business_modules has RLS enabled'
);

select ok(
  (select cls.relrowsecurity from pg_catalog.pg_class as cls
    join pg_catalog.pg_namespace as namespace on namespace.oid = cls.relnamespace
    where namespace.nspname = 'core' and cls.relname = 'audit_events'),
  'core.audit_events has RLS enabled'
);

select ok(
  (select cls.relrowsecurity from pg_catalog.pg_class as cls
    join pg_catalog.pg_namespace as namespace on namespace.oid = cls.relnamespace
    where namespace.nspname = 'private' and cls.relname = 'super_admins'),
  'private.super_admins has RLS enabled'
);

select * from finish();

rollback;
