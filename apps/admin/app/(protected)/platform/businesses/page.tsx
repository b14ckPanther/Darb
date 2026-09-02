import Link from "next/link";

import { BuildingIcon } from "@darb/icons";

import { AdminState } from "../../../_components/admin-state";
import { PageHeader } from "../../../_components/page-header";
import { PlatformPagination } from "../../../_components/platform-pagination";
import { StatusBadge } from "../../../_components/status-badge";
import { listPlatformBusinesses, listPlatformModules } from "../../../../lib/platform";
import {
  parsePositivePage,
  platformBusinessPath,
  platformPaths,
} from "../../../../lib/platform-model";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function PlatformBusinessesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const query = readParam(params.q, 120);
  const status = readParam(params.status, 20);
  const moduleKey = readParam(params.module, 40);
  const locale = readParam(params.locale, 8);
  const domainStatus = readParam(params.domain, 30);
  const page = parsePositivePage(params.page);
  const [businesses, modules] = await Promise.all([
    listPlatformBusinesses({
      page,
      ...(query ? { query } : {}),
      ...(status ? { status } : {}),
      ...(moduleKey ? { moduleKey } : {}),
      ...(locale ? { locale } : {}),
      ...(domainStatus ? { domainStatus } : {}),
    }),
    listPlatformModules(),
  ]);

  const queryState = { q: query, status, module: moduleKey, locale, domain: domainStatus };

  return (
    <>
      <PageHeader
        eyebrow="Platform operations"
        title="Businesses"
        summary="Search the tenant estate, inspect real configuration, and enter an explicitly marked business workspace."
      />
      <form className="platform-filter-bar" method="get" aria-label="Filter businesses">
        <label className="platform-filter-search">
          <span>Business name or slug</span>
          <input name="q" defaultValue={query} placeholder="Search businesses" maxLength={120} />
        </label>
        <label>
          <span>Lifecycle</span>
          <select name="status" defaultValue={status}>
            <option value="">All states</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <label>
          <span>Module</span>
          <select name="module" defaultValue={moduleKey}>
            <option value="">Any module</option>
            {modules.map((module) => (
              <option key={module.key} value={module.key}>
                {module.displayName}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Locale</span>
          <select name="locale" defaultValue={locale}>
            <option value="">Any locale</option>
            <option value="ar">Arabic</option>
            <option value="he">Hebrew</option>
            <option value="en">English</option>
          </select>
        </label>
        <label>
          <span>Domain</span>
          <select name="domain" defaultValue={domainStatus}>
            <option value="">Any domain state</option>
            <option value="none">No domain</option>
            <option value="pending">Pending ownership</option>
            <option value="verified">Verified ownership</option>
            <option value="live">Live routing</option>
            <option value="failed">Ownership failed</option>
          </select>
        </label>
        <div className="platform-filter-actions">
          <button className="primary-button primary-button--fit" type="submit">
            Apply filters
          </button>
          <Link className="secondary-button" href={platformPaths.businesses}>
            Clear
          </Link>
        </div>
      </form>

      <div className="platform-results-heading">
        <p>
          <strong>{businesses.total.toLocaleString("en-IL")}</strong> businesses match this view.
        </p>
      </div>

      {businesses.items.length === 0 ? (
        <AdminState
          headingLevel={2}
          icon={<BuildingIcon size={24} />}
          eyebrow="Tenant directory"
          title="No businesses match these filters."
          description="Adjust the search or lifecycle filters. No tenant state has been changed."
          action={
            <Link className="secondary-button" href={platformPaths.businesses}>
              Clear filters
            </Link>
          }
        />
      ) : (
        <div className="platform-table-shell">
          <table className="platform-table">
            <caption className="visually-hidden">Darb businesses</caption>
            <thead>
              <tr>
                <th scope="col">Business</th>
                <th scope="col">Lifecycle</th>
                <th scope="col">Footprint</th>
                <th scope="col">Capabilities</th>
                <th scope="col">
                  <span className="visually-hidden">Open</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {businesses.items.map((business) => (
                <tr key={business.id}>
                  <td data-label="Business">
                    <strong dir="auto">{business.displayName}</strong>
                    <small dir="ltr">{business.slug}</small>
                  </td>
                  <td data-label="Lifecycle">
                    <StatusBadge status={business.status} />
                  </td>
                  <td data-label="Footprint">
                    <span>{business.locationCount} locations</span>
                    <small>
                      {business.membershipCount} memberships · {business.domainCount} domains
                    </small>
                  </td>
                  <td data-label="Capabilities">
                    <span>
                      {business.enabledModules.length > 0
                        ? business.enabledModules.join(", ")
                        : "None enabled"}
                    </span>
                    <small>{business.enabledLocales.join(" · ").toUpperCase()}</small>
                  </td>
                  <td className="platform-table__action">
                    <Link className="text-link" href={platformBusinessPath(business.id)}>
                      Inspect<span className="visually-hidden"> {business.displayName}</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <PlatformPagination
        currentPage={businesses.page}
        pathname={platformPaths.businesses}
        searchParams={queryState}
        total={businesses.total}
      />
    </>
  );
}

function readParam(value: string | string[] | undefined, maxLength: number): string | undefined {
  const candidate = (Array.isArray(value) ? value[0] : value)?.trim();
  return candidate && candidate.length <= maxLength ? candidate : undefined;
}
