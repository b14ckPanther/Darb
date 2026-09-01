import "server-only";

import type { DarbServerSupabaseClient } from "@darb/database/server";
import type { Database } from "@darb/database/types";
import {
  isThemeOverrides,
  isThemeTokens,
  resolveTemplateSelection,
  resolveTheme,
  safeFallbackTheme,
  type ThemeOverrides,
  type ThemeTemplateCandidate,
  type ThemeTokens,
} from "@darb/theme";

import type { BusinessModuleState } from "./module-state";

type TemplateRow = Pick<
  Database["core"]["Tables"]["templates"]["Row"],
  | "default_theme"
  | "description"
  | "display_name"
  | "is_available"
  | "is_default"
  | "key"
  | "module_key"
  | "sort_order"
  | "template_version"
  | "theme_schema_version"
>;

export interface AppearanceTemplate extends ThemeTemplateCandidate {
  description: string;
  displayName: string;
  sortOrder: number;
  templateVersion: number;
  themeSchemaVersion: number;
}

export interface ResolvedBusinessAppearance {
  fallbackReason: "selected_unavailable" | "selected_unknown" | null;
  moduleDisplayName: string;
  moduleKey: string;
  overrides: ThemeOverrides;
  resolvedTheme: ThemeTokens;
  selectedTemplateKey: string | null;
  template: AppearanceTemplate;
  templates: AppearanceTemplate[];
}

export async function listAppearanceTemplates(
  supabase: DarbServerSupabaseClient,
): Promise<AppearanceTemplate[]> {
  const { data, error } = await supabase
    .schema("core")
    .from("templates")
    .select(
      "key, module_key, display_name, description, is_available, is_default, sort_order, template_version, theme_schema_version, default_theme",
    )
    .order("sort_order", { ascending: true })
    .order("key", { ascending: true });

  if (error) throw new Error(`Unable to resolve templates (${error.code}).`);
  return data.map(mapTemplateRow).filter((template): template is AppearanceTemplate => !!template);
}

export async function listResolvedBusinessAppearances(
  supabase: DarbServerSupabaseClient,
  businessId: string,
  modules: BusinessModuleState[],
): Promise<ResolvedBusinessAppearance[]> {
  const [templates, settingsResult] = await Promise.all([
    listAppearanceTemplates(supabase),
    supabase
      .schema("core")
      .from("business_visual_settings")
      .select("module_key, template_key, theme_overrides")
      .eq("business_id", businessId),
  ]);

  if (settingsResult.error) {
    throw new Error(`Unable to resolve business appearance (${settingsResult.error.code}).`);
  }

  const settingsByModule = new Map(settingsResult.data.map((row) => [row.module_key, row]));

  return modules.flatMap((module) => {
    if (!module.isEffectivelyEnabled) return [];
    const moduleTemplates = templates.filter((template) => template.moduleKey === module.key);
    if (moduleTemplates.length === 0) return [];

    const settings = settingsByModule.get(module.key);
    const overrides = settings?.theme_overrides;
    const safeOverrides: ThemeOverrides = isThemeOverrides(overrides) ? overrides : {};
    const selection = resolveTemplateSelection(moduleTemplates, settings?.template_key ?? null);
    if (!selection.template) return [];
    const selected = moduleTemplates.find((template) => template.key === selection.template?.key);
    if (!selected) return [];

    return [
      {
        fallbackReason: selection.fallbackReason,
        moduleDisplayName: module.displayName,
        moduleKey: module.key,
        overrides: safeOverrides,
        resolvedTheme: resolveTheme(selected.defaultTheme, safeOverrides),
        selectedTemplateKey: settings?.template_key ?? null,
        template: selected,
        templates: moduleTemplates,
      },
    ];
  });
}

function mapTemplateRow(row: TemplateRow): AppearanceTemplate | null {
  if (!isThemeTokens(row.default_theme)) return null;
  return {
    defaultTheme: row.default_theme,
    description: row.description,
    displayName: row.display_name,
    isAvailable: row.is_available,
    isDefault: row.is_default,
    key: row.key,
    moduleKey: row.module_key,
    sortOrder: row.sort_order,
    templateVersion: row.template_version,
    themeSchemaVersion: row.theme_schema_version,
  };
}

export function resolveEmergencyAppearanceTheme(value: unknown): ThemeTokens {
  return isThemeTokens(value) ? value : safeFallbackTheme;
}
