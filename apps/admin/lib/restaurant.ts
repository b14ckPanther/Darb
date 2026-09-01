import "server-only";

import { deriveRestaurantReadiness, type RestaurantReadinessItem } from "@darb/restaurant";
import type { DarbServerSupabaseClient } from "@darb/database/server";
import type { Database } from "@darb/database/types";

import type { AccessibleBusinessLocale } from "./business-locales";
import { listBusinessLocales, mapBusinessLocaleState } from "./business-locales";
import type { AccessibleLocation } from "./auth";
import type { AccessibleMediaAsset } from "./media";
import { listBusinessMediaAssets } from "./media";

type RestaurantTables = Database["restaurant"]["Tables"];
export type RestaurantConfiguration = RestaurantTables["configurations"]["Row"];
export type RestaurantMenu = RestaurantTables["menus"]["Row"];
export type RestaurantMenuTranslation = RestaurantTables["menu_translations"]["Row"];
export type RestaurantCategory = RestaurantTables["categories"]["Row"];
export type RestaurantCategoryTranslation = RestaurantTables["category_translations"]["Row"];
export type RestaurantItem = RestaurantTables["items"]["Row"];
export type RestaurantItemTranslation = RestaurantTables["item_translations"]["Row"];
export type RestaurantItemVariant = RestaurantTables["item_variants"]["Row"];
export type RestaurantItemVariantTranslation = RestaurantTables["item_variant_translations"]["Row"];
export type RestaurantModifierGroup = RestaurantTables["modifier_groups"]["Row"];
export type RestaurantModifierGroupTranslation =
  RestaurantTables["modifier_group_translations"]["Row"];
export type RestaurantModifier = RestaurantTables["modifiers"]["Row"];
export type RestaurantModifierTranslation = RestaurantTables["modifier_translations"]["Row"];
export type RestaurantItemModifierGroup = RestaurantTables["item_modifier_groups"]["Row"];
export type RestaurantLocationAvailability = RestaurantTables["item_location_availability"]["Row"];

export interface RestaurantOverviewSnapshot {
  activeCategoryCount: number;
  activeItemCount: number;
  activeMenuCount: number;
  configured: boolean;
  enabledLocaleCount: number;
  itemWithImageCount: number;
  locationOverrideCount: number;
  modifierGroupCount: number;
  publishedMenuCount: number;
  publiclyActive: boolean;
  readiness: RestaurantReadinessItem[];
  soldOutItemCount: number;
  translatedItemCount: number;
}

export interface RestaurantMenuListSnapshot {
  categories: RestaurantCategory[];
  items: RestaurantItem[];
  locales: AccessibleBusinessLocale[];
  menus: RestaurantMenu[];
  translations: RestaurantMenuTranslation[];
}

export interface RestaurantMenuEditorSnapshot extends RestaurantMenuListSnapshot {
  categoryTranslations: RestaurantCategoryTranslation[];
  itemTranslations: RestaurantItemTranslation[];
  media: AccessibleMediaAsset[];
  menu: RestaurantMenu;
}

export interface RestaurantItemEditorSnapshot {
  assignments: RestaurantItemModifierGroup[];
  categories: RestaurantCategory[];
  item: RestaurantItem;
  itemTranslations: RestaurantItemTranslation[];
  locales: AccessibleBusinessLocale[];
  locationAvailability: RestaurantLocationAvailability[];
  locations: AccessibleLocation[];
  media: AccessibleMediaAsset[];
  modifierGroupTranslations: RestaurantModifierGroupTranslation[];
  modifierGroups: RestaurantModifierGroup[];
  modifiers: RestaurantModifier[];
  variantTranslations: RestaurantItemVariantTranslation[];
  variants: RestaurantItemVariant[];
}

export interface RestaurantModifierLibrarySnapshot {
  groupTranslations: RestaurantModifierGroupTranslation[];
  groups: RestaurantModifierGroup[];
  locales: AccessibleBusinessLocale[];
  modifierTranslations: RestaurantModifierTranslation[];
  modifiers: RestaurantModifier[];
}

export async function loadRestaurantOverview(
  supabase: DarbServerSupabaseClient,
  businessId: string,
): Promise<RestaurantOverviewSnapshot> {
  const [
    configuration,
    menus,
    categories,
    items,
    translations,
    modifierGroups,
    overrides,
    locales,
  ] = await Promise.all([
    selectConfiguration(supabase, businessId),
    selectMenus(supabase, businessId),
    selectCategories(supabase, businessId),
    selectItems(supabase, businessId),
    selectItemTranslations(supabase, businessId),
    selectModifierGroups(supabase, businessId),
    selectLocationAvailability(supabase, businessId),
    listBusinessLocales(supabase, businessId),
  ]);
  const activeMenus = menus.filter((menu) => menu.lifecycle_status === "active");
  const activeCategories = categories.filter((category) => category.lifecycle_status === "active");
  const activeItems = items.filter((item) => item.lifecycle_status === "active");
  const enabledLocaleCount = locales.filter((locale) => locale.is_enabled).length;
  const translatedItemCount = new Set(translations.map((translation) => translation.item_id)).size;
  const readinessInput = {
    activeCategoryCount: activeCategories.length,
    activeItemCount: activeItems.length,
    activeMenuCount: activeMenus.length,
    configured: configuration !== null,
    enabledLocaleCount,
    modifierGroupCount: modifierGroups.filter((group) => group.lifecycle_status === "active")
      .length,
    publishedMenuCount: activeMenus.filter((menu) => menu.publication_status === "published")
      .length,
    publiclyActive: configuration?.is_publicly_active ?? false,
  };

  return {
    ...readinessInput,
    itemWithImageCount: activeItems.filter((item) => item.image_media_asset_id !== null).length,
    locationOverrideCount: overrides.length,
    readiness: deriveRestaurantReadiness(readinessInput),
    soldOutItemCount: activeItems.filter((item) => item.availability_status === "sold_out").length,
    translatedItemCount,
  };
}

