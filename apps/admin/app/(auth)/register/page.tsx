import Link from "next/link";
import { redirect } from "next/navigation";

import { DarbAdminBrand, DarbPublicSiteLink } from "../../_components/brand";
import { AdminLanguageSwitcher } from "../../_components/language-switcher";
import { getAdminAccessSnapshot } from "../../../lib/auth";
import { getAdminI18n } from "../../../lib/i18n-server";
import { adminPaths, getRegistrationDestination } from "../../../lib/navigation";
import { RegistrationForm } from "./registration-form";

export default async function RegisterPage() {
  const { t } = await getAdminI18n();
  const snapshot = await getAdminAccessSnapshot();
  const destination = getRegistrationDestination({
    accessibleBusinessCount: snapshot.businesses.length,
    isAuthenticated: Boolean(snapshot.user),
  });
  if (destination) redirect(destination);

  return (
    <main id="main-content" className="auth-layout">
      <section className="auth-story" aria-labelledby="registration-story-title">
        <div className="auth-story__brandline">
          <DarbAdminBrand tone="light" />
          <div className="auth-story__actions">
            <AdminLanguageSwitcher />
            <DarbPublicSiteLink className="auth-public-link" label="Back to Darb" />
          </div>
        </div>
        <div className="auth-story__copy">
          <p className="auth-story__kicker">{t("Your business, on a clear path")}</p>
          <h2 id="registration-story-title">{t("Start with the essentials. Build from there.")}</h2>
          <p>
            {t("Create one secure account, then shape the Darb workspace around your business.")}
          </p>
        </div>
        <div className="auth-opening" aria-hidden="true">
          <span />
        </div>
      </section>
      <section className="auth-panel" aria-labelledby="registration-heading">
        <div className="auth-card auth-card--registration">
          <p className="eyebrow">{t("Create your Darb account")}</p>
          <h1 id="registration-heading">{t("Let’s get your business moving")}</h1>
          <p className="auth-intro">{t("Your first workspace takes only a few focused steps.")}</p>
          <RegistrationForm />
          <p className="auth-footnote">
            {t("Already have an account?")} <Link href={adminPaths.login}>{t("Sign in")}</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
