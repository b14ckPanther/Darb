import { InformationCircleIcon } from "@darb/icons";

import { PageHeader } from "../../../../_components/page-header";
import { PermissionNotice } from "../../../../_components/permission-notice";
import { canManageModules } from "../../../../../lib/admin-access";
import { requireBusinessAdminContext } from "../../../../../lib/admin-context";
import { ModuleCard } from "./module-card";

interface ModulesPageProps {
  params: Promise<{ businessSlug: string }>;
}

export default async function ModulesPage({ params }: ModulesPageProps) {
  const { businessSlug } = await params;
  const context = await requireBusinessAdminContext(businessSlug);
  const editable = canManageModules(context.access, context.business.status);

  return (
    <>
      <PageHeader
        eyebrow="Business capabilities"
        title="Modules"
        summary="Control the administrative capability state for this business. Enablement does not grant user permission or imply that an engine is available yet."
      />

      {!editable ? (
        <PermissionNotice title="Module state is read-only.">
          {context.business.status !== "active"
            ? "Capabilities cannot be changed while this business is suspended or archived."
            : "The modules.manage permission is required to enable or disable capabilities."}
        </PermissionNotice>
      ) : null}

      <section className="module-registry-note" aria-labelledby="module-registry-note-heading">
        <span>
          <InformationCircleIcon size={20} />
        </span>
        <div>
          <h2 id="module-registry-note-heading">Capability state, not a product launch</h2>
          <p>
            These records prepare Darb for future engines. They do not create engine data, routes,
            billing, or customer-facing features.
          </p>
        </div>
      </section>

      {context.modules.length === 0 ? (
        <section className="empty-state">
          <h2>No capabilities are registered</h2>
          <p>The platform registry is currently empty.</p>
        </section>
      ) : (
        <ul className="module-grid" aria-label="Available business capabilities">
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
