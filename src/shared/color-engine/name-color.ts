import type { NamedColor, RgbColor } from "./types";
import { rgbToHex } from "./convert";

/*
  Turn a measured color into human language. We match against a curated set of
  named references (not exact hex math) and describe with brightness words too,
  since luminance reads regardless of color vision deficiency.
*/

interface ColorReference {
  name: string;
  rgb: RgbColor;
}

// A small, human-friendly reference set. Kept intentionally short; grows as the
// naming lens matures. Order does not matter; nearest match wins.
const REFERENCES: ColorReference[] = [
  { name: "Black", rgb: { r: 20, g: 20, b: 20 } },
  { name: "White", rgb: { r: 245, g: 245, b: 245 } },
  { name: "Gray", rgb: { r: 128, g: 128, b: 128 } },
  { name: "Red", rgb: { r: 200, g: 40, b: 40 } },
  { name: "Dark red", rgb: { r: 120, g: 25, b: 25 } },
  { name: "Orange", rgb: { r: 230, g: 130, b: 30 } },
  { name: "Brown", rgb: { r: 130, g: 80, b: 40 } },
  { name: "Dark brown", rgb: { r: 80, g: 50, b: 25 } },
  { name: "Yellow", rgb: { r: 235, g: 210, b: 50 } },
  { name: "Green", rgb: { r: 60, g: 160, b: 70 } },
  { name: "Dark green", rgb: { r: 35, g: 90, b: 45 } },
  { name: "Teal", rgb: { r: 40, g: 160, b: 160 } },
  { name: "Blue", rgb: { r: 45, g: 90, b: 200 } },
  { name: "Navy", rgb: { r: 25, g: 40, b: 100 } },
  { name: "Purple", rgb: { r: 130, g: 60, b: 170 } },
  { name: "Pink", rgb: { r: 230, g: 130, b: 170 } },
];

function distance(a: RgbColor, b: RgbColor): number {
  // Weighted euclidean; green weighted higher to track human sensitivity.
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return Math.sqrt(2 * dr * dr + 4 * dg * dg + 3 * db * db);
}

function brightnessWord(rgb: RgbColor): string {
  const perceived = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  if (perceived < 60) return "very dark";
  if (perceived < 110) return "dark";
  if (perceived < 170) return "medium";
  if (perceived < 215) return "bright";
  return "very bright";
}

function saturationWord(rgb: RgbColor): string {
  const max = Math.max(rgb.r, rgb.g, rgb.b);
  const min = Math.min(rgb.r, rgb.g, rgb.b);
  const spread = max - min;
  if (spread < 25) return "almost gray";
  if (spread < 80) return "muted";
  return "vivid";
}

/** The furthest two references can sit apart, used to normalize confidence. */
const MAX_DISTANCE = distance({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 });

export function nameColor(rgb: RgbColor): NamedColor {
  let best = REFERENCES[0];
  let bestDistance = Infinity;
  for (const ref of REFERENCES) {
    const d = distance(rgb, ref.rgb);
    if (d < bestDistance) {
      bestDistance = d;
      best = ref;
    }
  }

  const confidence = Math.max(0, 1 - bestDistance / (MAX_DISTANCE * 0.5));
  const description = `${brightnessWord(rgb)}, ${saturationWord(rgb)}`;

  return {
    rgb,
    hex: rgbToHex(rgb),
    name: best.name,
    description,
    confidence: Number(confidence.toFixed(2)),
  };
}
