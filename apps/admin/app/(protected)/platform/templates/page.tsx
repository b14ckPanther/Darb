import { TemplatesIcon } from "@darb/icons";

import { PageHeader } from "../../../_components/page-header";
import { StatusBadge } from "../../../_components/status-badge";
import { listPlatformTemplates } from "../../../../lib/platform";

export default async function PlatformTemplatesPage() {
  const templates = await listPlatformTemplates();
  const groups = templates.reduce<Map<string, typeof templates>>((result, template) => {
    const current = result.get(template.moduleKey) ?? [];
    current.push(template);
    result.set(template.moduleKey, current);
    return result;
  }, new Map());

  return (
    <>
      <PageHeader
        eyebrow="Platform registry"
        title="Templates"
        summary="Platform-owned compositions and their safe adoption state. Theme documents and tenant overrides are intentionally absent from this operator list."
      />
      <div className="platform-boundary-note">
        <TemplatesIcon size={20} />
        <div>
          <strong>Registry inspection only</strong>
          <p>
            Template authoring, arbitrary code, marketplaces, and availability mutations are outside
            this phase.
          </p>
        </div>
      </div>
      {[...groups.entries()].map(([moduleKey, moduleTemplates]) => (
        <section
          className="platform-overview-section"
          key={moduleKey}
          aria-labelledby={`templates-${moduleKey}`}
        >
          <header className="platform-section-heading">
            <h2 id={`templates-${moduleKey}`}>{moduleKey}</h2>
            <p>{moduleTemplates.length} registered compositions</p>
          </header>
          <div className="platform-registry-grid">
            {moduleTemplates.map((template) => (
              <article key={template.key}>
                <div className="platform-registry-card__topline">
                  <span>
                    <TemplatesIcon size={20} />
                  </span>
                  <div className="platform-status-stack">
                    {template.isDefault ? <StatusBadge status="enabled" label="Default" /> : null}
                    <StatusBadge status={template.isAvailable ? "available" : "unavailable"} />
                  </div>
                </div>
                <p className="eyebrow">
                  <bdi>{template.key}</bdi>
                </p>
                <h3>{template.displayName}</h3>
                <p>{template.description}</p>
                <dl className="platform-key-values">
                  <div>
                    <dt>Selected businesses</dt>
                    <dd>{template.selectedBusinessCount}</dd>
                  </div>
                  <div>
                    <dt>Template version</dt>
                    <dd>{template.templateVersion}</dd>
                  </div>
                  <div>
                    <dt>Theme schema</dt>
                    <dd>{template.themeSchemaVersion}</dd>
                  </div>
                  <div>
                    <dt>Registry order</dt>
                    <dd>{template.sortOrder}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
