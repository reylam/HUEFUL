import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import {
  AlertTriangle,
  Check,
  CircleHelp,
  Eye,
  Info,
  Loader2,
  RotateCcw,
} from "lucide-react";
import type { CvdType, RgbColor } from "@/shared/color-engine";
import { Button } from "@/shared/ui/Button";
import { CameraUpload } from "@/shared/ui/CameraUpload";
import type { CaptureResult } from "@/shared/ui/CameraUpload";
import { WELCOME_TOUR, useOnboarding } from "@/stores/onboarding";
import { CVD_PROFILES, useVisionProfile } from "@/stores/vision-profile";
import type { VisionProfileId } from "@/stores/vision-profile";
import { OutfitGuide } from "./components/OutfitGuide";
import { OutfitPhoto } from "./components/OutfitPhoto";
import { OutfitRecommendations } from "./components/OutfitRecommendations";
import {
  OutfitTutorial,
  TUTORIAL_ID,
} from "./components/OutfitTutorial";
import type { TutorialStep } from "./components/OutfitTutorial";
import { FRAMING_TIPS } from "./framing-tips";
import {
  DEFAULT_POINTS,
  MIXED_COVERAGE,
  PIECES,
  assessOutfit,
  describePiece,
  looksAlikeTo,
  preparePhoto,
  scanPiece,
} from "./outfit-engine";
import type { Piece, PieceScan, Point, Verdict } from "./outfit-engine";

/*
  Outfit Matching. Photo first: the user takes (or uploads) a picture of what
  they're wearing, the app scans the top and bottom, says in words whether they
  go together and why, then recommends named colors that would fix or finish
  the outfit. Every result pairs a label with an icon, never a bare colored
  dot, because the reasoning is what a color-blind user actually needs.

  A first visit opens with a short tutorial, which also asks how the user sees
  color. That choice powers a private heads-up in the results when the two
  pieces may look alike to them. The tutorial can be replayed, or opened on the
  color vision step, from beside the camera.

  The scan reads fixed spots that match the camera guide. When a spot misses
  the clothes, the user moves its marker on the photo and everything updates.
*/

interface Photo {
  url: string;
  canvas: HTMLCanvasElement;
}

/** One downward pass of the scan line; results show after it. */
const SCAN_MS = 1300;

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

interface Tour {
  startAt: TutorialStep;
  /** Opened on purpose from the capture screen, not a first visit. */
  replay: boolean;
}

