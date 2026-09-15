import { useMemo, useState } from "react";
import { hexToRgb, nameColor } from "@/shared/color-engine";
import type { NamedColor } from "@/shared/color-engine";

/*
  Owns the current sampled color. In this prototype the sample comes from a
  color input; in production this hook is where a live camera frame sample would
  feed in, keeping the component unchanged.
*/
export function useColorSample(initialHex = "#8a5a28") {
  const [hex, setHex] = useState(initialHex);

  const color: NamedColor | null = useMemo(() => {
    const rgb = hexToRgb(hex);
    return rgb ? nameColor(rgb) : null;
  }, [hex]);

  return { hex, setHex, color };
}
