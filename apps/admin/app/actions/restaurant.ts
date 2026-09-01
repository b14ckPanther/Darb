"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireActionBusiness } from "../../lib/action-context";
import { hasBusinessPermission } from "../../lib/auth";
import { listBusinessLocales, mapBusinessLocaleState } from "../../lib/business-locales";
import type { FormState } from "../../lib/forms";
import { listBusinessModuleStates } from "../../lib/modules";
import { mapMutationError } from "../../lib/mutation-errors";
import { businessPath } from "../../lib/navigation";
import {
  parseCategoryInput,
  parseItemInput,
  parseMenuInput,
  parseModifierGroupInput,
  parsePricedChildInput,
  parseTranslationInput,
} from "../../lib/restaurant-form";
import { createServerActionSupabaseClient } from "../../lib/supabase/server";

export async function saveRestaurantConfigurationAction(
  businessId: string,
  _businessSlug: string,
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const publiclyActive = readBoolean(formData, "publiclyActive");
  const guarded = await prepareRestaurantMutation(businessId);
  if (!guarded.ok) return guarded.error;

  const { data, error } = await guarded.supabase
    .schema("restaurant")
    .rpc("save_configuration", {
      requested_publicly_active: publiclyActive,
      target_business_id: guarded.businessId,
    })
    .single();

  if (error || !data) return mapMutationError(error ?? {}, "restaurant");
  revalidateRestaurantPaths(guarded.businessSlug);
  return {
    message: data.changed
      ? `Restaurant public experience marked ${data.is_publicly_active ? "active" : "inactive"}.`
      : "Restaurant configuration was already up to date.",
    status: "success",
  };
}

export async function saveRestaurantMenuAction(
  businessId: string,
  _businessSlug: string,
  menuId: string | null,
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseMenuInput(formData);
  if (!parsed.success) return { fieldErrors: parsed.errors, status: "error" };
  const guarded = await prepareRestaurantMutation(businessId);
  if (!guarded.ok) return guarded.error;

  const { data, error } = await guarded.supabase
    .schema("restaurant")
    .rpc("save_menu", {
      requested_display_order: parsed.data.displayOrder,
      requested_internal_name: parsed.data.internalName,
      requested_lifecycle_status: parsed.data.lifecycleStatus,
      requested_publication_status: parsed.data.publicationStatus,
      target_business_id: guarded.businessId,
      target_menu_id: nullableRpcUuid(menuId),
    })
    .single();

  if (error || !data) return mapMutationError(error ?? {}, "restaurant");
  revalidateRestaurantPaths(guarded.businessSlug);
  if (data.created) {
    redirect(`${restaurantMenusPath(guarded.businessSlug)}/${data.menu_id}?created=1`);
  }
  return {
    message: data.changed ? "Menu details saved." : "Menu details were already up to date.",
    status: "success",
  };
}

export async function saveRestaurantCategoryAction(
  businessId: string,
  _businessSlug: string,
  categoryId: string | null,
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseCategoryInput(formData);
  if (!parsed.success) return { fieldErrors: parsed.errors, status: "error" };
  const guarded = await prepareRestaurantMutation(businessId);
  if (!guarded.ok) return guarded.error;

  const { data, error } = await guarded.supabase
    .schema("restaurant")
    .rpc("save_category", {
      requested_display_order: parsed.data.displayOrder,
      requested_image_media_asset_id: nullableRpcUuid(parsed.data.imageMediaAssetId),
      requested_internal_name: parsed.data.internalName,
      requested_lifecycle_status: parsed.data.lifecycleStatus,
      requested_visible: parsed.data.isVisible,
      target_business_id: guarded.businessId,
      target_category_id: nullableRpcUuid(categoryId),
      target_menu_id: parsed.data.menuId,
    })
    .single();

  if (error || !data) return mapMutationError(error ?? {}, "restaurant");
  revalidateRestaurantPaths(guarded.businessSlug);
  return {
    message: data.created
      ? "Category created."
      : data.changed
        ? "Category details saved."
        : "Category details were already up to date.",
    status: "success",
  };
}

