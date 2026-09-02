import Link from "next/link";

import { AuditIcon } from "@darb/icons";

import { AdminState } from "../../../_components/admin-state";
import { PageHeader } from "../../../_components/page-header";
import { PlatformPagination } from "../../../_components/platform-pagination";
import { listPlatformAuditEvents } from "../../../../lib/platform";
import { parsePositivePage, platformPaths } from "../../../../lib/platform-model";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function PlatformAuditPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const businessId = readUuid(params.business);
  const actorQuery = readParam(params.actor, 160);
  const actionQuery = readParam(params.action, 120);
  const resourceCategory = readParam(params.resource, 80);
  const fromInput = readDate(params.from);
  const toInput = readDate(params.to);
  const page = parsePositivePage(params.page);
  const events = await listPlatformAuditEvents({
    page,
    ...(businessId ? { businessId } : {}),
    ...(actorQuery ? { actorQuery } : {}),
    ...(actionQuery ? { actionQuery } : {}),
    ...(resourceCategory ? { resourceCategory } : {}),
    ...(fromInput ? { from: `${fromInput}T00:00:00.000Z` } : {}),
    ...(toInput ? { to: `${toInput}T23:59:59.999Z` } : {}),
  });

  return (
    <>
      <PageHeader
        eyebrow="Platform governance"
        title="Audit"
        summary="Paginated security and administration history across Darb. Raw metadata stays outside the browser projection."
      />
      <form
        className="platform-filter-bar platform-filter-bar--audit"
        method="get"
        aria-label="Filter audit history"
      >
        <label>
          <span>Business ID</span>
          <input name="business" defaultValue={businessId} placeholder="Exact UUID" />
        </label>
        <label>
          <span>Actor email or ID</span>
          <input name="actor" defaultValue={actorQuery} placeholder="Actor" maxLength={160} />
        </label>
        <label>
          <span>Action</span>
          <input
            name="action"
            defaultValue={actionQuery}
            placeholder="e.g. platform.business"
            maxLength={120}
          />
        </label>
        <label>
          <span>Resource category</span>
          <input
            name="resource"
            defaultValue={resourceCategory}
            placeholder="e.g. core or restaurant"
            maxLength={80}
          />
        </label>
        <label>
          <span>From</span>
          <input name="from" type="date" defaultValue={fromInput} />
        </label>
        <label>
          <span>To</span>
          <input name="to" type="date" defaultValue={toInput} />
        </label>
        <div className="platform-filter-actions">
          <button className="primary-button primary-button--fit" type="submit">
            Apply filters
          </button>
          <Link className="secondary-button" href={platformPaths.audit}>
            Clear
          </Link>
        </div>
      </form>
      <div className="platform-results-heading">
        <p>
          <strong>{events.total.toLocaleString("en-IL")}</strong> audit events match this view.
        </p>
      </div>
      {events.items.length === 0 ? (
        <AdminState
          headingLevel={2}
          icon={<AuditIcon size={24} />}
          title="No audit events match these filters."
          description="Try a broader date, action, actor, or business scope."
        />
      ) : (
        <ol className="platform-audit-list">
          {events.items.map((event) => (
            <li key={event.id}>
              <span className="platform-audit-list__mark">
                <AuditIcon size={18} />
              </span>
              <div className="platform-audit-list__body">
                <div>
                  <strong>
                    <bdi>{event.actionKey}</bdi>
                  </strong>
                  <time dateTime={event.occurredAt}>{formatDateTime(event.occurredAt)}</time>
                </div>
                <p>
                  Actor: <bdi>{event.actorEmail ?? event.actorUserId ?? event.actorKind}</bdi>
                  {event.businessName ? (
                    <>
                      {" "}
                      · Business: <bdi>{event.businessName}</bdi>
                    </>
                  ) : (
                    " · Platform scope"
                  )}
                </p>
                {event.entityType ? (
                  <small>
                    Resource: <bdi>{event.entityType}</bdi>
                    {event.entityId ? (
                      <>
                        {" "}
                        · <bdi>{event.entityId}</bdi>
                      </>
                    ) : null}
                  </small>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      )}
      <PlatformPagination
        currentPage={events.page}
        pathname={platformPaths.audit}
        searchParams={{
          business: businessId,
          actor: actorQuery,
          action: actionQuery,
          resource: resourceCategory,
          from: fromInput,
          to: toInput,
        }}
        total={events.total}
      />
    </>
  );
}

function readParam(value: string | string[] | undefined, maxLength: number): string | undefined {
  const candidate = (Array.isArray(value) ? value[0] : value)?.trim();
  return candidate && candidate.length <= maxLength ? candidate : undefined;
}

function readUuid(value: string | string[] | undefined): string | undefined {
  const candidate = readParam(value, 36);
  return candidate &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(candidate)
    ? candidate
    : undefined;
}

function readDate(value: string | string[] | undefined): string | undefined {
  const candidate = readParam(value, 10);
  return candidate && /^\d{4}-\d{2}-\d{2}$/.test(candidate) ? candidate : undefined;
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-IL", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jerusalem",
  }).format(new Date(value));
}
