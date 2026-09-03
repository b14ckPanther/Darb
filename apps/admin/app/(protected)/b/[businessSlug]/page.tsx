import type { ReactNode } from "react";
import Link from "next/link";

import {
  AppearanceIcon,
  ArrowRightIcon,
  BuildingIcon,
  CheckmarkCircleIcon,
  DomainIcon,
  ImageIcon,
  LanguagesSettingsIcon,
  LocationIcon,
  ModulesIcon,
} from "@darb/icons";
import { getTextDirection } from "@darb/i18n";

import { PageHeader } from "../../../_components/page-header";
import { StatusBadge } from "../../../_components/status-badge";
import { getHonestModuleAvailability } from "../../../../lib/admin-foundation";
import { loadAdminOverview } from "../../../../lib/admin-overview";
import { requireBusinessAdminContext } from "../../../../lib/admin-context";
import { adminEngineContributions, businessSectionPath } from "../../../../lib/navigation";
import { createServerComponentSupabaseClient } from "../../../../lib/supabase/server";

interface BusinessHomePageProps {
  params: Promise<{ businessSlug: string }>;
}

const localeNames = { ar: "Arabic", en: "English", he: "Hebrew" } as const;

export default async function BusinessHomePage({ params }: BusinessHomePageProps) {
  const { businessSlug } = await params;
  const context = await requireBusinessAdminContext(businessSlug);
  const supabase = await createServerComponentSupabaseClient();
  const overview = await loadAdminOverview(supabase, context);

  return (
    <>
      <PageHeader
        eyebrow="Workspace overview"
        title={context.business.display_name}
        summary="A factual view of the platform foundations configured for this business—without invented engine activity or performance data."
        status={<StatusBadge status={context.business.status} />}
      />

      <section className="overview-brief" aria-labelledby="business-brief-heading">
        <div className="overview-identity">
          <span className="overview-identity__mark">
            <BuildingIcon size={24} />
          </span>
          <div>
            <p className="eyebrow">Business identity</p>
            <h2 id="business-brief-heading" lang={context.business.default_locale} dir="auto">
              {context.business.display_name}
            </h2>
            <p dir="ltr">darb.co.il/b/{context.business.slug}</p>
          </div>
          <dl>
            <div>
              <dt>Default language</dt>
              <dd
                lang={context.business.default_locale}
                dir={getTextDirection(context.business.default_locale)}
              >
                {localeNames[context.business.default_locale]}
              </dd>
            </div>
            <div>
              <dt>Regional defaults</dt>
              <dd>
                {context.business.currency_code} · <bdi>{context.business.timezone}</bdi>
              </dd>
            </div>
          </dl>
        </div>

        <dl className="overview-facts" aria-label="Current platform state">
          <OverviewFact
            icon={<LocationIcon size={19} />}
            label={
              context.access.canReadAllLocations || context.access.canManageAllLocations
                ? "Locations"
                : "Visible locations"
            }
            value={String(context.locations.length)}
          />
          <OverviewFact
            icon={<LanguagesSettingsIcon size={19} />}
            label="Enabled languages"
            value={String(overview.enabledLocaleCount)}
          />
          <OverviewFact
            icon={<ImageIcon size={19} />}
            label="Active media"
            value={String(overview.activeMediaCount)}
          />
          <OverviewFact
            icon={<DomainIcon size={19} />}
            label="Verified domains"
            value={String(overview.verifiedDomainCount)}
          />
        </dl>
      </section>

      <section className="overview-section" aria-labelledby="readiness-heading">
        <div className="overview-section__heading">
          <div>
            <p className="eyebrow">Setup readiness</p>
            <h2 id="readiness-heading">Clear next steps, without a made-up score</h2>
          </div>
          <p>Required foundations are separated from recommended and optional setup.</p>
        </div>
        <ul className="readiness-list">
          {overview.readiness.map((item) => {
            const canLink =
              (item.key !== "media" || context.access.canManageMedia) &&
              (item.key !== "domain" || context.access.canManageDomains) &&
              (item.key !== "locations" ||
                context.locations.length > 0 ||
                context.access.canManageAllLocations);

            return (
              <li key={item.key}>
                <span
                  className={`readiness-list__state readiness-list__state--${item.state}`}
                  aria-hidden="true"
                >
                  <CheckmarkCircleIcon size={18} />
                </span>
                <div>
                  <span className="readiness-list__label-row">
                    <strong>{item.label}</strong>
                    <StatusBadge status={item.importance} />
                  </span>
                  <p>{item.description}</p>
                </div>
                {item.href && canLink ? (
                  <Link href={item.href} aria-label={`Review ${item.label}`}>
                    Review
                    <ArrowRightIcon size={16} />
                  </Link>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="overview-section" aria-labelledby="capability-heading">
        <div className="overview-section__heading">
          <div>
            <p className="eyebrow">Product capabilities</p>
            <h2 id="capability-heading">Enabled state is not an engine launch</h2>
          </div>
          <Link
            className="overview-section__link"
            href={businessSectionPath(context.business.slug, "modules")}
          >
            Manage modules <ArrowRightIcon size={16} />
          </Link>
        </div>
        <ul className="overview-module-list">
          {context.modules.map((module) => {
            const availability = getHonestModuleAvailability(
              module,
              adminEngineContributions.some((engine) => engine.moduleKey === module.key),
            );
            return (
              <li key={module.key}>
                <span>
                  <ModulesIcon size={19} />
                </span>
                <div>
                  <strong>{module.displayName}</strong>
                  <p>{availability.detail}</p>
                </div>
                <StatusBadge status={availability.state} label={availability.label} />
              </li>
            );
          })}
        </ul>
      </section>

      <section className="overview-footnote" aria-label="Appearance and domain context">
        <AppearanceIcon size={19} />
        <p>
          {overview.appearanceContextCount > 0
            ? `${overview.appearanceContextCount} appearance ${overview.appearanceContextCount === 1 ? "context is" : "contexts are"} available; ${overview.configuredAppearanceCount} ${overview.configuredAppearanceCount === 1 ? "has" : "have"} explicit tenant settings.`
            : "No enabled capability currently has an appearance context."}
          {overview.primaryDomain
            ? ` ${overview.primaryDomain} is the verified primary domain.`
            : ` ${overview.domainCount > 0 ? "No domain claim is verified and primary yet." : "A custom domain remains optional."}`}
        </p>
      </section>
    </>
  );
}

function OverviewFact({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div>
      <dt>
        {icon}
        {label}
      </dt>
      <dd>{value}</dd>
    </div>
  );
}
