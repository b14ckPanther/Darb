import { getAdminI18n } from "../../../../../../lib/i18n-server";
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
  const { t } = await getAdminI18n();
  const { businessSlug } = await params;
  const context = await requireBusinessAdminContext(businessSlug);

  return (
    <>
      <Link className="back-link" href={businessSectionPath(context.business.slug, "locations")}>
        <ArrowRightIcon size={17} />
        {t("Back to locations")}
      </Link>
      <PageHeader
        eyebrow={t("New core location")}
        title={t("Create a location")}
        summary={t(
          "Add only the reusable identity and address details needed by the core platform.",
        )}
      />
      {!context.access.canManageAllLocations ? (
        <PermissionNotice title={t("Business-wide permission required.")}>
          {t(
            "A location-scoped permission can manage an assigned location but cannot create another.",
          )}
        </PermissionNotice>
      ) : (
        <LocationForm business={context.business} editable timezones={getSupportedTimezones()} />
      )}
    </>
  );
}
