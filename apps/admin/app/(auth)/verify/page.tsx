import { getTextDirection } from "@darb/i18n";
import { MailIcon } from "@darb/icons";

import { getAdminI18n } from "../../../lib/i18n-server";
import { adminPaths } from "../../../lib/navigation";
import { AuthShell } from "../auth-shell";

export default async function VerifyPage() {
  const { locale, t } = await getAdminI18n();
  return (
    <AuthShell
      direction={getTextDirection(locale)}
      panelLabelledBy="verify-heading"
      storyBody={t(
        "Create one secure account, then shape the Darb workspace around your business.",
      )}
      storyId="verify-story-title"
      storyTitle={t("Your business, on a clear path")}
    >
      <div className="auth-card auth-card--verify">
        <span className="auth-card__mark" aria-hidden="true">
          <MailIcon size={24} />
        </span>
        <h1 id="verify-heading">{t("One quick check, then you’re in")}</h1>
        <p className="auth-intro">
          {t(
            "Open the confirmation link we sent to your email. After confirmation, Darb will bring you back to create your first business.",
          )}
        </p>
        <a className="primary-button" href={adminPaths.login}>
          {t("Return to sign in")}
        </a>
      </div>
    </AuthShell>
  );
}