export async function saveRestaurantItemAction(
  businessId: string,
  _businessSlug: string,
  itemId: string | null,
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseItemInput(formData);
  if (!parsed.success) return { fieldErrors: parsed.errors, status: "error" };
  const guarded = await prepareRestaurantMutation(businessId);
  if (!guarded.ok) return guarded.error;

  const { data, error } = await guarded.supabase
    .schema("restaurant")
    .rpc("save_item", {
      requested_availability_status: parsed.data.availabilityStatus,
      requested_base_price_minor: parsed.data.basePriceMinor,
      requested_display_order: parsed.data.displayOrder,
      requested_image_media_asset_id: nullableRpcUuid(parsed.data.imageMediaAssetId),
      requested_internal_name: parsed.data.internalName,
      requested_lifecycle_status: parsed.data.lifecycleStatus,
      requested_visible: parsed.data.isVisible,
      target_business_id: guarded.businessId,
      target_category_id: parsed.data.categoryId,
      target_item_id: nullableRpcUuid(itemId),
      target_menu_id: parsed.data.menuId,
    })
    .single();

  if (error || !data) return mapMutationError(error ?? {}, "restaurant");
  revalidateRestaurantPaths(guarded.businessSlug);
  if (data.created) {
    redirect(`${restaurantPath(guarded.businessSlug)}/items/${data.item_id}?created=1`);
  }
  return {
    message: data.changed ? "Item details saved." : "Item details were already up to date.",
    status: "success",
  };
}

export async function saveRestaurantVariantAction(
  businessId: string,
  _businessSlug: string,
  itemId: string,
  variantId: string | null,
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parsePricedChildInput(formData);
  if (!parsed.success) return { fieldErrors: parsed.errors, status: "error" };
  const guarded = await prepareRestaurantMutation(businessId);
  if (!guarded.ok) return guarded.error;

  const { data, error } = await guarded.supabase
    .schema("restaurant")
    .rpc("save_item_variant", {
      requested_availability_status: parsed.data.availabilityStatus,
      requested_display_order: parsed.data.displayOrder,
      requested_internal_name: parsed.data.internalName,
      requested_lifecycle_status: parsed.data.lifecycleStatus,
      requested_price_minor: parsed.data.priceMinor,
      requested_visible: parsed.data.isVisible,
      target_business_id: guarded.businessId,
      target_item_id: itemId,
      target_variant_id: nullableRpcUuid(variantId),
    })
    .single();

  if (error || !data) return mapMutationError(error ?? {}, "restaurant");
  revalidateRestaurantPaths(guarded.businessSlug);
  return {
    message: data.created
      ? "Variant created."
      : data.changed
        ? "Variant saved."
        : "Variant was already up to date.",
    status: "success",
  };
}

export async function saveRestaurantModifierGroupAction(
  businessId: string,
  _businessSlug: string,
  modifierGroupId: string | null,
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseModifierGroupInput(formData);
  if (!parsed.success) return { fieldErrors: parsed.errors, status: "error" };
  const guarded = await prepareRestaurantMutation(businessId);
  if (!guarded.ok) return guarded.error;

  const { data, error } = await guarded.supabase
    .schema("restaurant")
    .rpc("save_modifier_group", {
      requested_internal_name: parsed.data.internalName,
      requested_lifecycle_status: parsed.data.lifecycleStatus,
      requested_visible: parsed.data.isVisible,
      target_business_id: guarded.businessId,
      target_modifier_group_id: nullableRpcUuid(modifierGroupId),
    })
    .single();

  if (error || !data) return mapMutationError(error ?? {}, "restaurant");
  revalidateRestaurantPaths(guarded.businessSlug);
  return {
    message: data.created
      ? "Modifier group created."
      : data.changed
        ? "Modifier group saved."
        : "Modifier group was already up to date.",
    status: "success",
  };
}