export async function loadRestaurantMenuList(
  supabase: DarbServerSupabaseClient,
  businessId: string,
): Promise<RestaurantMenuListSnapshot> {
  const [menus, categories, items, translations, locales] = await Promise.all([
    selectMenus(supabase, businessId),
    selectCategories(supabase, businessId),
    selectItems(supabase, businessId),
    selectMenuTranslations(supabase, businessId),
    listBusinessLocales(supabase, businessId),
  ]);

  return { categories, items, locales, menus, translations };
}

export async function loadRestaurantMenuEditor(
  supabase: DarbServerSupabaseClient,
  businessId: string,
  menuId: string,
): Promise<RestaurantMenuEditorSnapshot | null> {
  const [snapshot, categoryTranslations, itemTranslations, media] = await Promise.all([
    loadRestaurantMenuList(supabase, businessId),
    selectCategoryTranslations(supabase, businessId),
    selectItemTranslations(supabase, businessId),
    listBusinessMediaAssets(supabase, businessId),
  ]);
  const menu = snapshot.menus.find((candidate) => candidate.id === menuId);

  if (!menu) return null;

  return {
    ...snapshot,
    categories: snapshot.categories.filter((category) => category.menu_id === menu.id),
    categoryTranslations,
    itemTranslations,
    items: snapshot.items.filter((item) => item.menu_id === menu.id),
    media: media.filter((asset) => asset.status === "active" && asset.media_kind === "image"),
    menu,
  };
}

export async function loadRestaurantItemEditor(
  supabase: DarbServerSupabaseClient,
  businessId: string,
  itemId: string,
  locations: AccessibleLocation[],
): Promise<RestaurantItemEditorSnapshot | null> {
  const [
    items,
    itemTranslations,
    variants,
    variantTranslations,
    categories,
    modifierGroups,
    modifierGroupTranslations,
    modifiers,
    assignments,
    locationAvailability,
    locales,
    media,
  ] = await Promise.all([
    selectItems(supabase, businessId),
    selectItemTranslations(supabase, businessId),
    selectItemVariants(supabase, businessId),
    selectVariantTranslations(supabase, businessId),
    selectCategories(supabase, businessId),
    selectModifierGroups(supabase, businessId),
    selectModifierGroupTranslations(supabase, businessId),
    selectModifiers(supabase, businessId),
    selectItemModifierGroups(supabase, businessId),
    selectLocationAvailability(supabase, businessId),
    listBusinessLocales(supabase, businessId),
    listBusinessMediaAssets(supabase, businessId),
  ]);
  const item = items.find((candidate) => candidate.id === itemId);

  if (!item) return null;

  return {
    assignments: assignments.filter((assignment) => assignment.item_id === item.id),
    categories: categories.filter((category) => category.menu_id === item.menu_id),
    item,
    itemTranslations: itemTranslations.filter((translation) => translation.item_id === item.id),
    locales,
    locationAvailability: locationAvailability.filter(
      (availability) => availability.item_id === item.id,
    ),
    locations: locations.filter((location) => location.status !== "archived"),
    media: media.filter((asset) => asset.status === "active" && asset.media_kind === "image"),
    modifierGroupTranslations,
    modifierGroups,
    modifiers,
    variantTranslations,
    variants: variants.filter((variant) => variant.item_id === item.id),
  };
}

export async function loadRestaurantModifierLibrary(
  supabase: DarbServerSupabaseClient,
  businessId: string,
): Promise<RestaurantModifierLibrarySnapshot> {
  const [groups, groupTranslations, modifiers, modifierTranslations, locales] = await Promise.all([
    selectModifierGroups(supabase, businessId),
    selectModifierGroupTranslations(supabase, businessId),
    selectModifiers(supabase, businessId),
    selectModifierTranslations(supabase, businessId),
    listBusinessLocales(supabase, businessId),
  ]);

  return { groupTranslations, groups, locales, modifierTranslations, modifiers };
}

export function enabledRestaurantLocales(
  rows: readonly AccessibleBusinessLocale[],
  defaultLocale: Database["core"]["Enums"]["locale_code"],
) {
  return mapBusinessLocaleState(rows, defaultLocale).enabledLocales;
}

