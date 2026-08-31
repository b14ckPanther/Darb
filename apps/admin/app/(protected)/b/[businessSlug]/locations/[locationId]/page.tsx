import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowRightIcon } from "@darb/icons";

import { PageHeader } from "../../../../../_components/page-header";
import { PermissionNotice } from "../../../../../_components/permission-notice";
import { StatusBadge } from "../../../../../_components/status-badge";
import { requireBusinessAdminContext } from "../../../../../../lib/admin-context";
import { hasBusinessPermission, resolveAccessibleLocation } from "../../../../../../lib/auth";
import { businessSectionPath } from "../../../../../../lib/navigation";
import { createServerComponentSupabaseClient } from "../../../../../../lib/supabase/server";
import { getSupportedTimezones } from "../../../../../../lib/timezones";
import { ArchiveLocationControl } from "../archive-location-control";
import { LocationForm } from "../location-form";

interface LocationDetailPageProps {
  params: Promise<{ businessSlug: string; locationId: string }>;
  searchParams: Promise<{ archived?: string; created?: string }>;
}

export default async function LocationDetailPage({
  params,
  searchParams,
}: LocationDetailPageProps) {
  const { businessSlug, locationId } = await params;
  const context = await requireBusinessAdminContext(businessSlug);
  const supabase = await createServerComponentSupabaseClient();
  const location = await resolveAccessibleLocation(supabase, context.business.id, locationId);

  if (!location) {
    notFound();
  }

  const canManage =
    context.access.canManageAllLocations ||
    (await hasBusinessPermission(supabase, context.business.id, "locations.manage", location.id));
  const editable = canManage && location.status !== "archived";
  const query = await searchParams;

  return (
    <>
      <Link className="back-link" href={businessSectionPath(context.business.slug, "locations")}>
        <ArrowRightIcon size={17} />
        Back to locations
      </Link>
      <PageHeader
        eyebrow="Location record"
        title={location.display_name}
        summary="Core location details remain isolated to the permissions assigned to your account."
        actions={<StatusBadge status={location.status} />}
      />

      {query.created === "1" ? (
        <p className="form-success" role="status">
          Location created successfully.
        </p>
      ) : null}
      {query.archived === "1" ? (
        <p className="form-success" role="status">
          Location archived and retained as read-only.
        </p>
      ) : null}

      {!editable ? (
        <PermissionNotice>
          {location.status === "archived"
            ? "Archived locations are retained for historical integrity and cannot be edited."
            : "A matching locations.manage permission is required to edit this location."}
        </PermissionNotice>
      ) : null}

      <LocationForm
        business={context.business}
        editable={editable}
        location={location}
        timezones={getSupportedTimezones(location.timezone)}
      />

      {editable ? (
        <ArchiveLocationControl
          businessId={context.business.id}
          businessSlug={context.business.slug}
          locationId={location.id}
        />
      ) : null}
    </>
  );
}
