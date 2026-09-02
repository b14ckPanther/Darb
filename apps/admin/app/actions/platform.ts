"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { resolveCurrentUser } from "../../lib/auth";
import { platformBusinessPath, platformPaths } from "../../lib/platform-model";
import { createServerActionSupabaseClient } from "../../lib/supabase/server";

export interface PlatformMutationState {
  message: string;
  status: "error" | "idle" | "success";
}

export async function setPlatformBusinessStatusAction(
  _previousState: PlatformMutationState,
  formData: FormData,
): Promise<PlatformMutationState> {
  const businessId = readUuid(formData.get("businessId"));
  const status = readStatus(formData.get("status"));
  if (!businessId || !status) {
    return { message: "The requested lifecycle change is invalid.", status: "error" };
  }

  const supabase = await createServerActionSupabaseClient();
  const user = await resolveCurrentUser(supabase);
  if (!user)
    return { message: "Your session has expired. Sign in and try again.", status: "error" };

  const { data: isSuperAdmin, error: accessError } = await supabase
    .schema("core")
    .rpc("current_user_is_super_admin");
  if (accessError || isSuperAdmin !== true) {
    return { message: "Platform administrator access is required.", status: "error" };
  }

  const { error } = await supabase.schema("core").rpc("set_platform_business_status", {
    requested_status: status,
    target_business_id: businessId,
  });
  if (error) return mapPlatformMutationError(error.code);

  revalidatePath(platformPaths.home);
  revalidatePath(platformPaths.businesses);
  revalidatePath(platformBusinessPath(businessId));
  revalidatePath("/");
  redirect(`${platformBusinessPath(businessId)}?updated=${status}`);
}

function readUuid(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null;
}

function readStatus(value: FormDataEntryValue | null): "active" | "archived" | "suspended" | null {
  return value === "active" || value === "archived" || value === "suspended" ? value : null;
}

function mapPlatformMutationError(code: string): PlatformMutationState {
  if (code === "42501") {
    return { message: "Platform administrator access is required.", status: "error" };
  }
  if (code === "P0002") {
    return { message: "This business is no longer available.", status: "error" };
  }
  if (code === "55000" || code === "22023") {
    return {
      message: "That lifecycle transition is not valid from the business’s current state.",
      status: "error",
    };
  }
  return {
    message: "The business lifecycle could not be changed. No state was partially applied.",
    status: "error",
  };
}
