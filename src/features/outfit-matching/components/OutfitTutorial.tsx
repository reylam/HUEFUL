import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  Eye,
  Lightbulb,
  Pointer,
  ScanLine,
  Shirt,
} from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { VisionProfilePicker } from "@/shared/ui/VisionProfilePicker";
import { DEFAULT_POINTS, PIECES } from "../outfit-engine";
import { FRAMING_TIPS } from "../framing-tips";
import { OutfitGuide } from "./OutfitGuide";

/*
  First-run tutorial for Outfit Matching: what the tool does, how the user sees
  color, how to frame the photo, and how to read and fix the scan.

  UX rules it follows:
  - One idea per step, four steps, with "Step n of 4" spelled out in text.
  - Skip on every step and Back from the second, so it never traps anyone.
  - The vision choice is a real radio group with visible labels, the same one
    Settings uses, and it saves the moment it changes.
  - Focus moves to each new step's heading so screen readers announce it.
  - Steps enter with the app's shared page-in motion, off under reduced motion.
  - It sits inline rather than in a modal, so app navigation stays reachable.
*/

/** Key for remembering that this tutorial was finished or skipped. */
export const TUTORIAL_ID = "outfit";

export type TutorialStep = "intro" | "vision" | "frame" | "markers";

const STEP_TEXT: Record<TutorialStep, { title: string; body: string }> = {
  intro: {
    title: "Check if your outfit matches",
    body: "Take one photo. Hueful reads the colors of your top and bottom, tells you in words whether they go together, and suggests what to wear if they don't.",
  },
  vision: {
    title: "How do you see color?",
    body: "We use this to warn you when two pieces may look alike to you, even though others see different colors. You can change it any time in Settings.",
  },
  frame: {
    title: "Frame your whole outfit",
    body: "The camera shows a Top and a Bottom box. The scan reads the colors inside them, so a good frame means a good read.",
  },
  markers: {
    title: "Check the markers",
    body: "After the scan, a Top and a Bottom marker show where each color was read. If one lands on skin or the wall, tap the right spot on the photo (or use the arrow keys) to move it.",
  },
};

interface OutfitTutorialProps {
  /** Step to open on, e.g. "vision" when changing color vision. */
  startAt?: TutorialStep;
  /**
    Include the color vision step. Off once the welcome tour has asked, so a
    new visitor isn't asked the same question twice in a minute.
  */
  askVision: boolean;
  /**
    Opened on purpose from the capture screen: takes focus right away and offers
    Close rather than Skip. A first visit leaves focus alone on page load.
  */
  replay?: boolean;
  /** Finished, skipped, or closed. */
  onDone: () => void;
}

export function OutfitTutorial({
  startAt = "intro",
  askVision,
  replay = false,
  onDone,
}: OutfitTutorialProps) {
  const labelId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const steps: TutorialStep[] = askVision
    ? ["intro", "vision", "frame", "markers"]
    : ["intro", "frame", "markers"];
  const [index, setIndex] = useState(() =>
    Math.max(0, steps.indexOf(startAt)),
  );
  const step = steps[Math.min(index, steps.length - 1)];

  // The step whose heading last took focus. A first visit counts its opening
  // step as done so loading the page never pulls focus into the tutorial.
  const focusedStep = useRef<TutorialStep | null>(replay ? null : step);
  useEffect(() => {
    if (focusedStep.current === step) return;
    focusedStep.current = step;
    headingRef.current?.focus();
  }, [step]);

  const { title, body } = STEP_TEXT[step];
  const last = index >= steps.length - 1;

  return (
    <section
      aria-labelledby={labelId}
      className="mx-auto flex w-full max-w-xl flex-col rounded-card border border-border bg-surface-raised p-5 shadow-card sm:p-6"
    >
      {/* Progress in words, plus a bar that only repeats it visually. */}
      <div className="flex items-center justify-between gap-3">
        <p id={labelId} className="min-w-0 text-sm font-semibold text-text-muted">
          <span className="text-text">Quick tutorial</span> ·{" "}
          <span className="whitespace-nowrap">
            Step {index + 1} of {steps.length}
          </span>
        </p>
        <button
          type="button"
          onClick={onDone}
          className="-mr-2 inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-2xl px-3 text-sm font-semibold text-text-muted transition-colors hover:bg-surface-sunken hover:text-text"
        >
          {replay ? "Close" : "Skip tutorial"}
        </button>
      </div>
      <div aria-hidden className="mt-1 flex gap-1.5">
        {steps.map((s, i) => (
          <span
            key={s}
            className={[
              "h-1.5 flex-1 rounded-full transition-colors",
              i <= index ? "bg-primary" : "bg-border",
            ].join(" ")}
          />
        ))}
      </div>

      <div key={step} className="mt-5 flex animate-page-in flex-col gap-4">
        <div>
          <h3
            ref={headingRef}
            tabIndex={-1}
            className="focus-heading text-xl font-bold text-text"
          >
            {title}
          </h3>
          <p className="mt-1 text-text-muted">{body}</p>
        </div>
        <StepContent step={step} />
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        {index > 0 ? (
          <Button variant="ghost" onClick={() => setIndex(index - 1)}>
            <ArrowLeft size={18} aria-hidden />
            Back
          </Button>
        ) : (
          <span aria-hidden />
        )}
        {last ? (
          <Button onClick={onDone}>
            Get started
            <ArrowRight size={18} aria-hidden />
          </Button>
        ) : (
          <Button onClick={() => setIndex(index + 1)}>
            Next
            <ArrowRight size={18} aria-hidden />
          </Button>
        )}
      </div>
    </section>
  );
}

