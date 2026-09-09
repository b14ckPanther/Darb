import Link from "next/link";

import { DomainIcon } from "@darb/icons";

import { AdminState } from "../../../_components/admin-state";
import { PageHeader } from "../../../_components/page-header";
import { PlatformPagination } from "../../../_components/platform-pagination";
import { StatusBadge } from "../../../_components/status-badge";
import { listPlatformDomains, listPlatformModules } from "../../../../lib/platform";
import { getAdminI18n } from "../../../../lib/i18n-server";
import {
  parsePositivePage,
  platformBusinessPath,
  platformPaths,
} from "../../../../lib/platform-model";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function PlatformDomainsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const query = readParam(params.q, 253);
  const ownershipStatus = readParam(params.ownership, 20);
  const routingStatus = readParam(params.routing, 20);
  const moduleKey = readParam(params.module, 40);
  const primaryValue = readParam(params.primary, 8);
  const primary = primaryValue === "yes" ? true : primaryValue === "no" ? false : undefined;
  const page = parsePositivePage(params.page);
  const [domains, modules, { locale, t }] = await Promise.all([
    listPlatformDomains({
      page,
      ...(query ? { query } : {}),
      ...(ownershipStatus ? { ownershipStatus } : {}),
      ...(routingStatus ? { routingStatus } : {}),
      ...(moduleKey ? { moduleKey } : {}),
      ...(primary !== undefined ? { primary } : {}),
    }),
    listPlatformModules(),
    getAdminI18n(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Global operations"
        title="Domains"
        summary="Inspect tenant ownership and Darb routing state globally. Verification proofs and deployment-provider payloads never enter this projection."
      />
      <form className="platform-filter-bar" method="get" aria-label={t("Filter domains")}>
        <label className="platform-filter-search">
          <span>{t("Hostname or business")}</span>
          <input name="q" defaultValue={query} placeholder={t("Search domains")} maxLength={253} />
        </label>
        <label>
          <span>{t("Ownership")}</span>
          <select name="ownership" defaultValue={ownershipStatus}>
            <option value="">{t("Any state")}</option>
            <option value="pending">{t("Pending")}</option>
            <option value="verified">{t("Verified")}</option>
            <option value="failed">{t("Failed")}</option>
            <option value="disabled">{t("Disabled")}</option>
          </select>
        </label>
        <label>
          <span>{t("Routing")}</span>
          <select name="routing" defaultValue={routingStatus}>
            <option value="">{t("Any state")}</option>
            <option value="unconfigured">{t("Unconfigured")}</option>
            <option value="provisioning">{t("Provisioning")}</option>
            <option value="live">{t("Live")}</option>
            <option value="failed">{t("Failed")}</option>
            <option value="disconnected">{t("Disconnected")}</option>
          </select>
        </label>
        <label>
          <span>{t("Target")}</span>
          <select name="module" defaultValue={moduleKey}>
            <option value="">{t("Any target")}</option>
            {modules.map((module) => (
              <option key={module.key} value={module.key}>
                {module.displayName}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>{t("Primary")}</span>
          <select name="primary" defaultValue={primaryValue}>
            <option value="">{t("Either")}</option>
            <option value="yes">{t("Primary only")}</option>
            <option value="no">{t("Non-primary")}</option>
          </select>
        </label>
        <div className="platform-filter-actions">
          <button className="primary-button primary-button--fit" type="submit">
            {t("Apply filters")}
          </button>
          <Link className="secondary-button" href={platformPaths.domains}>
            {t("Clear")}
          </Link>
        </div>
      </form>
      <div className="platform-results-heading">
        <p>
          {t("{count} domains match this view.", { count: domains.total.toLocaleString(locale) })}
        </p>
      </div>
      {domains.items.length === 0 ? (
        <AdminState
          headingLevel={2}
          icon={<DomainIcon size={24} />}
          title="No domains match these filters."
          description="Adjust the ownership, routing, or business filter. No provider action has been performed."
        />
      ) : (
        <div className="platform-table-shell">
          <table className="platform-table">
            <caption className="visually-hidden">{t("Darb custom domains")}</caption>
            <thead>
              <tr>
                <th scope="col">{t("Hostname")}</th>
                <th scope="col">{t("Business")}</th>
                <th scope="col">{t("Ownership")}</th>
                <th scope="col">{t("Routing")}</th>
                <th scope="col">{t("Target")}</th>
              </tr>
            </thead>
            <tbody>
              {domains.items.map((domain) => (
                <tr key={domain.id}>
                  <td data-label={t("Hostname")}>
                    <strong dir="ltr">{domain.hostname}</strong>
                    <small>
                      {t(domain.isPrimary ? "Primary canonical host" : "Alias or unassigned")}
                    </small>
                  </td>
                  <td data-label={t("Business")}>
                    <Link className="text-link" href={platformBusinessPath(domain.businessId)}>
                      {domain.businessName}
                    </Link>
                    <small dir="ltr">{domain.businessSlug}</small>
                  </td>
                  <td data-label={t("Ownership")}>
                    <StatusBadge status={domain.ownershipStatus} />
                    <small>
                      {formatDate(
                        domain.verifiedAt ?? domain.verificationCheckedAt,
                        locale,
                        t("Not recorded"),
                      )}
                    </small>
                  </td>
                  <td data-label={t("Routing")}>
                    <StatusBadge status={domain.routingStatus} />
                    <small>
                      {formatDate(
                        domain.routingLiveAt ?? domain.routingCheckedAt,
                        locale,
                        t("Not recorded"),
                      )}
                    </small>
                  </td>
                  <td data-label={t("Target")}>
                    <span>{domain.targetModuleKey ?? t("Not assigned")}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <PlatformPagination
        currentPage={domains.page}
        pathname={platformPaths.domains}
        searchParams={{
          q: query,
          ownership: ownershipStatus,
          routing: routingStatus,
          module: moduleKey,
          primary: primaryValue,
        }}
        total={domains.total}
      />
    </>
  );
}

function readParam(value: string | string[] | undefined, maxLength: number): string | undefined {
  const candidate = (Array.isArray(value) ? value[0] : value)?.trim();
  return candidate && candidate.length <= maxLength ? candidate : undefined;
}

function formatDate(value: string | null, locale: string, fallback: string): string {
  return value
    ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(value))
    : fallback;
}
