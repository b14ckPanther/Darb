import { redirect } from "next/navigation";

import { ShieldIcon } from "@darb/icons";

import { DarbAdminBrand } from "../../_components/brand";
import { AdminLanguageSwitcher } from "../../_components/language-switcher";
import { getAdminAccessSnapshot } from "../../../lib/auth";
import { getAdminI18n } from "../../../lib/i18n-server";
import { getOnboardingDestination } from "../../../lib/navigation";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const { t } = await getAdminI18n();
  const snapshot = await getAdminAccessSnapshot();
  const destination = getOnboardingDestination({
    accessibleBusinessCount: snapshot.businesses.length,
    isAuthenticated: Boolean(snapshot.user),
  });

  if (destination) {
    redirect(destination);
  }

  return (
    <main id="main-content" className="onboarding-layout">
      <header className="onboarding-header">
        <DarbAdminBrand />
        <div className="onboarding-header__actions">
          <AdminLanguageSwitcher />
          <p className="secure-context">
            <ShieldIcon size={18} />
            {t("Signed in securely")}
          </p>
        </div>
      </header>

      <section className="onboarding-card" aria-labelledby="onboarding-heading">
        <div className="onboarding-card__intro">
          <p className="eyebrow">{t("First workspace")}</p>
          <h1 id="onboarding-heading">{t("Create your business")}</h1>
          <p className="auth-intro">
            {t(
              "Start with the identity Darb will use across every product. The next step tailors the essentials.",
            )}
          </p>
          <ol className="setup-progress" aria-label={t("Onboarding progress")}>
            <li className="is-complete">{t("Account")}</li>
            <li aria-current="step">{t("Business")}</li>
            <li>{t("Essentials")}</li>
          </ol>
        </div>
        <OnboardingForm />
      </section>

      <p className="onboarding-note">
        {t(
          "Currency starts as ILS and the timezone as Asia/Jerusalem. You will choose products and locations next.",
        )}
      </p>
    </main>
  );
}
