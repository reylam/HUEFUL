import { Apple, Banana, Cherry, Citrus, Grape, Leaf, Vegan } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { rgbToHsl } from "@/shared/color-engine";
import type { RgbColor } from "@/shared/color-engine";

/*
  HueRipe reference model. For each supported fruit we describe how its skin
  color maps to ripeness using hue (and, where it matters, lightness), then
  match a sampled color to the nearest stage. This is a deliberately simple,
  color-only heuristic tuned per fruit, not a food-science measurement, which is
  why the UI always shows a disclaimer and pairs the result with words + an icon,
  never color alone.

  Fruits COCO-SSD can locate on-device are marked detectable; the rest are
  chosen by the user and sampled from the center of the frame. Both paths run
  the same per-fruit rules below.
*/

export type FruitId =
  | "banana"
  | "apple"
  | "orange"
  | "tomato"
  | "mango"
  | "avocado"
  | "strawberry";
export type Stage = "unripe" | "ripe" | "overripe";

export interface FruitInfo {
  id: FruitId;
  label: string;
  /** A lucide icon for the fruit, used as a decorative cue beside its label. */
  Icon: LucideIcon;
  /** A short cue for how to frame the shot. */
  hint: string;
  /** True when COCO-SSD knows this class and can auto-locate it. */
  detectable: boolean;
}

export const FRUITS: FruitInfo[] = [
  {
    id: "banana",
    label: "Banana",
    Icon: Banana,
    hint: "Fill the frame with the peel.",
    detectable: true,
  },
  {
    id: "apple",
    label: "Apple",
    Icon: Apple,
    hint: "Show the skin, avoid glare.",
    detectable: true,
  },
  {
    id: "orange",
    label: "Orange",
    Icon: Citrus,
    hint: "Show the peel, not the stem.",
    detectable: true,
  },
  {
    id: "tomato",
    label: "Tomato",
    Icon: Cherry,
    hint: "Center the tomato's skin.",
    detectable: false,
  },
  {
    id: "mango",
    label: "Mango",
    Icon: Leaf,
    hint: "Show the skin, not the stem.",
    detectable: false,
  },
  {
    id: "avocado",
    label: "Avocado",
    Icon: Vegan,
    hint: "Show the skin in even light.",
    detectable: false,
  },
  {
    id: "strawberry",
    label: "Strawberry",
    Icon: Grape,
    hint: "Fill the frame with the berry.",
    detectable: false,
  },
];

interface StageMatch {
  stage: Stage;
  /** Plain-language color the fruit reads as at this stage. */
  colorWord: string;
  /** Why this stage, in one line. */
  note: string;
}

/*
  Per-fruit rules. Each rule takes the sampled HSL and returns a stage match if
  it applies. Rules are tried in order; the first match wins, with a sensible
  fallback so we never return nothing.
*/
type Rule = (hsl: { h: number; s: number; l: number }) => StageMatch | null;

const green = (c: { h: number }) => c.h >= 70 && c.h <= 165;

const RULES: Record<FruitId, Rule[]> = {
  banana: [
    (c) =>
      green(c)
        ? { stage: "unripe", colorWord: "green", note: "A green peel means it still needs time." }
        : null,
    (c) =>
      c.h >= 40 && c.h < 70 && c.l > 35
        ? { stage: "ripe", colorWord: "yellow", note: "An even yellow peel is the sweet spot." }
        : null,
    (c) =>
      c.l < 35 || c.h < 40
        ? { stage: "overripe", colorWord: "brown-spotted", note: "Browning peel is very ripe, best for baking." }
        : null,
  ],
  apple: [
    (c) =>
      green(c)
        ? { stage: "unripe", colorWord: "green", note: "Fully green can mean tart, or simply a green variety." }
        : null,
    (c) =>
      c.h <= 20 || c.h >= 340
        ? { stage: "ripe", colorWord: "red", note: "Deep, even red usually reads ripe and sweet." }
        : null,
    (c) =>
      c.l < 30
        ? { stage: "overripe", colorWord: "dull, dark", note: "Dull, darkening skin can mean it is past its best." }
        : null,
  ],
  orange: [
    (c) =>
      green(c)
        ? { stage: "unripe", colorWord: "green-tinged", note: "Green patches can mean it needs longer." }
        : null,
    (c) =>
      c.h >= 18 && c.h <= 45
        ? { stage: "ripe", colorWord: "orange", note: "An even orange peel usually reads ripe." }
        : null,
    (c) =>
      c.l < 30 || c.h < 18
        ? { stage: "overripe", colorWord: "dark orange", note: "Very dark, dull skin can mean it is drying out." }
        : null,
  ],
  tomato: [
    (c) =>
      green(c)
        ? { stage: "unripe", colorWord: "green", note: "A green tomato is not ready yet." }
        : null,
    (c) =>
      (c.h <= 18 || c.h >= 345) && c.l >= 22
        ? { stage: "ripe", colorWord: "red", note: "A deep, even red is ripe and ready." }
        : null,
    (c) =>
      c.h > 18 && c.h < 45
        ? { stage: "ripe", colorWord: "orange-red", note: "Turning red, close to fully ripe." }
        : null,
  ],
  mango: [
    (c) =>
      c.h >= 75 && c.h <= 165
        ? { stage: "unripe", colorWord: "green", note: "A firmly green mango needs more days." }
        : null,
    (c) =>
      c.h >= 35 && c.h < 75
        ? { stage: "ripe", colorWord: "yellow-orange", note: "Yellow to orange skin usually means ripe." }
        : null,
    (c) =>
      c.h < 35 || c.l < 30
        ? { stage: "overripe", colorWord: "dark orange", note: "Deep, darkening skin can mean past its peak." }
        : null,
  ],
  avocado: [
    (c) =>
      c.h >= 80 && c.h <= 165 && c.l > 30
        ? { stage: "unripe", colorWord: "bright green", note: "Bright green and firm usually means not yet." }
        : null,
    (c) =>
      c.l <= 32 || c.h < 80
        ? { stage: "ripe", colorWord: "dark, near-black", note: "Dark skin that yields to a gentle press reads ripe." }
        : null,
    (c) =>
      c.l < 18
        ? { stage: "overripe", colorWord: "very dark", note: "Very dark and soft can mean overripe inside." }
        : null,
  ],
  strawberry: [
    (c) =>
      green(c) || c.l > 70
        ? { stage: "unripe", colorWord: "pale or green-tipped", note: "Pale or green tips mean it needs longer." }
        : null,
    (c) =>
      (c.h <= 15 || c.h >= 340) && c.l >= 25
        ? { stage: "ripe", colorWord: "deep red", note: "An even, deep red is ripe and sweet." }
        : null,
    (c) =>
      c.l < 22
        ? { stage: "overripe", colorWord: "dark, dull", note: "Dark, dull, or bruised can mean overripe." }
        : null,
  ],
};

