import {
  colorDifference,
  contrastRatio,
  nameColor,
  relativeLuminance,
  rgbToHex,
  rgbToHsl,
  simulateCvd,
} from "@/shared/color-engine";
import type { CvdType, RgbColor } from "@/shared/color-engine";

/*
  The outfit engine, kept free of React so the page only renders. It runs the
  three steps that follow a photo:

  1. Scan:      read the main color of each garment from a spot on the photo.
  2. Judge:     decide whether the top and bottom go together, and say why.
  3. Recommend: name wardrobe colors that would fix or finish the outfit.

  All of it is an everyday styling heuristic, not color science, and the UI
  says so.
*/

export type Piece = "top" | "bottom";

export const PIECES: { id: Piece; label: string }[] = [
  { id: "top", label: "Top" },
  { id: "bottom", label: "Bottom" },
];

/** A spot on the photo, as fractions (0-1) of its width and height. */
export interface Point {
  x: number;
  y: number;
}

/*
  Where each piece is read when the outfit is framed as the camera guide asks:
  standing, centered, head near the top. The bottom point sits at the hips
  rather than mid-leg so it lands on fabric, not the gap between the legs.
  Uploads rarely line up exactly, which is why both points can be moved.
*/
export const DEFAULT_POINTS: Record<Piece, Point> = {
  top: { x: 0.5, y: 0.35 },
  bottom: { x: 0.5, y: 0.63 },
};

/* ------------------------------------------------------------------ Scan -- */

/** Longest edge a photo is scaled to. Plenty for color, and fast to read. */
const MAX_EDGE = 1024;

/** Scale a captured photo down so scanning and display stay quick. */
export function preparePhoto(source: HTMLCanvasElement): HTMLCanvasElement {
  const scale = Math.min(1, MAX_EDGE / Math.max(source.width, source.height));
  if (scale === 1) return source;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(source.width * scale);
  canvas.height = Math.round(source.height * scale);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return source;
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export interface PieceScan {
  rgb: RgbColor;
  /**
    Share of the spot (0-1) that is the main color. Low means a print, a
    pattern, or a shadow crossing the spot.
  */
  coverage: number;
}

/** Side of the square read around a point, as a share of the photo's short edge. */
const SPOT_SIZE = 0.12;
/** RGB distance within which a pixel counts as the main color. */
const SAME_COLOR = 40;
/** Below this coverage the spot is called mixed in the UI. */
export const MIXED_COVERAGE = 0.6;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/** Bucket index for a pixel: 8 levels per channel, 512 buckets. */
const bucketOf = (r: number, g: number, b: number) =>
  ((r >> 5) << 6) | ((g >> 5) << 3) | (b >> 5);

/*
  Read the main color around a point. A plain average would blend a print, a
  fold's shadow, or a strip of background into a muddy color nobody is wearing.

  Instead we bucket the pixels coarsely and find the densest neighborhood of
  buckets. Counting neighbors matters: camera noise spreads one fabric color
  across several adjacent buckets, while a flat background lands in one, and a
  single-bucket count would wrongly crown the background. From that seed, a few
  mean-shift steps settle on the average of the pixels near the main color.
*/
export function scanPiece(
  canvas: HTMLCanvasElement,
  point: Point,
): PieceScan | null {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx || !canvas.width || !canvas.height) return null;

  const side = Math.max(
    1,
    Math.round(Math.min(canvas.width, canvas.height) * SPOT_SIZE),
  );
  const x = clamp(Math.round(point.x * canvas.width - side / 2), 0, canvas.width - side);
  const y = clamp(Math.round(point.y * canvas.height - side / 2), 0, canvas.height - side);
  const { data } = ctx.getImageData(x, y, side, side);
  const total = data.length / 4;
  if (!total) return null;

  const counts = new Uint32Array(512);
  const sums = new Float64Array(512 * 3);
  for (let i = 0; i < data.length; i += 4) {
    const k = bucketOf(data[i], data[i + 1], data[i + 2]);
    counts[k]++;
    sums[k * 3] += data[i];
    sums[k * 3 + 1] += data[i + 1];
    sums[k * 3 + 2] += data[i + 2];
  }

  // The occupied bucket with the most pixels in it and its 26 neighbors.
  let best = -1;
  let bestDensity = 0;
  for (let k = 0; k < 512; k++) {
    if (!counts[k]) continue;
    const r = k >> 6;
    const g = (k >> 3) & 7;
    const b = k & 7;
    let density = 0;
    for (let dr = -1; dr <= 1; dr++)
      for (let dg = -1; dg <= 1; dg++)
        for (let db = -1; db <= 1; db++) {
          const nr = r + dr;
          const ng = g + dg;
          const nb = b + db;
          if (nr < 0 || ng < 0 || nb < 0 || nr > 7 || ng > 7 || nb > 7) continue;
          density += counts[(nr << 6) | (ng << 3) | nb];
        }
    if (density > bestDensity) {
      bestDensity = density;
      best = k;
    }
  }

  let seed: RgbColor = {
    r: sums[best * 3] / counts[best],
    g: sums[best * 3 + 1] / counts[best],
    b: sums[best * 3 + 2] / counts[best],
  };
  let near = 0;
  for (let step = 0; step < 3; step++) {
    let r = 0;
    let g = 0;
    let b = 0;
    let n = 0;
    for (let i = 0; i < data.length; i += 4) {
      const dr = data[i] - seed.r;
      const dg = data[i + 1] - seed.g;
      const db = data[i + 2] - seed.b;
      if (dr * dr + dg * dg + db * db <= SAME_COLOR * SAME_COLOR) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        n++;
      }
    }
    if (!n) break;
    seed = { r: r / n, g: g / n, b: b / n };
    near = n;
  }

  return {
    rgb: { r: Math.round(seed.r), g: Math.round(seed.g), b: Math.round(seed.b) },
    coverage: near / total,
  };
}

