import Link from "next/link";

import { ArrowRightIcon, PlusIcon, RestaurantIcon } from "@darb/icons";

import { PageHeader } from "../../../../../_components/page-header";
import { PermissionNotice } from "../../../../../_components/permission-notice";
import { StatusBadge } from "../../../../../_components/status-badge";
import { businessPath } from "../../../../../../lib/navigation";
import { enabledRestaurantLocales, loadRestaurantMenuList } from "../../../../../../lib/restaurant";
import {
  canMutateRestaurant,
  requireRestaurantAdminContext,
} from "../../../../../../lib/restaurant-access";
import { createServerComponentSupabaseClient } from "../../../../../../lib/supabase/server";
import { MenuForm } from "../restaurant-forms";
import styles from "../restaurant.module.css";

export default async function RestaurantMenusPage({
  params,
}: {
  params: Promise<{ businessSlug: string }>;
}) {
  const { businessSlug } = await params;
  const context = await requireRestaurantAdminContext(businessSlug);
  const { business } = context.businessContext;
  const supabase = await createServerComponentSupabaseClient();
  const snapshot = await loadRestaurantMenuList(supabase, business.id);
  const editable = canMutateRestaurant(context);
  const locales = enabledRestaurantLocales(snapshot.locales, business.default_locale);
  const base = `${businessPath(business.slug)}/restaurant`;

  return (
    <div className={styles.page}>
      <PageHeader
        breadcrumbs={[
          { href: businessPath(business.slug), label: "Overview" },
          { href: base, label: "Restaurant" },
          { label: "Menus" },
        ]}
        eyebrow="Menu architecture"
        title="Menus & items"
        summary="Build multiple menus with ordered categories, localized customer content, and operational item state."
      />

      {!editable ? (
        <PermissionNotice title="Menu content is read-only.">
          The restaurant.manage permission and an active Restaurant capability are required to make
          changes.
        </PermissionNotice>
      ) : null}

      {editable ? (
        <details className={`${styles.panel} ${styles.details}`}>
          <summary>
            <PlusIcon size={16} /> Create a menu
          </summary>
          <MenuForm businessId={business.id} businessSlug={business.slug} editable={editable} />
        </details>
      ) : null}

      {snapshot.menus.length === 0 ? (
        <section className={styles.empty}>
          <RestaurantIcon size={28} />
          <h2>No menus yet</h2>
          <p>
            Create the first real menu when this business has content to manage. Enabling the module
            never invents menu data.
          </p>
        </section>
      ) : (
        <section className={styles.panel} aria-labelledby="restaurant-menu-list-heading">
          <div className={styles.panelHeader}>
            <div>
              <h2 id="restaurant-menu-list-heading">Menu library</h2>
              <p>
                {snapshot.menus.length} {snapshot.menus.length === 1 ? "menu" : "menus"} ·{" "}
                {locales.length} enabled {locales.length === 1 ? "language" : "languages"}
              </p>
            </div>
          </div>
          <ul className={styles.entityList}>
            {snapshot.menus.map((menu) => {
              const customerName = snapshot.translations.find(
                (translation) =>
                  translation.menu_id === menu.id &&
                  translation.locale_code === business.default_locale,
              )?.name;
              const categoryCount = snapshot.categories.filter(
                (category) =>
                  category.menu_id === menu.id && category.lifecycle_status === "active",
              ).length;
              const itemCount = snapshot.items.filter(
                (item) => item.menu_id === menu.id && item.lifecycle_status === "active",
              ).length;
              return (
                <li className={styles.entityCard} key={menu.id}>
                  <div className={styles.entitySummary}>
                    <span>
                      <strong dir="auto">{customerName ?? menu.internal_name}</strong>
                      <small>
                        Internal: {menu.internal_name} · {categoryCount} categories · {itemCount}{" "}
                        items
                      </small>
                    </span>
                    <StatusBadge status={menu.lifecycle_status} />
                    <StatusBadge
                      status={menu.publication_status === "published" ? "enabled" : "pending"}
                      label={menu.publication_status === "published" ? "Published" : "Draft"}
                    />
                  </div>
                  <div className={styles.actions}>
                    <Link className={styles.entityLink} href={`${base}/menus/${menu.id}`}>
                      Open menu <ArrowRightIcon size={15} />
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
