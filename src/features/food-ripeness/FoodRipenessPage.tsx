import { useCallback, useState } from "react";
import {
  Check,
  Flame,
  Info,
  Loader2,
  RotateCcw,
  ScanLine,
  Sprout,
} from "lucide-react";
import { rgbToHex, nameColor } from "@/shared/color-engine";
import { CameraUpload } from "@/shared/ui/CameraUpload";
import type { CaptureResult } from "@/shared/ui/CameraUpload";
import { useAwardXp } from "@/shared/progress/useAwardXp";
import {
  FRUITS,
  STAGE_LABEL,
  judgeFruit,
  sampleDominant,
} from "./ripeness";
import type { FruitId, Stage } from "./ripeness";
import { useFruitDetector } from "./useFruitDetector";

/*
  HueRipe. Pick a fruit, capture or upload a photo, and it reads the skin color
  to estimate ripeness. It runs a real on-device detector (COCO-SSD): when the
  model recognizes the produce (banana, apple, orange) it locates the fruit and
  crops to it before reading color, which is far steadier than a fixed center
  box. For produce COCO doesn't know, it samples the center and says so.

  After a check the captured photo is shown with the detected fruit boxed and
  labelled, so the user sees exactly what was measured. Deliberately humble: a
  color-only estimate, never a measurement or a food-safety guarantee. Every
  result pairs a label, an icon, and a stepped indicator, so it never depends on
  color, which matters most for these users. A real analysis grants XP.
*/

const STAGE_UI: Record<Stage, { Icon: typeof Check; tone: string }> = {
  unripe: { Icon: Sprout, tone: "bg-status-unripe/20 text-status-unripe-ink" },
  ripe: { Icon: Check, tone: "bg-status-ripe/25 text-status-ripe-ink" },
  overripe: { Icon: Flame, tone: "bg-status-overripe/25 text-status-warning-ink" },
};

/** A box on the photo, stored as fractions of the image so it scales at any size. */
interface Overlay {
  left: number;
  top: number;
  width: number;
  height: number;
  label: string;
}

interface Reading {
  fruit: FruitId;
  stage: Stage;
  hex: string;
  colorName: string;
  colorWord: string;
  note: string;
  /** How the fruit was located: detected by the model, or center-sampled. */
  located: "detected" | "center";
  /** The model's label when detected, for an honest line. */
  detectedLabel?: string;
  /** The captured photo, shown with the box overlaid. */
  photoUrl: string;
  /** The box to draw, as fractions of the image (0-1). */
  overlay: Overlay;
}

