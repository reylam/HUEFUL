import { useCallback, useId, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import Webcam from "react-webcam";
import { Camera, Upload, Scan, X } from "lucide-react";
import { Button } from "./Button";

/*
  Shared capture surface for the tools that read pixels from an image: Color
  Scanner, Food Ripeness, Vision Simulator. It owns the camera/upload UX so each
  tool only cares about the pixels it gets back, and the interaction stays
  identical across the app (one visual language).

  Behavior and accessibility:
  - Opt-in camera: the hardware is only touched when the user presses Start,
    then react-webcam requests permission. Privacy and battery first.
  - Graceful states: idle, live camera, permission denied, and unsupported
    device all render a clear message plus the upload fallback, so it always
    works even with no camera.
  - A focus frame with corner marks and a center target shows exactly what will
    be read; a subtle scanning line animates only while the camera is live and
    only when motion is allowed (reduced-motion hides it).
  - On capture (or upload) we draw the source to an offscreen canvas and hand
    the caller both the canvas (for custom pixel work) and the center hex (the
    common case), so no page re-implements canvas plumbing.
*/

type Mode = "idle" | "camera" | "denied" | "unsupported";

const cameraSupported =
  typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

function rgbToHex(r: number, g: number, b: number): string {
  const h = (n: number) => n.toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

/** Draw a source into an offscreen canvas at its natural size. */
function drawToCanvas(
  source: CanvasImageSource,
  width: number,
  height: number,
): HTMLCanvasElement | null {
  if (!width || !height) return null;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0, width, height);
  return canvas;
}

function centerHex(canvas: HTMLCanvasElement): string | null {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  const cx = Math.floor(canvas.width / 2);
  const cy = Math.floor(canvas.height / 2);
  const { data } = ctx.getImageData(cx, cy, 1, 1);
  return rgbToHex(data[0], data[1], data[2]);
}

export interface CaptureResult {
  /** The full source drawn to a canvas, for custom pixel work. */
  canvas: HTMLCanvasElement;
  /** Convenience: the color at the exact center. */
  centerHex: string | null;
}

interface CameraUploadProps {
  /** Fired on capture or upload with the drawn canvas + center hex. */
  onCapture: (result: CaptureResult) => void;
  /** Verb shown on the capture button while the camera is live. */
  captureLabel?: string;
  className?: string;
}

export function CameraUpload({
  onCapture,
  captureLabel = "Capture",
  className,
}: CameraUploadProps) {
  const regionId = useId();
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>("idle");

  const start = useCallback(() => {
    setMode(cameraSupported ? "camera" : "unsupported");
  }, []);

  const capture = useCallback(() => {
    const video = webcamRef.current?.video;
    if (!video) return;
    const canvas = drawToCanvas(video, video.videoWidth, video.videoHeight);
    if (canvas) onCapture({ canvas, centerHex: centerHex(canvas) });
  }, [onCapture]);

  const handleFile = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const img = new Image();
      img.onload = () => {
        const canvas = drawToCanvas(img, img.naturalWidth, img.naturalHeight);
        if (canvas) onCapture({ canvas, centerHex: centerHex(canvas) });
        URL.revokeObjectURL(img.src);
      };
      img.src = URL.createObjectURL(file);
      setMode("idle");
      event.target.value = "";
    },
    [onCapture],
  );

  return (
    <div className={className}>
      <div
        aria-labelledby={regionId}
        className="relative aspect-square w-full overflow-hidden rounded-card border border-border bg-surface-sunken"
      >
        <span id={regionId} className="sr-only">
          Camera preview
        </span>

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

            {/* Focus frame: corner marks, a center target, and a scanning line
                that sweeps within the frame (motion only). */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-6 overflow-hidden"
            >
              <span className="absolute left-0 top-0 h-6 w-6 rounded-tl-lg border-l-2 border-t-2 border-white/90" />
              <span className="absolute right-0 top-0 h-6 w-6 rounded-tr-lg border-r-2 border-t-2 border-white/90" />
              <span className="absolute bottom-0 left-0 h-6 w-6 rounded-bl-lg border-b-2 border-l-2 border-white/90" />
              <span className="absolute bottom-0 right-0 h-6 w-6 rounded-br-lg border-b-2 border-r-2 border-white/90" />
              <span className="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(0,0,0,0.5)]" />
              <span className="absolute inset-x-0 top-0 h-0.5 bg-accent shadow-[0_0_8px_2px] shadow-accent/50 motion-safe:animate-scan-line motion-reduce:hidden" />
            </span>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-text-muted">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-surface-raised text-accent">
              <Camera size={22} aria-hidden />
            </span>
            {mode === "denied" && (
              <p role="alert" className="text-sm text-text">
                Camera access was blocked. Allow it in your browser settings, or
                upload a photo instead.
              </p>
            )}
            {mode === "unsupported" && (
              <p role="alert" className="text-sm text-text">
                This device doesn't offer camera access here. Upload a photo
                instead.
              </p>
            )}
            {mode === "idle" && (
              <p className="text-sm">Open the camera or upload a photo.</p>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {mode === "camera" ? (
          <>
            <Button onClick={capture}>
              <Scan size={18} aria-hidden />
              {captureLabel}
            </Button>
            <Button variant="ghost" onClick={() => setMode("idle")}>
              <X size={18} aria-hidden />
              Stop
            </Button>
          </>
        ) : (
          <Button onClick={start}>
            <Camera size={18} aria-hidden />
            Open Camera
          </Button>
        )}
        <Button variant="ghost" onClick={() => fileInputRef.current?.click()}>
          <Upload size={18} aria-hidden />
          Upload Image
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
  );
}
