export interface OutfitColors {
  top: string;
  bottom: string;
  shoes: string;
  accessory: string;
}

interface OutfitFigureProps {
  colors: OutfitColors;
  /** Which item is being edited, for a subtle highlight ring. */
  active: keyof OutfitColors;
}

/*
  A simple, friendly figure that stands in for a real person photo. Each garment
  is a flat shape filled with the chosen color, so recoloring is instant and
  legible. The active item gets a dashed outline (a non-color cue) so keyboard
  and low-vision users can see which piece they're editing without relying on
  the fill color. Purely presentational; labels live in the controls.
*/
export function OutfitFigure({ colors, active }: OutfitFigureProps) {
  const ring = (item: keyof OutfitColors) =>
    active === item
      ? { stroke: "var(--color-focus)", strokeWidth: 3, strokeDasharray: "6 5" }
      : { stroke: "var(--color-border)", strokeWidth: 1.5 };

  return (
    <svg
      viewBox="0 0 220 360"
      className="h-full w-full"
      role="img"
      aria-label="Outfit preview"
    >
      {/* head + accessory (scarf/hat band) */}
      <circle cx="110" cy="46" r="26" fill="var(--color-surface)" stroke="var(--color-border)" strokeWidth="1.5" />
      <rect
        x="84"
        y="60"
        width="52"
        height="14"
        rx="7"
        fill={colors.accessory}
        className="transition-[fill] duration-500 ease-out motion-reduce:transition-none"
        {...ring("accessory")}
      />

      {/* top */}
      <path
        d="M70 84 L150 84 L166 130 L146 140 L146 210 L74 210 L74 140 L54 130 Z"
        fill={colors.top}
        className="transition-[fill] duration-500 ease-out motion-reduce:transition-none"
        {...ring("top")}
      />

      {/* bottom */}
      <path
        d="M76 210 L144 210 L138 320 L116 320 L110 236 L104 320 L82 320 Z"
        fill={colors.bottom}
        className="transition-[fill] duration-500 ease-out motion-reduce:transition-none"
        {...ring("bottom")}
      />

      {/* shoes */}
      <rect
        x="78"
        y="320"
        width="30"
        height="16"
        rx="6"
        fill={colors.shoes}
        className="transition-[fill] duration-500 ease-out motion-reduce:transition-none"
        {...ring("shoes")}
      />
      <rect
        x="112"
        y="320"
        width="30"
        height="16"
        rx="6"
        fill={colors.shoes}
        className="transition-[fill] duration-500 ease-out motion-reduce:transition-none"
        {...ring("shoes")}
      />
    </svg>
  );
}