/* ----------------------------------------------------------------- Judge -- */

/*
  Neutrals pair with almost anything, so they decide most outfit verdicts.
  Beyond true grays we count the fashion neutrals people build outfits on every
  day: near-black, navy, denim, brown, and beige or tan.
*/
export function isNeutral(rgb: RgbColor): boolean {
  const { h, s, l } = rgbToHsl(rgb);
  const chroma = Math.max(rgb.r, rgb.g, rgb.b) - Math.min(rgb.r, rgb.g, rgb.b);
  if (chroma < 30 || l < 14 || l > 92) return true; // gray, black, white
  if (h >= 200 && h <= 235 && l < 32) return true; // navy
  if (h >= 195 && h <= 225 && s < 50 && l < 62) return true; // denim
  if (h >= 15 && h <= 45 && s < 55 && l < 45) return true; // brown
  if (h >= 20 && h <= 50 && s < 50 && l >= 55) return true; // beige, tan
  return false;
}

export type Tone = "good" | "ok" | "clash";

function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/** Contrast at or above this keeps two pieces from blurring together. */
const MIN_SEPARATION = 1.6;

/*
  Two colors go together when either is a neutral, or their hues sit close
  (analogous) or nearly opposite (complementary). They also need enough
  lightness separation to read as two pieces rather than one block.
*/
function toneOf(a: RgbColor, b: RgbColor): Tone {
  const gap = hueDistance(rgbToHsl(a).h, rgbToHsl(b).h);
  const harmonious = isNeutral(a) || isNeutral(b) || gap < 40 || gap > 140;
  if (!harmonious) return "clash";
  return contrastRatio(a, b) >= MIN_SEPARATION ? "good" : "ok";
}

export interface Verdict {
  tone: Tone;
  title: string;
  reason: string;
}

const colorWord = (rgb: RgbColor) => nameGarment(rgb).toLowerCase();

function judge(top: RgbColor, bottom: RgbColor): Verdict {
  const t = colorWord(top);
  const b = colorWord(bottom);
  const tone = toneOf(top, bottom);

  if (tone === "clash")
    return {
      tone,
      title: "They clash",
      reason: `The ${t} top and ${b} bottom pull against each other, so the outfit reads as two separate ideas.`,
    };
  if (tone === "ok")
    return {
      tone,
      title: "Works, but close in tone",
      reason: `The ${t} top and ${b} bottom go together, but they sit at a similar brightness, so they can blur into one block.`,
    };

  const topNeutral = isNeutral(top);
  const bottomNeutral = isNeutral(bottom);
  let why: string;
  if (topNeutral && bottomNeutral) why = "Both pieces are neutrals, so they pair easily";
  else if (bottomNeutral) why = `The ${b} bottom is a neutral, so it grounds the ${t} top`;
  else if (topNeutral) why = `The ${t} top is a neutral, so it calms the ${b} bottom`;
  else if (hueDistance(rgbToHsl(top).h, rgbToHsl(bottom).h) < 40)
    why = `The ${t} and ${b} sit close on the color wheel, so they look calm together`;
  else why = `The ${t} and ${b} sit across the color wheel from each other, a bold pairing that works`;

  return {
    tone,
    title: "Good match",
    reason: `${why}, and they differ enough in brightness to tell apart.`,
  };
}

