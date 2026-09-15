/** An sRGB color, channels 0-255. */
export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export type CvdType = "protanopia" | "deuteranopia" | "tritanopia";

/**
 * A color turned into human language. The UI leads with `name` + `description`
 * because a hex string means nothing to someone who can't perceive hue.
 */
export interface NamedColor {
  rgb: RgbColor;
  hex: string;
  /** Short human name, e.g. "Dark brown". */
  name: string;
  /** Plain-language description using brightness words too. */
  description: string;
  /** 0-1; how close the sample sits to a named reference. */
  confidence: number;
}
