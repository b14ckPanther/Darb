"use client";

import { useAdminI18n } from "../../../../../lib/i18n-client";

import Image from "next/image";
import { useCallback, useId, useState } from "react";

import { ArchiveIcon, CheckmarkCircleIcon, ImageIcon } from "@darb/icons";
import { formatMinorMoneyInput } from "@darb/restaurant";
import { getTextDirection, localeNames, type SupportedLocale } from "@darb/i18n";

import { ConfirmationDialog } from "../../../../_components/confirmation-dialog";
import {
  removeRestaurantItemModifierGroupAction,
  saveRestaurantCategoryAction,
  saveRestaurantConfigurationAction,
  saveRestaurantItemAction,
  saveRestaurantMenuAction,
  saveRestaurantModifierAction,
  saveRestaurantModifierGroupAction,
  saveRestaurantTranslationAction,
  saveRestaurantVariantAction,
  setRestaurantItemModifierGroupAction,
  setRestaurantLocationAvailabilityAction,
} from "../../../../actions/restaurant";
import type { FormState } from "../../../../../lib/forms";
import type {
  RestaurantCategory,
  RestaurantItem,
  RestaurantItemModifierGroup,
  RestaurantItemVariant,
  RestaurantMenu,
  RestaurantModifier,
  RestaurantModifierGroup,
} from "../../../../../lib/restaurant";
import styles from "./restaurant.module.css";
import { useRestaurantActionState } from "./use-restaurant-action-state";

export interface RestaurantMediaOption {
  alt: string;
  id: string;
  label: string;
  url: string;
}

export interface RestaurantTranslationValue {
  description?: string | null;
  locale: SupportedLocale;
  name: string;
}

type BoundFormAction = (previousState: FormState, formData: FormData) => Promise<FormState>;

export function ConfigurationForm({
  businessId,
  businessSlug,
  editable,
  publiclyActive,
}: {
  businessId: string;
  businessSlug: string;
  editable: boolean;
  publiclyActive: boolean;
}) {
  const { t } = useAdminI18n();
  const action = saveRestaurantConfigurationAction.bind(null, businessId, businessSlug);
  const [state, formAction, pending] = useRestaurantActionState(action);

  return (
    <form className={styles.form} action={formAction}>
      <FormFeedback state={state} />
      <label className={styles.checkRow}>
        <input
          type="checkbox"
          name="publiclyActive"
          aria-label={t("Public Restaurant experience active")}
          defaultChecked={publiclyActive}
          disabled={!editable}
        />
        <span>
          <strong>{t("Public Restaurant experience active")}</strong>
          <small className={styles.hint}>
            {t("Customers can view published, visible menu content when this is active.")}
          </small>
        </span>
      </label>
      {editable ? (
        <div className={styles.actions}>
          <button className="primary-button" type="submit" disabled={pending}>
            {pending ? t("Saving configuration…") : t("Save configuration")}
          </button>
        </div>
      ) : null}
    </form>
  );
}

export function MenuForm({
  businessId,
  businessSlug,
  editable,
  menu,
}: {
  businessId: string;
  businessSlug: string;
  editable: boolean;
  menu?: RestaurantMenu;
}) {
  const { t } = useAdminI18n();
  const action = saveRestaurantMenuAction.bind(null, businessId, businessSlug, menu?.id ?? null);
  const [state, formAction, pending] = useRestaurantActionState(action);
  const archived = menu?.lifecycle_status === "archived";

  return (
    <form className={styles.form} action={formAction}>
      <FormFeedback state={state} />
      <div className={styles.formGrid}>
        <Field label={t("Management name")} error={state.fieldErrors?.internalName} wide>
          <input
            name="internalName"
            defaultValue={menu?.internal_name ?? ""}
            maxLength={160}
            required
            disabled={!editable || archived}
          />
        </Field>
        <Field label={t("Publication")} error={state.fieldErrors?.publicationStatus}>
          <select
            name="publicationStatus"
            defaultValue={menu?.publication_status ?? "draft"}
            disabled={!editable || archived}
          >
            <option value="draft">{t("Draft")}</option>
            <option value="published">{t("Published")}</option>
          </select>
        </Field>
        <Field label={t("Display position")} error={state.fieldErrors?.displayOrder}>
          <input
            type="number"
            name="displayOrder"
            defaultValue={menu?.display_order ?? 0}
            min={0}
            max={1_000_000}
            disabled={!editable || archived}
          />
          <small className={styles.hint}>{t("Lower numbers appear first.")}</small>
        </Field>
      </div>
      <input type="hidden" name="lifecycleStatus" value="active" />
      {editable && !archived ? (
        <div className={styles.actions}>
          <button className="primary-button" type="submit" disabled={pending}>
            {pending ? t("Saving menu…") : menu ? t("Save menu") : t("Create menu")}
          </button>
        </div>
      ) : null}
    </form>
  );
}

