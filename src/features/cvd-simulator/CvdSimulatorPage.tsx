import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { simulateCvd } from "@/shared/color-engine";
import type { CvdType } from "@/shared/color-engine";
import { CameraUpload } from "@/shared/ui/CameraUpload";
import type { CaptureResult } from "@/shared/ui/CameraUpload";
import { CompareSlider } from "@/shared/ui/CompareSlider";

/*
  Vision Simulator. Interactive and educational: capture or upload an image, pick
  a color vision type, and drag the divider to compare the original against the
  simulation. Switching modes re-renders the simulated canvas from the original
  pixels, so the change is immediate. It is an approximation, not a clinical
  tool, and it says so, in a calm layout, not a medical one.

  Also usable with no image: a built-in sample scene of labeled color chips lets
  someone explore the effect right away.
*/

type Mode = "normal" | CvdType;

const MODES: { id: Mode; label: string; note: string }[] = [
  { id: "normal", label: "Normal Vision", note: "Typical color vision" },
  { id: "deuteranopia", label: "Deuteranopia", note: "Green-weak, most common" },
  { id: "protanopia", label: "Protanopia", note: "Red-weak" },
  { id: "tritanopia", label: "Tritanopia", note: "Blue-weak, rare" },
];

// A small labeled sample scene so the tool works before any upload. Colors that
// are commonly confused across CVD types, each with a text label.
const SAMPLE = [
  { name: "Red", hex: "#e23b3b" },
  { name: "Green", hex: "#3ca046" },
  { name: "Orange", hex: "#f5a623" },
  { name: "Brown", hex: "#7c4a1e" },
  { name: "Teal", hex: "#2dd4bf" },
  { name: "Purple", hex: "#8b5cf6" },
];

/** Apply a CVD transform to every pixel of a source canvas into a new one. */
function simulateCanvas(src: HTMLCanvasElement, type: CvdType): string {
  const out = document.createElement("canvas");
  out.width = src.width;
  out.height = src.height;
  const sctx = src.getContext("2d", { willReadFrequently: true });
  const octx = out.getContext("2d");
  if (!sctx || !octx) return src.toDataURL();
  const img = sctx.getImageData(0, 0, src.width, src.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const seen = simulateCvd({ r: d[i], g: d[i + 1], b: d[i + 2] }, type);
    d[i] = seen.r;
    d[i + 1] = seen.g;
    d[i + 2] = seen.b;
  }
  octx.putImageData(img, 0, 0);
  return out.toDataURL();
}

export function CvdSimulatorPage() {
  const [mode, setMode] = useState<Mode>("deuteranopia");
  const sourceRef = useRef<HTMLCanvasElement | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [simUrl, setSimUrl] = useState<string | null>(null);

  const onCapture = useCallback((result: CaptureResult) => {
    sourceRef.current = result.canvas;
    setOriginalUrl(result.canvas.toDataURL());
  }, []);

  // Re-simulate whenever the mode or source image changes.
  useEffect(() => {
    const src = sourceRef.current;
    if (!src || !originalUrl) return;
    if (mode === "normal") {
      setSimUrl(originalUrl);
      return;
    }
    setSimUrl(simulateCanvas(src, mode));
  }, [mode, originalUrl]);

  const sampleAfter = useMemo(() => {
    return SAMPLE.map((c) => {
      if (mode === "normal") return { ...c, shown: c.hex };
      const rgb = { r: 0, g: 0, b: 0 };
      // Reuse hex->rgb via a tiny inline parse to avoid an extra import cycle.
      const v = parseInt(c.hex.slice(1), 16);
      rgb.r = (v >> 16) & 255;
      rgb.g = (v >> 8) & 255;
      rgb.b = v & 255;
      const seen = simulateCvd(rgb, mode);
      const hex = `#${((1 << 24) + (seen.r << 16) + (seen.g << 8) + seen.b)
        .toString(16)
        .slice(1)}`;
      return { ...c, shown: hex };
    });
  }, [mode]);

  const modeLabel = MODES.find((m) => m.id === mode)?.label ?? "Simulation";

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h2 className="text-2xl font-bold text-text">See color differently.</h2>
        <p className="mt-1 text-text-muted">
          Pick a vision type and compare it against the original. This is an
          approximation, not a medical assessment.
        </p>
      </header>

      {/* Mode selector: segmented, text labels with a note. */}
      <div
        role="group"
        aria-label="Vision type"
        className="flex flex-wrap gap-2"
      >
        {MODES.map((m) => {
          const selected = mode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setMode(m.id)}
              className={[
                "min-h-10 rounded-full border px-4 text-sm font-medium transition-colors",
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-text-muted hover:text-text",
              ].join(" ")}
            >
              {m.label}
            </button>
          );
        })}
      </div>
      <p className="-mt-3 text-sm text-text-muted">
        {MODES.find((m) => m.id === mode)?.note}
      </p>

      {originalUrl && simUrl ? (
        <CompareSlider
          before={
            <img
              src={originalUrl}
              alt="Original"
              className="h-full w-full object-cover"
            />
          }
          after={
            <img
              src={simUrl}
              alt={`${modeLabel} simulation`}
              className="h-full w-full object-cover"
            />
          }
          beforeLabel="Original"
          afterLabel={modeLabel}
        />
      ) : (
        /* Sample scene before any image is provided. */
        <div className="rounded-card border border-border bg-surface-raised p-5">
          <p className="mb-3 text-sm text-text-muted">
            No image yet. Here's how a set of common colors looks under{" "}
            <span className="font-semibold text-text">{modeLabel}</span>. Each
            chip keeps its real name as a label.
          </p>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {sampleAfter.map((c) => (
              <li
                key={c.name}
                className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3"
              >
                <span
                  aria-hidden
                  className="h-10 w-10 shrink-0 rounded-xl border border-border transition-colors duration-500 ease-out motion-reduce:transition-none"
                  style={{ backgroundColor: c.shown }}
                />
                <span className="text-sm font-medium text-text">{c.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <CameraUpload onCapture={onCapture} captureLabel="Use this frame" />
        <div className="flex flex-col justify-center gap-2 text-sm text-text-muted">
          <p>
            Upload a photo or use the camera to run the simulation on a real
            scene, then drag the divider to compare.
          </p>
          <p>
            Tip: try a photo with reds and greens together to see where they
            become hard to tell apart.
          </p>
        </div>
      </div>
    </div>
  );
}
