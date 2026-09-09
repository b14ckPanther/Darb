import { getAdminI18n } from "../../../../../../../lib/i18n-server";
import { notFound } from "next/navigation";

import { PlusIcon, RestaurantIcon, TranslationIcon } from "@darb/icons";

import { PageHeader } from "../../../../../../_components/page-header";
import { PermissionNotice } from "../../../../../../_components/permission-notice";
import { StatusBadge } from "../../../../../../_components/status-badge";
import {
  saveRestaurantCategoryAction,
  saveRestaurantMenuAction,
} from "../../../../../../actions/restaurant";
import { businessPath } from "../../../../../../../lib/navigation";
import {
  enabledRestaurantLocales,
  loadRestaurantMenuEditor,
} from "../../../../../../../lib/restaurant";
import {
  canMutateRestaurant,
  requireRestaurantAdminContext,
} from "../../../../../../../lib/restaurant-access";
import { createRestaurantMediaOptions } from "../../../../../../../lib/restaurant-media";
import { createServerComponentSupabaseClient } from "../../../../../../../lib/supabase/server";
import {
  ArchiveControl,
  CategoryForm,
  ItemForm,
  MenuForm,
  TranslationEditor,
} from "../../restaurant-forms";
import { MenuContentWorkspace } from "../../menu-content-workspace";
import styles from "../../restaurant.module.css";

