import Link from "next/link";

import { ShieldIcon, UsersIcon } from "@darb/icons";

import { AdminState } from "../../../_components/admin-state";
import { PageHeader } from "../../../_components/page-header";
import { PlatformPagination } from "../../../_components/platform-pagination";
import { PlatformSectionHeading } from "../../../_components/platform-summary";
import { StatusBadge } from "../../../_components/status-badge";
import { listPlatformSuperAdmins, listPlatformUsers } from "../../../../lib/platform";
import { parsePositivePage, platformPaths } from "../../../../lib/platform-model";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function PlatformUsersPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = readParam(params.q, 160);
  const page = parsePositivePage(params.page);
  const [users, superAdmins] = await Promise.all([
    listPlatformUsers(query, page),
    listPlatformSuperAdmins(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Platform identities"
        title="Users"
        summary="An allow-listed operational projection of Auth identity and tenant relationships. Credentials, sessions, providers, and metadata stay private."
      />
      <section className="platform-overview-section" aria-labelledby="operators-heading">
        <PlatformSectionHeading
          id="operators-heading"
          title="Platform operators"
          description="Promotion and revocation remain a controlled operational process in this phase."
        />
        <div className="platform-registry-list">
          {superAdmins.map((administrator) => (
            <article key={administrator.userId}>
              <span>
                <ShieldIcon size={19} />
              </span>
              <div>
                <strong>
                  <bdi>{administrator.email ?? administrator.userId}</bdi>
                </strong>
                <p>Granted {formatDate(administrator.grantedAt)}</p>
              </div>
              <StatusBadge
                status={administrator.state === "active" ? "active" : "disabled"}
                label={administrator.state === "active" ? "Active operator" : "Revoked"}
              />
            </article>
          ))}
        </div>
      </section>

      <section className="platform-overview-section" aria-labelledby="user-directory-heading">
        <PlatformSectionHeading
          id="user-directory-heading"
          title="User directory"
          description={`${users.total.toLocaleString("en-IL")} Auth identities match this view.`}
        />
        <form
          className="platform-filter-bar platform-filter-bar--compact"
          method="get"
          aria-label="Search users"
        >
          <label className="platform-filter-search">
            <span>Email or exact user ID</span>
            <input name="q" defaultValue={query} placeholder="Search users" maxLength={160} />
          </label>
          <div className="platform-filter-actions">
            <button className="primary-button primary-button--fit" type="submit">
              Search
            </button>
            <Link className="secondary-button" href={platformPaths.users}>
              Clear
            </Link>
          </div>
        </form>

        {users.items.length === 0 ? (
          <AdminState
            headingLevel={2}
            icon={<UsersIcon size={24} />}
            title="No users match this search."
            description="Try a different email or exact user identifier."
          />
        ) : (
          <div className="platform-table-shell">
            <table className="platform-table">
              <caption className="visually-hidden">Darb platform users</caption>
              <thead>
                <tr>
                  <th scope="col">Identity</th>
                  <th scope="col">Platform</th>
                  <th scope="col">Memberships</th>
                  <th scope="col">Created</th>
                </tr>
              </thead>
              <tbody>
                {users.items.map((user) => (
                  <tr key={user.id}>
                    <td data-label="Identity">
                      <strong>
                        <bdi>{user.email ?? "Email unavailable"}</bdi>
                      </strong>
                      <small>
                        <bdi>{user.id}</bdi>
                      </small>
                    </td>
                    <td data-label="Platform">
                      {user.isSuperAdmin ? (
                        <StatusBadge status="active" label="Super admin" />
                      ) : (
                        <span className="platform-muted-value">Tenant user</span>
                      )}
                    </td>
                    <td data-label="Memberships">
                      <strong>{user.businessCount} businesses</strong>
                      <details className="platform-membership-details">
                        <summary>{user.activeMembershipCount} active · inspect</summary>
                        {user.memberships.length === 0 ? (
                          <p>No business memberships.</p>
                        ) : (
                          <ul>
                            {user.memberships.map((membership) => (
                              <li key={membership.id}>
                                <Link href={`/b/${membership.businessSlug}`}>
                                  {membership.businessName}
                                </Link>
                                <span>
                                  {membership.status} · {membership.permissionKeys.length} business
                                  permissions
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </details>
                    </td>
                    <td data-label="Created">
                      <time dateTime={user.createdAt}>{formatDate(user.createdAt)}</time>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <PlatformPagination
          currentPage={users.page}
          pathname={platformPaths.users}
          searchParams={{ q: query }}
          total={users.total}
        />
      </section>
    </>
  );
}

function readParam(value: string | string[] | undefined, maxLength: number): string | undefined {
  const candidate = (Array.isArray(value) ? value[0] : value)?.trim();
  return candidate && candidate.length <= maxLength ? candidate : undefined;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-IL", { dateStyle: "medium" }).format(new Date(value));
}
