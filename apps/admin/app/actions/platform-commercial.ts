"use server";

import { revalidatePath } from "next/cache";

import { resolveCurrentUser } from "../../lib/auth";
import { platformBusinessPath } from "../../lib/platform-model";
import { createServerActionSupabaseClient } from "../../lib/supabase/server";
import type { PlatformMutationState } from "./platform";

export async function updatePlatformCommercialAction(
  _previousState: PlatformMutationState,
  formData: FormData,
): Promise<PlatformMutationState> {
  const businessId = readUuid(formData.get("businessId"));
  const operation = formData.get("operation");
  if (!businessId || typeof operation !== "string") return invalid();

  const supabase = await createServerActionSupabaseClient();
  if (!(await resolveCurrentUser(supabase))) {
    return { message: "Your session has expired. Sign in and try again.", status: "error" };
  }
  const { data: allowed } = await supabase.schema("core").rpc("current_user_is_super_admin");
  if (allowed !== true)
    return { message: "Platform administrator access is required.", status: "error" };

  let error: { code?: string } | null = null;
  if (operation === "plan") {
    const planKey = readPlanKey(formData.get("planKey"));
    if (!planKey) return invalid();
    ({ error } = await supabase.schema("core").rpc("set_platform_business_plan", {
      requested_plan_key: planKey,
      target_business_id: businessId,
    }));
  } else if (operation === "override") {
    const moduleKey = readModuleKey(formData.get("moduleKey"));
    const decision = formData.get("decision");
    const reason = formData.get("reason");
    if (
      !moduleKey ||
      !["", "grant", "deny"].includes(String(decision)) ||
      typeof reason !== "string"
    )
      return invalid();
    ({ error } = await supabase.schema("core").rpc("set_platform_module_entitlement_override", {
      requested_decision: String(decision),
      requested_reason: reason,
      target_business_id: businessId,
      target_module_key: moduleKey,
    }));
  } else if (operation === "setup") {
    const status = formData.get("status");
    if (!["accepted", "in_progress", "completed", "cancelled"].includes(String(status)))
      return invalid();
    ({ error } = await supabase.schema("core").rpc("set_platform_initial_setup_status", {
      requested_status: String(status),
      target_business_id: businessId,
    }));
  } else return invalid();

  if (error) {
    return {
      message:
        error.code === "42501"
          ? "Platform administrator access is required."
          : "The commercial access change was rejected. Review the requested transition and try again.",
      status: "error",
    };
  }
  revalidatePath(platformBusinessPath(businessId));
  return { message: "Commercial access updated.", status: "success" };
}

function invalid(): PlatformMutationState {
  return { message: "The requested commercial access change is invalid.", status: "error" };
}

function readUuid(value: FormDataEntryValue | null): string | null {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null;
}

function readPlanKey(value: FormDataEntryValue | null): string | null {
  return typeof value === "string" && /^[a-z][a-z0-9-]*$/.test(value) ? value : null;
}

function readModuleKey(value: FormDataEntryValue | null): string | null {
  return typeof value === "string" && /^[a-z][a-z0-9_]*$/.test(value) ? value : null;
}
