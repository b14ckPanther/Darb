import { PageHeader } from "../../../../_components/page-header";
import { PermissionNotice } from "../../../../_components/permission-notice";
import { requireBusinessAdminContext } from "../../../../../lib/admin-context";
import { businessPath } from "../../../../../lib/navigation";
import { getSupportedTimezones } from "../../../../../lib/timezones";
import { BusinessSettingsForm } from "./business-settings-form";

interface BusinessSettingsPageProps {
  params: Promise<{ businessSlug: string }>;
}

export default async function BusinessSettingsPage({ params }: BusinessSettingsPageProps) {
  const { businessSlug } = await params;
  const context = await requireBusinessAdminContext(businessSlug);
  const editable = context.access.canManageBusiness && context.business.status !== "suspended";

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { href: businessPath(context.business.slug), label: "Overview" },
          { label: "Business settings" },
        ]}
        eyebrow="Core settings"
        title="Business settings"
        summary="Manage the canonical identity and regional defaults shared by this business."
      />
      {!editable ? (
        <PermissionNotice>
          {context.business.status === "suspended"
            ? "Suspended businesses cannot be changed through tenant administration."
            : "The business.manage permission is required to edit these settings."}
        </PermissionNotice>
      ) : null}
      <BusinessSettingsForm
        business={context.business}
        editable={editable}
        timezones={getSupportedTimezones(context.business.timezone)}
      />
    </>
  );
}