export function CategoryForm({
  businessId,
  businessSlug,
  category,
  editable,
  media,
  menuId,
}: {
  businessId: string;
  businessSlug: string;
  category?: RestaurantCategory;
  editable: boolean;
  media: RestaurantMediaOption[];
  menuId: string;
}) {
  const { t } = useAdminI18n();
  const action = saveRestaurantCategoryAction.bind(
    null,
    businessId,
    businessSlug,
    category?.id ?? null,
  );
  const [state, formAction, pending] = useRestaurantActionState(action);
  const archived = category?.lifecycle_status === "archived";

  return (
    <form className={styles.form} action={formAction}>
      <FormFeedback state={state} />
      <input type="hidden" name="menuId" value={menuId} />
      <input type="hidden" name="lifecycleStatus" value="active" />
      <div className={styles.formGrid}>
        <Field label={t("Management name")} error={state.fieldErrors?.internalName} wide>
          <input
            name="internalName"
            defaultValue={category?.internal_name ?? ""}
            maxLength={160}
            required
            disabled={!editable || archived}
          />
          <small className={styles.hint}>{t("Lower numbers appear first.")}</small>
        </Field>
        <Field label={t("Display position")} error={state.fieldErrors?.displayOrder}>
          <input
            type="number"
            name="displayOrder"
            defaultValue={category?.display_order ?? 0}
            min={0}
            max={1_000_000}
            disabled={!editable || archived}
          />
        </Field>
        <div className={styles.field}>
          <span className={styles.checkRow}>
            <input
              id={`category-visible-${category?.id ?? "new"}`}
              type="checkbox"
              name="isVisible"
              defaultChecked={category?.is_visible ?? true}
              disabled={!editable || archived}
            />
            <label htmlFor={`category-visible-${category?.id ?? "new"}`}>
              {t("Visible to customers")}
            </label>
          </span>
        </div>
        <MediaPicker
          currentId={category?.image_media_asset_id ?? null}
          disabled={!editable || archived}
          media={media}
        />
      </div>
      {editable && !archived ? (
        <div className={styles.actions}>
          <button className="primary-button" type="submit" disabled={pending}>
            {pending ? t("Saving category…") : category ? t("Save category") : t("Create category")}
          </button>
        </div>
      ) : null}
    </form>
  );
}

