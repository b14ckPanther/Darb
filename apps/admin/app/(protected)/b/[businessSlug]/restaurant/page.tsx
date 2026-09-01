import Link from "next/link";

import {
  ArrowRightIcon,
  CheckmarkCircleIcon,
  InformationCircleIcon,
  RestaurantIcon,
} from "@darb/icons";

import { PageHeader } from "../../../../_components/page-header";
import { PermissionNotice } from "../../../../_components/permission-notice";
import { StatusBadge } from "../../../../_components/status-badge";
import { businessPath } from "../../../../../lib/navigation";
import { loadRestaurantOverview } from "../../../../../lib/restaurant";
import {
  canMutateRestaurant,
  requireRestaurantAdminContext,
} from "../../../../../lib/restaurant-access";
import { createServerComponentSupabaseClient } from "../../../../../lib/supabase/server";
import { ConfigurationForm } from "./restaurant-forms";
import styles from "./restaurant.module.css";

export default async function RestaurantOverviewPage({
  params,
}: {
  params: Promise<{ businessSlug: string }>;
}) {
  const { businessSlug } = await params;
  const context = await requireRestaurantAdminContext(businessSlug);
  const { business } = context.businessContext;
  const supabase = await createServerComponentSupabaseClient();
  const snapshot = await loadRestaurantOverview(supabase, business.id);
  const editable = canMutateRestaurant(context);
  const restaurantBase = `${businessPath(business.slug)}/restaurant`;

  return (
    <div className={styles.page}>
      <PageHeader
        breadcrumbs={[
          { href: businessPath(business.slug), label: "Overview" },
          { label: "Restaurant" },
        ]}
        eyebrow="Restaurant Engine"
        title="Restaurant"
        summary="Operate menus, localized content, availability, variants, and modifiers from one tenant-safe workspace."
        status={
          <StatusBadge
            status={context.capabilityEffective ? "enabled" : "unavailable"}
            label={context.capabilityEffective ? "Capability active" : "Retained · read-only"}
          />
        }
        actions={
          <Link className="primary-link" href={`${restaurantBase}/menus`}>
            Manage menus <ArrowRightIcon size={17} />
          </Link>
        }
      />

      <section className={styles.boundary} aria-labelledby="restaurant-public-boundary">
        <InformationCircleIcon size={20} />
        <div>
          <h2 id="restaurant-public-boundary">Administration is live; public delivery is next</h2>
          <p>
            This is the authenticated Restaurant workspace. Phase 11 will add a deliberately safe
            public menu read model and renderer; no customer route is implied here.
          </p>
        </div>
      </section>

      {!editable ? (
        <PermissionNotice title="Restaurant is read-only.">
          {!context.access.canManage
            ? "The restaurant.manage permission is required to change Restaurant content."
            : "Restaurant mutations require an active business and an available, enabled capability."}
        </PermissionNotice>
      ) : null}

      <section className={styles.metricGrid} aria-label="Restaurant content totals">
        <Metric label="Active menus" value={snapshot.activeMenuCount} />
        <Metric label="Categories" value={snapshot.activeCategoryCount} />
        <Metric label="Items" value={snapshot.activeItemCount} />
        <Metric label="Sold out" value={snapshot.soldOutItemCount} />
      </section>

      <div className={styles.workspaceGrid}>
        <section className={styles.panel} aria-labelledby="restaurant-readiness-heading">
          <div className={styles.panelHeader}>
            <div>
              <h2 id="restaurant-readiness-heading">Operational readiness</h2>
              <p>Factual requirements and optional enhancements—without a fabricated score.</p>
            </div>
          </div>
          <ul className={styles.readinessList}>
            {snapshot.readiness.map((item) => (
              <li key={item.key}>
                <span
                  className={`${styles.readinessState}${item.ready ? ` ${styles.ready}` : ""}`}
                  aria-hidden="true"
                >
                  <CheckmarkCircleIcon size={17} />
                </span>
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.ready ? "Configured" : "Needs attention"}</small>
                </span>
                <StatusBadge status={item.requirement} />
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.panel} aria-labelledby="restaurant-configuration-heading">
          <div className={styles.panelHeader}>
            <div>
              <h2 id="restaurant-configuration-heading">Engine configuration</h2>
              <p>Keep operational activation separate from menu publication.</p>
            </div>
            <RestaurantIcon size={21} />
          </div>
          <ConfigurationForm
            businessId={business.id}
            businessSlug={business.slug}
            editable={editable}
            publiclyActive={snapshot.publiclyActive}
          />
        </section>
      </div>

      <section className={styles.panel} aria-labelledby="restaurant-detail-heading">
        <div className={styles.panelHeader}>
          <div>
            <h2 id="restaurant-detail-heading">Content foundation</h2>
            <p>Real state currently stored for this business.</p>
          </div>
          <Link className={styles.entityLink} href={`${restaurantBase}/modifiers`}>
            Modifier library <ArrowRightIcon size={15} />
          </Link>
        </div>
        <div className={styles.metricGrid}>
          <Metric label="Published menus" value={snapshot.publishedMenuCount} />
          <Metric label="Items with translation" value={snapshot.translatedItemCount} />
          <Metric label="Items with media" value={snapshot.itemWithImageCount} />
          <Metric label="Location overrides" value={snapshot.locationOverrideCount} />
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.metric}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