export async function saveRestaurantModifierAction(
  businessId: string,
  _businessSlug: string,
  modifierGroupId: string,
  modifierId: string | null,
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parsePricedChildInput(formData, "priceDelta");
  if (!parsed.success) return { fieldErrors: parsed.errors, status: "error" };
  const guarded = await prepareRestaurantMutation(businessId);
  if (!guarded.ok) return guarded.error;

  const { data, error } = await guarded.supabase
    .schema("restaurant")
    .rpc("save_modifier", {
      requested_availability_status: parsed.data.availabilityStatus,
      requested_display_order: parsed.data.displayOrder,
      requested_internal_name: parsed.data.internalName,
      requested_lifecycle_status: parsed.data.lifecycleStatus,
      requested_price_delta_minor: parsed.data.priceMinor,
      requested_visible: parsed.data.isVisible,
      target_business_id: guarded.businessId,
      target_modifier_group_id: modifierGroupId,
      target_modifier_id: nullableRpcUuid(modifierId),
    })
    .single();

  if (error || !data) return mapMutationError(error ?? {}, "restaurant");
  revalidateRestaurantPaths(guarded.businessSlug);
  return {
    message: data.created
      ? "Modifier option created."
      : data.changed
        ? "Modifier option saved."
        : "Modifier option was already up to date.",
    status: "success",
  };
}

export async function saveRestaurantTranslationAction(
  businessId: string,
  _businessSlug: string,
  entityId: string,
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseTranslationInput(formData);
  if (!parsed.success) return { fieldErrors: parsed.errors, status: "error" };
  const guarded = await prepareRestaurantMutation(businessId);
  if (!guarded.ok) return guarded.error;
  const localeRows = await listBusinessLocales(guarded.supabase, guarded.businessId);
  const localeState = mapBusinessLocaleState(localeRows, guarded.defaultLocale);

  if (!localeState.enabledLocales.includes(parsed.data.locale)) {
    return {
      message: "Enable this business language before adding Restaurant content.",
      status: "error",
    };
  }

  const { data, error } = await guarded.supabase
    .schema("restaurant")
    .rpc("save_translation", {
      ...(parsed.data.description ? { requested_description: parsed.data.description } : {}),
      requested_entity_type: parsed.data.entityType,
      requested_locale_code: parsed.data.locale,
      requested_name: parsed.data.name,
      target_business_id: guarded.businessId,
      target_entity_id: entityId,
    })
    .single();

  if (error || !data) return mapMutationError(error ?? {}, "restaurant");
  revalidateRestaurantPaths(guarded.businessSlug);
  return {
    message: data.changed
      ? "Localized content saved."
      : "Localized content was already up to date.",
    status: "success",
  };
}

export async function setRestaurantItemModifierGroupAction(
  businessId: string,
  _businessSlug: string,
  itemId: string,
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const modifierGroupId = readString(formData, "modifierGroupId");
  const minimum = readBoundedInteger(formData, "minimumSelections", 0, 100);
  const maximum = readBoundedInteger(formData, "maximumSelections", 1, 100);
  const displayOrder = readBoundedInteger(formData, "displayOrder", 0, 1_000_000);

  if (
    !isUuid(modifierGroupId) ||
    minimum === null ||
    maximum === null ||
    minimum > maximum ||
    displayOrder === null
  ) {
    return { message: "Choose a modifier group and valid selection limits.", status: "error" };
  }
  const guarded = await prepareRestaurantMutation(businessId);
  if (!guarded.ok) return guarded.error;
  const { data, error } = await guarded.supabase
    .schema("restaurant")
    .rpc("set_item_modifier_group", {
      requested_display_order: displayOrder,
      requested_maximum_selections: maximum,
      requested_minimum_selections: minimum,
      target_business_id: guarded.businessId,
      target_item_id: itemId,
      target_modifier_group_id: modifierGroupId,
    })
    .single();
  if (error || !data) return mapMutationError(error ?? {}, "restaurant");
  revalidateRestaurantPaths(guarded.businessSlug);
  return {
    message: data.changed
      ? "Modifier group assignment saved."
      : "Assignment was already up to date.",
    status: "success",
  };
}