export function ItemForm({
  businessId,
  businessSlug,
  categories,
  editable,
  item,
  media,
  menuId,
}: {
  businessId: string;
  businessSlug: string;
  categories: RestaurantCategory[];
  editable: boolean;
  item?: RestaurantItem;
  media: RestaurantMediaOption[];
  menuId: string;
}) {
  const { t } = useAdminI18n();
  const action = saveRestaurantItemAction.bind(null, businessId, businessSlug, item?.id ?? null);
  const [state, formAction, pending] = useRestaurantActionState(action);
  const archived = item?.lifecycle_status === "archived";

  return (
    <form className={styles.form} action={formAction}>
      <FormFeedback state={state} />
      <input type="hidden" name="menuId" value={menuId} />
      <input type="hidden" name="lifecycleStatus" value="active" />
      <div className={styles.formGrid}>
        <Field label={t("Management name")} error={state.fieldErrors?.internalName} wide>
          <input
            name="internalName"
            defaultValue={item?.internal_name ?? ""}
            maxLength={160}
            required
            disabled={!editable || archived}
          />
          <small className={styles.hint}>{t("Lower numbers appear first.")}</small>
        </Field>
        <Field label={t("Category")} error={state.fieldErrors?.categoryId}>
          <select
            name="categoryId"
            defaultValue={item?.category_id ?? ""}
            required
            disabled={!editable || archived}
          >
            <option value="" disabled>
              {t("Choose category")}
            </option>
            {categories
              .filter((category) => category.lifecycle_status === "active")
              .map((category) => (
                <option key={category.id} value={category.id}>
                  {category.internal_name}
                </option>
              ))}
          </select>
        </Field>
        <Field label={t("Base price")} error={state.fieldErrors?.price}>
          <input
            name="price"
            inputMode="decimal"
            defaultValue={item ? formatMinorMoneyInput(item.base_price_minor) : "0.00"}
            pattern="(?:0|[1-9][0-9]*)(?:\.[0-9]{1,2})?"
            required
            dir="ltr"
            disabled={!editable || archived}
          />
        </Field>
        <Field label={t("Availability")} error={state.fieldErrors?.availabilityStatus}>
          <select
            name="availabilityStatus"
            defaultValue={item?.availability_status ?? "available"}
            disabled={!editable || archived}
          >
            <option value="available">{t("Available")}</option>
            <option value="sold_out">{t("Sold out")}</option>
          </select>
        </Field>
        <Field label={t("Display position")} error={state.fieldErrors?.displayOrder}>
          <input
            type="number"
            name="displayOrder"
            defaultValue={item?.display_order ?? 0}
            min={0}
            max={1_000_000}
            disabled={!editable || archived}
          />
          <small className={styles.hint}>{t("Lower numbers appear first.")}</small>
        </Field>
        <div className={styles.field}>
          <span className={styles.checkRow}>
            <input
              id={`item-visible-${item?.id ?? "new"}`}
              type="checkbox"
              name="isVisible"
              defaultChecked={item?.is_visible ?? true}
              disabled={!editable || archived}
            />
            <label htmlFor={`item-visible-${item?.id ?? "new"}`}>{t("Visible to customers")}</label>
          </span>
        </div>
        <MediaPicker
          currentId={item?.image_media_asset_id ?? null}
          disabled={!editable || archived}
          media={media}
        />
      </div>
      {editable && !archived ? (
        <div className={styles.actions}>
          <button className="primary-button" type="submit" disabled={pending}>
            {pending ? t("Saving item…") : item ? t("Save item") : t("Create item")}
          </button>
        </div>
      ) : null}
    </form>
  );
}

export function VariantForm({
  businessId,
  businessSlug,
  editable,
  itemId,
  variant,
}: {
  businessId: string;
  businessSlug: string;
  editable: boolean;
  itemId: string;
  variant?: RestaurantItemVariant;
}) {
  const { t } = useAdminI18n();
  const action = saveRestaurantVariantAction.bind(
    null,
    businessId,
    businessSlug,
    itemId,
    variant?.id ?? null,
  );
  const [state, formAction, pending] = useRestaurantActionState(action);
  const archived = variant?.lifecycle_status === "archived";

  return (
    <form className={styles.form} action={formAction}>
      <FormFeedback state={state} />
      <input type="hidden" name="lifecycleStatus" value="active" />
      <div className={styles.formGrid}>
        <Field label={t("Variant name")} error={state.fieldErrors?.internalName}>
          <input
            name="internalName"
            defaultValue={variant?.internal_name ?? ""}
            required
            disabled={!editable || archived}
          />
        </Field>
        <Field label={t("Absolute price")} error={state.fieldErrors?.price}>
          <input
            name="price"
            inputMode="decimal"
            defaultValue={variant ? formatMinorMoneyInput(variant.price_minor) : "0.00"}
            required
            dir="ltr"
            disabled={!editable || archived}
          />
        </Field>
        <Field label={t("Availability")} error={state.fieldErrors?.availabilityStatus}>
          <select
            name="availabilityStatus"
            defaultValue={variant?.availability_status ?? "available"}
            disabled={!editable || archived}
          >
            <option value="available">{t("Available")}</option>
            <option value="sold_out">{t("Sold out")}</option>
          </select>
        </Field>
        <Field label={t("Display position")} error={state.fieldErrors?.displayOrder}>
          <input
            type="number"
            name="displayOrder"
            min={0}
            max={1_000_000}
            defaultValue={variant?.display_order ?? 0}
            disabled={!editable || archived}
          />
        </Field>
        <label className={styles.checkRow}>
          <input
            type="checkbox"
            name="isVisible"
            defaultChecked={variant?.is_visible ?? true}
            disabled={!editable || archived}
          />
          {t("Visible to customers")}
        </label>
      </div>
      {editable && !archived ? (
        <div className={styles.actions}>
          <button className="primary-button" type="submit" disabled={pending}>
            {pending ? t("Saving variant…") : variant ? t("Save variant") : t("Add variant")}
          </button>
        </div>
      ) : null}
    </form>
  );
}

