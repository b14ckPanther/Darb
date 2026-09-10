import Link from "next/link";
import { MailIcon } from "@darb/icons";
import { getAdminI18n } from "../../../lib/i18n-server";
import { adminPaths } from "../../../lib/navigation";

export default async function VerifyPage() {
  const { t } = await getAdminI18n();
  return (
    <main id="main-content" className="onboarding-layout">
      <section className="onboarding-card verification-card" aria-labelledby="verify-heading">
        <span className="verification-card__icon">
          <MailIcon size={28} />
        </span>
        <p className="eyebrow">{t("Confirm your email")}</p>
        <h1 id="verify-heading">{t("One quick check, then you’re in")}</h1>
        <p className="auth-intro">
          {t(
            "Open the confirmation link we sent to your email. After confirmation, Darb will bring you back to create your first business.",
          )}
        </p>
        <Link className="primary-button" href={adminPaths.login}>
          {t("Return to sign in")}
        </Link>
      </section>
    </main>
  );
}
