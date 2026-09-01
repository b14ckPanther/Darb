import Link from "next/link";

import { ArrowRightIcon, LocationIcon, PlusIcon } from "@darb/icons";

import { PageHeader } from "../../../../_components/page-header";
import { PermissionNotice } from "../../../../_components/permission-notice";
import { StatusBadge } from "../../../../_components/status-badge";
import { canCreateLocation, canShowLocations } from "../../../../../lib/admin-access";
import { requireBusinessAdminContext } from "../../../../../lib/admin-context";
import {
  businessLocationPath,
  businessPath,
  businessSectionPath,
} from "../../../../../lib/navigation";

interface LocationsPageProps {
  params: Promise<{ businessSlug: string }>;
}

export default async function LocationsPage({ params }: LocationsPageProps) {
  const { businessSlug } = await params;
  const context = await requireBusinessAdminContext(businessSlug);
  const canAccessLocations = canShowLocations(context.access, context.locations.length);

  if (!canAccessLocations) {
    return (
      <>
        <PageHeader
          breadcrumbs={[
            { href: businessPath(context.business.slug), label: "Overview" },
            { label: "Locations" },
          ]}
          eyebrow="Business locations"
          title="Locations"
          summary="Locations are visible only when your permission scope includes them."
        />
        <PermissionNotice title="No location access is assigned.">
          Ask a business administrator for locations.read or locations.manage access.
        </PermissionNotice>
      </>
    );
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { href: businessPath(context.business.slug), label: "Overview" },
          { label: "Locations" },
        ]}
        eyebrow="Business locations"
        title="Locations"
        summary="Manage reusable location identity and lifecycle without engine-specific fields."
        actions={
          canCreateLocation(context.access) ? (
            <Link
              className="primary-link"
              href={`${businessSectionPath(context.business.slug, "locations")}/new`}
            >
              <PlusIcon size={18} />
              New location
            </Link>
          ) : null
        }
      />

      {context.locations.length === 0 ? (
        <section className="empty-state">
          <span>
            <LocationIcon size={24} />
          </span>
          <h2>No locations yet</h2>
          <p>Create the first reusable location for this business.</p>
        </section>
      ) : (
        <ul className="location-list" aria-label="Accessible locations">
          {context.locations.map((location) => (
            <li key={location.id}>
              <Link href={businessLocationPath(context.business.slug, location.id)}>
                <span className="location-list__marker">
                  <LocationIcon size={20} />
                </span>
                <span className="location-list__body">
                  <strong dir="auto">{location.display_name}</strong>
                  <small dir="auto">
                    {[location.address_line, location.locality, location.country_code]
                      .filter(Boolean)
                      .join(" · ") || "No address details yet"}
                  </small>
                </span>
                <StatusBadge status={location.status} />
                <ArrowRightIcon size={18} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