export function ModifierGroupForm({
  businessId,
  businessSlug,
  editable,
  group,
}: {
  businessId: string;
  businessSlug: string;
  editable: boolean;
  group?: RestaurantModifierGroup;
}) {
  const { t } = useAdminI18n();
  const action = saveRestaurantModifierGroupAction.bind(
    null,
    businessId,
    businessSlug,
    group?.id ?? null,
  );
  const [state, formAction, pending] = useRestaurantActionState(action);
  const archived = group?.lifecycle_status === "archived";
  return (
    <form className={styles.form} action={formAction}>
      <FormFeedback state={state} />
      <input type="hidden" name="lifecycleStatus" value="active" />
      <div className={styles.formGrid}>
        <Field label={t("Management group name")} error={state.fieldErrors?.internalName}>
          <input
            name="internalName"
            defaultValue={group?.internal_name ?? ""}
            required
            disabled={!editable || archived}
          />
        </Field>
        <label className={styles.checkRow}>
          <input
            type="checkbox"
            name="isVisible"
            defaultChecked={group?.is_visible ?? true}
            disabled={!editable || archived}
          />
          {t("Visible to customers")}
        </label>
      </div>
      {editable && !archived ? (
        <div className={styles.actions}>
          <button className="primary-button" type="submit" disabled={pending}>
            {pending ? t("Saving group…") : group ? t("Save group") : t("Create modifier group")}
          </button>
        </div>
      ) : null}
    </form>
  );
}

export function ModifierForm({
  businessId,
  businessSlug,
  editable,
  groupId,
  modifier,
}: {
  businessId: string;
  businessSlug: string;
  editable: boolean;
  groupId: string;
  modifier?: RestaurantModifier;
}) {
  const { t } = useAdminI18n();
  const action = saveRestaurantModifierAction.bind(
    null,
    businessId,
    businessSlug,
    groupId,
    modifier?.id ?? null,
  );
  const [state, formAction, pending] = useRestaurantActionState(action);
  const archived = modifier?.lifecycle_status === "archived";
  return (
    <form className={styles.form} action={formAction}>
      <FormFeedback state={state} />
      <input type="hidden" name="lifecycleStatus" value="active" />
      <div className={styles.formGrid}>
        <Field label={t("Option name")} error={state.fieldErrors?.internalName}>
          <input
            name="internalName"
            defaultValue={modifier?.internal_name ?? ""}
            required
            disabled={!editable || archived}
          />
        </Field>
        <Field label={t("Price add-on")} error={state.fieldErrors?.priceDelta}>
          <input
            name="priceDelta"
            inputMode="decimal"
            defaultValue={modifier ? formatMinorMoneyInput(modifier.price_delta_minor) : "0.00"}
            required
            dir="ltr"
            disabled={!editable || archived}
          />
        </Field>
        <Field label={t("Availability")} error={state.fieldErrors?.availabilityStatus}>
          <select
            name="availabilityStatus"
            defaultValue={modifier?.availability_status ?? "available"}
            disabled={!editable || archived}
          >
            <option value="available">{t("Available")}</option>
            <option value="sold_out">{t("Sold out")}</option>
          </select>
        </Field>
        <Field label={t("Display position")} error={state.fieldErrors?.displayOrder}>
          <input
            type="number"
            name="displayOrder"
            min={0}
            max={1_000_000}
            defaultValue={modifier?.display_order ?? 0}
            disabled={!editable || archived}
          />
          <small className={styles.hint}>{t("Lower numbers appear first.")}</small>
        </Field>
        <label className={styles.checkRow}>
          <input
            type="checkbox"
            name="isVisible"
            defaultChecked={modifier?.is_visible ?? true}
            disabled={!editable || archived}
          />
          {t("Visible to customers")}
        </label>
      </div>
      {editable && !archived ? (
        <div className={styles.actions}>
          <button className="primary-button" type="submit" disabled={pending}>
            {pending ? t("Saving option…") : modifier ? t("Save option") : t("Add modifier option")}
          </button>
        </div>
      ) : null}
    </form>
  );
}

