import { useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import {
  hexToRgb,
  nameColor,
  contrastRatio,
  colorDifference,
  colorSimilarity,
} from "@/shared/color-engine";

/*
  Color Compare. Two large color panels the user can recolor, with a plain,
  honest read on how they relate: their names, how alike they are (a perceptual
  similarity score from Lab deltaE), and their WCAG contrast ratio with a
  pass/fail for body and large text. Every verdict is words plus an icon, never
  color alone. Panels transition smoothly when a color changes rather than
  snapping, so the comparison feels alive.
*/

interface PanelState {
  hex: string;
}

function describeDifference(delta: number): string {
  if (delta < 2) return "Nearly identical. Most people won't tell them apart.";
  if (delta < 10) return "Close. Subtly different up close, easy to confuse.";
  if (delta < 25) return "Noticeably different.";
  if (delta < 50) return "Clearly different.";
  return "Strongly different, near opposite.";
}

export function CompareColorsPage() {
  const [a, setA] = useState<PanelState>({ hex: "#2dd4bf" });
  const [b, setB] = useState<PanelState>({ hex: "#f5a623" });

  const rgbA = hexToRgb(a.hex);
  const rgbB = hexToRgb(b.hex);

  const analysis = useMemo(() => {
    if (!rgbA || !rgbB) return null;
    const ratio = contrastRatio(rgbA, rgbB);
    return {
      nameA: nameColor(rgbA),
      nameB: nameColor(rgbB),
      similarity: colorSimilarity(rgbA, rgbB),
      delta: colorDifference(rgbA, rgbB),
      ratio,
      bodyPass: ratio >= 4.5,
      largePass: ratio >= 3,
    };
  }, [rgbA, rgbB]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h2 className="text-2xl font-bold text-text">Compare two colors.</h2>
        <p className="mt-1 text-text-muted">
          Set two colors and see how alike they are and whether one reads
          clearly against the other.
        </p>
      </header>

      {/* Two large panels sharing an edge, each recolorable. */}
      <div className="grid grid-cols-2 overflow-hidden rounded-card border border-border">
        <ColorPanel
          label="Color A"
          hex={a.hex}
          name={analysis?.nameA.name}
          onChange={(hex) => setA({ hex })}
        />
        <ColorPanel
          label="Color B"
          hex={b.hex}
          name={analysis?.nameB.name}
          onChange={(hex) => setB({ hex })}
          align="right"
        />
      </div>

      {analysis ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Similarity. */}
          <div className="rounded-card border border-border bg-surface-raised p-5">
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
                Similarity
              </h3>
              <span className="text-2xl font-bold text-text">
                {analysis.similarity}%
              </span>
            </div>
            {/* Meter uses width + a number, not color, to convey the value. */}
            <div
              className="mt-3 h-2 overflow-hidden rounded-full bg-surface"
              role="meter"
              aria-valuenow={analysis.similarity}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Color similarity"
            >
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out motion-reduce:transition-none"
                style={{ width: `${analysis.similarity}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-text-muted">
              {describeDifference(analysis.delta)}
            </p>
          </div>

          {/* Contrast, with explicit pass/fail (text + icon). */}
          <div className="rounded-card border border-border bg-surface-raised p-5">
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
                Contrast
              </h3>
              <span className="text-2xl font-bold text-text">
                {analysis.ratio.toFixed(1)}:1
              </span>
            </div>
            <ul className="mt-3 flex flex-col gap-2">
              <ContrastRow pass={analysis.bodyPass} label="Body text" min="4.5:1" />
              <ContrastRow
                pass={analysis.largePass}
                label="Large text"
                min="3:1"
              />
            </ul>
          </div>
        </div>
      ) : (
        <p role="alert" className="text-status-danger">
          One of those colors isn't valid. Pick another.
        </p>
      )}
    </div>
  );
}

function ColorPanel({
  label,
  hex,
  name,
  onChange,
  align = "left",
}: {
  label: string;
  hex: string;
  name?: string;
  onChange: (hex: string) => void;
  align?: "left" | "right";
}) {
  const readableOnSwatch = pickReadableText(hex);
  return (
    <label
      className="relative flex aspect-[4/3] cursor-pointer flex-col justify-between p-4 transition-colors duration-500 ease-out motion-reduce:transition-none"
      style={{ backgroundColor: hex, color: readableOnSwatch }}
    >
      <span
        className={`text-xs font-semibold uppercase tracking-wide opacity-80 ${align === "right" ? "text-right" : ""}`}
      >
        {label}
      </span>
      <span className={align === "right" ? "text-right" : ""}>
        <span className="block text-lg font-bold">{name ?? "Custom"}</span>
        <span className="block font-mono text-sm opacity-80">
          {hex.toUpperCase()}
        </span>
      </span>
      <input
        type="color"
        value={hex}
        onChange={(e) => onChange(e.target.value)}
        aria-label={`Change ${label}`}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </label>
  );
}

function ContrastRow({
  pass,
  label,
  min,
}: {
  pass: boolean;
  label: string;
  min: string;
}) {
  return (
    <li className="flex items-center gap-2 text-sm">
      <span
        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${
          pass ? "bg-status-unripe/20 text-status-unripe" : "bg-status-danger/20 text-status-danger"
        }`}
      >
        {pass ? (
          <Check size={14} aria-hidden />
        ) : (
          <X size={14} aria-hidden />
        )}
      </span>
      <span className="text-text">{label}</span>
      <span className="ml-auto font-medium text-text-muted">
        {pass ? "Passes" : "Fails"} ({min})
      </span>
    </li>
  );
}

// Choose black or white text for a swatch so the label stays readable, using
// the same luminance idea as WCAG. Kept local since it is presentational only.
function pickReadableText(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "#000";
  const yiq = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return yiq >= 140 ? "#0b0f14" : "#f4f7fa";
}
