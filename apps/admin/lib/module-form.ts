const moduleKeyPattern = /^[a-z][a-z0-9_]*$/;

export type ModuleMutationInput =
  | { data: { enabled: boolean; moduleKey: string }; success: true }
  | { message: string; success: false };

export function parseModuleMutationInput(formData: FormData): ModuleMutationInput {
  const moduleKeyValue = formData.get("moduleKey");
  const enabledValue = formData.get("enabled");
  const moduleKey = typeof moduleKeyValue === "string" ? moduleKeyValue.trim() : "";

  if (!moduleKeyPattern.test(moduleKey) || moduleKey.length > 64) {
    return { message: "That capability is not available.", success: false };
  }

  if (enabledValue !== "true" && enabledValue !== "false") {
    return { message: "Choose a valid capability state.", success: false };
  }

  return {
    data: { enabled: enabledValue === "true", moduleKey },
    success: true,
  };
}
