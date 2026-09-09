import { getAdminI18n } from "../../../../../../../lib/i18n-server";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowRightIcon, LocationIcon, PlusIcon, TranslationIcon } from "@darb/icons";
import { describeModifierSelection } from "@darb/restaurant";

import { PageHeader } from "../../../../../../_components/page-header";
import { PermissionNotice } from "../../../../../../_components/permission-notice";
import { StatusBadge } from "../../../../../../_components/status-badge";
import {
  saveRestaurantItemAction,
  saveRestaurantVariantAction,
} from "../../../../../../actions/restaurant";
import { businessPath } from "../../../../../../../lib/navigation";
import {
  enabledRestaurantLocales,
  loadRestaurantItemEditor,
} from "../../../../../../../lib/restaurant";
import {
  canMutateRestaurant,
  requireRestaurantAdminContext,
} from "../../../../../../../lib/restaurant-access";
import { createRestaurantMediaOptions } from "../../../../../../../lib/restaurant-media";
import { createServerComponentSupabaseClient } from "../../../../../../../lib/supabase/server";
import {
  ArchiveControl,
  AssignedModifierGroupForm,
  ItemForm,
  LocationAvailabilityForm,
  ModifierAssignmentForm,
  TranslationEditor,
  VariantForm,
} from "../../restaurant-forms";
import styles from "../../restaurant.module.css";