export async function removeRestaurantItemModifierGroupAction(
  businessId: string,
  _businessSlug: string,
  itemId: string,
  modifierGroupId: string,
  _previousState: FormState,
  _formData: FormData,
): Promise<FormState> {
  void _previousState;
  void _formData;
  const guarded = await prepareRestaurantMutation(businessId);
  if (!guarded.ok) return guarded.error;
  const { data, error } = await guarded.supabase
    .schema("restaurant")
    .rpc("remove_item_modifier_group", {
      target_business_id: guarded.businessId,
      target_item_id: itemId,
      target_modifier_group_id: modifierGroupId,
    })
    .single();
  if (error || !data) return mapMutationError(error ?? {}, "restaurant");
  revalidateRestaurantPaths(guarded.businessSlug);
  return {
    message: data.changed ? "Modifier group removed from item." : "The group was not assigned.",
    status: "success",
  };
}

export async function setRestaurantLocationAvailabilityAction(
  businessId: string,
  _businessSlug: string,
  itemId: string,
  locationId: string,
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const requested = readString(formData, "availabilityStatus");
  if (requested !== "inherit" && requested !== "available" && requested !== "sold_out") {
    return { message: "Choose inherit, available, or sold out.", status: "error" };
  }
  const guarded = await prepareRestaurantMutation(businessId);
  if (!guarded.ok) return guarded.error;
  const { data, error } = await guarded.supabase
    .schema("restaurant")
    .rpc("set_item_location_availability", {
      requested_availability_status: nullableRpcText(requested === "inherit" ? null : requested),
      target_business_id: guarded.businessId,
      target_item_id: itemId,
      target_location_id: locationId,
    })
    .single();
  if (error || !data) return mapMutationError(error ?? {}, "restaurant");
  revalidateRestaurantPaths(guarded.businessSlug);
  return {
    message: data.changed
      ? "Location availability saved."
      : "Location availability was already up to date.",
    status: "success",
  };
}

async function prepareRestaurantMutation(businessId: string) {
  const supabase = await createServerActionSupabaseClient();
  const business = await requireActionBusiness(supabase, businessId);

  if (business.status !== "active") {
    return {
      error: mapMutationError({ message: "RESTAURANT_BUSINESS_NOT_ACTIVE" }, "restaurant"),
      ok: false as const,
    };
  }
  if (!(await hasBusinessPermission(supabase, business.id, "restaurant.manage"))) {
    return { error: mapMutationError({ code: "42501" }, "restaurant"), ok: false as const };
  }
  const modules = await listBusinessModuleStates(supabase, business.id, business.status);
  const restaurant = modules.find((module) => module.key === "restaurant");
  if (!restaurant?.isAvailable) {
    return {
      error: mapMutationError({ message: "RESTAURANT_MODULE_UNAVAILABLE" }, "restaurant"),
      ok: false as const,
    };
  }
  if (!restaurant.isEffectivelyEnabled) {
    return {
      error: mapMutationError({ message: "RESTAURANT_MODULE_DISABLED" }, "restaurant"),
      ok: false as const,
    };
  }

  return {
    businessId: business.id,
    businessSlug: business.slug,
    defaultLocale: business.default_locale,
    ok: true as const,
    supabase,
  };
}

function revalidateRestaurantPaths(businessSlug: string): void {
  revalidatePath(businessPath(businessSlug));
  revalidatePath(restaurantPath(businessSlug));
}

function restaurantPath(businessSlug: string): string {
  return `${businessPath(businessSlug)}/restaurant`;
}

function restaurantMenusPath(businessSlug: string): string {
  return `${restaurantPath(businessSlug)}/menus`;
}

function nullableRpcUuid(value: string | null): string {
  // The generated client models RPC UUID parameters as non-null even though the reviewed create
  // mode deliberately uses SQL NULL so the database can generate the identifier.
  return value as unknown as string;
}

function nullableRpcText(value: string | null): string {
  return value as unknown as string;
}

function readBoolean(formData: FormData, field: string): boolean {
  return formData.get(field) === "on" || formData.get(field) === "true";
}

function readString(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}

function readBoundedInteger(
  formData: FormData,
  field: string,
  minimum: number,
  maximum: number,
): number | null {
  const value = readString(formData, field);
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= minimum && parsed <= maximum ? parsed : null;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
