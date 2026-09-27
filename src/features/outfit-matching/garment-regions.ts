import type { Piece, Point } from "./outfit-engine";

/*
  Turns the body segmenter's part map into the two regions the outfit scan
  reads. BodyPix labels every pixel of a person with one of 24 body parts; the
  top is read from the torso and the bottom from the thighs. Arms, lower legs,
  face, hands, and feet are left out on purpose: short sleeves, shorts, and
  skirts show skin there, while the torso and thighs are almost always covered
  by the top and the bottom.

  Kept free of React and of TensorFlow so it stays a plain function of the map.
*/

/** A body-part map: one part id per pixel (-1 off the person), row-major. */
export interface PartMap {
  data: Int32Array;
  width: number;
  height: number;
}

export interface GarmentRegion {
  /** 1 for each pixel the color is read from, row-major at the map's size. */
  mask: Uint8Array;
  /** Where the marker sits: inside the region, near its middle. */
  point: Point;
}

export type GarmentRegions = Partial<Record<Piece, GarmentRegion>>;

// Part ids, in the order of BodyPix's PART_CHANNELS.
const TORSO = [12, 13]; // front, back
const LEFT_THIGH = [14, 15];
const RIGHT_THIGH = [16, 17];

const TOP = 1;
const BOTTOM = 2;

/** A region below this share of the photo is too small to trust. */
const MIN_SHARE = 0.003;
/**
  How far inside a region's edge we start reading, as a share of the photo's
  short edge. Segment edges wander onto the background, an arm, or the other
  garment, and those pixels would pull the color off.
*/
const INSET = 0.015;

/** A rectangle on the photo, in pixels. */
export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Margin added around the person, as a share of their size, so no edge is cut. */
const BOX_PAD = 0.1;

/** The box around every person pixel in a part map, padded, or null if none. */
export function personBox({ data, width, height }: PartMap): Box | null {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let i = 0; i < data.length; i++) {
    if (data[i] < 0) continue;
    const x = i % width;
    const y = Math.floor(i / width);
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  if (maxX < 0) return null;

  const padX = Math.round((maxX - minX + 1) * BOX_PAD);
  const padY = Math.round((maxY - minY + 1) * BOX_PAD);
  const x = Math.max(0, minX - padX);
  const y = Math.max(0, minY - padY);
  return {
    x,
    y,
    width: Math.min(width, maxX + 1 + padX) - x,
    height: Math.min(height, maxY + 1 + padY) - y,
  };
}

/*
  Put a part map made from a crop of the photo back at the photo's size. The
  crop may have been scaled, so each photo pixel takes the nearest crop pixel.
  Everything outside the box is off the person.
*/
export function placeDetail(
  photo: { width: number; height: number },
  box: Box,
  detail: PartMap,
): PartMap {
  const { width, height } = photo;
  const data = new Int32Array(width * height).fill(-1);
  const sx = detail.width / box.width;
  const sy = detail.height / box.height;
  for (let y = 0; y < box.height; y++) {
    const dy = Math.min(detail.height - 1, Math.floor((y + 0.5) * sy));
    for (let x = 0; x < box.width; x++) {
      const dx = Math.min(detail.width - 1, Math.floor((x + 0.5) * sx));
      data[(box.y + y) * width + box.x + x] = detail.data[dy * detail.width + dx];
    }
  }
  return { data, width, height };
}

