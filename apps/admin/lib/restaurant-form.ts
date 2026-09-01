import { isSupportedLocale, type SupportedLocale } from "@darb/i18n";
import { parseMajorMoneyToMinor } from "@darb/restaurant";

import type { FieldErrors } from "./forms";

export type RestaurantParseResult<T> =
  { data: T; success: true } | { errors: FieldErrors; success: false };

export interface MenuInput {
  displayOrder: number;
  internalName: string;
  lifecycleStatus: "active" | "archived";
  publicationStatus: "draft" | "published";
}

export interface CategoryInput {
  displayOrder: number;
  imageMediaAssetId: string | null;
  internalName: string;
  isVisible: boolean;
  lifecycleStatus: "active" | "archived";
  menuId: string;
}

export interface ItemInput {
  availabilityStatus: "available" | "sold_out";
  basePriceMinor: number;
  categoryId: string;
  displayOrder: number;
  imageMediaAssetId: string | null;
  internalName: string;
  isVisible: boolean;
  lifecycleStatus: "active" | "archived";
  menuId: string;
}

export interface PricedChildInput {
  availabilityStatus: "available" | "sold_out";
  displayOrder: number;
  internalName: string;
  isVisible: boolean;
  lifecycleStatus: "active" | "archived";
  priceMinor: number;
}

export interface ModifierGroupInput {
  internalName: string;
  isVisible: boolean;
  lifecycleStatus: "active" | "archived";
}

export interface TranslationInput {
  description: string;
  entityType: "category" | "item" | "item_variant" | "menu" | "modifier" | "modifier_group";
  locale: SupportedLocale;
  name: string;
}

export function parseMenuInput(formData: FormData): RestaurantParseResult<MenuInput> {
  const internalName = readString(formData, "internalName").trim();
  const publicationStatus = readString(formData, "publicationStatus");
  const lifecycleStatus = readString(formData, "lifecycleStatus") || "active";
  const displayOrder = parseOrder(formData, "displayOrder");
  const errors: Record<string, string> = {};

  validateName(internalName, errors);
  if (publicationStatus !== "draft" && publicationStatus !== "published") {
    errors.publicationStatus = "Choose draft or published.";
  }
  if (lifecycleStatus !== "active" && lifecycleStatus !== "archived") {
    errors.lifecycleStatus = "Choose an active or archived lifecycle.";
  }
  if (displayOrder === null) errors.displayOrder = "Use a position from 0 to 1,000,000.";

  return Object.keys(errors).length > 0 ||
    displayOrder === null ||
    (publicationStatus !== "draft" && publicationStatus !== "published") ||
    (lifecycleStatus !== "active" && lifecycleStatus !== "archived")
    ? { errors, success: false }
    : { data: { displayOrder, internalName, lifecycleStatus, publicationStatus }, success: true };
}

export function parseCategoryInput(formData: FormData): RestaurantParseResult<CategoryInput> {
  const menuId = readString(formData, "menuId");
  const internalName = readString(formData, "internalName").trim();
  const lifecycleStatus = readString(formData, "lifecycleStatus") || "active";
  const displayOrder = parseOrder(formData, "displayOrder");
  const errors: Record<string, string> = {};

  validateUuid(menuId, "menuId", "Choose a valid menu.", errors);
  validateName(internalName, errors);
  if (lifecycleStatus !== "active" && lifecycleStatus !== "archived") {
    errors.lifecycleStatus = "Choose an active or archived lifecycle.";
  }
  if (displayOrder === null) errors.displayOrder = "Use a position from 0 to 1,000,000.";
  const imageMediaAssetId = optionalUuid(formData, "imageMediaAssetId", errors);

  if (
    Object.keys(errors).length > 0 ||
    displayOrder === null ||
    (lifecycleStatus !== "active" && lifecycleStatus !== "archived")
  ) {
    return { errors, success: false };
  }

  return {
    data: {
      displayOrder,
      imageMediaAssetId,
      internalName,
      isVisible: readBoolean(formData, "isVisible"),
      lifecycleStatus,
      menuId,
    },
    success: true,
  };
}

export function parseModifierGroupInput(
  formData: FormData,
): RestaurantParseResult<ModifierGroupInput> {
  const internalName = readString(formData, "internalName").trim();
  const lifecycleStatus = readString(formData, "lifecycleStatus") || "active";
  const errors: Record<string, string> = {};
  validateName(internalName, errors);
  validateLifecycle(lifecycleStatus, errors);

  return Object.keys(errors).length > 0 || !isLifecycle(lifecycleStatus)
    ? { errors, success: false }
    : {
        data: {
          internalName,
          isVisible: readBoolean(formData, "isVisible"),
          lifecycleStatus,
        },
        success: true,
      };
}