function StepContent({ step }: { step: TutorialStep }) {
  if (step === "intro") return <HowItWorks />;
  if (step === "vision") return <VisionProfilePicker legend="Your color vision" />;
  // Picture and text sit side by side, and the text drops below the picture
  // when it would be squeezed (narrow phones, larger text).
  if (step === "frame")
    return (
      <div className="flex flex-wrap items-center gap-4">
        <Viewfinder>
          <OutfitGuide />
        </Viewfinder>
        <div className="min-w-[8.5rem] flex-1">
          <IconList
            items={FRAMING_TIPS.map(({ Icon, text }) => ({
              icon: <Icon size={18} aria-hidden />,
              text,
            }))}
          />
        </div>
      </div>
    );
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Viewfinder>
        <MarkerPreview />
      </Viewfinder>
      <div className="min-w-[8.5rem] flex-1">
        <p className="mb-2 text-sm font-semibold text-text">Then you get:</p>
        <IconList
          items={[
            {
              icon: <Check size={18} aria-hidden />,
              text: "A verdict in words, and why.",
            },
            {
              icon: <Eye size={18} aria-hidden />,
              text: "A heads-up if the pieces may look alike to you.",
            },
            {
              icon: <Lightbulb size={18} aria-hidden />,
              text: "Named colors to try instead.",
            },
          ]}
        />
      </div>
    </div>
  );
}

const FLOW = [
  { Icon: Camera, label: "Take a photo" },
  { Icon: ScanLine, label: "We scan it" },
  { Icon: Shirt, label: "Get advice" },
];

function HowItWorks() {
  return (
    <ol className="grid grid-cols-3 gap-2">
      {FLOW.map(({ Icon, label }) => (
        <li
          key={label}
          className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface px-2 py-3 text-center"
        >
          <span className="grid h-11 w-11 place-items-center rounded-full bg-surface-sunken text-accent">
            <Icon size={20} aria-hidden />
          </span>
          <span className="text-sm font-semibold text-text">{label}</span>
        </li>
      ))}
    </ol>
  );
}

function IconList({ items }: { items: { icon: ReactNode; text: string }[] }) {
  return (
    <ul className="flex min-w-0 flex-col gap-3">
      {items.map(({ icon, text }) => (
        <li key={text} className="flex items-start gap-2.5 text-sm text-text">
          <span className="mt-0.5 shrink-0 text-accent">{icon}</span>
          {text}
        </li>
      ))}
    </ul>
  );
}

/*
  A small camera-style preview with a stand-in figure. Camera previews read as
  dark in both themes, so this uses fixed dark neutrals like the live camera
  overlay does, rather than theme tokens. Decorative: the text beside it says
  the same thing.
*/
function Viewfinder({ children }: { children: ReactNode }) {
  return (
    <div
      aria-hidden
      className="relative aspect-[3/4] w-36 shrink-0 overflow-hidden rounded-2xl bg-slate-800"
    >
      <svg viewBox="0 0 120 160" className="absolute inset-0 h-full w-full">
        <circle cx="60" cy="20" r="10" className="fill-slate-400" />
        <rect x="31" y="34" width="11" height="40" rx="5" className="fill-slate-500" />
        <rect x="78" y="34" width="11" height="40" rx="5" className="fill-slate-500" />
        <rect x="40" y="32" width="40" height="50" rx="8" className="fill-slate-500" />
        <rect x="43" y="80" width="34" height="16" className="fill-slate-600" />
        <rect x="43" y="80" width="16" height="66" className="fill-slate-600" />
        <rect x="61" y="80" width="16" height="66" className="fill-slate-600" />
        <rect x="41" y="144" width="18" height="7" rx="3" className="fill-slate-900" />
        <rect x="61" y="144" width="18" height="7" rx="3" className="fill-slate-900" />
      </svg>
      {children}
    </div>
  );
}

/** The scan's markers in miniature, with a pointer hinting they can be moved. */
function MarkerPreview() {
  return (
    <>
      {PIECES.map(({ id, label }) => (
        <span
          key={id}
          className="absolute h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(0,0,0,0.55)]"
          style={{
            left: `${DEFAULT_POINTS[id].x * 100}%`,
            top: `${DEFAULT_POINTS[id].y * 100}%`,
          }}
        >
          <span className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/70 px-2 py-0.5 text-xs font-semibold text-white">
            {label}
          </span>
        </span>
      ))}
      <Pointer
        size={22}
        className="absolute left-[60%] top-[27%] fill-white text-black"
      />
    </>
  );
}
