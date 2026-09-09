import { getAdminI18n } from "../../../../../lib/i18n-server";
import { LanguagesSettingsIcon } from "@darb/icons";

import { PageHeader } from "../../../../_components/page-header";
import { PermissionNotice } from "../../../../_components/permission-notice";
import { requireBusinessAdminContext } from "../../../../../lib/admin-context";
import { listBusinessLocales, mapBusinessLocaleState } from "../../../../../lib/business-locales";
import { businessPath } from "../../../../../lib/navigation";
import { createServerComponentSupabaseClient } from "../../../../../lib/supabase/server";
import { LanguageSettingsForm } from "./language-settings-form";

interface LanguagesPageProps {
  params: Promise<{ businessSlug: string }>;
}

export default async function LanguagesPage({ params }: LanguagesPageProps) {
  const { t } = await getAdminI18n();
  const { businessSlug } = await params;
  const context = await requireBusinessAdminContext(businessSlug);
  const supabase = await createServerComponentSupabaseClient();
  const locales = await listBusinessLocales(supabase, context.business.id);
  const state = mapBusinessLocaleState(locales, context.business.default_locale);
  const editable = context.access.canManageBusiness && context.business.status === "active";

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { href: businessPath(context.business.slug), label: t("Overview") },
          { label: t("Languages") },
        ]}
        eyebrow={t("Language availability")}
        title={t("Languages")}
        summary={t(
          "Choose the languages this business supports and one canonical default. Content translation remains owned by each future engine.",
        )}
      />

      {!editable ? (
        <PermissionNotice title={t("Language settings are read-only.")}>
          {context.business.status !== "active"
            ? t("Languages cannot be changed while this business is suspended or archived.")
            : t("The business.manage permission is required to change enabled languages.")}
        </PermissionNotice>
      ) : null}

      <section className="language-foundation-note" aria-labelledby="language-foundation-heading">
        <span>
          <LanguagesSettingsIcon size={22} />
        </span>
        <div>
          <h2 id="language-foundation-heading">{t("A stable platform invariant")}</h2>
          <p>
            {t(
              "The default language is always enabled. Arabic and Hebrew use RTL; English uses LTR.",
            )}
          </p>
        </div>
      </section>

      <LanguageSettingsForm
        businessId={context.business.id}
        businessSlug={context.business.slug}
        editable={editable}
        initialState={state}
      />
    </>
  );
}