/* ------------------------------------------------------------- Recommend -- */

export interface WardrobeColor {
  name: string;
  hex: string;
  rgb: RgbColor;
  neutral: boolean;
}

const color = (name: string, rgb: RgbColor): WardrobeColor => ({
  name,
  rgb,
  hex: rgbToHex(rgb),
  neutral: isNeutral(rgb),
});

// Garment colors people actually own, most versatile first. Order is the
// tie-breaker, so the safest picks surface before the bolder ones.
const WARDROBE: WardrobeColor[] = [
  color("Navy", { r: 31, g: 42, b: 68 }),
  color("Light gray", { r: 199, g: 204, b: 209 }),
  color("White", { r: 244, g: 244, b: 242 }),
  color("Black", { r: 28, g: 28, b: 30 }),
  color("Beige", { r: 216, g: 195, b: 160 }),
  color("Denim blue", { r: 74, g: 106, b: 138 }),
  color("Charcoal", { r: 63, g: 68, b: 73 }),
  color("Brown", { r: 107, g: 74, b: 47 }),
  color("Burgundy", { r: 109, g: 31, b: 46 }),
  color("Olive", { r: 107, g: 107, b: 58 }),
  color("Forest green", { r: 47, g: 93, b: 69 }),
  color("Rust", { r: 181, g: 83, b: 42 }),
  color("Mustard", { r: 212, g: 165, b: 42 }),
  color("Teal", { r: 31, g: 111, b: 120 }),
  color("Sky blue", { r: 156, g: 195, b: 224 }),
  color("Blush pink", { r: 232, g: 180, b: 184 }),
];

// Extra names so any scanned color gets a clothing word, not only the colors
// worth recommending.
const NAMING_ONLY: WardrobeColor[] = [
  color("Gray", { r: 128, g: 128, b: 128 }),
  color("Khaki", { r: 181, g: 162, b: 122 }),
  color("Cream", { r: 240, g: 232, b: 208 }),
  color("Red", { r: 200, g: 40, b: 40 }),
  color("Orange", { r: 230, g: 130, b: 30 }),
  color("Yellow", { r: 235, g: 210, b: 50 }),
  color("Green", { r: 60, g: 160, b: 70 }),
  color("Blue", { r: 45, g: 90, b: 200 }),
  color("Purple", { r: 130, g: 60, b: 170 }),
  color("Pink", { r: 230, g: 130, b: 170 }),
];

/*
  Name a scanned color the way people talk about clothes ("denim blue",
  "khaki", "burgundy") rather than the scanner's broad hue names. Nearest by
  perceptual difference, which keeps low-chroma tans and grays apart.
*/
export function nameGarment(rgb: RgbColor): string {
  let best = WARDROBE[0];
  let bestDiff = Infinity;
  for (const c of [...WARDROBE, ...NAMING_ONLY]) {
    const diff = colorDifference(rgb, c.rgb);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = c;
    }
  }
  return best.name;
}

/** How a scanned piece reads, in words first. */
export function describePiece(rgb: RgbColor) {
  const named = nameColor(rgb);
  return { name: nameGarment(rgb), description: named.description, hex: named.hex };
}

// Shoes come in a handful of classic colors. Near the depth of the bottom keeps
// the leg line long; white is the easy casual pick either way.
const SHOES_FOR_DARK_BOTTOM = [
  color("Black", { r: 28, g: 28, b: 30 }),
  color("Brown", { r: 107, g: 74, b: 47 }),
  color("White", { r: 244, g: 244, b: 242 }),
];
const SHOES_FOR_LIGHT_BOTTOM = [
  color("White", { r: 244, g: 244, b: 242 }),
  color("Tan", { r: 190, g: 150, b: 105 }),
  color("Brown", { r: 107, g: 74, b: 47 }),
];

/** DeltaE under which a wardrobe color counts as the piece being replaced. */
const SAME_AS_PIECE = 15;
/** DeltaE two suggestions must differ by to be real alternatives. */
const DISTINCT = 25;

interface SuggestOptions {
  /** true: neutrals only, false: colors only, undefined: either. */
  neutral?: boolean;
  /** Pieces being replaced; suggesting what they already wear is no help. */
  avoid?: RgbColor[];
  count?: number;
}

