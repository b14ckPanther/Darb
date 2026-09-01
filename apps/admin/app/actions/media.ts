"use server";

import { revalidatePath } from "next/cache";

import { requireActionBusiness } from "../../lib/action-context";
import { hasBusinessPermission } from "../../lib/auth";
import type { FormState } from "../../lib/forms";
import { mapMutationError } from "../../lib/mutation-errors";
import {
  parseMediaAltText,
  parseMediaUploadRequest,
  type MediaUploadRequest,
} from "../../lib/phase6-forms";
import { buildMediaStoragePath } from "../../lib/media-validation";
import { businessSectionPath } from "../../lib/navigation";
import { createServerActionSupabaseClient } from "../../lib/supabase/server";

export interface MediaReservationResult {
  assetId?: string;
  fieldErrors?: Readonly<Record<string, string | undefined>>;
  message?: string;
  mimeType?: string;
  status: "error" | "success";
  storageBucket?: string;
  storagePath?: string;
}

export async function registerMediaUploadAction(
  businessId: string,
  request: MediaUploadRequest,
): Promise<MediaReservationResult> {
  const parsed = parseMediaUploadRequest(request);

  if (!parsed.success) {
    return { fieldErrors: parsed.errors, status: "error" };
  }

  const supabase = await createServerActionSupabaseClient();
  const business = await requireActionBusiness(supabase, businessId);

  if (business.status !== "active") {
    return {
      message: "Media cannot be uploaded while this business is not active.",
      status: "error",
    };
  }

  if (!(await hasBusinessPermission(supabase, business.id, "media.manage"))) {
    return mapMediaError(mapMutationError({ code: "42501" }, "media"));
  }

  const { data, error } = await supabase
    .schema("core")
    .rpc("register_media_asset", {
      ...(parsed.data.durationMs === null ? {} : { requested_duration_ms: parsed.data.durationMs }),
      ...(parsed.data.height === null ? {} : { requested_height: parsed.data.height }),
      ...(parsed.data.width === null ? {} : { requested_width: parsed.data.width }),
      requested_alt_text: parsed.data.altText,
      requested_byte_size: parsed.data.byteSize,
      requested_media_kind: parsed.data.kind,
      requested_mime_type: parsed.data.mimeType,
      requested_original_filename: parsed.data.filename,
      target_business_id: business.id,
    })
    .single();

  if (error || !data) {
    return mapMediaError(mapMutationError(error ?? {}, "media"));
  }

  const expectedPath = buildMediaStoragePath(business.id, data.id, parsed.data.mimeType);

  if (data.storage_path !== expectedPath) {
    return { message: "The upload path could not be verified.", status: "error" };
  }

  return {
    assetId: data.id,
    mimeType: data.mime_type,
    status: "success",
    storageBucket: data.storage_bucket,
    storagePath: data.storage_path,
  };
}

export async function completeMediaUploadAction(
  businessId: string,
  businessSlug: string,
  assetId: string,
): Promise<FormState> {
  const supabase = await createServerActionSupabaseClient();
  const business = await requireActionBusiness(supabase, businessId);

  if (!(await hasBusinessPermission(supabase, business.id, "media.manage"))) {
    return mapMutationError({ code: "42501" }, "media");
  }

  const { error } = await supabase
    .schema("core")
    .rpc("complete_media_asset", {
      target_business_id: business.id,
      target_media_asset_id: assetId,
    })
    .single();

  if (error) {
    return mapMutationError(error, "media");
  }

  revalidatePath(businessSectionPath(businessSlug, "media"));
  return { message: "Media uploaded securely.", status: "success" };
}

export async function updateMediaAltTextAction(
  businessId: string,
  businessSlug: string,
  assetId: string,
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseMediaAltText(formData);

  if (!parsed.success) {
    return { fieldErrors: parsed.errors, status: "error" };
  }

  const supabase = await createServerActionSupabaseClient();
  const business = await requireActionBusiness(supabase, businessId);

  if (!(await hasBusinessPermission(supabase, business.id, "media.manage"))) {
    return mapMutationError({ code: "42501" }, "media");
  }

  const { error } = await supabase
    .schema("core")
    .rpc("update_media_asset_alt_text", {
      requested_alt_text: parsed.data.altText,
      target_business_id: business.id,
      target_media_asset_id: assetId,
    })
    .single();

  if (error) {
    return mapMutationError(error, "media");
  }

  revalidatePath(businessSectionPath(businessSlug, "media"));
  return { message: "Alternative text saved.", status: "success" };
}

export async function archiveMediaAssetAction(
  businessId: string,
  businessSlug: string,
  assetId: string,
  _previousState: FormState,
  _formData: FormData,
): Promise<FormState> {
  void _previousState;
  void _formData;

  const supabase = await createServerActionSupabaseClient();
  const business = await requireActionBusiness(supabase, businessId);

  if (!(await hasBusinessPermission(supabase, business.id, "media.manage"))) {
    return mapMutationError({ code: "42501" }, "media");
  }

  const { error } = await supabase
    .schema("core")
    .rpc("archive_media_asset", {
      target_business_id: business.id,
      target_media_asset_id: assetId,
    })
    .single();

  if (error) {
    return mapMutationError(error, "media");
  }

  revalidatePath(businessSectionPath(businessSlug, "media"));
  return {
    message: "Media archived. The stored object is retained for controlled cleanup.",
    status: "success",
  };
}

function mapMediaError(state: FormState): MediaReservationResult {
  return {
    ...(state.fieldErrors ? { fieldErrors: state.fieldErrors } : {}),
    ...(state.message ? { message: state.message } : {}),
    status: "error",
  };
}
