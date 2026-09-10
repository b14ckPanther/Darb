import { redirect } from "next/navigation";

import { requireBusinessAdminContext } from "../../../../../lib/admin-context";
import { businessPath } from "../../../../../lib/navigation";
import { getAdminI18n } from "../../../../../lib/i18n-server";
import { FirstBusinessSetupForm } from "./setup-form";

export default async function FirstBusinessSetupPage({
  params,
}: {
  params: Promise<{ businessSlug: string }>;
}) {
  const { businessSlug } = await params;
  const { t } = await getAdminI18n();
  const context = await requireBusinessAdminContext(businessSlug);
  if (context.business.onboarding_completed_at) redirect(businessPath(context.business.slug));

  const restaurant = context.modules.find((module) => module.key === "restaurant");
  return (
    <main id="main-content" className="setup-flow">
      <header className="setup-flow__header">
        <p className="eyebrow">{t("Workspace setup")}</p>
        <h1>{t("Shape your first Darb workspace")}</h1>
        <p>{t("Choose only what helps you start. Everything here can be managed later.")}</p>
        <ol className="setup-progress" aria-label={t("Onboarding progress")}>
          <li className="is-complete">{t("Account")}</li>
          <li className="is-complete">{t("Business")}</li>
          <li aria-current="step">{t("Essentials")}</li>
        </ol>
      </header>
      <FirstBusinessSetupForm
        business={context.business}
        restaurantAvailable={Boolean(restaurant?.isAvailable)}
      />
    </main>
  );
}
