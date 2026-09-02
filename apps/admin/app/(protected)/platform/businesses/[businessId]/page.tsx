import Link from "next/link";
import { notFound } from "next/navigation";

import {
  BuildingIcon,
  DomainIcon,
  ModulesIcon,
  RestaurantIcon,
  TemplatesIcon,
  UsersIcon,
} from "@darb/icons";

import { PageHeader } from "../../../../_components/page-header";
import { PlatformSectionHeading } from "../../../../_components/platform-summary";
import { StatusBadge } from "../../../../_components/status-badge";
import { getPlatformBusinessDetail } from "../../../../../lib/platform";
import { getPlatformBusinessTransitions, platformPaths } from "../../../../../lib/platform-model";
import { businessPath } from "../../../../../lib/navigation";
import { PlatformBusinessStatusControl } from "./platform-business-status-control";

export default async function PlatformBusinessDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessId: string }>;
  searchParams: Promise<{ updated?: string | string[] }>;
}) {
  const { businessId } = await params;
  const query = await searchParams;
  const detail = await getPlatformBusinessDetail(businessId);
  if (!detail) notFound();
  const business = detail.business;
  const restaurant = detail.restaurant;
  const lifecycleMessage = getLifecycleMessage(query.updated);

  return (
    <>
      <PageHeader
        eyebrow="Tenant inspection"
        title={business.displayName}
        summary="Platform-level operational context. Opening the workspace keeps your real operator identity and creates no tenant membership."
        breadcrumbs={[
          { label: "Businesses", href: platformPaths.businesses },
          { label: business.displayName },
        ]}
        status={<StatusBadge status={business.status} />}
        actions={
          <>
            <Link
              className="secondary-button"
              href={`${platformPaths.audit}?business=${business.id}`}
            >
              View audit history
            </Link>
            <Link className="primary-link" href={businessPath(business.slug)}>
              Open business workspace
            </Link>
          </>
        }
      />
      {lifecycleMessage ? (
        <p className="success-alert" role="status">
          {lifecycleMessage}
        </p>
      ) : null}

      <section className="platform-detail-grid" aria-label="Business identity and footprint">
        <article className="platform-detail-card platform-detail-card--identity">
          <span>
            <BuildingIcon size={21} />
          </span>
          <div>
            <p className="eyebrow">Canonical identity</p>
            <dl className="platform-key-values">
              <div>
                <dt>Business ID</dt>
                <dd>
                  <bdi>{business.id}</bdi>
                </dd>
              </div>
              <div>
                <dt>Slug</dt>
                <dd dir="ltr">{business.slug}</dd>
              </div>
              <div>
                <dt>Default locale</dt>
                <dd>{business.defaultLocale.toUpperCase()}</dd>
              </div>
              <div>
                <dt>Currency</dt>
                <dd>{business.currencyCode}</dd>
              </div>
              <div>
                <dt>Timezone</dt>
                <dd>{business.timezone}</dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>{formatDate(business.createdAt)}</dd>
              </div>
            </dl>
          </div>
        </article>
        <article className="platform-detail-card">
          <span>
            <UsersIcon size={21} />
          </span>
          <div>
            <p className="eyebrow">Tenant footprint</p>
            <dl className="platform-key-values">
              <div>
                <dt>Memberships</dt>
                <dd>{detail.membershipCount}</dd>
              </div>
              <div>
                <dt>Active memberships</dt>
                <dd>{detail.activeMembershipCount}</dd>
              </div>
              <div>
                <dt>Locations</dt>
                <dd>{detail.locations.length}</dd>
              </div>
              <div>
                <dt>Enabled locales</dt>
                <dd>
                  {detail.locales
                    .filter((locale) => locale.isEnabled)
                    .map((locale) => locale.code.toUpperCase())
                    .join(" · ")}
                </dd>
              </div>
            </dl>
          </div>
        </article>
      </section>

      <section className="platform-detail-section" aria-labelledby="capabilities-heading">
        <PlatformSectionHeading
          id="capabilities-heading"
          title="Capabilities and appearance"
          description="Stored tenant enablement remains separate from platform availability and engine implementation."
        />
        <div className="platform-registry-list">
          {detail.modules.map((module) => {
            const appearance = detail.appearances.find((item) => item.moduleKey === module.key);
            return (
              <article key={module.key}>
                <span>
                  <ModulesIcon size={19} />
                </span>
                <div>
                  <strong>{module.displayName}</strong>
                  <p>
                    {appearance
                      ? `${appearance.templateDisplayName} selected`
                      : "Platform default or no current composition"}
                  </p>
                </div>
                <StatusBadge
                  status={
                    module.isEffective ? "enabled" : module.isAvailable ? "disabled" : "unavailable"
                  }
                  label={
                    module.isEffective
                      ? "Effective"
                      : module.isAvailable
                        ? "Disabled"
                        : "Unavailable"
                  }
                />
              </article>
            );
          })}
        </div>
      </section>

      <section className="platform-detail-section" aria-labelledby="restaurant-heading">
        <PlatformSectionHeading
          id="restaurant-heading"
          title="Restaurant state"
          description="Capability, configuration, and publication are reported separately."
        />
        <article className="platform-detail-card platform-detail-card--wide">
          <span>
            <RestaurantIcon size={21} />
          </span>
          <dl className="platform-key-values platform-key-values--columns">
            <div>
              <dt>Module</dt>
              <dd>{restaurant.moduleEnabled ? "Enabled" : "Disabled"}</dd>
            </div>
            <div>
              <dt>Configuration</dt>
              <dd>{restaurant.configured ? "Configured" : "Not configured"}</dd>
            </div>
            <div>
              <dt>Public intent</dt>
              <dd>{restaurant.publiclyActive ? "Active" : "Inactive"}</dd>
            </div>
            <div>
              <dt>Menus</dt>
              <dd>{restaurant.menuCount}</dd>
            </div>
            <div>
              <dt>Published menus</dt>
              <dd>{restaurant.publishedMenuCount}</dd>
            </div>
            <div>
              <dt>Items</dt>
              <dd>{restaurant.itemCount}</dd>
            </div>
          </dl>
        </article>
      </section>

      <section className="platform-detail-section" aria-labelledby="domain-heading">
        <PlatformSectionHeading
          id="domain-heading"
          title="Domains"
          description="Ownership proof and deployment-provider payloads are excluded from this view."
        />
        {detail.domains.length === 0 ? (
          <div className="platform-quiet-state">
            <DomainIcon size={21} />
            <p>No custom domains are registered for this tenant.</p>
          </div>
        ) : (
          <div className="platform-registry-list">
            {detail.domains.map((domain) => (
              <article key={domain.id}>
                <span>
                  <DomainIcon size={19} />
                </span>
                <div>
                  <strong dir="ltr">{domain.hostname}</strong>
                  <p>{domain.targetModuleKey ?? "No public target"}</p>
                </div>
                <div className="platform-status-stack">
                  <StatusBadge status={domain.ownershipStatus} />
                  <StatusBadge status={domain.routingStatus} />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="platform-detail-section" aria-labelledby="location-heading">
        <PlatformSectionHeading
          id="location-heading"
          title="Locations"
          description="Canonical core locations are listed without engine-specific assumptions."
        />
        {detail.locations.length === 0 ? (
          <div className="platform-quiet-state">
            <BuildingIcon size={21} />
            <p>No locations have been created.</p>
          </div>
        ) : (
          <div className="platform-registry-list">
            {detail.locations.map((location) => (
              <article key={location.id}>
                <span>
                  <BuildingIcon size={19} />
                </span>
                <div>
                  <strong dir="auto">{location.displayName}</strong>
                  <p>
                    {[location.addressLine, location.locality, location.countryCode]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <StatusBadge status={location.status as "active" | "archived" | "inactive"} />
              </article>
            ))}
          </div>
        )}
      </section>

      <section
        className="platform-detail-section platform-lifecycle-panel"
        aria-labelledby="lifecycle-heading"
      >
        <div>
          <span>
            <TemplatesIcon size={21} />
          </span>
          <div>
            <h2 id="lifecycle-heading">Platform lifecycle controls</h2>
            <p>
              These actions change tenant operability, preserve data, retain the real actor, and
              write an atomic audit event.
            </p>
          </div>
        </div>
        <div className="platform-lifecycle-actions">
          {getPlatformBusinessTransitions(business.status).map((transition) => (
            <PlatformBusinessStatusControl
              key={transition.status}
              businessId={business.id}
              businessName={business.displayName}
              transition={transition}
            />
          ))}
        </div>
      </section>
    </>
  );
}

function getLifecycleMessage(value: string | string[] | undefined): string | null {
  const status = Array.isArray(value) ? value[0] : value;
  if (status === "active") return "Business reactivated.";
  if (status === "suspended") return "Business suspended by the platform.";
  if (status === "archived") return "Business archived and retained.";
  return null;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-IL", { dateStyle: "medium" }).format(new Date(value));
}