export function FoodRipenessPage() {
  const [fruit, setFruit] = useState<FruitId>("banana");
  const [reading, setReading] = useState<Reading | null>(null);
  const [busy, setBusy] = useState(false);
  const { detect, status } = useFruitDetector();
  const award = useAwardXp();

  const selected = FRUITS.find((f) => f.id === fruit);

  const onCapture = useCallback(
    async (result: CaptureResult) => {
      setBusy(true);
      setReading(null);
      try {
        const { canvas } = result;
        const w = canvas.width;
        const h = canvas.height;

        // Try to locate the fruit with the model first. A hit crops the color
        // read to the fruit; a miss (or an unknown fruit) falls back to center.
        const box = selected?.detectable ? await detect(canvas) : null;
        const useBox = box && box.fruitId === fruit ? box : null;

        const region = useBox
          ? {
              x: useBox.bbox[0],
              y: useBox.bbox[1],
              width: useBox.bbox[2],
              height: useBox.bbox[3],
            }
          : undefined;

        const rgb = sampleDominant(canvas, region);
        if (!rgb) {
          setReading(null);
          setBusy(false);
          return;
        }

        // The overlay: the detected box in image fractions, or a centered box
        // matching the center region we actually sampled, so what is drawn is
        // always what was measured.
        const overlay: Overlay = useBox
          ? {
              left: useBox.bbox[0] / w,
              top: useBox.bbox[1] / h,
              width: useBox.bbox[2] / w,
              height: useBox.bbox[3] / h,
              label: `${selected?.label ?? useBox.label} · ${Math.round(useBox.score * 100)}%`,
            }
          : {
              left: 0.2,
              top: 0.2,
              width: 0.6,
              height: 0.6,
              label: `${selected?.label ?? "Fruit"} · center`,
            };

        const hex = rgbToHex(rgb);
        const verdict = judgeFruit(fruit, rgb);
        setReading({
          fruit,
          stage: verdict.stage,
          hex,
          colorName: nameColor(rgb).name,
          colorWord: verdict.colorWord,
          note: verdict.note,
          located: useBox ? "detected" : "center",
          detectedLabel: useBox?.label,
          photoUrl: canvas.toDataURL("image/jpeg", 0.85),
          overlay,
        });
        award(20, "Ripeness checked");
      } finally {
        setBusy(false);
      }
    },
    [detect, fruit, selected, award],
  );

  const loadingModel = status === "loading-model";
  const retake = () => setReading(null);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h2 className="text-2xl font-bold text-text">Check food ripeness.</h2>
        <p className="mt-1 text-text-muted">
          Pick a fruit, then point at it or upload a photo. We find the fruit and
          read its skin color.
        </p>
      </header>

      {/* Fruit selector. Detectable fruits are auto-located by the model. */}
      <div role="group" aria-label="Fruit" className="flex flex-wrap gap-2">
        {FRUITS.map((f) => {
          const isSel = fruit === f.id;
          const Icon = f.Icon;
          return (
            <button
              key={f.id}
              type="button"
              aria-pressed={isSel}
              onClick={() => {
                setFruit(f.id);
                setReading(null);
              }}
              className={[
                "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors",
                isSel
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-text-muted hover:text-text",
              ].join(" ")}
            >
              <Icon size={16} aria-hidden />
              {f.label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {reading ? (
          <DetectedPhoto reading={reading} onRetake={retake} />
        ) : (
          <CameraUpload onCapture={onCapture} captureLabel="Check ripeness" />
        )}

        <div className="flex flex-col justify-center">
          {busy ? (
            <div
              role="status"
              className="flex items-center gap-3 rounded-card border border-border bg-surface-raised p-5 shadow-card"
            >
              <Loader2 size={22} aria-hidden className="shrink-0 animate-spin text-accent" />
              <div>
                <p className="font-semibold text-text">
                  {loadingModel ? "Loading the detector…" : "Reading the color…"}
                </p>
                <p className="text-sm text-text-muted">
                  {loadingModel
                    ? "First check loads the on-device model. It stays on your device."
                    : "Finding the fruit and sampling its skin."}
                </p>
              </div>
            </div>
          ) : reading ? (
            <RipenessCard reading={reading} />
          ) : (
            <div className="flex flex-col items-start gap-2 rounded-card border border-dashed border-border p-6 text-text-muted">
              <ScanLine size={22} aria-hidden className="text-text-muted" />
              <p className="text-sm">
                Capture a {selected?.label.toLowerCase()} and a plain read on its
                ripeness shows up here.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Honesty note, always present. */}
      <p className="flex items-start gap-2 rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text-muted">
        <Info size={16} aria-hidden className="mt-0.5 shrink-0 text-accent" />
        This is an estimate from color only, not a measurement or a food-safety
        check. Lighting shifts color, so trust your senses too.
      </p>
    </div>
  );
}

/*
  The captured photo with the measured region drawn on it. The box is positioned
  in percentages of the image, so it lines up whether the photo is shown small
  on a phone or larger on a desktop. The label rides the top edge of the box and
  flips inside when the box sits at the very top, so it never clips off-frame.
*/
function DetectedPhoto({
  reading,
  onRetake,
}: {
  reading: Reading;
  onRetake: () => void;
}) {
  const { overlay, located } = reading;
  const labelInside = overlay.top < 0.08;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative overflow-hidden rounded-card border border-border bg-surface-sunken">
        <img
          src={reading.photoUrl}
          alt={`Captured ${reading.fruit}, with the ${located === "detected" ? "detected" : "sampled"} area marked`}
          className="block w-full"
        />
        <div
          className={[
            "pointer-events-none absolute rounded-lg border-2",
            located === "detected" ? "border-primary" : "border-accent border-dashed",
          ].join(" ")}
          style={{
            left: `${overlay.left * 100}%`,
            top: `${overlay.top * 100}%`,
            width: `${overlay.width * 100}%`,
            height: `${overlay.height * 100}%`,
          }}
        >
          <span
            className={[
              "absolute left-0 whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-semibold",
              located === "detected"
                ? "bg-primary text-primary-foreground"
                : "bg-accent text-accent-foreground",
              labelInside ? "top-0.5 left-0.5" : "-top-6",
            ].join(" ")}
          >
            {overlay.label}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={onRetake}
        className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-2xl border border-border bg-surface-raised px-4 text-sm font-semibold text-text hover:bg-surface-sunken"
      >
        <RotateCcw size={16} aria-hidden />
        Check another
      </button>
    </div>
  );
}

function RipenessCard({ reading }: { reading: Reading }) {
  const ui = STAGE_UI[reading.stage];
  const steps: Stage[] = ["unripe", "ripe", "overripe"];
  const activeIndex = steps.indexOf(reading.stage);
  const fruitLabel =
    FRUITS.find((f) => f.id === reading.fruit)?.label ?? "Fruit";

  return (
    <div
      aria-live="polite"
      className="flex flex-col gap-4 rounded-card border border-border bg-surface-raised p-5 shadow-card"
    >
      <div className="flex items-center gap-4">
        <span
          aria-hidden
          className="h-14 w-14 shrink-0 rounded-2xl border border-border"
          style={{ backgroundColor: reading.hex }}
        />
        <div className="min-w-0">
          <p className="text-sm font-medium text-text-muted">{fruitLabel}</p>
          <p className="flex items-center gap-2 text-xl font-bold text-text">
            <span className={`grid h-7 w-7 place-items-center rounded-full ${ui.tone}`}>
              <ui.Icon size={16} aria-hidden />
            </span>
            {STAGE_LABEL[reading.stage]}
          </p>
        </div>
      </div>

      {/* Stepped indicator so the stage reads without color. */}
      <div>
        <div className="flex gap-1.5" role="presentation">
          {steps.map((step, i) => (
            <span
              key={step}
              className={`h-1.5 flex-1 rounded-full ${
                i <= activeIndex ? "bg-primary" : "bg-surface-sunken"
              }`}
            />
          ))}
        </div>
        <div className="mt-1.5 flex justify-between text-xs text-text-muted">
          {steps.map((step) => (
            <span
              key={step}
              className={reading.stage === step ? "font-semibold text-text" : ""}
            >
              {STAGE_LABEL[step]}
            </span>
          ))}
        </div>
      </div>

      <p className="text-sm text-text-muted">
        Detected color: <span className="text-text">{reading.colorName}</span>{" "}
        <span className="font-mono text-xs">{reading.hex}</span>. {reading.note}
      </p>

      <p className="flex items-center gap-1.5 text-xs text-text-muted">
        <ScanLine size={13} aria-hidden className="shrink-0" />
        {reading.located === "detected"
          ? `Located automatically (detected a ${reading.detectedLabel}).`
          : "Read from the center of the frame."}
      </p>
    </div>
  );
}
