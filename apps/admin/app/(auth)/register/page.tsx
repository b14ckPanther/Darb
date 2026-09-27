import { redirect } from "next/navigation";

import { getTextDirection } from "@darb/i18n";

import { getAdminAccessSnapshot } from "../../../lib/auth";
import { getAdminI18n } from "../../../lib/i18n-server";
import { adminPaths, getRegistrationDestination } from "../../../lib/navigation";
import { AuthShell } from "../auth-shell";
import { RegistrationForm } from "./registration-form";

export default async function RegisterPage() {
  const { locale, t } = await getAdminI18n();
  const snapshot = await getAdminAccessSnapshot();
  const destination = getRegistrationDestination({
    accessibleBusinessCount: snapshot.businesses.length,
    isAuthenticated: Boolean(snapshot.user),
  });
  if (destination) redirect(destination);

  return (
    <AuthShell
      direction={getTextDirection(locale)}
      panelLabelledBy="registration-heading"
      storyBody={t(
        "Create one secure account, then shape the Darb workspace around your business.",
      )}
      storyId="registration-story-title"
      storyTitle={t("Start with the essentials. Build from there.")}
    >
      <div className="auth-card auth-card--registration">
        <h1 id="registration-heading">{t("Let’s get your business moving")}</h1>
        <p className="auth-intro">{t("Your first workspace takes only a few focused steps.")}</p>
        <RegistrationForm />
        <p className="auth-footnote">
          {t("Already have an account?")} <a href={adminPaths.login}>{t("Sign in")}</a>
        </p>
      </div>
    </AuthShell>
  );
}
