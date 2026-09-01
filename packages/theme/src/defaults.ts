import type { ThemeTokens } from "./types";

/**
 * Renderer emergency fallback only. Platform template defaults remain database-owned.
 */
export const safeFallbackTheme: Readonly<ThemeTokens> = {
  colors: {
    accent: "#B98232",
    border: "#D6D8D2",
    danger: "#A33D3D",
    elevated: "#FFFFFF",
    onPrimary: "#FFFFFF",
    page: "#F5F1E8",
    primary: "#154734",
    success: "#1C7251",
    surface: "#FFFDF8",
    textMuted: "#677970",
    textPrimary: "#14251E",
    textSecondary: "#475A51",
    warning: "#80520F",
  },
  density: "comfortable",
  layout: {
    cardImageRatio: "landscape",
    contentWidth: "balanced",
    heroTreatment: "split",
    sectionSpacing: "comfortable",
  },
  motion: "subtle",
  shadow: "subtle",
  shape: { border: "hairline", radius: "rounded" },
  typography: {
    bodyWeight: 400,
    headingWeight: 700,
    lineHeight: "comfortable",
    scale: "balanced",
    tracking: "normal",
  },
};
