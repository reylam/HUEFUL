import {
  colorHarmony,
  harmonyReason,
  hexToRgb,
  hslToRgb,
  nameColor,
  rgbToHex,
  rgbToHsl,
} from "@/shared/color-engine";
import type { HarmonyScheme, NamedColor, RgbColor } from "@/shared/color-engine";

/*
  The logic behind the dashboard's Color Studio: the interactive hero where a
  user explores a color and the app answers with related colors, each named in
  plain language. All the color math lives in the shared color-engine; this
  module just composes it into the shapes the playground renders, so the
  component stays about interaction and this stays testable and framework-free.

  Never color alone is baked in here: a related color is never returned as a
  bare swatch, it always carries its name and a short reason it belongs, so the
  UI can explain the relationship in words.
*/

export const SCHEMES: { id: HarmonyScheme; label: string }[] = [
  { id: "complementary", label: "Opposite" },
  { id: "analogous", label: "Neighbors" },
  { id: "monochromatic", label: "Shades" },
];

export interface StudioColor extends NamedColor {
  /** True for the color the user is exploring, false for its partners. */
  isBase: boolean;
}

export interface StudioResult {
  base: StudioColor;
  partners: StudioColor[];
  /** One plain sentence on why this scheme's colors work together. */
  reason: string;
}

function toStudioColor(rgb: RgbColor, isBase: boolean): StudioColor {
  return { ...nameColor(rgb), isBase };
}

/*
  Build the studio result for a hex + scheme. The engine returns the base plus
  its partners (order varies by scheme, e.g. analogous puts the base in the
  middle), so we tag whichever entry equals the base and treat the rest as
  partners rather than assuming a position.
*/
export function studioFromHex(
  hex: string,
  scheme: HarmonyScheme,
): StudioResult | null {
  const baseRgb = hexToRgb(hex);
  if (!baseRgb) return null;

  const baseHex = rgbToHex(baseRgb).toLowerCase();
  const palette = colorHarmony(baseRgb, scheme);

  let base: StudioColor | null = null;
  const partners: StudioColor[] = [];
  for (const rgb of palette) {
    const isBase = rgbToHex(rgb).toLowerCase() === baseHex;
    const color = toStudioColor(rgb, isBase);
    if (isBase && !base) base = color;
    else partners.push(color);
  }

  // Fallback in the rare case rounding means no entry matched the base exactly.
  if (!base) base = toStudioColor(baseRgb, true);

  return { base, partners, reason: harmonyReason(scheme) };
}

/*
  A pleasant, saturated starting color chosen at random by spinning the hue
  wheel and keeping saturation and lightness in a lively-but-legible band. Used
  by the Shuffle control so exploration always lands somewhere worth naming,
  never on a muddy near-gray.
*/
export function randomVividHex(): string {
  const h = Math.floor(Math.random() * 360);
  const s = 62 + Math.floor(Math.random() * 26); // 62-88
  const l = 45 + Math.floor(Math.random() * 20); // 45-65
  return rgbToHex(hslToRgb({ h, s, l }));
}

/*
  Nudge the current color's hue around the wheel, keeping its saturation and
  lightness. This powers dragging along the hue track: the user moves through
  related hues and every stop is a real, nameable color.
*/
export function hexAtHue(hex: string, hue: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const { s, l } = rgbToHsl(rgb);
  return rgbToHex(hslToRgb({ h: ((hue % 360) + 360) % 360, s, l }));
}

/** The current color's hue, for positioning the hue-track handle. */
export function hueOfHex(hex: string): number {
  const rgb = hexToRgb(hex);
  return rgb ? rgbToHsl(rgb).h : 0;
}
