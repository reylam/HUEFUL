import type { RgbColor } from "./types";
import { rgbToHsl, hslToRgb } from "./convert";

/*
  Color harmony from a base color, computed with our own HSL math (no external
  color library). Three classic schemes:
  - complementary: the base plus the hue on the opposite side of the wheel.
  - analogous: the base plus its two neighbors on the wheel.
  - monochromatic: the base hue at a few different lightness levels.

  Each scheme returns the base first (or in its natural position), then its
  partners, as RGB. Callers name each color with nameColor so the UI can explain
  the pairing in words, never swatches alone.
*/

export type HarmonyScheme = "complementary" | "analogous" | "monochromatic";

const rotate = (h: number, by: number): number => (((h + by) % 360) + 360) % 360;
const clampL = (l: number): number => Math.min(92, Math.max(12, l));

export function colorHarmony(base: RgbColor, scheme: HarmonyScheme): RgbColor[] {
  const { h, s, l } = rgbToHsl(base);

  switch (scheme) {
    case "complementary":
      return [base, hslToRgb({ h: rotate(h, 180), s, l })];

    case "analogous":
      return [
        hslToRgb({ h: rotate(h, -30), s, l }),
        base,
        hslToRgb({ h: rotate(h, 30), s, l }),
      ];

    case "monochromatic":
      return [
        hslToRgb({ h, s, l: clampL(l - 28) }),
        base,
        hslToRgb({ h, s, l: clampL(l + 24) }),
      ];
  }
}

/** A short, plain reason a scheme works, for the UI. */
export function harmonyReason(scheme: HarmonyScheme): string {
  switch (scheme) {
    case "complementary":
      return "Opposite hues on the color wheel, so they contrast strongly and make each other pop.";
    case "analogous":
      return "Neighboring hues, so they blend calmly and feel coordinated.";
    case "monochromatic":
      return "One hue at different lightness levels, so it reads as a clean, tonal look.";
  }
}
