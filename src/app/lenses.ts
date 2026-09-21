import { lazy } from "react";
import type { ComponentType } from "react";

/*
  The lens registry: the single source of truth for the dashboard's tools.
  Each lens is a feature module, lazy-loaded so heavy code (camera, image
  processing) stays out of the initial bundle. Adding a lens is one entry here
  plus a feature folder; the dashboard nav and home grid update automatically.

  Paths are relative to the /dashboard shell (see app/routes.tsx). "index" is
  the dashboard home and is defined there, not here.
*/

export type LensState = "ready" | "prototype" | "planned";

export interface Lens {
  /** Path segment under /dashboard, e.g. "scan" -> /dashboard/scan. */
  path: string;
  label: string;
  /** Short tab label; keep it tiny for the bottom nav. */
  navLabel: string;
  /** One plain sentence describing what the lens does, used on the home grid. */
  summary: string;
  /**
    Honest maturity signal, surfaced in the UI:
    - ready:     usable end to end
    - prototype: works, but with known gaps (e.g. pick a color, no live camera)
    - planned:   scaffolded, not built yet
  */
  state: LensState;
  Component: ComponentType;
}

export const lenses: Lens[] = [
  {
    path: "scan",
    label: "Color Scanner",
    navLabel: "Scan",
    summary:
      "Sample a color and get its plain-language name with a CVD-safe breakdown.",
    state: "ready",
    Component: lazy(() =>
      import("@/features/color-scanner").then((m) => ({
        default: m.ColorScannerPage,
      })),
    ),
  },
  {
    path: "compare",
    label: "Color Compare",
    navLabel: "Compare",
    summary:
      "Check whether two colors are actually distinguishable, for you and across CVD types.",
    state: "ready",
    Component: lazy(() =>
      import("@/features/compare-colors").then((m) => ({
        default: m.CompareColorsPage,
      })),
    ),
  },
  {
    path: "outfit",
    label: "Outfit Matching",
    navLabel: "Outfit",
    summary:
      "See whether two garments clash or go together, described in words, not just swatches.",
    state: "ready",
    Component: lazy(() =>
      import("@/features/outfit-matching").then((m) => ({
        default: m.OutfitMatchingPage,
      })),
    ),
  },
  {
    path: "ripeness",
    label: "Food Ripeness",
    navLabel: "Ripeness",
    summary:
      "Judge how ripe produce is from its color, with labels and icons, never color alone.",
    state: "ready",
    Component: lazy(() =>
      import("@/features/food-ripeness").then((m) => ({
        default: m.FoodRipenessPage,
      })),
    ),
  },
  {
    path: "simulate",
    label: "Vision Simulator",
    navLabel: "Simulate",
    summary:
      "See how a color shifts under protanopia, deuteranopia, and tritanopia.",
    state: "ready",
    Component: lazy(() =>
      import("@/features/cvd-simulator").then((m) => ({
        default: m.CvdSimulatorPage,
      })),
    ),
  },
  {
    path: "saved",
    label: "Saved Colors",
    navLabel: "Saved",
    summary: "Keep colors you named so you can recognize them again later.",
    state: "ready",
    Component: lazy(() =>
      import("@/features/saved-colors").then((m) => ({
        default: m.SavedColorsPage,
      })),
    ),
  },
];
