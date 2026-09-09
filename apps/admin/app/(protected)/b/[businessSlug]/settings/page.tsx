import { getAdminI18n } from "../../../../../lib/i18n-server";
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
  const { t } = await getAdminI18n();
  const { businessSlug } = await params;
  const context = await requireBusinessAdminContext(businessSlug);
  const editable = context.access.canManageBusiness && context.business.status !== "suspended";

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { href: businessPath(context.business.slug), label: t("Overview") },
          { label: t("Business settings") },
        ]}
        eyebrow={t("Core settings")}
        title={t("Business settings")}
        summary={t("Manage the canonical identity and regional defaults shared by this business.")}
      />
      {!editable ? (
        <PermissionNotice>
          {context.business.status === "suspended"
            ? t("Suspended businesses cannot be changed through tenant administration.")
            : t("The business.manage permission is required to edit these settings.")}
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
