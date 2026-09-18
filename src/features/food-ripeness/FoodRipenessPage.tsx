import { useCallback, useState } from "react";
import { Check, Clock, Hourglass, Info } from "lucide-react";
import { rgbToHex, rgbToHsl, nameColor, hexToRgb } from "@/shared/color-engine";
import type { RgbColor } from "@/shared/color-engine";
import { CameraUpload } from "@/shared/ui/CameraUpload";
import type { CaptureResult } from "@/shared/ui/CameraUpload";

/*
  Food Ripeness. A practical everyday utility: capture or upload a photo of
  produce and get a plain read on how ready it looks. This is deliberately
  humble. It reads the dominant color and gives a rough impression, never a
  measurement or a food-safety guarantee, and it says so. The result always
  combines a label, an icon, and a worded indicator so it never depends on
  color, which matters most for exactly these users.
*/

type Stage = "ready" | "almost" | "early";

interface Reading {
  stage: Stage;
  hex: string;
  colorName: string;
}

const STAGE_UI: Record<
  Stage,
  { label: string; hint: string; Icon: typeof Check; tone: string }
> = {
  ready: {
    label: "Looks ready",
    hint: "The color reads as ripe. Give it a gentle squeeze to confirm.",
    Icon: Check,
    tone: "bg-status-ripe/20 text-status-ripe",
  },
  almost: {
    label: "Almost ready",
    hint: "Getting there. A day or two more will likely do it.",
    Icon: Clock,
    tone: "bg-status-warning/20 text-status-warning",
  },
  early: {
    label: "Needs more time",
    hint: "Reads underripe. Leave it out a few more days.",
    Icon: Hourglass,
    tone: "bg-status-unripe/20 text-status-unripe",
  },
};

/** Average the center region of the captured image for a stabler sample. */
function averageCenter(canvas: HTMLCanvasElement): RgbColor | null {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  const side = Math.max(1, Math.floor(Math.min(canvas.width, canvas.height) * 0.4));
  const x = Math.floor((canvas.width - side) / 2);
  const y = Math.floor((canvas.height - side) / 2);
  const { data } = ctx.getImageData(x, y, side, side);
  let r = 0;
  let g = 0;
  let b = 0;
  const count = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
  }
  return { r: r / count, g: g / count, b: b / count };
}

/*
  A general, honest heuristic. Warm hues (red/orange/yellow) with decent
  saturation read as riper; greens read as earlier. This is a rough impression
  across common produce, not per-fruit tuning, which is why the UI never claims
  precision.
*/
function judgeRipeness(rgb: RgbColor): Stage {
  const { h, s } = rgbToHsl(rgb);
  if (s < 18) return "almost"; // washed out / unclear, stay non-committal
  // Green band -> early.
  if (h >= 75 && h <= 165) return "early";
  // Yellow / yellow-green transition -> almost.
  if (h > 45 && h < 75) return "almost";
  // Red / orange -> ready.
  if (h <= 45 || h >= 330) return "ready";
  return "almost";
}

export function FoodRipenessPage() {
  const [reading, setReading] = useState<Reading | null>(null);

  const onCapture = useCallback((result: CaptureResult) => {
    const avg = averageCenter(result.canvas);
    if (!avg) return;
    const hex = rgbToHex(avg);
    const rgb = hexToRgb(hex);
    setReading({
      stage: judgeRipeness(avg),
      hex,
      colorName: rgb ? nameColor(rgb).name : "Color",
    });
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h2 className="text-2xl font-bold text-text">Check food ripeness.</h2>
        <p className="mt-1 text-text-muted">
          Point at a fruit or vegetable, or upload a photo. Center the produce in
          the frame.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <CameraUpload onCapture={onCapture} captureLabel="Check ripeness" />

        <div className="flex flex-col justify-center">
          {reading ? (
            <RipenessResult reading={reading} />
          ) : (
            <div className="flex flex-col items-start gap-2 rounded-card border border-dashed border-border p-6 text-text-muted">
              <Hourglass size={22} aria-hidden className="text-text-muted" />
              <p className="text-sm">
                Capture some produce and a plain read on its ripeness shows up
                here.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Honesty note, always present. */}
      <p className="flex items-start gap-2 rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text-muted">
        <Info size={16} aria-hidden className="mt-0.5 shrink-0 text-accent" />
        This is a rough impression from color only, not a measurement or a
        food-safety check. Trust your senses too.
      </p>
    </div>
  );
}

function RipenessResult({ reading }: { reading: Reading }) {
  const ui = STAGE_UI[reading.stage];
  // A 3-step indicator so the stage reads without color: early, almost, ready.
  const steps: Stage[] = ["early", "almost", "ready"];
  const activeIndex = steps.indexOf(reading.stage);

  return (
    <div
      aria-live="polite"
      className="flex flex-col gap-4 rounded-card border border-border bg-surface-raised p-5"
    >
      <div className="flex items-center gap-3">
        <span className={`grid h-11 w-11 place-items-center rounded-full ${ui.tone}`}>
          <ui.Icon size={22} aria-hidden />
        </span>
        <div>
          <p className="text-lg font-bold text-text">{ui.label}</p>
          <p className="text-sm text-text-muted">
            Dominant color reads as {reading.colorName.toLowerCase()}.
          </p>
        </div>
      </div>

      {/* Stepped indicator: filled bars + a labeled current step. */}
      <div>
        <div className="flex gap-1.5" role="presentation">
          {steps.map((step, i) => (
            <span
              key={step}
              className={`h-1.5 flex-1 rounded-full ${
                i <= activeIndex ? "bg-primary" : "bg-surface"
              }`}
            />
          ))}
        </div>
        <div className="mt-1.5 flex justify-between text-xs text-text-muted">
          <span className={reading.stage === "early" ? "font-semibold text-text" : ""}>
            Early
          </span>
          <span className={reading.stage === "almost" ? "font-semibold text-text" : ""}>
            Almost
          </span>
          <span className={reading.stage === "ready" ? "font-semibold text-text" : ""}>
            Ready
          </span>
        </div>
      </div>

      <p className="text-sm text-text-muted">{ui.hint}</p>
    </div>
  );
}
