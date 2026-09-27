import { redirect } from "next/navigation";

import { getTextDirection } from "@darb/i18n";

import { getAdminAccessSnapshot } from "../../../lib/auth";
import { getAdminI18n } from "../../../lib/i18n-server";
import { adminPaths, getLoginDestination, sanitizeReturnPath } from "../../../lib/navigation";
import { AuthShell } from "../auth-shell";
import { LoginForm } from "./login-form";

interface LoginPageProps {
  searchParams: Promise<{ confirmation?: string | string[]; next?: string | string[] }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { locale, t } = await getAdminI18n();
  const snapshot = await getAdminAccessSnapshot();
  const destination = getLoginDestination({
    accessibleBusinessCount: snapshot.businesses.length,
    isAuthenticated: Boolean(snapshot.user),
  });

  if (destination) {
    redirect(destination);
  }

  const params = await searchParams;
  const requestedNext = Array.isArray(params.next) ? params.next[0] : params.next;
  const confirmation = Array.isArray(params.confirmation)
    ? params.confirmation[0]
    : params.confirmation;
  const nextPath = sanitizeReturnPath(requestedNext);

  return (
    <AuthShell
      direction={getTextDirection(locale)}
      panelLabelledBy="login-heading"
      storyBody={t(
        "One secure workspace for the teams, locations, and Darb products you are authorized to manage.",
      )}
      storyId="auth-story-title"
      storyTitle={t("A clear path from your business to every customer.")}
    >
      <div className="auth-card">
        <h1 id="login-heading">{t("Welcome back")}</h1>
        <p className="auth-intro">
          {t("Sign in to continue to the businesses you manage with Darb.")}
        </p>
        {confirmation === "failed" ? (
          <p className="form-alert" role="alert">
            {t("That confirmation link is invalid or expired. Try signing in or register again.")}
          </p>
        ) : null}
        <LoginForm nextPath={nextPath} />
        <p className="auth-footnote">
          {t("New to Darb?")} <a href={adminPaths.register}>{t("Create account")}</a>
        </p>
        <p className="auth-footnote auth-footnote--quiet">
          {t("Access is limited to authorized Darb team members.")}
        </p>
      </div>
    </AuthShell>
  );
}
