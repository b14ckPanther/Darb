import Link from "next/link";

import { ArrowRightIcon, BuildingIcon, LocationIcon, ModulesIcon, SettingsIcon } from "@darb/icons";
import { getTextDirection } from "@darb/i18n";

import { PageHeader } from "../../../_components/page-header";
import { StatusBadge } from "../../../_components/status-badge";
import { canShowLocations } from "../../../../lib/admin-access";
import { requireBusinessAdminContext } from "../../../../lib/admin-context";
import { businessSectionPath } from "../../../../lib/navigation";

interface BusinessHomePageProps {
  params: Promise<{ businessSlug: string }>;
}

const localeNames = { ar: "Arabic", en: "English", he: "Hebrew" } as const;

export default async function BusinessHomePage({ params }: BusinessHomePageProps) {
  const { businessSlug } = await params;
  const context = await requireBusinessAdminContext(businessSlug);
  const showLocations = canShowLocations(context.access, context.locations.length);

  return (
    <>
      <PageHeader
        eyebrow="Business workspace"
        title={context.business.display_name}
        summary="Core identity and location access for this Darb business. Product engines remain separate."
      />

      <section className="business-summary-grid" aria-label="Core business details">
        <div className="summary-panel summary-panel--identity">
          <span className="summary-panel__icon">
            <BuildingIcon size={22} />
          </span>
          <div>
            <small>Business identity</small>
            <strong dir="auto">{context.business.display_name}</strong>
            <span dir="ltr">{context.business.slug}</span>
          </div>
          <StatusBadge status={context.business.status} />
        </div>
        <dl className="definition-grid">
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
            <dt>Currency</dt>
            <dd>{context.business.currency_code}</dd>
          </div>
          <div>
            <dt>Timezone</dt>
            <dd dir="ltr">{context.business.timezone}</dd>
          </div>
          <div>
            <dt>Visible locations</dt>
            <dd>{context.locations.length}</dd>
          </div>
        </dl>
      </section>

      <section className="core-section" aria-labelledby="core-sections-heading">
        <div className="section-heading section-heading--plain">
          <div>
            <p className="eyebrow">Core administration</p>
            <h2 id="core-sections-heading">Manage the essentials</h2>
          </div>
        </div>
        <div className="section-link-grid">
          <Link href={businessSectionPath(context.business.slug, "settings")}>
            <span>
              <SettingsIcon size={20} />
            </span>
            <div>
              <strong>Business settings</strong>
              <small>Identity, language, timezone, and lifecycle.</small>
            </div>
            <ArrowRightIcon size={18} />
          </Link>
          {showLocations ? (
            <Link href={businessSectionPath(context.business.slug, "locations")}>
              <span>
                <LocationIcon size={20} />
              </span>
              <div>
                <strong>Locations</strong>
                <small>View and manage only the locations in your scope.</small>
              </div>
              <ArrowRightIcon size={18} />
            </Link>
          ) : null}
          <Link href={businessSectionPath(context.business.slug, "modules")}>
            <span>
              <ModulesIcon size={20} />
            </span>
            <div>
              <strong>Modules</strong>
              <small>Review and manage this business&apos;s capability state.</small>
            </div>
            <ArrowRightIcon size={18} />
          </Link>
        </div>
      </section>
    </>
  );
}
