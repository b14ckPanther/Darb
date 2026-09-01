import { PlusIcon, SettingsIcon, TranslationIcon } from "@darb/icons";

import { PageHeader } from "../../../../../_components/page-header";
import { PermissionNotice } from "../../../../../_components/permission-notice";
import { StatusBadge } from "../../../../../_components/status-badge";
import {
  saveRestaurantModifierAction,
  saveRestaurantModifierGroupAction,
} from "../../../../../actions/restaurant";
import { businessPath } from "../../../../../../lib/navigation";
import {
  enabledRestaurantLocales,
  loadRestaurantModifierLibrary,
} from "../../../../../../lib/restaurant";
import {
  canMutateRestaurant,
  requireRestaurantAdminContext,
} from "../../../../../../lib/restaurant-access";
import { createServerComponentSupabaseClient } from "../../../../../../lib/supabase/server";
import {
  ArchiveControl,
  ModifierForm,
  ModifierGroupForm,
  TranslationEditor,
} from "../restaurant-forms";
import styles from "../restaurant.module.css";

export default async function RestaurantModifiersPage({
  params,
}: {
  params: Promise<{ businessSlug: string }>;
}) {
  const { businessSlug } = await params;
  const context = await requireRestaurantAdminContext(businessSlug);
  const { business } = context.businessContext;
  const supabase = await createServerComponentSupabaseClient();
  const snapshot = await loadRestaurantModifierLibrary(supabase, business.id);
  const editable = canMutateRestaurant(context);
  const locales = enabledRestaurantLocales(snapshot.locales, business.default_locale);
  const base = `${businessPath(business.slug)}/restaurant`;

  return (
    <div className={styles.page}>
      <PageHeader
        breadcrumbs={[
          { href: businessPath(business.slug), label: "Overview" },
          { href: base, label: "Restaurant" },
          { label: "Modifier library" },
        ]}
        eyebrow="Reusable customization"
        title="Modifier library"
        summary="Create reusable option groups once, then assign item-specific minimum and maximum selection rules."
      />

      {!editable ? (
        <PermissionNotice title="Modifier content is read-only.">
          Restaurant management access and an active capability are required to make changes.
        </PermissionNotice>
      ) : null}

      {editable ? (
        <details className={`${styles.panel} ${styles.details}`}>
          <summary>
            <PlusIcon size={15} /> Create modifier group
          </summary>
          <ModifierGroupForm businessId={business.id} businessSlug={business.slug} editable />
        </details>
      ) : null}

      {snapshot.groups.length === 0 ? (
        <section className={styles.empty}>
          <SettingsIcon size={26} />
          <h2>No modifier groups yet</h2>
          <p>
            Add a group only when real menu items need reusable choices such as size, milk, or
            extras.
          </p>
        </section>
      ) : (
        <section className={styles.panel} aria-labelledby="modifier-library-heading">
          <div className={styles.panelHeader}>
            <div>
              <h2 id="modifier-library-heading">Reusable groups</h2>
              <p>
                Group visibility and option availability stay distinct from item assignment rules.
              </p>
            </div>
            <span className="count-badge">{snapshot.groups.length}</span>
          </div>
          <ul className={styles.entityList}>
            {snapshot.groups.map((group) => {
              const groupTranslations = snapshot.groupTranslations
                .filter((translation) => translation.modifier_group_id === group.id)
                .map((translation) => ({
                  description: translation.description,
                  locale: translation.locale_code,
                  name: translation.name,
                }));
              const modifiers = snapshot.modifiers.filter(
                (modifier) => modifier.modifier_group_id === group.id,
              );
              const groupEditable = editable && group.lifecycle_status === "active";
              return (
                <li className={styles.entityCard} key={group.id}>
                  <div className={styles.entitySummary}>
                    <span>
                      <strong dir="auto">
                        {groupTranslations.find(
                          (translation) => translation.locale === business.default_locale,
                        )?.name ?? group.internal_name}
                      </strong>
                      <small>
                        {modifiers.length} {modifiers.length === 1 ? "option" : "options"} ·{" "}
                        {group.is_visible ? "Visible" : "Hidden"}
                      </small>
                    </span>
                    <StatusBadge status={group.lifecycle_status} />
                    <StatusBadge
                      status={group.is_visible ? "enabled" : "disabled"}
                      label={group.is_visible ? "Visible" : "Hidden"}
                    />
                  </div>
                  <details className={styles.details}>
                    <summary>Edit group, translations, and options</summary>
                    <ModifierGroupForm
                      businessId={business.id}
                      businessSlug={business.slug}
                      editable={groupEditable}
                      group={group}
                    />
                    <hr className={styles.divider} />
                    <div className={styles.panelHeader}>
                      <div>
                        <h3>Customer-facing languages</h3>
                        <p>Names and descriptions follow the enabled business languages.</p>
                      </div>
                      <TranslationIcon size={18} />
                    </div>
                    <TranslationEditor
                      businessId={business.id}
                      businessSlug={business.slug}
                      defaultLocale={business.default_locale}
                      editable={groupEditable}
                      entityId={group.id}
                      entityType="modifier_group"
                      locales={locales}
                      supportsDescription
                      translations={groupTranslations}
                    />
                    <hr className={styles.divider} />
                    <div className={styles.panelHeader}>
                      <div>
                        <h3>Options</h3>
                        <p>Price values are non-negative add-ons in {business.currency_code}.</p>
                      </div>
                    </div>
                    {groupEditable ? (
                      <details className={styles.details}>
                        <summary>
                          <PlusIcon size={15} /> Add option
                        </summary>
                        <ModifierForm
                          businessId={business.id}
                          businessSlug={business.slug}
                          editable
                          groupId={group.id}
                        />
                      </details>
                    ) : null}
                    <ul className={styles.entityList}>
                      {modifiers.map((modifier) => {
                        const translations = snapshot.modifierTranslations
                          .filter((translation) => translation.modifier_id === modifier.id)
                          .map((translation) => ({
                            locale: translation.locale_code,
                            name: translation.name,
                          }));
                        const optionEditable =
                          groupEditable && modifier.lifecycle_status === "active";
                        return (
                          <li className={styles.entityCard} key={modifier.id}>
                            <div className={styles.entitySummary}>
                              <span>
                                <strong dir="auto">
                                  {translations.find(
                                    (translation) => translation.locale === business.default_locale,
                                  )?.name ?? modifier.internal_name}
                                </strong>
                                <small>
                                  +{business.currency_code}{" "}
                                  {(modifier.price_delta_minor / 100).toFixed(2)} ·{" "}
                                  {modifier.availability_status === "available"
                                    ? "Available"
                                    : "Sold out"}
                                </small>
                              </span>
                              <StatusBadge status={modifier.lifecycle_status} />
                              <StatusBadge
                                status={modifier.is_visible ? "enabled" : "disabled"}
                                label={modifier.is_visible ? "Visible" : "Hidden"}
                              />
                            </div>
                            <details className={styles.details}>
                              <summary>Edit option</summary>
                              <ModifierForm
                                businessId={business.id}
                                businessSlug={business.slug}
                                editable={optionEditable}
                                groupId={group.id}
                                modifier={modifier}
                              />
                              <TranslationEditor
                                businessId={business.id}
                                businessSlug={business.slug}
                                defaultLocale={business.default_locale}
                                editable={optionEditable}
                                entityId={modifier.id}
                                entityType="modifier"
                                locales={locales}
                                supportsDescription={false}
                                translations={translations}
                              />
                              {optionEditable ? (
                                <div className={styles.actions}>
                                  <ArchiveControl
                                    action={saveRestaurantModifierAction.bind(
                                      null,
                                      business.id,
                                      business.slug,
                                      group.id,
                                      modifier.id,
                                    )}
                                    description="Archive this modifier option and retain its localized history?"
                                    fields={{
                                      availabilityStatus: modifier.availability_status,
                                      displayOrder: modifier.display_order,
                                      internalName: modifier.internal_name,
                                      isVisible: modifier.is_visible,
                                      lifecycleStatus: "archived",
                                      priceDelta: (modifier.price_delta_minor / 100).toFixed(2),
                                    }}
                                    label="Archive option"
                                    title="Archive this option?"
                                  />
                                </div>
                              ) : null}
                            </details>
                          </li>
                        );
                      })}
                    </ul>
                    {groupEditable ? (
                      <div className={styles.actions}>
                        <ArchiveControl
                          action={saveRestaurantModifierGroupAction.bind(
                            null,
                            business.id,
                            business.slug,
                            group.id,
                          )}
                          description="Archive this reusable group and retain its options, translations, and item assignment history?"
                          fields={{
                            internalName: group.internal_name,
                            isVisible: group.is_visible,
                            lifecycleStatus: "archived",
                          }}
                          label="Archive group"
                          title="Archive this modifier group?"
                        />
                      </div>
                    ) : null}
                  </details>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