export function OutfitMatchingPage() {
  const tutorialDone = useOnboarding((s) => s.done[TUTORIAL_ID] ?? false);
  const finishTutorial = useOnboarding((s) => s.finish);
  const welcomeDone = useOnboarding((s) => s.done[WELCOME_TOUR] ?? false);
  const profile = useVisionProfile((s) => s.profile);

  const [tour, setTour] = useState<Tour | null>(() =>
    tutorialDone ? null : { startAt: "intro", replay: false },
  );
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [points, setPoints] = useState(DEFAULT_POINTS);
  const [active, setActive] = useState<Piece>("top");
  const [scanning, setScanning] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);
  const focusCaptureNext = useRef(false);

  const closeTour = () => {
    finishTutorial(TUTORIAL_ID);
    focusCaptureNext.current = true;
    setTour(null);
  };

  // When the tutorial closes, land keyboard and screen reader users on the
  // next action, the camera's first button, instead of the top of the page.
  useEffect(() => {
    if (tour || !focusCaptureNext.current) return;
    focusCaptureNext.current = false;
    captureRef.current?.querySelector("button")?.focus();
  }, [tour]);

  const onCapture = useCallback((result: CaptureResult) => {
    const canvas = preparePhoto(result.canvas);
    setPhoto({ canvas, url: canvas.toDataURL("image/jpeg", 0.85) });
    setPoints(DEFAULT_POINTS);
    setActive("top");
    setScanning(!prefersReducedMotion());
  }, []);

  // Let the scan line make one pass before revealing the verdict.
  useEffect(() => {
    if (!scanning) return;
    const timer = window.setTimeout(() => setScanning(false), SCAN_MS);
    return () => window.clearTimeout(timer);
  }, [scanning]);

  // Stagger the results in once the scan finishes (motion only, fails safe).
  useEffect(() => {
    const el = resultRef.current;
    if (!photo || scanning || !el || prefersReducedMotion()) return;
    try {
      gsap.fromTo(
        el.querySelectorAll("[data-reveal]"),
        { autoAlpha: 0, y: 8 },
        { autoAlpha: 1, y: 0, duration: 0.35, stagger: 0.08, ease: "power2.out" },
      );
    } catch {
      // Content is already visible without the animation.
    }
  }, [photo, scanning]);

  const scans = useMemo(() => {
    if (!photo) return null;
    const top = scanPiece(photo.canvas, points.top);
    const bottom = scanPiece(photo.canvas, points.bottom);
    return top && bottom ? { top, bottom } : null;
  }, [photo, points]);

  const assessment = useMemo(
    () => (scans ? assessOutfit(scans.top.rgb, scans.bottom.rgb) : null),
    [scans],
  );

  const movePoint = useCallback(
    (piece: Piece, point: Point) =>
      setPoints((prev) => ({
        ...prev,
        [piece]: { x: clamp01(point.x), y: clamp01(point.y) },
      })),
    [],
  );

  const retake = () => {
    setPhoto(null);
    setScanning(false);
  };

  const activeLabel = PIECES.find((p) => p.id === active)?.label ?? "";
  const profileLabel =
    CVD_PROFILES.find((p) => p.id === profile)?.label ?? "I'm not sure";

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h2 className="text-2xl font-bold text-text">Check your outfit.</h2>
        {/* The tutorial's first step says the same, so skip it there. */}
        {!tour && (
          <p className="mt-1 text-text-muted">
            Take a photo of what you're wearing. We scan your top and bottom,
            tell you whether they go together, and suggest what to change.
          </p>
        )}
      </header>

      {tour ? (
        <OutfitTutorial
          startAt={tour.startAt}
          askVision={!welcomeDone || tour.startAt === "vision"}
          replay={tour.replay}
          onDone={closeTour}
        />
      ) : !photo ? (
        <div ref={captureRef} className="grid gap-6 md:grid-cols-2">
          <CameraUpload
            onCapture={onCapture}
            captureLabel="Scan outfit"
            portrait
            guide={<OutfitGuide />}
            className="mx-auto w-full max-w-sm"
          />

          <aside
            aria-label="Before you scan"
            className="flex flex-col gap-5 self-start rounded-card border border-border bg-surface-raised p-5 shadow-card"
          >
            <div>
              <p className="text-sm font-semibold text-text-muted">
                Your color vision
              </p>
              <div className="flex items-center justify-between gap-3">
                <p className="flex items-center gap-2 font-semibold text-text">
                  <Eye size={18} aria-hidden className="shrink-0 text-accent" />
                  {profileLabel}
                </p>
                <button
                  type="button"
                  onClick={() => setTour({ startAt: "vision", replay: true })}
                  className="-mr-2 inline-flex min-h-11 shrink-0 items-center rounded-2xl px-3 text-sm font-semibold text-primary transition-colors hover:bg-surface-sunken"
                >
                  Change<span className="sr-only"> color vision</span>
                </button>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-text">
                For a good scan
              </p>
              <ul className="flex flex-col gap-3">
                {FRAMING_TIPS.map(({ Icon, text }) => (
                  <li key={text} className="flex items-start gap-2.5 text-sm text-text">
                    <Icon size={18} aria-hidden className="mt-0.5 shrink-0 text-accent" />
                    {text}
                  </li>
                ))}
              </ul>
            </div>

            <Button
              variant="ghost"
              onClick={() => setTour({ startAt: "intro", replay: true })}
              className="self-start"
            >
              <CircleHelp size={18} aria-hidden />
              Replay tutorial
            </Button>
          </aside>
        </div>
      ) : (
        <div ref={resultRef} className="flex flex-col gap-6">
          {/* The photo column holds only the photo, so on phones the verdict
              follows it directly instead of sitting below the fold. */}
          <div className="grid items-start gap-6 md:grid-cols-2">
            <OutfitPhoto
              url={photo.url}
              points={points}
              active={active}
              scanning={scanning}
              onSelect={setActive}
              onMove={movePoint}
            />

            <div className="flex flex-col gap-4">
              {scanning ? (
                <div
                  role="status"
                  className="flex items-center gap-3 rounded-card border border-border bg-surface-raised p-5 shadow-card"
                >
                  <Loader2
                    size={22}
                    aria-hidden
                    className="shrink-0 animate-spin text-accent"
                  />
                  <div>
                    <p className="font-semibold text-text">
                      Scanning your outfit…
                    </p>
                    <p className="text-sm text-text-muted">
                      Reading the colors of your top and bottom.
                    </p>
                  </div>
                </div>
              ) : scans && assessment ? (
                <>
                  <VerdictCard verdict={assessment.verdict} />
                  {/* Always mounted so a heads-up that appears after moving a
                      marker is still announced. */}
                  <div data-reveal aria-live="polite">
                    <VisionNotice
                      top={scans.top.rgb}
                      bottom={scans.bottom.rgb}
                      profile={profile}
                    />
                  </div>
                  <ScannedPieces
                    scans={scans}
                    active={active}
                    onSelect={setActive}
                  />
                  <p className="text-sm text-text-muted">
                    Marker missed your clothes? Tap the photo to move the{" "}
                    <span className="font-semibold text-text">{activeLabel}</span>{" "}
                    marker, or focus a marker and use the arrow keys.
                  </p>
                </>
              ) : (
                <p
                  role="alert"
                  className="rounded-card border border-border bg-surface p-5 text-sm text-text"
                >
                  We couldn't read this photo. Try retaking it or uploading a
                  different one.
                </p>
              )}
              <Button variant="ghost" onClick={retake} className="self-start">
                <RotateCcw size={18} aria-hidden />
                Retake photo
              </Button>
            </div>
          </div>

          {!scanning && assessment && (
            <div data-reveal>
              <OutfitRecommendations items={assessment.recommendations} />
            </div>
          )}
        </div>
      )}

      {/* Honesty note, present whenever a photo is in play. */}
      {!tour && (
        <p className="flex items-start gap-2 rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text-muted">
          <Info size={16} aria-hidden className="mt-0.5 shrink-0 text-accent" />
          Colors in a photo shift with lighting, so this is a styling guide, not
          a guarantee. Daylight or a bright room reads best.
        </p>
      )}
    </div>
  );
}