export function TranslationEditor({
  businessId,
  businessSlug,
  defaultLocale,
  editable,
  entityId,
  entityType,
  locales,
  supportsDescription,
  translations,
}: {
  businessId: string;
  businessSlug: string;
  defaultLocale: SupportedLocale;
  editable: boolean;
  entityId: string;
  entityType: "category" | "item" | "item_variant" | "menu" | "modifier" | "modifier_group";
  locales: SupportedLocale[];
  supportsDescription: boolean;
  translations: RestaurantTranslationValue[];
}) {
  return (
    <div className={styles.translationGrid}>
      {locales.map((locale) => {
        const current = translations.find((translation) => translation.locale === locale);
        return (
          <TranslationLocaleForm
            key={locale}
            action={saveRestaurantTranslationAction.bind(null, businessId, businessSlug, entityId)}
            current={current}
            defaultLocale={defaultLocale}
            editable={editable}
            entityType={entityType}
            locale={locale}
            supportsDescription={supportsDescription}
          />
        );
      })}
    </div>
  );
}

function TranslationLocaleForm({
  action,
  current,
  defaultLocale,
  editable,
  entityType,
  locale,
  supportsDescription,
}: {
  action: BoundFormAction;
  current?: RestaurantTranslationValue | undefined;
  defaultLocale: SupportedLocale;
  editable: boolean;
  entityType: string;
  locale: SupportedLocale;
  supportsDescription: boolean;
}) {
  const { t, locale: adminLocale } = useAdminI18n();
  const [state, formAction, pending] = useRestaurantActionState(action);
  return (
    <form
      className={`${styles.form} ${styles.translationCard}`}
      action={formAction}
      lang={adminLocale}
      dir={getTextDirection(adminLocale)}
      data-content-locale={locale}
    >
      <header>
        <strong>
          <span lang={locale} dir={getTextDirection(locale)}>
            {localeNames[locale]}
          </span>
          {locale === defaultLocale ? ` · ${t("Default")}` : ""}
        </strong>
        <span className={styles.localeCode}>{locale}</span>
      </header>
      <input type="hidden" name="entityType" value={entityType} />
      <input type="hidden" name="locale" value={locale} />
      <Field label={t("Customer-facing name")} error={state.fieldErrors?.name}>
        <input
          name="name"
          lang={locale}
          dir={getTextDirection(locale)}
          defaultValue={current?.name ?? ""}
          required
          maxLength={160}
          disabled={!editable}
        />
      </Field>
      {supportsDescription ? (
        <Field label={t("Description")} error={state.fieldErrors?.description}>
          <textarea
            name="description"
            lang={locale}
            dir={getTextDirection(locale)}
            defaultValue={current?.description ?? ""}
            maxLength={4000}
            disabled={!editable}
          />
        </Field>
      ) : null}
      <FormFeedback state={state} />
      {editable ? (
        <div className={styles.actions}>
          <button className="secondary-button" type="submit" disabled={pending}>
            {pending ? t("Saving…") : t("Save {language}", { language: locale.toUpperCase() })}
          </button>
        </div>
      ) : null}
    </form>
  );
}

export function ModifierAssignmentForm({
  businessId,
  businessSlug,
  editable,
  groups,
  itemId,
}: {
  businessId: string;
  businessSlug: string;
  editable: boolean;
  groups: RestaurantModifierGroup[];
  itemId: string;
}) {
  const { t } = useAdminI18n();
  const action = setRestaurantItemModifierGroupAction.bind(null, businessId, businessSlug, itemId);
  const [state, formAction, pending] = useRestaurantActionState(action);
  return (
    <form className={styles.form} action={formAction}>
      <FormFeedback state={state} />
      <div className={styles.formGrid}>
        <Field label={t("Modifier group")}>
          <select
            name="modifierGroupId"
            required
            disabled={!editable}
            defaultValue=""
            aria-label={t("Modifier group")}
          >
            <option value="" disabled>
              {t("Choose group")}
            </option>
            {groups
              .filter((group) => group.lifecycle_status === "active")
              .map((group) => (
                <option key={group.id} value={group.id}>
                  {group.internal_name}
                </option>
              ))}
          </select>
        </Field>
        <Field label={t("Minimum selections")}>
          <input
            type="number"
            name="minimumSelections"
            min={0}
            max={100}
            defaultValue={0}
            disabled={!editable}
          />
        </Field>
        <Field label={t("Maximum selections")}>
          <input
            type="number"
            name="maximumSelections"
            min={1}
            max={100}
            defaultValue={1}
            disabled={!editable}
          />
        </Field>
        <Field label={t("Display position")}>
          <input
            type="number"
            name="displayOrder"
            min={0}
            max={1_000_000}
            defaultValue={0}
            disabled={!editable}
          />
        </Field>
      </div>
      {editable ? (
        <div className={styles.actions}>
          <button className="primary-button" type="submit" disabled={pending}>
            {pending ? t("Assigning…") : t("Assign modifier group")}
          </button>
        </div>
      ) : null}
    </form>
  );
}