export function parseItemInput(formData: FormData): RestaurantParseResult<ItemInput> {
  const menuId = readString(formData, "menuId");
  const categoryId = readString(formData, "categoryId");
  const internalName = readString(formData, "internalName").trim();
  const lifecycleStatus = readString(formData, "lifecycleStatus") || "active";
  const availabilityStatus = readString(formData, "availabilityStatus");
  const displayOrder = parseOrder(formData, "displayOrder");
  const basePriceMinor = parseMajorMoneyToMinor(readString(formData, "price"));
  const errors: Record<string, string> = {};

  validateUuid(menuId, "menuId", "Choose a valid menu.", errors);
  validateUuid(categoryId, "categoryId", "Choose a valid category.", errors);
  validateName(internalName, errors);
  validateLifecycle(lifecycleStatus, errors);
  validateAvailability(availabilityStatus, errors);
  if (displayOrder === null) errors.displayOrder = "Use a position from 0 to 1,000,000.";
  if (basePriceMinor === null)
    errors.price = "Enter a non-negative amount with at most 2 decimals.";
  const imageMediaAssetId = optionalUuid(formData, "imageMediaAssetId", errors);

  if (
    Object.keys(errors).length > 0 ||
    displayOrder === null ||
    basePriceMinor === null ||
    !isLifecycle(lifecycleStatus) ||
    !isAvailability(availabilityStatus)
  ) {
    return { errors, success: false };
  }

  return {
    data: {
      availabilityStatus,
      basePriceMinor,
      categoryId,
      displayOrder,
      imageMediaAssetId,
      internalName,
      isVisible: readBoolean(formData, "isVisible"),
      lifecycleStatus,
      menuId,
    },
    success: true,
  };
}

export function parsePricedChildInput(
  formData: FormData,
  priceField = "price",
): RestaurantParseResult<PricedChildInput> {
  const internalName = readString(formData, "internalName").trim();
  const lifecycleStatus = readString(formData, "lifecycleStatus") || "active";
  const availabilityStatus = readString(formData, "availabilityStatus");
  const displayOrder = parseOrder(formData, "displayOrder");
  const priceMinor = parseMajorMoneyToMinor(readString(formData, priceField));
  const errors: Record<string, string> = {};

  validateName(internalName, errors);
  validateLifecycle(lifecycleStatus, errors);
  validateAvailability(availabilityStatus, errors);
  if (displayOrder === null) errors.displayOrder = "Use a position from 0 to 1,000,000.";
  if (priceMinor === null)
    errors[priceField] = "Enter a non-negative amount with at most 2 decimals.";

  if (
    Object.keys(errors).length > 0 ||
    displayOrder === null ||
    priceMinor === null ||
    !isLifecycle(lifecycleStatus) ||
    !isAvailability(availabilityStatus)
  ) {
    return { errors, success: false };
  }

  return {
    data: {
      availabilityStatus,
      displayOrder,
      internalName,
      isVisible: readBoolean(formData, "isVisible"),
      lifecycleStatus,
      priceMinor,
    },
    success: true,
  };
}

export function parseTranslationInput(formData: FormData): RestaurantParseResult<TranslationInput> {
  const entityType = readString(formData, "entityType");
  const locale = readString(formData, "locale");
  const name = readString(formData, "name").trim();
  const description = readString(formData, "description").trim();
  const errors: Record<string, string> = {};
  const entityTypes = [
    "menu",
    "category",
    "item",
    "item_variant",
    "modifier_group",
    "modifier",
  ] as const;

  validateName(name, errors, "name");
  if (description.length > 4000)
    errors.description = "Description must be 4,000 characters or fewer.";
  if (!isSupportedLocale(locale)) errors.locale = "Choose an enabled Darb language.";
  if (!entityTypes.includes(entityType as (typeof entityTypes)[number])) {
    errors.entityType = "Choose a supported Restaurant content type.";
  }

  if (
    Object.keys(errors).length > 0 ||
    !isSupportedLocale(locale) ||
    !entityTypes.includes(entityType as (typeof entityTypes)[number])
  ) {
    return { errors, success: false };
  }

  return {
    data: {
      description,
      entityType: entityType as TranslationInput["entityType"],
      locale,
      name,
    },
    success: true,
  };
}

function validateName(value: string, errors: Record<string, string>, field = "internalName"): void {
  if (!value || value.length > 160) errors[field] = "Enter a name between 1 and 160 characters.";
}

function validateLifecycle(value: string, errors: Record<string, string>): void {
  if (!isLifecycle(value)) errors.lifecycleStatus = "Choose an active or archived lifecycle.";
}

function validateAvailability(value: string, errors: Record<string, string>): void {
  if (!isAvailability(value)) errors.availabilityStatus = "Choose available or sold out.";
}

function isLifecycle(value: string): value is "active" | "archived" {
  return value === "active" || value === "archived";
}

function isAvailability(value: string): value is "available" | "sold_out" {
  return value === "available" || value === "sold_out";
}

function parseOrder(formData: FormData, field: string): number | null {
  const value = readString(formData, field);
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 1_000_000 ? parsed : null;
}

function readBoolean(formData: FormData, field: string): boolean {
  return formData.get(field) === "on" || formData.get(field) === "true";
}

function optionalUuid(
  formData: FormData,
  field: string,
  errors: Record<string, string>,
): string | null {
  const value = readString(formData, field);
  if (!value) return null;
  validateUuid(value, field, "Choose an image from this business.", errors);
  return value;
}

function validateUuid(
  value: string,
  field: string,
  message: string,
  errors: Record<string, string>,
): void {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    errors[field] = message;
  }
}

function readString(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}