const CVD_TYPES: CvdType[] = ["deuteranopia", "protanopia", "tritanopia"];

/*
  The private heads-up: the verdict describes how the outfit reads to most
  people, but two clearly different pieces can look alike to someone with color
  blindness. Uses the chosen vision type; "I'm not sure" checks every type so
  the note stays safe, and typical vision never sees it.
*/
function VisionNotice({
  top,
  bottom,
  profile,
}: {
  top: RgbColor;
  bottom: RgbColor;
  profile: VisionProfileId;
}) {
  if (profile === "typical") return null;
  const unsure = profile === "unknown";
  const alike = (unsure ? CVD_TYPES : [profile]).filter((type) =>
    looksAlikeTo(top, bottom, type),
  );
  if (alike.length === 0) return null;

  const types = new Intl.ListFormat("en", { type: "disjunction" }).format(alike);
  const t = describePiece(top).name.toLowerCase();
  const b = describePiece(bottom).name.toLowerCase();

  return (
    <div className="flex items-start gap-3 rounded-card border border-border bg-surface p-4">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-sunken text-accent">
        <Eye size={18} aria-hidden />
      </span>
      <div>
        <p className="font-semibold text-text">
          {unsure
            ? "These may look alike with color blindness"
            : "These may look alike to you"}
        </p>
        <p className="text-sm text-text-muted">
          With {types}, the {t} top and {b} bottom can look like similar shades.
          Most people see two different colors, so go by the verdict above.
        </p>
      </div>
    </div>
  );
}

/** Top vs bottom, in words with an icon, never color alone. */
function VerdictCard({ verdict }: { verdict: Verdict }) {
  return (
    <div
      data-reveal
      aria-live="polite"
      className="flex items-start gap-3 rounded-card border border-border bg-surface-raised p-5 shadow-card"
    >
      <span
        className={[
          "grid h-11 w-11 shrink-0 place-items-center rounded-full",
          verdict.tone === "good"
            ? "bg-status-unripe/20 text-status-unripe-ink"
            : verdict.tone === "ok"
              ? "bg-status-warning/20 text-status-warning-ink"
              : "bg-status-danger/20 text-status-danger-ink",
        ].join(" ")}
      >
        {verdict.tone === "good" ? (
          <Check size={22} aria-hidden />
        ) : (
          <AlertTriangle size={22} aria-hidden />
        )}
      </span>
      <div>
        <p className="text-lg font-bold text-text">{verdict.title}</p>
        <p className="text-sm text-text-muted">{verdict.reason}</p>
      </div>
    </div>
  );
}

/*
  What the scan read for each piece, named in words. Each row also picks which
  marker a tap on the photo moves.
*/
function ScannedPieces({
  scans,
  active,
  onSelect,
}: {
  scans: Record<Piece, PieceScan>;
  active: Piece;
  onSelect: (piece: Piece) => void;
}) {
  return (
    <div data-reveal className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-text">What we read</span>
      <div className="flex flex-col gap-2" role="group" aria-label="Scanned pieces">
        {PIECES.map(({ id, label }) => {
          const scan = scans[id];
          const color = describePiece(scan.rgb);
          const selected = active === id;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(id)}
              className={[
                "flex items-center gap-3 rounded-2xl border bg-surface-raised px-3 py-2.5 text-left transition-colors",
                selected ? "border-primary ring-1 ring-primary" : "border-border hover:bg-surface-sunken",
              ].join(" ")}
            >
              <span
                aria-hidden
                className="h-12 w-12 shrink-0 rounded-xl border border-border"
                style={{ backgroundColor: color.hex }}
              />
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold uppercase tracking-wide text-text-muted">
                  {label}
                </span>
                <span className="block font-semibold text-text">{color.name}</span>
                <span className="block text-sm text-text-muted">
                  {color.description}
                  {scan.coverage < MIXED_COVERAGE &&
                    ". Mixed colors or shadow here, so we read the main one"}
                </span>
              </span>
              {selected && (
                <span className="shrink-0 text-xs font-semibold text-text-muted">
                  Selected
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