export function AssignedModifierGroupForm({
  assignment,
  businessId,
  businessSlug,
  editable,
  group,
  itemId,
}: {
  assignment: RestaurantItemModifierGroup;
  businessId: string;
  businessSlug: string;
  editable: boolean;
  group: RestaurantModifierGroup;
  itemId: string;
}) {
  const { t } = useAdminI18n();
  const saveAction = setRestaurantItemModifierGroupAction.bind(
    null,
    businessId,
    businessSlug,
    itemId,
  );
  const removeAction = removeRestaurantItemModifierGroupAction.bind(
    null,
    businessId,
    businessSlug,
    itemId,
    group.id,
  );
  const [saveState, saveFormAction, savePending] = useRestaurantActionState(saveAction);
  const [removeState, removeFormAction, removePending] = useRestaurantActionState(removeAction);
  return (
    <div className={styles.entityCard}>
      <strong>{group.internal_name}</strong>
      <form className={styles.form} action={saveFormAction}>
        <input type="hidden" name="modifierGroupId" value={group.id} />
        <div className={styles.formGrid}>
          <Field label={t("Minimum")}>
            <input
              type="number"
              name="minimumSelections"
              min={0}
              max={100}
              defaultValue={assignment.minimum_selections}
              disabled={!editable}
            />
          </Field>
          <Field label={t("Maximum")}>
            <input
              type="number"
              name="maximumSelections"
              min={1}
              max={100}
              defaultValue={assignment.maximum_selections}
              disabled={!editable}
            />
          </Field>
          <Field label={t("Position")}>
            <input
              type="number"
              name="displayOrder"
              min={0}
              max={1_000_000}
              defaultValue={assignment.display_order}
              disabled={!editable}
            />
          </Field>
        </div>
        <FormFeedback state={saveState} />
        {editable ? (
          <div className={styles.actions}>
            <button className="secondary-button" type="submit" disabled={savePending}>
              {savePending ? t("Saving…") : t("Save assignment")}
            </button>
          </div>
        ) : null}
      </form>
      {editable ? (
        <form className={styles.actions} action={removeFormAction}>
          <button className="danger-button" type="submit" disabled={removePending}>
            {removePending ? t("Removing…") : t("Remove assignment")}
          </button>
        </form>
      ) : null}
      <FormFeedback state={removeState} />
    </div>
  );
}

export function LocationAvailabilityForm({
  baseAvailability,
  businessId,
  businessSlug,
  editable,
  itemId,
  locationId,
  locationName,
  override,
}: {
  baseAvailability: "available" | "sold_out";
  businessId: string;
  businessSlug: string;
  editable: boolean;
  itemId: string;
  locationId: string;
  locationName: string;
  override: "available" | "sold_out" | null;
}) {
  const { t } = useAdminI18n();
  const action = setRestaurantLocationAvailabilityAction.bind(
    null,
    businessId,
    businessSlug,
    itemId,
    locationId,
  );
  const [state, formAction, pending] = useRestaurantActionState(action);
  return (
    <form className={styles.locationRow} action={formAction}>
      <span>
        <strong dir="auto">{locationName}</strong>
        <small>
          {override
            ? t("Explicit override")
            : baseAvailability === "available"
              ? t("Inherits available")
              : t("Inherits sold out")}
        </small>
      </span>
      <select
        name="availabilityStatus"
        defaultValue={override ?? "inherit"}
        disabled={!editable}
        aria-label={t("{location} availability", { location: locationName })}
      >
        <option value="inherit">{t("Inherit item")}</option>
        <option value="available">{t("Available")}</option>
        <option value="sold_out">{t("Sold out")}</option>
      </select>
      {editable ? (
        <button className="secondary-button" type="submit" disabled={pending}>
          {pending ? t("Saving…") : t("Save")}
        </button>
      ) : null}
      <FormFeedback state={state} />
    </form>
  );
}

