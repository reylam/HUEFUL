import type { RgbColor } from "./types";

/*
  Perceptual color difference. We convert sRGB to CIE Lab and measure the
  straight-line distance between the two colors (CIE76 deltaE). Lab is roughly
  perceptually uniform, so this tracks how different two colors look to a human
  far better than raw RGB distance does. It is an approximation, good enough for
  a "how alike are these" readout, not a color-science instrument.
*/

interface LabColor {
  l: number;
  a: number;
  b: number;
}

// D65 reference white.
const REF_X = 95.047;
const REF_Y = 100;
const REF_Z = 108.883;

function srgbToLinear(value: number): number {
  const s = value / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function rgbToXyz({ r, g, b }: RgbColor): { x: number; y: number; z: number } {
  const rl = srgbToLinear(r) * 100;
  const gl = srgbToLinear(g) * 100;
  const bl = srgbToLinear(b) * 100;
  return {
    x: rl * 0.4124 + gl * 0.3576 + bl * 0.1805,
    y: rl * 0.2126 + gl * 0.7152 + bl * 0.0722,
    z: rl * 0.0193 + gl * 0.1192 + bl * 0.9505,
  };
}

function rgbToLab(rgb: RgbColor): LabColor {
  const { x, y, z } = rgbToXyz(rgb);
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(x / REF_X);
  const fy = f(y / REF_Y);
  const fz = f(z / REF_Z);
  return {
    l: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}

/**
 * CIE76 deltaE between two sRGB colors. Roughly: < 1 imperceptible, 1-2 very
 * close, 2-10 noticeable, 11-49 clearly different, >= 50 opposite.
 */
export function colorDifference(a: RgbColor, b: RgbColor): number {
  const la = rgbToLab(a);
  const lb = rgbToLab(b);
  const dl = la.l - lb.l;
  const da = la.a - lb.a;
  const db = la.b - lb.b;
  return Math.sqrt(dl * dl + da * da + db * db);
}

/** 0-100 similarity score derived from deltaE, higher = more alike. */
export function colorSimilarity(a: RgbColor, b: RgbColor): number {
  const diff = colorDifference(a, b);
  // deltaE ~100 is about as far apart as everyday colors get; map to 0-100.
  const score = Math.max(0, 100 - diff);
  return Math.round(score);
}
