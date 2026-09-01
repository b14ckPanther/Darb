import Link from "next/link";

import { AppearanceIcon, InformationCircleIcon } from "@darb/icons";

import { PageHeader } from "../../../../_components/page-header";
import { PermissionNotice } from "../../../../_components/permission-notice";
import { canManageAppearance } from "../../../../../lib/admin-access";
import { listResolvedBusinessAppearances } from "../../../../../lib/appearance";
import { requireBusinessAdminContext } from "../../../../../lib/admin-context";
import { businessSectionPath } from "../../../../../lib/navigation";
import { createServerComponentSupabaseClient } from "../../../../../lib/supabase/server";
import { AppearanceEditor } from "./appearance-editor";
import styles from "./appearance.module.css";

interface AppearancePageProps {
  params: Promise<{ businessSlug: string }>;
}

export default async function AppearancePage({ params }: AppearancePageProps) {
  const { businessSlug } = await params;
  const context = await requireBusinessAdminContext(businessSlug);
  const supabase = await createServerComponentSupabaseClient();
  const appearances = await listResolvedBusinessAppearances(
    supabase,
    context.business.id,
    context.modules,
  );
  const editable = canManageAppearance(context.access, context.business.status);

  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Customer experience foundation"
        title="Appearance"
        summary="Choose a composition and tune controlled visual tokens for enabled capabilities. These settings prepare future renderers; they do not create an engine or storefront."
      />

      {!editable && appearances.length > 0 ? (
        <PermissionNotice title="Appearance is read-only.">
          {context.business.status !== "active"
            ? "Appearance cannot change while this business is suspended or archived."
            : "The appearance.manage permission is required to save template or theme changes."}
        </PermissionNotice>
      ) : null}

      {appearances.length === 0 ? (
        <section className={styles.emptyState} aria-labelledby="appearance-empty-heading">
          <span className={styles.emptyIcon}>
            <AppearanceIcon size={28} />
          </span>
          <p className="eyebrow">No rendering context yet</p>
          <h2 id="appearance-empty-heading">Enable a capability with an appearance foundation</h2>
          <p>
            A business can remain valid with zero modules. Appearance becomes configurable only when
            an enabled capability has platform templates registered for it.
          </p>
          <Link
            className="primary-button"
            href={businessSectionPath(context.business.slug, "modules")}
          >
            Review modules
          </Link>
        </section>
      ) : (
        <>
          <section className={styles.boundaryNote} aria-labelledby="appearance-boundary-heading">
            <InformationCircleIcon size={20} />
            <div>
              <h2 id="appearance-boundary-heading">Composition and tokens—not arbitrary CSS</h2>
              <p>
                Templates control structure. Theme tokens control color, typography, shape, density,
                depth, motion, and limited layout choices through a validated contract.
              </p>
            </div>
          </section>

          {appearances.map((appearance) => (
            <AppearanceEditor
              key={appearance.moduleKey}
              appearance={appearance}
              business={{
                defaultLocale: context.business.default_locale,
                displayName: context.business.display_name,
                id: context.business.id,
                slug: context.business.slug,
              }}
              editable={editable}
            />
          ))}
        </>
      )}
    </div>
  );
}