/** Find the top and bottom in a part map. A piece not in view is left out. */
export function locateGarments(parts: PartMap): GarmentRegions {
  const { data, width, height } = parts;
  const pieces = new Uint8Array(width * height);
  for (let i = 0; i < data.length; i++) {
    const part = data[i];
    if (TORSO.includes(part)) pieces[i] = TOP;
    else if (LEFT_THIGH.includes(part) || RIGHT_THIGH.includes(part))
      pieces[i] = BOTTOM;
  }

  const regions: GarmentRegions = {};
  const top = regionOf(pieces, TOP, width, height);
  if (top) regions.top = { mask: top, point: centerOf(top, width, height) };

  const bottom = regionOf(pieces, BOTTOM, width, height);
  if (bottom) {
    // The middle of both thighs is the gap between the legs, so the marker
    // goes on whichever thigh shows more.
    const left = new Uint8Array(bottom.length);
    const right = new Uint8Array(bottom.length);
    let leftCount = 0;
    let rightCount = 0;
    for (let i = 0; i < bottom.length; i++) {
      if (!bottom[i]) continue;
      if (LEFT_THIGH.includes(data[i])) {
        left[i] = 1;
        leftCount++;
      } else {
        right[i] = 1;
        rightCount++;
      }
    }
    regions.bottom = {
      mask: bottom,
      point: centerOf(leftCount >= rightCount ? left : right, width, height),
    };
  }
  return regions;
}

/** The pixels of one piece, pulled in from the edges, or null if too small. */
function regionOf(
  pieces: Uint8Array,
  piece: number,
  width: number,
  height: number,
): Uint8Array | null {
  const minPixels = width * height * MIN_SHARE;
  let count = 0;
  for (let i = 0; i < pieces.length; i++) if (pieces[i] === piece) count++;
  if (count < minPixels) return null;

  // Keep a pixel only if the piece continues INSET pixels out in all four
  // directions. A small region can vanish under that, so fall back to it whole.
  const d = Math.max(1, Math.round(Math.min(width, height) * INSET));
  const inner = new Uint8Array(pieces.length);
  let innerCount = 0;
  for (let y = d; y < height - d; y++) {
    for (let x = d; x < width - d; x++) {
      const i = y * width + x;
      if (
        pieces[i] === piece &&
        pieces[i - d] === piece &&
        pieces[i + d] === piece &&
        pieces[i - d * width] === piece &&
        pieces[i + d * width] === piece
      ) {
        inner[i] = 1;
        innerCount++;
      }
    }
  }
  if (innerCount >= minPixels / 2) return inner;

  const whole = new Uint8Array(pieces.length);
  for (let i = 0; i < pieces.length; i++) whole[i] = pieces[i] === piece ? 1 : 0;
  return whole;
}

/*
  The middle of a region as a point on the photo. A curved or split region can
  have its average outside itself, so that snaps to the nearest pixel inside.
*/
function centerOf(mask: Uint8Array, width: number, height: number): Point {
  let sx = 0;
  let sy = 0;
  let n = 0;
  for (let i = 0; i < mask.length; i++) {
    if (!mask[i]) continue;
    sx += i % width;
    sy += Math.floor(i / width);
    n++;
  }
  let cx = Math.round(sx / n);
  let cy = Math.round(sy / n);

  if (!mask[cy * width + cx]) {
    let best = Infinity;
    for (let i = 0; i < mask.length; i++) {
      if (!mask[i]) continue;
      const dx = (i % width) - cx;
      const dy = Math.floor(i / width) - cy;
      const dist = dx * dx + dy * dy;
      if (dist < best) {
        best = dist;
        cx = i % width;
        cy = Math.floor(i / width);
      }
    }
  }
  return { x: (cx + 0.5) / width, y: (cy + 0.5) / height };
}

/** Longest edge of the spotlight image; the browser scales it up smoothly. */
const SPOTLIGHT_EDGE = 320;

/*
  An image that dims the photo everywhere except a region, laid over the photo
  so the user sees exactly which pixels a color came from. Brightness is the
  cue, not a hue, so it reads the same with any color vision. Drawn small: the
  soft upscaled edge looks better than a jagged full-size one.
*/
export function spotlightOf(
  mask: Uint8Array,
  width: number,
  height: number,
): string {
  const scale = Math.min(1, SPOTLIGHT_EDGE / Math.max(width, height));
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const image = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    const sy = Math.min(height - 1, Math.floor((y + 0.5) / scale));
    for (let x = 0; x < w; x++) {
      const sx = Math.min(width - 1, Math.floor((x + 0.5) / scale));
      // Black at 45% outside the region, clear inside.
      image.data[(y * w + x) * 4 + 3] = mask[sy * width + sx] ? 0 : 115;
    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL("image/png");
}
