import type { CvdType, RgbColor } from "./types";
import { clampRgb } from "./convert";

/*
  Simulate how a color vision deficiency sees a color, using the Brettel-style
  linear approximation in linear-RGB space. This is an approximation, good
  enough to preview a color and to sanity-check our own token choices. It is
  not a clinical tool.
*/

const toLinear = (c: number) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

const toSrgb = (c: number) => {
  const v = c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055;
  return v * 255;
};

// Per-type transform matrices (row-major, linear RGB).
const MATRICES: Record<CvdType, number[]> = {
  protanopia: [0.567, 0.433, 0, 0.558, 0.442, 0, 0, 0.242, 0.758],
  deuteranopia: [0.625, 0.375, 0, 0.7, 0.3, 0, 0, 0.3, 0.7],
  tritanopia: [0.95, 0.05, 0, 0, 0.433, 0.567, 0, 0.475, 0.525],
};

export function simulateCvd(rgb: RgbColor, type: CvdType): RgbColor {
  const [r, g, b] = [toLinear(rgb.r), toLinear(rgb.g), toLinear(rgb.b)];
  const m = MATRICES[type];
  return clampRgb({
    r: toSrgb(m[0] * r + m[1] * g + m[2] * b),
    g: toSrgb(m[3] * r + m[4] * g + m[5] * b),
    b: toSrgb(m[6] * r + m[7] * g + m[8] * b),
  });
}
