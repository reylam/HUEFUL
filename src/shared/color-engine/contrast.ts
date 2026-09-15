import type { RgbColor } from "./types";
import { relativeLuminance } from "./convert";

/** WCAG contrast ratio between two colors, 1:1 to 21:1. */
export function contrastRatio(a: RgbColor, b: RgbColor): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Whether a foreground/background pair meets WCAG 2 minimums.
 * Body text needs 4.5:1; large text (>=18pt / 14pt bold) and UI needs 3:1.
 */
export function meetsContrast(
  foreground: RgbColor,
  background: RgbColor,
  level: "body" | "large" = "body",
): boolean {
  const ratio = contrastRatio(foreground, background);
  return ratio >= (level === "body" ? 4.5 : 3);
}
