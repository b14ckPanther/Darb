import Link from "next/link";

import {
  AuditIcon,
  BuildingIcon,
  DomainIcon,
  ModulesIcon,
  TemplatesIcon,
  UsersIcon,
} from "@darb/icons";

import { PageHeader } from "../../_components/page-header";
import { PlatformMetric, PlatformSectionHeading } from "../../_components/platform-summary";
import { loadPlatformOverview } from "../../../lib/platform";
import { platformPaths } from "../../../lib/platform-model";

export default async function PlatformOverviewPage() {
  const overview = await loadPlatformOverview();

  return (
    <>
      <PageHeader
        eyebrow="Darb control plane"
        title="Platform overview"
        summary="A factual operating view of Darb tenants, identities, capabilities, domains, and platform-owned presentation resources."
      />

      <section className="platform-overview-section" aria-labelledby="tenant-health-heading">
        <PlatformSectionHeading
          id="tenant-health-heading"
          title="Tenant estate"
          description="Lifecycle totals are current database state—not growth or commercial analytics."
        />
        <div className="platform-metric-grid">
          <PlatformMetric
            icon={<BuildingIcon size={21} />}
            label="Businesses"
            value={overview.businesses.total}
            detail={`${overview.businesses.active} active · ${overview.businesses.suspended} suspended · ${overview.businesses.archived} archived`}
          />
          <PlatformMetric
            icon={<UsersIcon size={21} />}
            label="Auth users"
            value={overview.users}
            detail={`${overview.memberships} total business memberships`}
          />
          <PlatformMetric
            icon={<ModulesIcon size={21} />}
            label="Restaurant effective"
            value={overview.restaurantEnabledBusinesses}
            detail={`${overview.availableModules} platform modules currently available`}
          />
          <PlatformMetric
            icon={<DomainIcon size={21} />}
            label="Live domains"
            value={overview.liveDomains}
            detail="Verified custom hostnames with live routing"
          />
          <PlatformMetric
            icon={<TemplatesIcon size={21} />}
            label="Templates"
            value={overview.templates}
            detail="Platform-owned rendering compositions"
          />
          <PlatformMetric
            icon={<AuditIcon size={21} />}
            label="Active operators"
            value={overview.activeSuperAdmins}
            detail="Explicit non-revoked platform assignments"
          />
        </div>
      </section>

      <section className="platform-overview-section" aria-labelledby="operating-areas-heading">
        <PlatformSectionHeading
          id="operating-areas-heading"
          title="Operating areas"
          description="Each area uses a bounded platform projection; tenant work remains in its business workspace."
        />
        <div className="platform-area-grid">
          {[
            {
              href: platformPaths.businesses,
              icon: <BuildingIcon size={20} />,
              title: "Businesses",
              detail:
                "Find tenants, inspect configuration, and apply deliberate lifecycle controls.",
            },
            {
              href: platformPaths.users,
              icon: <UsersIcon size={20} />,
              title: "Users",
              detail:
                "Review allow-listed identity and membership context without exposing Auth internals.",
            },
            {
              href: platformPaths.domains,
              icon: <DomainIcon size={20} />,
              title: "Domains",
              detail:
                "Inspect ownership and routing lifecycle globally without ownership proof values.",
            },
            {
              href: platformPaths.audit,
              icon: <AuditIcon size={20} />,
              title: "Audit",
              detail:
                "Review paginated platform and tenant security events without raw metadata payloads.",
            },
          ].map((area) => (
            <Link href={area.href} key={area.href}>
              <span>{area.icon}</span>
              <div>
                <strong>{area.title}</strong>
                <p>{area.detail}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
