import { getAdminI18n } from "../../../../../lib/i18n-server";
import Link from "next/link";

import {
  ArrowRightIcon,
  CheckmarkCircleIcon,
  ExternalLinkIcon,
  ImageIcon,
  InformationCircleIcon,
  RestaurantIcon,
  TranslationIcon,
} from "@darb/icons";
import type { RestaurantReadinessItem } from "@darb/restaurant";

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
  const { t } = await getAdminI18n();
  const { businessSlug } = await params;
  const context = await requireRestaurantAdminContext(businessSlug);
  const { business } = context.businessContext;
  const supabase = await createServerComponentSupabaseClient();
  const snapshot = await loadRestaurantOverview(
    supabase,
    business.id,
    business.slug,
    business.default_locale,
    context.businessContext.locations,
  );
  const editable = canMutateRestaurant(context);
  const restaurantBase = `${businessPath(business.slug)}/restaurant`;

  return (
    <div className={styles.page}>
      <PageHeader
        breadcrumbs={[
          { href: businessPath(business.slug), label: t("Overview") },
          { label: t("Restaurant") },
        ]}
        eyebrow={t("Restaurant Engine")}
        title={t("Restaurant")}
        summary={t(
          "Operate menus, localized content, availability, variants, and modifiers from one tenant-safe workspace.",
        )}
        status={
          <StatusBadge
            status={context.capabilityEffective ? "enabled" : "unavailable"}
            label={context.capabilityEffective ? t("Capability active") : t("Retained · read-only")}
          />
        }
        actions={
          <div className={styles.headerActions}>
            <a
              className="secondary-link"
              href={snapshot.publicUrl}
              target="_blank"
              rel="noreferrer"
            >
              {t("View public menu")}
              <ExternalLinkIcon size={16} />
            </a>
            <Link className="primary-link" href={`${restaurantBase}/menus`}>
              {t("Manage menus")}
              <ArrowRightIcon size={17} />
            </Link>
          </div>
        }
      />

      <section className={styles.boundary} aria-labelledby="restaurant-public-boundary">
        <InformationCircleIcon size={20} />
        <div>
          <h2 id="restaurant-public-boundary">{t("Manage what customers see")}</h2>
          <p>
            {t(
              "The public menu shows published, visible content while the Restaurant experience is active. Draft and archived content stays private.",
            )}
          </p>
        </div>
      </section>

      {!editable ? (
        <PermissionNotice title={t("Restaurant is read-only.")}>
          {!context.access.canManage
            ? t("The restaurant.manage permission is required to change Restaurant content.")
            : t(
                "Restaurant mutations require an active business and an available, enabled capability.",
              )}
        </PermissionNotice>
      ) : null}

      <section className={styles.metricGrid} aria-label={t("Restaurant content totals")}>
        <Metric label={t("Active menus")} value={snapshot.activeMenuCount} />
        <Metric label={t("Categories")} value={snapshot.activeCategoryCount} />
        <Metric label={t("Items")} value={snapshot.activeItemCount} />
        <Metric label={t("Sold out")} value={snapshot.soldOutItemCount} />
      </section>

      <div className={styles.workspaceGrid}>
        <section className={styles.panel} aria-labelledby="restaurant-readiness-heading">
          <div className={styles.panelHeader}>
            <div>
              <h2 id="restaurant-readiness-heading">{t("Operational readiness")}</h2>
              <p>
                {t("Factual requirements and optional enhancements—without a fabricated score.")}
              </p>
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
                  <strong>{t(item.label)}</strong>
                  <small>{item.ready ? t("Configured") : t("Needs attention")}</small>
                </span>
                <StatusBadge status={item.requirement} />
                {!item.ready ? (
                  <Link
                    className={styles.readinessAction}
                    href={restaurantReadinessPath(restaurantBase, business.slug, item.key)}
                  >
                    {t("Resolve")}
                    <ArrowRightIcon size={14} />
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.panel} aria-labelledby="restaurant-configuration-heading">
          <div className={styles.panelHeader}>
            <div>
              <h2 id="restaurant-configuration-heading">{t("Engine configuration")}</h2>
              <p>{t("Keep operational activation separate from menu publication.")}</p>
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

      <section className={styles.attentionPanel} aria-labelledby="restaurant-attention-heading">
        <div className={styles.panelHeader}>
          <div>
            <h2 id="restaurant-attention-heading">{t("Needs your attention")}</h2>
            <p>{t("Practical content gaps you can improve before customers see the menu.")}</p>
          </div>
          <Link className={styles.entityLink} href={`${restaurantBase}/menus`}>
            {t("Review menu content")}
            <ArrowRightIcon size={15} />
          </Link>
        </div>
        <div className={styles.attentionGrid}>
          <div>
            <ImageIcon size={19} />
            <strong>{snapshot.itemsMissingImageCount}</strong>
            <span>{t("Items missing images")}</span>
          </div>
          <div>
            <TranslationIcon size={19} />
            <strong>{snapshot.itemsMissingTranslationsCount}</strong>
            <span>{t("Items missing enabled-language content")}</span>
          </div>
          <div>
            <RestaurantIcon size={19} />
            <strong>{snapshot.soldOutItemCount}</strong>
            <span>{t("Items currently sold out")}</span>
          </div>
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="restaurant-detail-heading">
        <div className={styles.panelHeader}>
          <div>
            <h2 id="restaurant-detail-heading">{t("Content foundation")}</h2>
            <p>{t("Real state currently stored for this business.")}</p>
          </div>
          <Link className={styles.entityLink} href={`${restaurantBase}/modifiers`}>
            {t("Modifier library")}
            <ArrowRightIcon size={15} />
          </Link>
        </div>
        <div className={styles.metricGrid}>
          <Metric label={t("Published menus")} value={snapshot.publishedMenuCount} />
          <Metric label={t("Items with translation")} value={snapshot.translatedItemCount} />
          <Metric label={t("Items with media")} value={snapshot.itemWithImageCount} />
          <Metric label={t("Location overrides")} value={snapshot.locationOverrideCount} />
        </div>
      </section>
    </div>
  );
}

function restaurantReadinessPath(
  restaurantBase: string,
  businessSlug: string,
  key: RestaurantReadinessItem["key"],
): string {
  switch (key) {
    case "location":
      return `${businessPath(businessSlug)}/locations`;
    case "hours":
    case "contact":
      return `${restaurantBase}/locations`;
    case "localization":
      return `${restaurantBase}/languages`;
    case "template":
    case "branding":
      return `${businessPath(businessSlug)}/appearance`;
    case "content":
    case "publication":
      return `${restaurantBase}/menus`;
    case "modifiers":
      return `${restaurantBase}/modifiers`;
    case "configuration":
      return `${restaurantBase}#restaurant-configuration-heading`;
  }
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.metric}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
