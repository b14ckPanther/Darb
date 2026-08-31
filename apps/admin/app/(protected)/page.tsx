import { redirect } from "next/navigation";

import { BuildingIcon, LogoutIcon, ShieldIcon } from "@darb/icons";

import { signOutAction } from "../actions/auth";
import { DarbAdminBrand } from "../_components/brand";
import { getAdminAccessSnapshot } from "../../lib/auth";
import { getProtectedAdminDestination } from "../../lib/navigation";

const localeNames = {
  ar: "Arabic",
  he: "Hebrew",
  en: "English",
} as const;

export default async function AdminPage() {
  const snapshot = await getAdminAccessSnapshot();
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

  if (!snapshot.user) {
    redirect("/login");
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <DarbAdminBrand />
        <form action={signOutAction}>
          <button className="quiet-button" type="submit">
            <LogoutIcon size={18} />
            Sign out
          </button>
        </form>
      </header>

      <main id="main-content" className="admin-content">
        <section className="access-hero" aria-labelledby="access-heading">
          <p className="eyebrow">
            <ShieldIcon size={17} />
            Access confirmed
          </p>
          <h1 id="access-heading">Your Darb workspace is ready.</h1>
          <p>
            Signed in as <bdi>{snapshot.user.email ?? "your Darb account"}</bdi>. This minimal shell
            confirms secure session and tenant access; administration tools arrive in later phases.
          </p>
        </section>

        <section className="business-access" aria-labelledby="business-access-heading">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Authorized scope</p>
              <h2 id="business-access-heading">Accessible businesses</h2>
            </div>
            <span className="count-badge">{snapshot.businesses.length}</span>
          </div>

          <ul className="business-list">
            {snapshot.businesses.map((business) => (
              <li key={business.id} className="business-card">
                <span className="business-card__icon">
                  <BuildingIcon size={22} />
                </span>
                <div>
                  <h3 dir="auto">{business.display_name}</h3>
                  <p>
                    <span dir="ltr">{business.slug}</span>
                    <span aria-hidden="true">·</span>
                    {localeNames[business.default_locale]}
                  </p>
                </div>
                <span className="status-chip">{business.status}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
