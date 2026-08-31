import Link from "next/link";

import { ArrowRightIcon } from "@darb/icons";

import { PageHeader } from "../../../../../_components/page-header";
import { PermissionNotice } from "../../../../../_components/permission-notice";
import { requireBusinessAdminContext } from "../../../../../../lib/admin-context";
import { businessSectionPath } from "../../../../../../lib/navigation";
import { getSupportedTimezones } from "../../../../../../lib/timezones";
import { LocationForm } from "../location-form";

interface NewLocationPageProps {
  params: Promise<{ businessSlug: string }>;
}

export default async function NewLocationPage({ params }: NewLocationPageProps) {
  const { businessSlug } = await params;
  const context = await requireBusinessAdminContext(businessSlug);

  return (
    <>
      <Link className="back-link" href={businessSectionPath(context.business.slug, "locations")}>
        <ArrowRightIcon size={17} />
        Back to locations
      </Link>
      <PageHeader
        eyebrow="New core location"
        title="Create a location"
        summary="Add only the reusable identity and address details needed by the core platform."
      />
      {!context.access.canManageAllLocations ? (
        <PermissionNotice title="Business-wide permission required.">
          A location-scoped permission can manage an assigned location but cannot create another.
        </PermissionNotice>
      ) : (
        <LocationForm business={context.business} editable timezones={getSupportedTimezones()} />
      )}
    </>
  );
}