export default async function RestaurantMenuEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessSlug: string; menuId: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { t } = await getAdminI18n();
  const { businessSlug, menuId } = await params;
  const context = await requireRestaurantAdminContext(businessSlug);
  const { business } = context.businessContext;
  const supabase = await createServerComponentSupabaseClient();
  const snapshot = await loadRestaurantMenuEditor(supabase, business.id, menuId);
  if (!snapshot) notFound();
  const editable = canMutateRestaurant(context) && snapshot.menu.lifecycle_status === "active";
  const locales = enabledRestaurantLocales(snapshot.locales, business.default_locale);
  const media = createRestaurantMediaOptions(snapshot.media);
  const base = `${businessPath(business.slug)}/restaurant`;
  const created = (await searchParams).created === "1";
  const menuTranslations = snapshot.translations
    .filter((translation) => translation.menu_id === snapshot.menu.id)
    .map((translation) => ({
      description: translation.description,
      locale: translation.locale_code,
      name: translation.name,
    }));
  const categoryNames = new Map(
    snapshot.categories.map((category) => [
      category.id,
      snapshot.categoryTranslations.find(
        (translation) =>
          translation.category_id === category.id &&
          translation.locale_code === business.default_locale,
      )?.name ?? category.internal_name,
    ]),
  );
  const mediaById = new Map(media.map((asset) => [asset.id, asset]));

  return (
    <div className={styles.page}>
      <PageHeader
        breadcrumbs={[
          { href: businessPath(business.slug), label: t("Overview") },
          { href: base, label: t("Restaurant") },
          { href: `${base}/menus`, label: t("Menus") },
          { label: snapshot.menu.internal_name },
        ]}
        eyebrow={t("Menu editor")}
        title={snapshot.menu.internal_name}
        summary={t(
          "Manage this menu’s publication state, localized identity, categories, and items.",
        )}
        status={
          <StatusBadge
            status={snapshot.menu.publication_status === "published" ? "enabled" : "pending"}
            label={snapshot.menu.publication_status === "published" ? t("Published") : t("Draft")}
          />
        }
      />

      {created ? (
        <p className={styles.feedback} role="status">
          {t(
            "Menu created with its default-language customer name. Add other translations and structure next.",
          )}
        </p>
      ) : null}
      {!editable ? (
        <PermissionNotice title={t("This menu is read-only.")}>
          {snapshot.menu.lifecycle_status === "archived"
            ? t("Archived menu history cannot be changed.")
            : t("Restaurant management access and an active capability are required.")}
        </PermissionNotice>
      ) : null}

      <section className={styles.panel} aria-labelledby="menu-details-heading">
        <div className={styles.panelHeader}>
          <div>
            <h2 id="menu-details-heading">{t("Menu details")}</h2>
            <p>{t("Management name, publication state, and deterministic display position.")}</p>
          </div>
          <StatusBadge status={snapshot.menu.lifecycle_status} />
        </div>
        <MenuForm
          businessId={business.id}
          businessSlug={business.slug}
          editable={editable}
          menu={snapshot.menu}
        />
        {editable ? (
          <div className={styles.actions}>
            <ArchiveControl
              action={saveRestaurantMenuAction.bind(
                null,
                business.id,
                business.slug,
                snapshot.menu.id,
              )}
              description={t(
                "Archive this menu and retain its categories, items, translations, and audit history? Archived records cannot be edited.",
              )}
              fields={{
                displayOrder: snapshot.menu.display_order,
                internalName: snapshot.menu.internal_name,
                lifecycleStatus: "archived",
                publicationStatus: snapshot.menu.publication_status,
              }}
              label={t("Archive menu")}
              title={t("Archive this menu?")}
            />
          </div>
        ) : null}
      </section>

      <section className={styles.panel} aria-labelledby="menu-translations-heading">
        <div className={styles.panelHeader}>
          <div>
            <h2 id="menu-translations-heading">{t("Customer-facing languages")}</h2>
            <p>{t("Only languages enabled for this business are available.")}</p>
          </div>
          <TranslationIcon size={20} />
        </div>
        <TranslationEditor
          businessId={business.id}
          businessSlug={business.slug}
          defaultLocale={business.default_locale}
          editable={editable}
          entityId={snapshot.menu.id}
          entityType="menu"
          locales={locales}
          supportsDescription
          translations={menuTranslations}
        />
      </section>

      <section className={styles.panel} aria-labelledby="menu-categories-heading">
        <div className={styles.panelHeader}>
          <div>
            <h2 id="menu-categories-heading">{t("Categories")}</h2>
            <p>{t("Ordered sections remain structurally bound to this menu.")}</p>
          </div>
          <span className="count-badge">{snapshot.categories.length}</span>
        </div>
        {editable ? (
          <details className={styles.details}>
            <summary>
              <PlusIcon size={15} /> {t("Add category")}
            </summary>
            <CategoryForm
              businessId={business.id}
              businessSlug={business.slug}
              editable
              menuId={snapshot.menu.id}
              media={media}
            />
          </details>
        ) : null}
        {snapshot.categories.length === 0 ? (
          <div className={styles.compactEmpty}>
            <strong>{t("No categories in this menu")}</strong>
            <p>{t("Add the first section customers will use to scan this menu.")}</p>
          </div>
        ) : null}
        <ul className={styles.entityList}>
          {snapshot.categories.map((category) => {
            const translations = snapshot.categoryTranslations
              .filter((translation) => translation.category_id === category.id)
              .map((translation) => ({
                description: translation.description,
                locale: translation.locale_code,
                name: translation.name,
              }));
            return (
              <li className={styles.entityCard} key={category.id}>
                <div className={styles.entitySummary}>
                  <span>
                    <strong dir="auto">
                      {translations.find(
                        (translation) => translation.locale === business.default_locale,
                      )?.name ?? category.internal_name}
                    </strong>
                    <small>
                      {t("Position {position}", { position: category.display_order })} ·{" "}
                      {category.is_visible ? t("Visible") : t("Hidden")}
                    </small>
                  </span>
                  <StatusBadge status={category.lifecycle_status} />
                  <StatusBadge
                    status={category.is_visible ? "enabled" : "disabled"}
                    label={category.is_visible ? t("Visible") : t("Hidden")}
                  />
                </div>
                <details className={styles.details}>
                  <summary>{t("Edit category")}</summary>
                  <CategoryForm
                    businessId={business.id}
                    businessSlug={business.slug}
                    category={category}
                    editable={editable && category.lifecycle_status === "active"}
                    menuId={snapshot.menu.id}
                    media={media}
                  />
                  <hr className={styles.divider} />
                  <TranslationEditor
                    businessId={business.id}
                    businessSlug={business.slug}
                    defaultLocale={business.default_locale}
                    editable={editable && category.lifecycle_status === "active"}
                    entityId={category.id}
                    entityType="category"
                    locales={locales}
                    supportsDescription
                    translations={translations}
                  />
                  {editable && category.lifecycle_status === "active" ? (
                    <div className={styles.actions}>
                      <ArchiveControl
                        action={saveRestaurantCategoryAction.bind(
                          null,
                          business.id,
                          business.slug,
                          category.id,
                        )}
                        description={t(
                          "Archive this category while retaining its items and localized history?",
                        )}
                        fields={{
                          displayOrder: category.display_order,
                          imageMediaAssetId: category.image_media_asset_id,
                          internalName: category.internal_name,
                          isVisible: category.is_visible,
                          lifecycleStatus: "archived",
                          menuId: category.menu_id,
                        }}
                        label={t("Archive category")}
                        title={t("Archive this category?")}
                      />
                    </div>
                  ) : null}
                </details>
              </li>
            );
          })}
        </ul>
      </section>

      <section className={styles.panel} aria-labelledby="menu-items-heading">
        <div className={styles.panelHeader}>
          <div>
            <h2 id="menu-items-heading">{t("Items")}</h2>
            <p>
              {t(
                "Prices are entered in {currency} major units and stored as exact integer minor units.",
                { currency: business.currency_code },
              )}
            </p>
          </div>
          <span className="count-badge">{snapshot.items.length}</span>
        </div>
        {editable &&
        snapshot.categories.some((category) => category.lifecycle_status === "active") ? (
          <details className={styles.details}>
            <summary>
              <PlusIcon size={15} /> {t("Add item")}
            </summary>
            <ItemForm
              businessId={business.id}
              businessSlug={business.slug}
              categories={snapshot.categories}
              editable
              media={media}
              menuId={snapshot.menu.id}
            />
          </details>
        ) : editable ? (
          <p className={styles.hint}>{t("Create an active category before adding an item.")}</p>
        ) : null}
        {snapshot.items.length === 0 ? (
          <div className={styles.empty}>
            <RestaurantIcon size={24} />
            <h2>{t("No items in this menu")}</h2>
            <p>
              {t(
                "Add real menu content when it is available; Darb does not create placeholder dishes.",
              )}
            </p>
          </div>
        ) : (
          <MenuContentWorkspace
            businessId={business.id}
            businessSlug={business.slug}
            categories={snapshot.categories
              .filter((category) => category.lifecycle_status === "active")
              .map((category) => ({ id: category.id, name: categoryNames.get(category.id)! }))}
            currencyCode={business.currency_code}
            editable={editable}
            menuId={snapshot.menu.id}
            items={snapshot.items.map((item) => {
              const image = item.image_media_asset_id
                ? mediaById.get(item.image_media_asset_id)
                : null;
              return {
                availabilityStatus: item.availability_status,
                basePriceMinor: item.base_price_minor,
                categoryId: item.category_id,
                categoryName: categoryNames.get(item.category_id) ?? t("Archived category"),
                displayOrder: item.display_order,
                hasImage: image !== null && image !== undefined,
                id: item.id,
                imageAlt: image?.alt ?? null,
                imageId: item.image_media_asset_id,
                imageUrl: image?.url ?? null,
                internalName: item.internal_name,
                isVisible: item.is_visible,
                lifecycleStatus: item.lifecycle_status,
                localizedName:
                  snapshot.itemTranslations.find(
                    (translation) =>
                      translation.item_id === item.id &&
                      translation.locale_code === business.default_locale,
                  )?.name ?? item.internal_name,
                modifierGroupCount: snapshot.assignments.filter(
                  (assignment) => assignment.item_id === item.id,
                ).length,
                variantCount: snapshot.variants.filter((variant) => variant.item_id === item.id)
                  .length,
              };
            })}
          />
        )}
      </section>
    </div>
  );
}
