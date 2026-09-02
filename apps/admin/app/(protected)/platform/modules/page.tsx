import { ModulesIcon } from "@darb/icons";

import { PageHeader } from "../../../_components/page-header";
import { StatusBadge } from "../../../_components/status-badge";
import { listPlatformModules } from "../../../../lib/platform";
import { getPlatformModuleImplementation } from "../../../../lib/platform-model";

export default async function PlatformModulesPage() {
  const modules = await listPlatformModules();

  return (
    <>
      <PageHeader
        eyebrow="Platform registry"
        title="Modules"
        summary="Canonical Darb capabilities. Platform availability and each business’s enabled state remain separate decisions."
      />
      <div className="platform-boundary-note">
        <ModulesIcon size={20} />
        <div>
          <strong>Read-only registry control</strong>
          <p>
            Availability changes are deferred until their cross-tenant consequences and recovery
            workflow receive a dedicated operational design.
          </p>
        </div>
      </div>
      <div className="platform-registry-grid">
        {modules.map((module) => (
          <article key={module.key}>
            <div className="platform-registry-card__topline">
              <span>
                <ModulesIcon size={20} />
              </span>
              <StatusBadge status={module.isAvailable ? "available" : "unavailable"} />
            </div>
            <p className="eyebrow">
              <bdi>{module.key}</bdi>
            </p>
            <h2>{module.displayName}</h2>
            <p>{module.description}</p>
            <dl className="platform-key-values">
              <div>
                <dt>Implementation</dt>
                <dd>{getPlatformModuleImplementation(module.key)}</dd>
              </div>
              <div>
                <dt>Stored enabled</dt>
                <dd>{module.enabledBusinessCount}</dd>
              </div>
              <div>
                <dt>Effective businesses</dt>
                <dd>{module.effectiveBusinessCount}</dd>
              </div>
              <div>
                <dt>Registry order</dt>
                <dd>{module.sortOrder}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </>
  );
}
