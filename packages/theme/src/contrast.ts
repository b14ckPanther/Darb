import type { ThemeColorKey, ThemeContrastIssue, ThemeTokens } from "./types";

export function contrastRatio(foreground: string, background: string): number {
  const light = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const dark = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (light + 0.05) / (dark + 0.05);
}

export function getThemeContrastIssues(theme: ThemeTokens): ThemeContrastIssue[] {
  const pairs: Array<{
    background: ThemeColorKey;
    foreground: ThemeColorKey;
    level: "error" | "warning";
    minimumRatio: number;
  }> = [
    { background: "page", foreground: "textPrimary", level: "error", minimumRatio: 4.5 },
    { background: "surface", foreground: "textPrimary", level: "error", minimumRatio: 4.5 },
    { background: "primary", foreground: "onPrimary", level: "error", minimumRatio: 4.5 },
    { background: "page", foreground: "textSecondary", level: "warning", minimumRatio: 4.5 },
    { background: "page", foreground: "accent", level: "warning", minimumRatio: 3 },
    { background: "page", foreground: "border", level: "warning", minimumRatio: 3 },
  ];

  return pairs.flatMap((pair) => {
    const actualRatio = contrastRatio(theme.colors[pair.foreground], theme.colors[pair.background]);
    return actualRatio < pair.minimumRatio ? [{ ...pair, actualRatio }] : [];
  });
}

function relativeLuminance(hex: string): number {
  const channels = [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16) / 255);
  const [red = 0, green = 0, blue = 0] = channels.map((channel) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}