export interface RipenessResult {
  stage: Stage;
  colorWord: string;
  note: string;
}

export function judgeFruit(fruit: FruitId, rgb: RgbColor): RipenessResult {
  const hsl = rgbToHsl(rgb);
  for (const rule of RULES[fruit]) {
    const match = rule(hsl);
    if (match) return match;
  }
  // Fallback: use lightness to pick a non-committal stage, stated as a guess.
  if (hsl.l < 30)
    return {
      stage: "overripe",
      colorWord: "dark",
      note: "The color is quite dark, so treat this as a rough guess.",
    };
  return {
    stage: "ripe",
    colorWord: "mixed",
    note: "The color is hard to place, so this is only a rough guess.",
  };
}

export const STAGE_LABEL: Record<Stage, string> = {
  unripe: "Unripe",
  ripe: "Ripe",
  overripe: "Overripe",
};

/*
  Sample the dominant color inside a region of a canvas. Reads pixels on a grid
  for speed, drops near-transparent, near-black, and near-white pixels (shadow
  and background/glare), quantizes the rest into coarse buckets, and returns the
  average of the most populated bucket. Given the fruit's bounding box (from the
  detector) it reads only the fruit; with no box it reads a center region.
*/
export function sampleDominant(
  canvas: HTMLCanvasElement,
  region?: { x: number; y: number; width: number; height: number },
): RgbColor | null {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx || !canvas.width || !canvas.height) return null;

  const rx = Math.max(0, Math.floor(region?.x ?? canvas.width * 0.2));
  const ry = Math.max(0, Math.floor(region?.y ?? canvas.height * 0.2));
  const rw = Math.floor(region?.width ?? canvas.width * 0.6);
  const rh = Math.floor(region?.height ?? canvas.height * 0.6);
  const w = Math.min(rw, canvas.width - rx);
  const h = Math.min(rh, canvas.height - ry);
  if (w <= 0 || h <= 0) return null;

  const { data } = ctx.getImageData(rx, ry, w, h);
  const step = Math.max(1, Math.floor(Math.sqrt((w * h) / 4000)));
  const bucketSize = 24;
  const buckets = new Map<string, { r: number; g: number; b: number; n: number }>();

  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const i = (y * w + x) * 4;
      if (data[i + 3] < 200) continue;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const mx = Math.max(r, g, b);
      if (mx < 24 || mx > 244) continue;
      const key = `${Math.round(r / bucketSize)}-${Math.round(g / bucketSize)}-${Math.round(b / bucketSize)}`;
      const bucket = buckets.get(key);
      if (bucket) {
        bucket.r += r;
        bucket.g += g;
        bucket.b += b;
        bucket.n += 1;
      } else {
        buckets.set(key, { r, g, b, n: 1 });
      }
    }
  }

  let best: { r: number; g: number; b: number; n: number } | null = null;
  for (const bucket of buckets.values()) {
    if (!best || bucket.n > best.n) best = bucket;
  }
  if (!best) return null;
  return {
    r: Math.round(best.r / best.n),
    g: Math.round(best.g / best.n),
    b: Math.round(best.b / best.n),
  };
}