export default async function RestaurantItemEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessSlug: string; itemId: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { t } = await getAdminI18n();
  const { businessSlug, itemId } = await params;
  const context = await requireRestaurantAdminContext(businessSlug);
  const { business, locations } = context.businessContext;
  const supabase = await createServerComponentSupabaseClient();
  const snapshot = await loadRestaurantItemEditor(supabase, business.id, itemId, locations);
  if (!snapshot) notFound();
  const editable = canMutateRestaurant(context) && snapshot.item.lifecycle_status === "active";
  const locales = enabledRestaurantLocales(snapshot.locales, business.default_locale);
  const media = createRestaurantMediaOptions(snapshot.media);
  const base = `${businessPath(business.slug)}/restaurant`;
  const created = (await searchParams).created === "1";
  const itemTranslations = snapshot.itemTranslations.map((translation) => ({
    description: translation.description,
    locale: translation.locale_code,
    name: translation.name,
  }));
  const currentCategory = snapshot.categories.find(
    (category) => category.id === snapshot.item.category_id,
  );
  const unassignedModifierGroups = snapshot.modifierGroups.filter(
    (group) =>
      group.lifecycle_status === "active" &&
      !snapshot.assignments.some((assignment) => assignment.modifier_group_id === group.id),
  );

  return (
    <div className={styles.page}>
      <PageHeader
        breadcrumbs={[
          { href: businessPath(business.slug), label: t("Overview") },
          { href: base, label: t("Restaurant") },
          { href: `${base}/menus`, label: t("Menus") },
          { href: `${base}/menus/${snapshot.item.menu_id}`, label: t("Current menu") },
          { label: snapshot.item.internal_name },
        ]}
        eyebrow={t("Menu item")}
        title={snapshot.item.internal_name}
        summary={t(
          "Manage customer content, price, operational state, variants, modifiers, and location availability.",
        )}
        status={
          <StatusBadge
            status={snapshot.item.availability_status === "available" ? "available" : "inactive"}
            label={
              snapshot.item.availability_status === "available" ? t("Available") : t("Sold out")
            }
          />
        }
      />

      {created ? (
        <p className={styles.feedback} role="status">
          {t(
            "Item created with its default-language customer name. Add other translations and optional configuration next.",
          )}
        </p>
      ) : null}
      {!editable ? (
        <PermissionNotice title={t("This item is read-only.")}>
          {snapshot.item.lifecycle_status === "archived"
            ? t("Archived item history cannot be changed.")
            : t("Restaurant management access and an active capability are required.")}
        </PermissionNotice>
      ) : null}

      <nav className={styles.editorNav} aria-label={t("Item editor sections")}>
        <a href="#item-core-heading">{t("Core details")}</a>
        <a href="#item-translations-heading">{t("Languages")}</a>
        <a href="#item-variants-heading">{t("Variants")}</a>
        <a href="#item-modifiers-heading">{t("Modifiers")}</a>
        <a href="#item-locations-heading">{t("Locations")}</a>
      </nav>

      <section className={styles.panel} aria-labelledby="item-core-heading">
        <div className={styles.panelHeader}>
          <div>
            <h2 id="item-core-heading">{t("Item details")}</h2>
            <p>
              {t("Currently in {category}. Base price uses {currency}.", {
                category: currentCategory?.internal_name ?? t("its assigned category"),
                currency: business.currency_code,
              })}
            </p>
          </div>
          <StatusBadge status={snapshot.item.lifecycle_status} />
        </div>
        <ItemForm
          businessId={business.id}
          businessSlug={business.slug}
          categories={snapshot.categories}
          editable={editable}
          item={snapshot.item}
          media={media}
          menuId={snapshot.item.menu_id}
        />
        {editable ? (
          <div className={styles.actions}>
            <ArchiveControl
              action={saveRestaurantItemAction.bind(
                null,
                business.id,
                business.slug,
                snapshot.item.id,
              )}
              description={t(
                "Archive this item while retaining translations, variants, modifier assignments, and location history?",
              )}
              fields={{
                availabilityStatus: snapshot.item.availability_status,
                categoryId: snapshot.item.category_id,
                displayOrder: snapshot.item.display_order,
                imageMediaAssetId: snapshot.item.image_media_asset_id,
                internalName: snapshot.item.internal_name,
                isVisible: snapshot.item.is_visible,
                lifecycleStatus: "archived",
                menuId: snapshot.item.menu_id,
                price: (snapshot.item.base_price_minor / 100).toFixed(2),
              }}
              label={t("Archive item")}
              title={t("Archive this item?")}
            />
          </div>
        ) : null}
      </section>

      <section className={styles.panel} aria-labelledby="item-translations-heading">
        <div className={styles.panelHeader}>
          <div>
            <h2 id="item-translations-heading">{t("Customer-facing content")}</h2>
            <p>
              {t("Names and descriptions follow each language’s native direction and Darb font.")}
            </p>
          </div>
          <TranslationIcon size={20} />
        </div>
        <TranslationEditor
          businessId={business.id}
          businessSlug={business.slug}
          defaultLocale={business.default_locale}
          editable={editable}
          entityId={snapshot.item.id}
          entityType="item"
          locales={locales}
          supportsDescription
          translations={itemTranslations}
        />
      </section>

      <section className={styles.panel} aria-labelledby="item-variants-heading">
        <div className={styles.panelHeader}>
          <div>
            <h2 id="item-variants-heading">{t("Variants")}</h2>
            <p>
              {t("Each variant has an absolute price—not an ambiguous delta from the base item.")}
            </p>
          </div>
          <span className="count-badge">{snapshot.variants.length}</span>
        </div>
        {editable ? (
          <details className={styles.details}>
            <summary>
              <PlusIcon size={15} /> {t("Add variant")}
            </summary>
            <VariantForm
              businessId={business.id}
              businessSlug={business.slug}
              editable
              itemId={snapshot.item.id}
            />
          </details>
        ) : null}
        {snapshot.variants.length === 0 ? (
          <div className={styles.compactEmpty}>
            <strong>{t("No variants configured")}</strong>
            <p>{t("Keep the base item as-is, or add sizes and other priced choices here.")}</p>
          </div>
        ) : null}
        <ul className={styles.entityList}>
          {snapshot.variants.map((variant) => {
            const translations = snapshot.variantTranslations
              .filter((translation) => translation.item_variant_id === variant.id)
              .map((translation) => ({ locale: translation.locale_code, name: translation.name }));
            return (
              <li className={styles.entityCard} key={variant.id}>
                <div className={styles.entitySummary}>
                  <span>
                    <strong dir="auto">
                      {translations.find(
                        (translation) => translation.locale === business.default_locale,
                      )?.name ?? variant.internal_name}
                    </strong>
                    <small>
                      {business.currency_code} {(variant.price_minor / 100).toFixed(2)} ·{" "}
                      {variant.availability_status === "available" ? t("Available") : t("Sold out")}
                    </small>
                  </span>
                  <StatusBadge status={variant.lifecycle_status} />
                  <StatusBadge
                    status={variant.is_visible ? "enabled" : "disabled"}
                    label={variant.is_visible ? t("Visible") : t("Hidden")}
                  />
                </div>
                <details className={styles.details}>
                  <summary>{t("Edit variant")}</summary>
                  <VariantForm
                    businessId={business.id}
                    businessSlug={business.slug}
                    editable={editable && variant.lifecycle_status === "active"}
                    itemId={snapshot.item.id}
                    variant={variant}
                  />
                  <hr className={styles.divider} />
                  <TranslationEditor
                    businessId={business.id}
                    businessSlug={business.slug}
                    defaultLocale={business.default_locale}
                    editable={editable && variant.lifecycle_status === "active"}
                    entityId={variant.id}
                    entityType="item_variant"
                    locales={locales}
                    supportsDescription={false}
                    translations={translations}
                  />
                  {editable && variant.lifecycle_status === "active" ? (
                    <div className={styles.actions}>
                      <ArchiveControl
                        action={saveRestaurantVariantAction.bind(
                          null,
                          business.id,
                          business.slug,
                          snapshot.item.id,
                          variant.id,
                        )}
                        description={t("Archive this variant and retain its localized history?")}
                        fields={{
                          availabilityStatus: variant.availability_status,
                          displayOrder: variant.display_order,
                          internalName: variant.internal_name,
                          isVisible: variant.is_visible,
                          lifecycleStatus: "archived",
                          price: (variant.price_minor / 100).toFixed(2),
                        }}
                        label={t("Archive variant")}
                        title={t("Archive this variant?")}
                      />
                    </div>
                  ) : null}
                </details>
              </li>
            );
          })}
        </ul>
      </section>

      <section className={styles.panel} aria-labelledby="item-modifiers-heading">
        <div className={styles.panelHeader}>
          <div>
            <h2 id="item-modifiers-heading">{t("Modifier groups")}</h2>
            <p>
              {t(
                "Selection limits belong to this item assignment; reusable options stay in the library.",
              )}
            </p>
          </div>
          <Link className={styles.entityLink} href={`${base}/modifiers`}>
            {t("Open library")}
            <ArrowRightIcon size={15} />
          </Link>
        </div>
        {editable && unassignedModifierGroups.length > 0 ? (
          <ModifierAssignmentForm
            businessId={business.id}
            businessSlug={business.slug}
            editable
            groups={unassignedModifierGroups}
            itemId={snapshot.item.id}
          />
        ) : snapshot.modifierGroups.length === 0 ? (
          <p className={styles.hint}>
            {t("Create a modifier group in the library before assigning one.")}
          </p>
        ) : null}
        {snapshot.assignments.length === 0 && snapshot.modifierGroups.length > 0 ? (
          <div className={styles.compactEmpty}>
            <strong>{t("No modifier groups assigned")}</strong>
            <p>{t("Assign only the choices customers need for this item.")}</p>
          </div>
        ) : null}
        <ul className={styles.entityList}>
          {snapshot.assignments.map((assignment) => {
            const group = snapshot.modifierGroups.find(
              (candidate) => candidate.id === assignment.modifier_group_id,
            );
            if (!group) return null;
            const semantics = describeModifierSelection(
              assignment.minimum_selections,
              assignment.maximum_selections,
            );
            return (
              <li key={group.id}>
                <AssignedModifierGroupForm
                  assignment={assignment}
                  businessId={business.id}
                  businessSlug={business.slug}
                  editable={editable}
                  group={group}
                  itemId={snapshot.item.id}
                />
                <p className={styles.hint}>
                  {semantics.required ? t("Required") : t("Optional")} ·{" "}
                  {semantics.allowsMultiple ? t("Multiple selections") : t("Single selection")}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      <section className={styles.panel} aria-labelledby="item-locations-heading">
        <div className={styles.panelHeader}>
          <div>
            <h2 id="item-locations-heading">{t("Location availability")}</h2>
            <p>{t("An absent override inherits the item’s base operational state.")}</p>
          </div>
          <LocationIcon size={20} />
        </div>
        {snapshot.locations.length === 0 ? (
          <p className={styles.hint}>{t("No accessible active locations are available.")}</p>
        ) : (
          <ul className={styles.locationList}>
            {snapshot.locations.map((location) => (
              <li key={location.id}>
                <LocationAvailabilityForm
                  baseAvailability={snapshot.item.availability_status}
                  businessId={business.id}
                  businessSlug={business.slug}
                  editable={editable}
                  itemId={snapshot.item.id}
                  locationId={location.id}
                  locationName={location.display_name}
                  override={
                    snapshot.locationAvailability.find(
                      (availability) => availability.location_id === location.id,
                    )?.availability_status ?? null
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
