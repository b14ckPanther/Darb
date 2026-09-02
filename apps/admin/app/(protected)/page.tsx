import Link from "next/link";
import { redirect } from "next/navigation";

import { ArrowRightIcon, AuditIcon, BuildingIcon, LogoutIcon } from "@darb/icons";

import { signOutAction } from "../actions/auth";
import { DarbAdminBrand } from "../_components/brand";
import { StatusBadge } from "../_components/status-badge";
import { getAdminAccessSnapshot } from "../../lib/auth";
import { businessPath, getProtectedAdminDestination } from "../../lib/navigation";
import { getPlatformAdminContext } from "../../lib/platform";

export default async function BusinessChooserPage() {
  const [snapshot, platformContext] = await Promise.all([
    getAdminAccessSnapshot(),
    getPlatformAdminContext(),
  ]);
  const destination = getProtectedAdminDestination(
    {
      accessibleBusinessCount: snapshot.businesses.length,
      isAuthenticated: Boolean(snapshot.user),
    },
    "/",
  );

  if (destination) {
    redirect(destination);
  }

  if (snapshot.businesses.length === 1 && !platformContext) {
    redirect(businessPath(snapshot.businesses[0]!.slug));
  }

  return (
    <div className="business-chooser-page">
      <header className="chooser-header">
        <DarbAdminBrand />
        <form action={signOutAction}>
          <button className="quiet-button" type="submit">
            <LogoutIcon size={18} />
            Sign out
          </button>
        </form>
      </header>

      <main id="main-content" className="business-chooser-content">
        <header className="page-header page-header--chooser">
          <div>
            <p className="eyebrow">Authorized workspaces</p>
            <h1>
              {platformContext ? "Choose your operating context." : "Choose a business to manage."}
            </h1>
            <p className="page-header__summary">
              {platformContext
                ? "Platform operations and tenant workspaces stay visibly separate, while your real identity remains unchanged."
                : "Each workspace keeps its own settings, locations, permissions, and audit history."}
            </p>
          </div>
        </header>

        <ul className="chooser-grid" aria-label="Accessible businesses">
          {platformContext ? (
            <li className="chooser-card--platform">
              <Link href="/platform">
                <span className="chooser-card__icon">
                  <AuditIcon size={23} />
                </span>
                <span className="chooser-card__body">
                  <strong>Darb Platform Administration</strong>
                  <small>Cross-tenant operations</small>
                </span>
                <StatusBadge status="available" label="Platform" />
                <ArrowRightIcon className="chooser-card__arrow" size={19} />
              </Link>
            </li>
          ) : null}
          {snapshot.businesses.map((business) => (
            <li key={business.id}>
              <Link href={businessPath(business.slug)}>
                <span className="chooser-card__icon">
                  <BuildingIcon size={23} />
                </span>
                <span className="chooser-card__body">
                  <strong dir="auto">{business.display_name}</strong>
                  <small dir="ltr">{business.slug}</small>
                </span>
                <StatusBadge status={business.status} />
                <ArrowRightIcon className="chooser-card__arrow" size={19} />
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