export function ArchiveControl({
  action,
  description,
  fields,
  label,
  title,
}: {
  action: BoundFormAction;
  description: string;
  fields: Record<string, boolean | number | string | null>;
  label: string;
  title: string;
}) {
  const { t } = useAdminI18n();
  const [open, setOpen] = useState(false);
  const archiveAction = useCallback(
    async (previousState: FormState, formData: FormData) => {
      const result = await action(previousState, formData);
      if (result.status === "success") setOpen(false);
      return result;
    },
    [action],
  );
  const [state, formAction, pending] = useRestaurantActionState(archiveAction);
  return (
    <>
      <FormFeedback state={state} />
      <button className="danger-button" type="button" onClick={() => setOpen(true)}>
        <ArchiveIcon size={17} />
        {label}
      </button>
      <ConfirmationDialog
        open={open}
        pending={pending}
        onClose={() => setOpen(false)}
        title={title}
        description={description}
      >
        <button
          type="button"
          className="secondary-button"
          onClick={() => setOpen(false)}
          disabled={pending}
        >
          {t("Cancel")}
        </button>
        <form action={formAction}>
          {Object.entries(fields).map(([name, value]) => (
            <input
              key={name}
              type="hidden"
              name={name}
              value={value === null ? "" : String(value)}
            />
          ))}
          <button type="submit" className="danger-button" disabled={pending}>
            {pending ? t("Archiving…") : label}
          </button>
        </form>
      </ConfirmationDialog>
    </>
  );
}

function MediaPicker({
  currentId,
  disabled,
  media,
}: {
  currentId: string | null;
  disabled: boolean;
  media: RestaurantMediaOption[];
}) {
  const { t } = useAdminI18n();
  const id = useId();
  return (
    <fieldset className={`${styles.field} ${styles.wide}`}>
      <legend>{t("Image")}</legend>
      <div className={styles.mediaGrid}>
        <label className={styles.mediaChoice}>
          <input
            type="radio"
            name="imageMediaAssetId"
            value=""
            defaultChecked={!currentId}
            disabled={disabled}
          />
          <span className={styles.mediaBlank}>
            <ImageIcon size={22} />
          </span>
          <span>{t("No image")}</span>
        </label>
        {media.map((asset) => (
          <label className={styles.mediaChoice} key={asset.id}>
            <input
              id={`${id}-${asset.id}`}
              type="radio"
              name="imageMediaAssetId"
              value={asset.id}
              defaultChecked={currentId === asset.id}
              disabled={disabled}
            />
            <Image
              src={asset.url}
              alt={asset.alt}
              width={180}
              height={135}
              unoptimized={isLocalStorageUrl(asset.url)}
            />
            <span>{asset.label}</span>
          </label>
        ))}
      </div>
      {media.length === 0 ? (
        <p className={styles.hint}>
          {t("No active business images are available. Add one in Media first.")}
        </p>
      ) : null}
    </fieldset>
  );
}

function isLocalStorageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.hostname === "127.0.0.1" || url.hostname === "localhost";
  } catch {
    return false;
  }
}

function Field({
  children,
  error,
  label,
  wide = false,
}: {
  children: React.ReactNode;
  error?: string | undefined;
  label: string;
  wide?: boolean;
}) {
  const { t } = useAdminI18n();
  return (
    <label className={`${styles.field}${wide ? ` ${styles.wide}` : ""}`}>
      <span>{label}</span>
      {children}
      {error ? <p className={styles.error}>{t(error)}</p> : null}
    </label>
  );
}

function FormFeedback({ state }: { state: FormState }) {
  const { t } = useAdminI18n();
  if (!state.message) return null;
  return (
    <p
      className={`${styles.feedback}${state.status === "error" ? ` ${styles.feedbackError}` : ""}`}
      role={state.status === "error" ? "alert" : "status"}
    >
      {state.status === "success" ? <CheckmarkCircleIcon size={17} /> : null}
      {t(state.message)}
    </p>
  );
}
