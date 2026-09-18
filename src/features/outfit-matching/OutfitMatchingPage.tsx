import { useMemo, useState } from "react";
import { Check, AlertTriangle, Shirt, PencilRuler } from "lucide-react";
import { hexToRgb, rgbToHsl, contrastRatio } from "@/shared/color-engine";
import { OutfitFigure } from "./components/OutfitFigure";
import type { OutfitColors } from "./components/OutfitFigure";

/*
  Outfit Matching. An interactive styling tool: pick a garment (top, bottom,
  shoes, accessory), give it a color, and the figure recolors live. The verdict
  on whether the top and bottom work together is spelled out in words with an
  icon, never a bare colored dot, and explains why (harmony and separation),
  since that reasoning is what a color-blind user actually needs.
*/

type Item = keyof OutfitColors;

const ITEMS: { id: Item; label: string }[] = [
  { id: "top", label: "Top" },
  { id: "bottom", label: "Bottom" },
  { id: "shoes", label: "Shoes" },
  { id: "accessory", label: "Accessory" },
];

// A small, tasteful palette per item plus a custom picker.
const PALETTE = [
  "#1e293b",
  "#0e7490",
  "#2dd4bf",
  "#f5a623",
  "#e2e8f0",
  "#7c2d12",
  "#be123c",
  "#4c1d95",
];

const DEFAULTS: OutfitColors = {
  top: "#1e293b",
  bottom: "#c7ccd1",
  shoes: "#0e7490",
  accessory: "#f5a623",
};

function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

interface Verdict {
  tone: "good" | "ok" | "clash";
  title: string;
  reason: string;
}

function judge(topHex: string, bottomHex: string): Verdict | null {
  const top = hexToRgb(topHex);
  const bottom = hexToRgb(bottomHex);
  if (!top || !bottom) return null;

  const ht = rgbToHsl(top);
  const hb = rgbToHsl(bottom);
  const hueGap = hueDistance(ht.h, hb.h);
  const ratio = contrastRatio(top, bottom);
  const eitherNeutral = ht.s < 15 || hb.s < 15;

  // Neutrals go with anything; otherwise reward either close hues (analogous)
  // or near-opposite hues (complementary), and enough lightness separation.
  const harmonious = eitherNeutral || hueGap < 40 || hueGap > 140;
  const separated = ratio >= 1.6;

  if (harmonious && separated)
    return {
      tone: "good",
      title: "Good match",
      reason: eitherNeutral
        ? "One piece is neutral, so it pairs easily and the two stay distinct."
        : "The colors sit in harmony and are different enough to tell apart.",
    };
  if (harmonious && !separated)
    return {
      tone: "ok",
      title: "Works, but close in tone",
      reason:
        "The colors harmonize but sit at a similar brightness, so they can blur together. Add contrast if you want them to stand apart.",
    };
  return {
    tone: "clash",
    title: "They clash",
    reason:
      "The hues fight and there is little to separate them. Try a neutral, or push one lighter or darker.",
  };
}

export function OutfitMatchingPage() {
  const [colors, setColors] = useState<OutfitColors>(DEFAULTS);
  const [active, setActive] = useState<Item>("top");

  const verdict = useMemo(
    () => judge(colors.top, colors.bottom),
    [colors.top, colors.bottom],
  );

  const setActiveColor = (hex: string) =>
    setColors((prev) => ({ ...prev, [active]: hex }));

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h2 className="text-2xl font-bold text-text">Build your outfit.</h2>
        <p className="mt-1 text-text-muted">
          Color each piece and see whether they work together, explained in
          words.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        {/* The figure is the focus. */}
        <div className="rounded-card border border-border bg-surface-raised p-4">
          <div className="mx-auto h-80 max-w-[16rem]">
            <OutfitFigure colors={colors} active={active} />
          </div>
        </div>

        {/* Controls. */}
        <div className="flex flex-col gap-5">
          {/* Item selector. */}
          <div>
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-text">
              <Shirt size={16} aria-hidden className="text-accent" />
              Choose a piece
            </span>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Outfit piece">
              {ITEMS.map((item) => {
                const selected = active === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setActive(item.id)}
                    className={[
                      "inline-flex min-h-10 items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition-colors",
                      selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-text-muted hover:text-text",
                    ].join(" ")}
                  >
                    <span
                      aria-hidden
                      className="h-3.5 w-3.5 rounded-full border border-black/20"
                      style={{ backgroundColor: colors[item.id] }}
                    />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Swatch palette for the active item. */}
          <div>
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-text">
              <PencilRuler size={16} aria-hidden className="text-accent" />
              Color the {ITEMS.find((i) => i.id === active)?.label.toLowerCase()}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {PALETTE.map((hex) => {
                const selected =
                  colors[active].toLowerCase() === hex.toLowerCase();
                return (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setActiveColor(hex)}
                    aria-label={`Use ${hex}`}
                    aria-pressed={selected}
                    className={[
                      "h-9 w-9 rounded-full border transition-transform hover:scale-110 motion-reduce:hover:scale-100",
                      selected
                        ? "border-text ring-2 ring-focus"
                        : "border-border",
                    ].join(" ")}
                    style={{ backgroundColor: hex }}
                  >
                    {selected && (
                      <Check
                        size={16}
                        aria-hidden
                        className="mx-auto text-white mix-blend-difference"
                      />
                    )}
                  </button>
                );
              })}
              <label
                className="flex h-9 cursor-pointer items-center gap-2 rounded-full border border-border px-3 text-sm text-text-muted hover:text-text"
                aria-label="Custom color"
              >
                Custom
                <input
                  type="color"
                  value={colors[active]}
                  onChange={(e) => setActiveColor(e.target.value)}
                  className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
                />
              </label>
            </div>
          </div>

          {/* Verdict, top vs bottom. Text + icon, never color alone. */}
          {verdict && (
            <div
              aria-live="polite"
              className="flex items-start gap-3 rounded-card border border-border bg-surface p-4"
            >
              <span
                className={[
                  "grid h-9 w-9 shrink-0 place-items-center rounded-full",
                  verdict.tone === "good"
                    ? "bg-status-unripe/20 text-status-unripe"
                    : verdict.tone === "ok"
                      ? "bg-status-warning/20 text-status-warning"
                      : "bg-status-danger/20 text-status-danger",
                ].join(" ")}
              >
                {verdict.tone === "good" ? (
                  <Check size={18} aria-hidden />
                ) : (
                  <AlertTriangle size={18} aria-hidden />
                )}
              </span>
              <div>
                <p className="font-semibold text-text">{verdict.title}</p>
                <p className="text-sm text-text-muted">{verdict.reason}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
