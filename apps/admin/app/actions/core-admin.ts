"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireActionBusiness } from "../../lib/action-context";
import { hasBusinessPermission } from "../../lib/auth";
import { type FormState, parseBusinessSettingsInput, parseLocationInput } from "../../lib/forms";
import { mapMutationError } from "../../lib/mutation-errors";
import {
  businessLocationPath,
  businessPath,
  businessSectionPath,
  getCanonicalBusinessPath,
} from "../../lib/navigation";
import { createServerActionSupabaseClient } from "../../lib/supabase/server";

export async function updateBusinessSettingsAction(
  businessId: string,
  currentSlug: string,
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseBusinessSettingsInput(formData);

  if (!parsed.success) {
    return { fieldErrors: parsed.errors, status: "error" };
  }

  const supabase = await createServerActionSupabaseClient();
  const business = await requireActionBusiness(supabase, businessId);

  if (!(await hasBusinessPermission(supabase, business.id, "business.manage"))) {
    return mapMutationError({ code: "42501" }, "business");
  }

  const { data, error } = await supabase
    .schema("core")
    .rpc("update_business_settings", {
      requested_default_locale: parsed.data.defaultLocale,
      requested_display_name: parsed.data.displayName,
      requested_slug: parsed.data.slug,
      requested_status: parsed.data.status,
      requested_timezone: parsed.data.timezone,
      target_business_id: business.id,
    })
    .single();

  if (error || !data) {
    return mapMutationError(error ?? {}, "business");
  }

  revalidatePath(businessPath(currentSlug));
  revalidatePath(businessPath(data.slug));

  if (data.slug !== currentSlug) {
    redirect(getCanonicalBusinessPath(data.slug, "settings"));
  }

  return { message: "Business settings saved.", status: "success" };
}

export async function createLocationAction(
  businessId: string,
  businessSlug: string,
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseLocationInput(formData, "create");

  if (!parsed.success) {
    return { fieldErrors: parsed.errors, status: "error" };
  }

  const supabase = await createServerActionSupabaseClient();
  const business = await requireActionBusiness(supabase, businessId);

  if (!(await hasBusinessPermission(supabase, business.id, "locations.manage"))) {
    return mapMutationError({ code: "42501" }, "location-create");
  }

  const { data, error } = await supabase
    .schema("core")
    .rpc("create_location", {
      requested_address_line: parsed.data.addressLine,
      requested_country_code: parsed.data.countryCode,
      requested_display_name: parsed.data.displayName,
      requested_locality: parsed.data.locality,
      requested_postal_code: parsed.data.postalCode,
      requested_timezone: parsed.data.timezone,
      target_business_id: business.id,
    })
    .single();

  if (error || !data) {
    return mapMutationError(error ?? {}, "location-create");
  }

  revalidatePath(businessSectionPath(businessSlug, "locations"));
  redirect(`${businessLocationPath(businessSlug, data.id)}?created=1`);
}

export async function updateLocationAction(
  businessId: string,
  businessSlug: string,
  locationId: string,
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseLocationInput(formData, "update");

  if (!parsed.success) {
    return { fieldErrors: parsed.errors, status: "error" };
  }

  const supabase = await createServerActionSupabaseClient();
  const business = await requireActionBusiness(supabase, businessId);

  if (!(await hasBusinessPermission(supabase, business.id, "locations.manage", locationId))) {
    return mapMutationError({ code: "42501" }, "location-update");
  }

  const { error } = await supabase
    .schema("core")
    .rpc("update_location", {
      requested_address_line: parsed.data.addressLine,
      requested_country_code: parsed.data.countryCode,
      requested_display_name: parsed.data.displayName,
      requested_locality: parsed.data.locality,
      requested_postal_code: parsed.data.postalCode,
      requested_status: parsed.data.status,
      requested_timezone: parsed.data.timezone,
      target_business_id: business.id,
      target_location_id: locationId,
    })
    .single();

  if (error) {
    return mapMutationError(error, "location-update");
  }

  revalidatePath(businessSectionPath(businessSlug, "locations"));
  revalidatePath(businessLocationPath(businessSlug, locationId));
  return { message: "Location details saved.", status: "success" };
}

export async function archiveLocationAction(
  businessId: string,
  businessSlug: string,
  locationId: string,
  _previousState: FormState,
  _formData: FormData,
): Promise<FormState> {
  void _previousState;
  void _formData;

  const supabase = await createServerActionSupabaseClient();
  const business = await requireActionBusiness(supabase, businessId);

  if (!(await hasBusinessPermission(supabase, business.id, "locations.manage", locationId))) {
    return mapMutationError({ code: "42501" }, "location-archive");
  }

  const { error } = await supabase
    .schema("core")
    .rpc("archive_location", {
      target_business_id: business.id,
      target_location_id: locationId,
    })
    .single();

  if (error) {
    return mapMutationError(error, "location-archive");
  }

  revalidatePath(businessSectionPath(businessSlug, "locations"));
  revalidatePath(businessLocationPath(businessSlug, locationId));
  redirect(`${businessLocationPath(businessSlug, locationId)}?archived=1`);
}
