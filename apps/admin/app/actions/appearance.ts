"use server";

import type { Json } from "@darb/database/types";

import { requireActionBusiness } from "../../lib/action-context";
import { listAppearanceTemplates } from "../../lib/appearance";
import { parseAppearanceInput, parseAppearanceResetInput } from "../../lib/appearance-form";
import { hasBusinessPermission } from "../../lib/auth";
import type { FormState } from "../../lib/forms";
import { listBusinessModuleStates } from "../../lib/modules";
import { mapMutationError } from "../../lib/mutation-errors";
import { createServerActionSupabaseClient } from "../../lib/supabase/server";

export async function saveBusinessAppearanceAction(
  businessId: string,
  formData: FormData,
): Promise<FormState> {
  const supabase = await createServerActionSupabaseClient();
  const business = await requireActionBusiness(supabase, businessId);

  if (business.status !== "active")
    return mapMutationError({ message: "BUSINESS_APPEARANCE_INACTIVE" }, "appearance");
  if (!(await hasBusinessPermission(supabase, business.id, "appearance.manage"))) {
    return mapMutationError({ code: "42501" }, "appearance");
  }

  const templates = await listAppearanceTemplates(supabase);
  const requestedTemplateKey = formData.get("templateKey");
  const template = templates.find((candidate) => candidate.key === requestedTemplateKey);
  if (!template || !template.isAvailable)
    return mapMutationError({ message: "TEMPLATE_UNAVAILABLE" }, "appearance");

  const parsed = parseAppearanceInput(formData, template.defaultTheme);
  if (!parsed.success) {
    return {
      fieldErrors: parsed.errors,
      message:
        parsed.message ??
        "Some appearance values were not accepted. Review the controls and try again.",
      status: "error",
    };
  }
  if (template.moduleKey !== parsed.data.moduleKey)
    return mapMutationError({ message: "TEMPLATE_NOT_FOUND" }, "appearance");

  const modules = await listBusinessModuleStates(supabase, business.id, business.status);
  if (
    !modules.some((module) => module.key === parsed.data.moduleKey && module.isEffectivelyEnabled)
  ) {
    return mapMutationError({ message: "MODULE_NOT_ENABLED" }, "appearance");
  }

  const { data, error } = await supabase
    .schema("core")
    .rpc("set_business_appearance", {
      requested_theme_overrides: parsed.data.overrides as unknown as Json,
      target_business_id: business.id,
      target_module_key: parsed.data.moduleKey,
      target_template_key: parsed.data.templateKey,
    })
    .single();
  if (error || !data) return mapMutationError(error ?? {}, "appearance");

  // Keep the mutation response separate from the subsequent route refresh. In-action path
  // revalidation couples this result to a second Appearance RSC tree in one Flight response.
  return {
    message: data.changed
      ? "Appearance saved and ready for future rendering."
      : "Appearance was already up to date.",
    status: "success",
  };
}

export async function resetBusinessThemeAction(
  businessId: string,
  formData: FormData,
): Promise<FormState> {
  const moduleKey = parseAppearanceResetInput(formData);
  if (!moduleKey) return { message: "Choose a valid appearance context.", status: "error" };
  const supabase = await createServerActionSupabaseClient();
  const business = await requireActionBusiness(supabase, businessId);
  if (business.status !== "active")
    return mapMutationError({ message: "BUSINESS_APPEARANCE_INACTIVE" }, "appearance");
  if (!(await hasBusinessPermission(supabase, business.id, "appearance.manage"))) {
    return mapMutationError({ code: "42501" }, "appearance");
  }
  const modules = await listBusinessModuleStates(supabase, business.id, business.status);
  if (!modules.some((module) => module.key === moduleKey && module.isEffectivelyEnabled)) {
    return mapMutationError({ message: "MODULE_NOT_ENABLED" }, "appearance");
  }
  const { data, error } = await supabase
    .schema("core")
    .rpc("reset_business_theme_overrides", {
      target_business_id: business.id,
      target_module_key: moduleKey,
    })
    .single();
  if (error || !data) return mapMutationError(error ?? {}, "appearance");
  // The client refreshes only after it has committed this result and released pending UI.
  return {
    message: data.changed
      ? "Theme overrides reset to the template defaults."
      : "Theme was already using its defaults.",
    status: "success",
  };
}