/** Wardrobe colors that pair well with every piece in `partners`. */
function suggest(
  partners: RgbColor[],
  { neutral, avoid = [], count = 3 }: SuggestOptions = {},
): WardrobeColor[] {
  const picks: WardrobeColor[] = [];
  for (const c of WARDROBE) {
    if (picks.length === count) break;
    if (neutral !== undefined && c.neutral !== neutral) continue;
    if (!partners.every((p) => toneOf(p, c.rgb) === "good")) continue;
    if (avoid.some((a) => colorDifference(a, c.rgb) < SAME_AS_PIECE)) continue;
    if (picks.some((p) => colorDifference(p.rgb, c.rgb) < DISTINCT)) continue;
    picks.push(c);
  }
  return picks;
}

/** Two safe neutrals plus one color, the shape of a useful swap list. */
const swapOptions = (keep: RgbColor, replace: RgbColor) => [
  ...suggest([keep], { neutral: true, avoid: [replace], count: 2 }),
  ...suggest([keep], { neutral: false, avoid: [replace], count: 1 }),
];

export type RecommendationKind =
  | "swap-bottom"
  | "swap-top"
  | "contrast"
  | "layer"
  | "shoes"
  | "accent";

export interface Recommendation {
  kind: RecommendationKind;
  title: string;
  detail: string;
  colors: WardrobeColor[];
}

function recommend(
  top: RgbColor,
  bottom: RgbColor,
  tone: Tone,
): Recommendation[] {
  const t = colorWord(top);
  const b = colorWord(bottom);

  const recommendations: Recommendation[] =
    tone === "clash"
      ? [
          {
            kind: "swap-bottom",
            title: "Swap the bottom",
            detail: `Keep the ${t} top. These bottoms go with it:`,
            colors: swapOptions(top, bottom),
          },
          {
            kind: "swap-top",
            title: "Or swap the top",
            detail: `Keep the ${b} bottom. These tops go with it:`,
            colors: swapOptions(bottom, top),
          },
        ]
      : tone === "ok"
        ? [
            {
              kind: "contrast",
              title: "Add contrast",
              detail: `Keep the ${t} top and pick a bottom that is clearly lighter or darker, like:`,
              colors: swapOptions(top, bottom),
            },
            {
              kind: "layer",
              title: "Or break it up",
              detail:
                "A belt, jacket, or open shirt between the two pieces separates them. Try one in:",
              colors: suggest([top, bottom], { neutral: true }),
            },
          ]
        : [
            {
              kind: "shoes",
              title: "Finish with shoes",
              detail: "Shoes that keep the outfit together:",
              colors:
                relativeLuminance(bottom) < 0.2
                  ? SHOES_FOR_DARK_BOTTOM
                  : SHOES_FOR_LIGHT_BOTTOM,
            },
            {
              kind: "accent",
              title: "Add an accent",
              detail: "For a touch of color, a bag, cap, or scarf in:",
              colors: suggest([top, bottom], { neutral: false }),
            },
          ];

  return recommendations.filter((r) => r.colors.length > 0);
}

/* ------------------------------------------------------ Personal vision -- */

// DeltaE bands follow Color Compare's scale (under 10 reads as "easy to
// confuse"), nudged up slightly since photo colors are noisier than picks.
/** DeltaE from which most people see two pieces as different colors. */
const CLEARLY_DIFFERENT = 20;
/** Simulated DeltaE under which two pieces may look like similar shades. */
const LOOK_ALIKE = 12;

/*
  Whether two pieces that most people see as clearly different may look alike
  to someone with this type of color blindness. The verdict describes how the
  outfit reads to everyone else; this is the private heads-up for when the user
  may not see what the verdict describes.
*/
export function looksAlikeTo(a: RgbColor, b: RgbColor, type: CvdType): boolean {
  if (colorDifference(a, b) < CLEARLY_DIFFERENT) return false;
  return colorDifference(simulateCvd(a, type), simulateCvd(b, type)) < LOOK_ALIKE;
}

/* ------------------------------------------------------------------ All -- */

export interface Assessment {
  verdict: Verdict;
  recommendations: Recommendation[];
}

export function assessOutfit(top: RgbColor, bottom: RgbColor): Assessment {
  const verdict = judge(top, bottom);
  return { verdict, recommendations: recommend(top, bottom, verdict.tone) };
}
