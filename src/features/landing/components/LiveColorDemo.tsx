import { useCallback, useId, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import Webcam from "react-webcam";
import { Camera, Upload, RefreshCw } from "lucide-react";
import { hexToRgb, nameColor, rgbToHex } from "@/shared/color-engine";
import type { NamedColor } from "@/shared/color-engine";
import { Button } from "@/shared/ui/Button";
import { StatusBadge } from "@/shared/ui/StatusBadge";

/*
  A working taste of the product on the landing page: point the camera at
  something and read the color's name in plain words. It's deliberately
  opt-in. The camera hardware is never touched until the visitor asks for it
  (privacy and battery). react-webcam ships only in the landing route chunk
  (this whole feature is lazy-loaded at the route), so its weight stays off
  every app route.

  States handled: idle, camera live, permission denied, unsupported device,
  and a still result after sampling. An image upload is offered as a fallback
  so the demo works even when the camera can't.
*/

type Mode = "idle" | "camera" | "denied" | "unsupported";

const cameraSupported =
  typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

/** Read the center pixel of a source drawn to an offscreen canvas. */
function sampleCenterHex(
  source: CanvasImageSource,
  width: number,
  height: number,
): string | null {
  if (!width || !height) return null;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0, width, height);
  const cx = Math.floor(width / 2);
  const cy = Math.floor(height / 2);
  const { data } = ctx.getImageData(cx, cy, 1, 1);
  return rgbToHex({ r: data[0], g: data[1], b: data[2] });
}

interface LiveColorDemoProps {
  /**
    When embedded (e.g. inside the ContainerScroll showcase), drop the outer
    section border and the visible heading, since the wrapper supplies the
    framing and title. The heading stays in the DOM as a screen-reader label.
  */
  embedded?: boolean;
}

export function LiveColorDemo({ embedded = false }: LiveColorDemoProps) {
  const regionId = useId();
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>("idle");
  const [color, setColor] = useState<NamedColor | null>(null);

  const startCamera = useCallback(() => {
    if (!cameraSupported) {
      setMode("unsupported");
      return;
    }
    setColor(null);
    setMode("camera");
  }, []);

  const sampleFromCamera = useCallback(() => {
    const video = webcamRef.current?.video;
    if (!video) return;
    const hex = sampleCenterHex(video, video.videoWidth, video.videoHeight);
    const rgb = hex ? hexToRgb(hex) : null;
    if (rgb) setColor(nameColor(rgb));
  }, []);

  const handleFile = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      const hex = sampleCenterHex(img, img.naturalWidth, img.naturalHeight);
      const rgb = hex ? hexToRgb(hex) : null;
      if (rgb) setColor(nameColor(rgb));
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
    setMode("idle");
  }, []);

  return (
    <section
      aria-labelledby={regionId}
      className={
        embedded ? "p-5 md:p-6" : "border-t border-border py-10 md:py-14"
      }
    >
      <h2
        id={regionId}
        className={
          embedded ? "sr-only" : "text-2xl font-bold text-text"
        }
      >
        Try it now
      </h2>
      <p
        className={
          embedded
            ? "max-w-2xl text-sm text-text-muted"
            : "mt-2 max-w-2xl text-text-muted"
        }
      >
        Point your camera at anything and read the color in plain words. Nothing
        leaves your device, and the camera only turns on when you ask.
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div className="relative aspect-square w-full overflow-hidden rounded-card border border-border bg-surface-raised">
            {mode === "camera" ? (
              <>
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{ facingMode: "environment" }}
                  onUserMediaError={() => setMode("denied")}
                  className="h-full w-full object-cover"
                />
                {/* Center reticle marks exactly what gets sampled. */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(0,0,0,0.5)]"
                />
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-text-muted">
                <Camera size={28} aria-hidden />
                {mode === "denied" && (
                  <p role="alert" className="text-sm text-text">
                    Camera access was blocked. You can allow it in your browser
                    settings, or upload a photo instead.
                  </p>
                )}
                {mode === "unsupported" && (
                  <p role="alert" className="text-sm text-text">
                    This device doesn't offer camera access here. Upload a photo
                    instead.
                  </p>
                )}
                {mode === "idle" && (
                  <p className="text-sm">The camera preview shows up here.</p>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {mode === "camera" ? (
              <>
                <Button onClick={sampleFromCamera}>Read color</Button>
                <Button variant="ghost" onClick={() => setMode("idle")}>
                  Stop
                </Button>
              </>
            ) : (
              <Button onClick={startCamera}>
                <Camera size={18} aria-hidden />
                Start camera
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={18} aria-hidden />
              Upload a photo
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFile}
              className="sr-only"
              aria-hidden
              tabIndex={-1}
            />
          </div>
        </div>

        <div className="flex flex-col justify-center">
          {color ? (
            <div
              aria-live="polite"
              className="rounded-card border border-border bg-surface-raised p-5"
            >
              <div className="flex items-center gap-4">
                <span
                  aria-hidden
                  className="h-16 w-16 shrink-0 rounded-2xl border border-border"
                  style={{ backgroundColor: color.hex }}
                />
                <div className="min-w-0">
                  <p className="text-2xl font-bold text-text">{color.name}</p>
                  <p className="text-text-muted">{color.description}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {color.confidence < 0.6 && (
                  <StatusBadge
                    tone="uncertain"
                    label="Not sure, try better lighting"
                    icon={<span aria-hidden>?</span>}
                  />
                )}
                <span className="text-xs text-text-muted">{color.hex}</span>
                <button
                  type="button"
                  onClick={() => setColor(null)}
                  className="ml-auto inline-flex items-center gap-1 text-sm font-medium text-text-muted hover:text-text"
                >
                  <RefreshCw size={14} aria-hidden />
                  Clear
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-text-muted">
              Start the camera and press <strong className="text-text">Read
              color</strong>, or upload a photo. The color at the center is what
              gets named.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
