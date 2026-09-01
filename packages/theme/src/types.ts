export const themeColorKeys = [
  "page",
  "surface",
  "elevated",
  "primary",
  "onPrimary",
  "accent",
  "textPrimary",
  "textSecondary",
  "textMuted",
  "border",
  "success",
  "warning",
  "danger",
] as const;

export type ThemeColorKey = (typeof themeColorKeys)[number];
export type ThemeColorTokens = Record<ThemeColorKey, string>;

export interface ThemeTypographyTokens {
  bodyWeight: 400 | 500;
  headingWeight: 600 | 700 | 800;
  lineHeight: "snug" | "comfortable" | "airy";
  scale: "compact" | "balanced" | "generous";
  tracking: "tight" | "normal" | "open";
}

export interface ThemeShapeTokens {
  border: "none" | "hairline" | "defined";
  radius: "soft" | "rounded" | "bold";
}

export interface ThemeLayoutTokens {
  cardImageRatio: "square" | "landscape" | "portrait";
  contentWidth: "focused" | "balanced" | "wide";
  heroTreatment: "minimal" | "split" | "immersive";
  sectionSpacing: "compact" | "comfortable" | "spacious";
}

export interface ThemeTokens {
  colors: ThemeColorTokens;
  density: "compact" | "comfortable" | "spacious";
  layout: ThemeLayoutTokens;
  motion: "reduced" | "subtle" | "expressive";
  shadow: "none" | "subtle" | "medium" | "strong";
  shape: ThemeShapeTokens;
  typography: ThemeTypographyTokens;
}

export interface ThemeOverrides {
  colors?: Partial<ThemeColorTokens>;
  density?: ThemeTokens["density"];
  layout?: Partial<ThemeLayoutTokens>;
  motion?: ThemeTokens["motion"];
  shadow?: ThemeTokens["shadow"];
  shape?: Partial<ThemeShapeTokens>;
  typography?: Partial<ThemeTypographyTokens>;
}

export interface ThemeValidationIssue {
  code: "invalid_color" | "invalid_type" | "invalid_value" | "missing_value" | "unknown_key";
  path: string;
}

export interface ThemeValidationResult {
  issues: ThemeValidationIssue[];
  valid: boolean;
}

export interface ThemeContrastIssue {
  actualRatio: number;
  foreground: ThemeColorKey;
  background: ThemeColorKey;
  level: "error" | "warning";
  minimumRatio: number;
}

export type DarbThemeLocale = "ar" | "he" | "en";

export interface ThemeTemplateCandidate {
  defaultTheme: ThemeTokens;
  isAvailable: boolean;
  isDefault: boolean;
  key: string;
  moduleKey: string;
}

export interface ResolvedTemplateSelection {
  fallbackReason: "selected_unavailable" | "selected_unknown" | null;
  template: ThemeTemplateCandidate | null;
}
