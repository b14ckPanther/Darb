import Link from "next/link";
import { redirect } from "next/navigation";

import { ArrowRightIcon, AuditIcon, BuildingIcon, LogoutIcon } from "@darb/icons";

import { signOutAction } from "../actions/auth";
import { DarbAdminBrand, DarbPublicSiteLink } from "../_components/brand";
import { StatusBadge } from "../_components/status-badge";
import { AdminLanguageSwitcher } from "../_components/language-switcher";
import { getAdminAccessSnapshot } from "../../lib/auth";
import { businessPath, getProtectedAdminDestination } from "../../lib/navigation";
import { getPlatformAdminContext } from "../../lib/platform";
import { getAdminI18n } from "../../lib/i18n-server";

export default async function BusinessChooserPage() {
  const { t } = await getAdminI18n();
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
        <div className="chooser-header__actions">
          <AdminLanguageSwitcher />
          <DarbPublicSiteLink className="chooser-public-link" />
          <form action={signOutAction}>
            <button className="quiet-button" type="submit">
              <LogoutIcon size={18} />
              {t("Sign out")}
            </button>
          </form>
        </div>
      </header>

      <main id="main-content" className="business-chooser-content">
        <header className="page-header page-header--chooser">
          <div>
            <p className="eyebrow">{t("Authorized workspaces")}</p>
            <h1>
              {t(
                platformContext ? "Choose your operating context." : "Choose a business to manage.",
              )}
            </h1>
            <p className="page-header__summary">
              {t(
                platformContext
                  ? "Platform operations and tenant workspaces stay visibly separate, while your real identity remains unchanged."
                  : "Each workspace keeps its own settings, locations, permissions, and audit history.",
              )}
            </p>
          </div>
        </header>

        <ul className="chooser-grid" aria-label={t("Accessible businesses")}>
          {platformContext ? (
            <li className="chooser-card--platform">
              <Link href="/platform">
                <span className="chooser-card__icon">
                  <AuditIcon size={23} />
                </span>
                <span className="chooser-card__body">
                  <strong>{t("Darb Platform Administration")}</strong>
                  <small>{t("Cross-tenant operations")}</small>
                </span>
                <StatusBadge status="available" label={t("Platform")} />
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
                  <strong lang={business.default_locale} dir="auto">
                    {business.display_name}
                  </strong>
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