async function selectConfiguration(supabase: DarbServerSupabaseClient, businessId: string) {
  const { data, error } = await supabase
    .schema("restaurant")
    .from("configurations")
    .select("business_id, is_publicly_active, created_by, created_at, updated_at")
    .eq("business_id", businessId)
    .maybeSingle();
  if (error) throwRestaurantReadError(error.code);
  return data;
}

async function selectMenus(supabase: DarbServerSupabaseClient, businessId: string) {
  const { data, error } = await supabase
    .schema("restaurant")
    .from("menus")
    .select("*")
    .eq("business_id", businessId)
    .order("display_order")
    .order("created_at");
  if (error) throwRestaurantReadError(error.code);
  return data;
}

async function selectMenuTranslations(supabase: DarbServerSupabaseClient, businessId: string) {
  const { data, error } = await supabase
    .schema("restaurant")
    .from("menu_translations")
    .select("*")
    .eq("business_id", businessId);
  if (error) throwRestaurantReadError(error.code);
  return data;
}

async function selectCategories(supabase: DarbServerSupabaseClient, businessId: string) {
  const { data, error } = await supabase
    .schema("restaurant")
    .from("categories")
    .select("*")
    .eq("business_id", businessId)
    .order("display_order")
    .order("created_at");
  if (error) throwRestaurantReadError(error.code);
  return data;
}

async function selectCategoryTranslations(supabase: DarbServerSupabaseClient, businessId: string) {
  const { data, error } = await supabase
    .schema("restaurant")
    .from("category_translations")
    .select("*")
    .eq("business_id", businessId);
  if (error) throwRestaurantReadError(error.code);
  return data;
}

async function selectItems(supabase: DarbServerSupabaseClient, businessId: string) {
  const { data, error } = await supabase
    .schema("restaurant")
    .from("items")
    .select("*")
    .eq("business_id", businessId)
    .order("display_order")
    .order("created_at");
  if (error) throwRestaurantReadError(error.code);
  return data;
}

async function selectItemTranslations(supabase: DarbServerSupabaseClient, businessId: string) {
  const { data, error } = await supabase
    .schema("restaurant")
    .from("item_translations")
    .select("*")
    .eq("business_id", businessId);
  if (error) throwRestaurantReadError(error.code);
  return data;
}

async function selectItemVariants(supabase: DarbServerSupabaseClient, businessId: string) {
  const { data, error } = await supabase
    .schema("restaurant")
    .from("item_variants")
    .select("*")
    .eq("business_id", businessId)
    .order("display_order")
    .order("created_at");
  if (error) throwRestaurantReadError(error.code);
  return data;
}

async function selectVariantTranslations(supabase: DarbServerSupabaseClient, businessId: string) {
  const { data, error } = await supabase
    .schema("restaurant")
    .from("item_variant_translations")
    .select("*")
    .eq("business_id", businessId);
  if (error) throwRestaurantReadError(error.code);
  return data;
}

async function selectModifierGroups(supabase: DarbServerSupabaseClient, businessId: string) {
  const { data, error } = await supabase
    .schema("restaurant")
    .from("modifier_groups")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at");
  if (error) throwRestaurantReadError(error.code);
  return data;
}

async function selectModifierGroupTranslations(
  supabase: DarbServerSupabaseClient,
  businessId: string,
) {
  const { data, error } = await supabase
    .schema("restaurant")
    .from("modifier_group_translations")
    .select("*")
    .eq("business_id", businessId);
  if (error) throwRestaurantReadError(error.code);
  return data;
}

async function selectModifiers(supabase: DarbServerSupabaseClient, businessId: string) {
  const { data, error } = await supabase
    .schema("restaurant")
    .from("modifiers")
    .select("*")
    .eq("business_id", businessId)
    .order("display_order")
    .order("created_at");
  if (error) throwRestaurantReadError(error.code);
  return data;
}

async function selectModifierTranslations(supabase: DarbServerSupabaseClient, businessId: string) {
  const { data, error } = await supabase
    .schema("restaurant")
    .from("modifier_translations")
    .select("*")
    .eq("business_id", businessId);
  if (error) throwRestaurantReadError(error.code);
  return data;
}

async function selectItemModifierGroups(supabase: DarbServerSupabaseClient, businessId: string) {
  const { data, error } = await supabase
    .schema("restaurant")
    .from("item_modifier_groups")
    .select("*")
    .eq("business_id", businessId)
    .order("display_order");
  if (error) throwRestaurantReadError(error.code);
  return data;
}

async function selectLocationAvailability(supabase: DarbServerSupabaseClient, businessId: string) {
  const { data, error } = await supabase
    .schema("restaurant")
    .from("item_location_availability")
    .select("*")
    .eq("business_id", businessId);
  if (error) throwRestaurantReadError(error.code);
  return data;
}

function throwRestaurantReadError(code: string): never {
  throw new Error(`Unable to load Restaurant administration data (${code}).`);
}
