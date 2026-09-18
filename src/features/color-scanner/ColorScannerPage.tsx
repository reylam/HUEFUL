import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Check, Bookmark, Pipette } from "lucide-react";
import gsap from "gsap";
import { hexToRgb, nameColor } from "@/shared/color-engine";
import type { NamedColor } from "@/shared/color-engine";
import { CameraUpload } from "@/shared/ui/CameraUpload";
import type { CaptureResult } from "@/shared/ui/CameraUpload";
import { StatusBadge } from "@/shared/ui/StatusBadge";
import { useSavedColors } from "@/stores/saved-colors";
import { ColorReadout } from "./components/ColorReadout";

/*
  Color Scanner. An interactive scanner, not a form: open the camera or upload a
  photo and the color at the center of the frame is named in plain words, with
  its HEX, RGB, and HSL. A manual color picker stays available as a keyboard and
  no-camera fallback. The result reveals with a small scale/opacity pop (motion
  only) so naming a color feels satisfying, never with heavy glow.
*/
export function ColorScannerPage() {
  const pickerId = useId();
  const save = useSavedColors((s) => s.save);
  const saved = useSavedColors((s) => s.colors);

  const [color, setColor] = useState<NamedColor | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const setFromHex = useCallback((hex: string | null) => {
    const rgb = hex ? hexToRgb(hex) : null;
    setColor(rgb ? nameColor(rgb) : null);
  }, []);

  const onCapture = useCallback(
    (result: CaptureResult) => setFromHex(result.centerHex),
    [setFromHex],
  );

  // Pop the result in when it changes (motion only, fails safe).
  useEffect(() => {
    const el = resultRef.current;
    if (!el || !color) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    try {
      gsap.fromTo(
        el,
        { autoAlpha: 0, scale: 0.96, y: 8 },
        { autoAlpha: 1, scale: 1, y: 0, duration: 0.35, ease: "back.out(1.6)" },
      );
    } catch {
      el.style.opacity = "1";
    }
  }, [color]);

  const isSaved = color
    ? saved.some((c) => c.hex.toLowerCase() === color.hex.toLowerCase())
    : false;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h2 className="text-2xl font-bold text-text">What color is this?</h2>
        <p className="mt-1 text-text-muted">
          Point at something or upload a photo. The color at the center of the
          frame gets named.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <CameraUpload onCapture={onCapture} captureLabel="Read color" />

          {/* Manual fallback: a color picker that needs no camera. */}
          <label
            htmlFor={pickerId}
            className="flex min-h-11 cursor-pointer items-center gap-3 rounded-2xl border border-border bg-surface-raised px-4"
          >
            <Pipette size={18} aria-hidden className="text-accent" />
            <span className="font-medium text-text">Or pick a color</span>
            <input
              id={pickerId}
              type="color"
              defaultValue="#8a5a28"
              onChange={(e) => setFromHex(e.target.value)}
              className="ml-auto h-8 w-8 cursor-pointer rounded-lg border-0 bg-transparent p-0"
            />
          </label>
        </div>

        <div className="flex flex-col justify-center">
          {color ? (
            <div
              ref={resultRef}
              aria-live="polite"
              className="flex flex-col gap-4 rounded-card border border-border bg-surface-raised p-5"
            >
              <div className="flex items-center gap-4">
                <span
                  aria-hidden
                  className="h-20 w-20 shrink-0 rounded-2xl border border-border"
                  style={{ backgroundColor: color.hex }}
                />
                <div className="min-w-0">
                  <p className="text-2xl font-bold text-text">{color.name}</p>
                  <p className="text-text-muted">{color.description}</p>
                </div>
              </div>

              {color.confidence < 0.6 && (
                <StatusBadge
                  tone="uncertain"
                  label="Not sure, try better lighting"
                  icon={<span aria-hidden>?</span>}
                />
              )}

              <ColorReadout color={color} />

              <button
                type="button"
                onClick={() => save(color)}
                disabled={isSaved}
                aria-pressed={isSaved}
                className={[
                  "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold transition-colors",
                  isSaved
                    ? "border border-border text-text-muted"
                    : "bg-primary text-primary-foreground hover:brightness-110",
                ].join(" ")}
              >
                {isSaved ? (
                  <>
                    <Check size={16} aria-hidden />
                    Saved
                  </>
                ) : (
                  <>
                    <Bookmark size={16} aria-hidden />
                    Save Color
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-start gap-2 rounded-card border border-dashed border-border p-6 text-text-muted">
              <Pipette size={22} aria-hidden className="text-text-muted" />
              <p className="text-sm">
                Read a color and its name, HEX, RGB, and HSL will show up here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
