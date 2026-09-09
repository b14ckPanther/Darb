import { getAdminI18n } from "../../../../../lib/i18n-server";
import { DomainIcon } from "@darb/icons";

import { PageHeader } from "../../../../_components/page-header";
import { PermissionNotice } from "../../../../_components/permission-notice";
import { canManageDomains } from "../../../../../lib/admin-access";
import { requireBusinessAdminContext } from "../../../../../lib/admin-context";
import { listBusinessDomains } from "../../../../../lib/domains";
import { businessPath } from "../../../../../lib/navigation";
import { createServerComponentSupabaseClient } from "../../../../../lib/supabase/server";
import { AddDomainForm } from "./add-domain-form";
import { DomainCard } from "./domain-card";

interface DomainsPageProps {
  params: Promise<{ businessSlug: string }>;
}

export default async function DomainsPage({ params }: DomainsPageProps) {
  const { t } = await getAdminI18n();
  const { businessSlug } = await params;
  const context = await requireBusinessAdminContext(businessSlug);
  const supabase = await createServerComponentSupabaseClient();
  const domains = await listBusinessDomains(supabase, context.business.id);
  const editable = canManageDomains(context.access, context.business.status);

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { href: businessPath(context.business.slug), label: t("Overview") },
          { label: t("Domains") },
        ]}
        eyebrow={t("Ownership and routing")}
        title={t("Domains")}
        summary={t(
          "Verify ownership, choose an implemented public capability, and connect the hostname through a separately attested deployment lifecycle.",
        )}
      />

      {!editable ? (
        <PermissionNotice title={t("Domain settings are read-only.")}>
          {context.business.status !== "active"
            ? t("Domains cannot be changed while this business is suspended or archived.")
            : t("The domains.manage permission is required to manage domain claims.")}
        </PermissionNotice>
      ) : (
        <AddDomainForm businessId={context.business.id} businessSlug={context.business.slug} />
      )}

      {domains.length === 0 ? (
        <section className="empty-state domain-empty-state">
          <span>
            <DomainIcon size={22} />
          </span>
          <div>
            <h2>{t("No custom domains")}</h2>
            <p>
              {t(
                "This business has not claimed a hostname. Its Darb workspace remains fully valid.",
              )}
            </p>
          </div>
        </section>
      ) : (
        <section className="domain-list-section" aria-labelledby="domain-list-heading">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{t("Tenant hostnames")}</p>
              <h2 id="domain-list-heading">{t("Domain claims and routing")}</h2>
            </div>
            <span className="count-badge" aria-label={`${domains.length} domains`}>
              {domains.length}
            </span>
          </div>
          <ul className="domain-list">
            {domains.map((domain) => (
              <li key={domain.id}>
                <DomainCard
                  businessId={context.business.id}
                  businessSlug={context.business.slug}
                  domain={domain}
                  editable={editable}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
