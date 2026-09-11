import { getAdminI18n } from "../../../../../lib/i18n-server";
import { InformationCircleIcon } from "@darb/icons";

import { PageHeader } from "../../../../_components/page-header";
import { PermissionNotice } from "../../../../_components/permission-notice";
import { canManageModules } from "../../../../../lib/admin-access";
import { requireBusinessAdminContext } from "../../../../../lib/admin-context";
import { businessPath } from "../../../../../lib/navigation";
import { getBusinessCommercialSummary } from "../../../../../lib/modules";
import { createServerComponentSupabaseClient } from "../../../../../lib/supabase/server";
import { ModuleCard } from "./module-card";
import { CommercialSummary } from "./commercial-summary";

interface ModulesPageProps {
  params: Promise<{ businessSlug: string }>;
}

export default async function ModulesPage({ params }: ModulesPageProps) {
  const { t } = await getAdminI18n();
  const { businessSlug } = await params;
  const context = await requireBusinessAdminContext(businessSlug);
  const editable = canManageModules(context.access, context.business.status);
  const supabase = await createServerComponentSupabaseClient();
  const commercial = await getBusinessCommercialSummary(supabase, context.business.id);

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { href: businessPath(context.business.slug), label: t("Overview") },
          { label: t("Plan & access") },
        ]}
        eyebrow={t("Commercial access")}
        title={t("Plan & access")}
        summary={t(
          "See what this business is entitled to use, then control which included capabilities are enabled.",
        )}
      />

      <CommercialSummary
        businessId={context.business.id}
        businessSlug={context.business.slug}
        canRequestSetup={context.access.canManageBusiness && context.business.status === "active"}
        summary={commercial}
      />

      {!editable ? (
        <PermissionNotice title={t("Module state is read-only.")}>
          {context.business.status !== "active"
            ? t("Capabilities cannot be changed while this business is suspended or archived.")
            : t("The modules.manage permission is required to enable or disable capabilities.")}
        </PermissionNotice>
      ) : null}

      <section className="module-registry-note" aria-labelledby="module-registry-note-heading">
        <span>
          <InformationCircleIcon size={20} />
        </span>
        <div>
          <h2 id="module-registry-note-heading">{t("Access and activation are separate")}</h2>
          <p>
            {t(
              "A capability must be available from Darb, included for this business, and enabled here before it becomes active. Turning it off retains existing data.",
            )}
          </p>
        </div>
      </section>

      {context.modules.length === 0 ? (
        <section className="empty-state">
          <h2>{t("No capabilities are registered")}</h2>
          <p>{t("The platform registry is currently empty.")}</p>
        </section>
      ) : (
        <ul className="module-grid" aria-label={t("Available business capabilities")}>
          {context.modules.map((module) => (
            <li key={module.key}>
              <ModuleCard
                businessId={context.business.id}
                businessSlug={context.business.slug}
                editable={editable}
                module={module}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
