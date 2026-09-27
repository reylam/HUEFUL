import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  CircleHelp,
  Type,
} from "lucide-react";
import mascot from "@/assets/images/mascot.png";
import { lenses } from "@/app/lenses";
import { Button } from "@/shared/ui/Button";
import { StatusBadge } from "@/shared/ui/StatusBadge";
import { VisionProfilePicker } from "@/shared/ui/VisionProfilePicker";
import { WELCOME_TOUR, useOnboarding } from "@/stores/onboarding";

/*
  The site-wide welcome tour. It opens on a visitor's first page (any page but
  sign in and sign up), and Settings can replay it.

  UX rules it follows:
  - A native modal <dialog>, like the More sheet: focus stays inside and comes
    back on close, the page behind is inert, and Esc skips the tour.
  - A bottom sheet on phones, a centered card from md up. The header and footer
    stay put while the step scrolls, so Skip, Back, and Next are always in reach.
  - Four short steps with "Step n of 4" in text: welcome, how you see color,
    how answers read, where to start. Skip on every step, Back from the second.
  - The color vision choice is the same radio group as Settings and saves
    immediately.
  - Focus moves to each step's heading so screen readers announce it.
  - Steps enter with the app's shared page-in motion, off under reduced motion.
*/

const STEPS = [
  {
    title: "Welcome to Hueful",
    body: "Hueful is a color assistant for people with color vision deficiency. Point your camera at something and it tells you the color in plain words, whether two colors match, and more.",
  },
  {
    title: "How do you see color?",
    body: "Tools use this to tailor their explanations, like warning you when two colors may look alike to you. You can change it any time in Settings.",
  },
  {
    title: "Answers in words, never color alone",
    body: "Every result is written out, so nothing depends on seeing the color itself.",
  },
  {
    title: "Where would you like to start?",
    body: "Pick a tool to jump in, or close this and look around. Every tool is always in the menu.",
  },
];

export function WelcomeTour() {
  const labelId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const finish = useOnboarding((s) => s.finish);
  const [step, setStep] = useState(0);

  // Open as a modal on mount. Guarded because React's dev double-run of effects
  // would otherwise call showModal() on a dialog that is already open.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  // Each step starts at its top with focus on its heading.
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
    headingRef.current?.focus();
  }, [step]);

  // Every exit (Skip, Done, Esc, choosing a tool) closes the dialog, and the
  // close event marks the tour done, so there is exactly one way out.
  const close = () => dialogRef.current?.close();

  const { title, body } = STEPS[step];
  const last = step === STEPS.length - 1;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={labelId}
      onClose={() => finish(WELCOME_TOUR)}
      className="tour-sheet mb-0 mt-auto max-h-[92dvh] w-full max-w-none flex-col rounded-t-3xl border-t border-border bg-surface-raised p-0 text-text backdrop:bg-[#0c2340]/40 open:flex md:m-auto md:max-h-[85dvh] md:max-w-lg md:rounded-3xl md:border"
    >
      {/* Progress in words, plus a bar that only repeats it visually. */}
      <div className="shrink-0 px-5 pt-4 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <p id={labelId} className="min-w-0 text-sm font-semibold text-text-muted">
            <span className="text-text">Welcome tour</span> ·{" "}
            <span className="whitespace-nowrap">
              Step {step + 1} of {STEPS.length}
            </span>
          </p>
          <button
            type="button"
            onClick={close}
            className="-mr-2 inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-2xl px-3 text-sm font-semibold text-text-muted transition-colors hover:bg-surface-sunken hover:text-text"
          >
            {last ? "Close" : "Skip tour"}
          </button>
        </div>
        <div aria-hidden className="mt-1 flex gap-1.5">
          {STEPS.map((s, i) => (
            <span
              key={s.title}
              className={[
                "h-1.5 flex-1 rounded-full transition-colors",
                i <= step ? "bg-primary" : "bg-border",
              ].join(" ")}
            />
          ))}
        </div>
      </div>

      <div
        ref={bodyRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 pt-5 sm:px-6"
      >
        <div key={step} className="flex animate-page-in flex-col gap-4">
          <div>
            <h2
              ref={headingRef}
              tabIndex={-1}
              className="focus-heading text-xl font-bold text-text"
            >
              {title}
            </h2>
            <p className="mt-1 text-text-muted">{body}</p>
          </div>
          <StepContent step={step} onChooseTool={close} />
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border px-5 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 sm:px-6">
        {step > 0 ? (
          <Button variant="ghost" onClick={() => setStep(step - 1)}>
            <ArrowLeft size={18} aria-hidden />
            Back
          </Button>
        ) : (
          <span aria-hidden />
        )}
        {last ? (
          <Button onClick={close}>
            <Check size={18} aria-hidden />
            Done
          </Button>
        ) : (
          <Button onClick={() => setStep(step + 1)}>
            Next
            <ArrowRight size={18} aria-hidden />
          </Button>
        )}
      </div>
    </dialog>
  );
}

function StepContent({
  step,
  onChooseTool,
}: {
  step: number;
  onChooseTool: () => void;
}) {
  if (step === 0)
    return (
      <>
        <img
          src={mascot}
          alt=""
          className="mx-auto h-36 w-auto select-none sm:h-44"
          draggable={false}
        />
        <p className="text-center text-sm text-text-muted">
          This quick tour takes under a minute.
        </p>
      </>
    );

  if (step === 1) return <VisionProfilePicker legend="Your color vision" />;

  if (step === 2) return <AnswersExample />;

  return (
    <ul className="flex flex-col gap-1">
      {lenses.map(({ path, label, summary, Icon }) => (
        <li key={path}>
          <Link
            to={`/dashboard/${path}`}
            onClick={onChooseTool}
            className="flex min-h-14 items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-surface active:bg-surface-sunken"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-sunken text-primary">
              <Icon size={20} aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-text">{label}</span>
              <span className="block text-sm text-text-muted">{summary}</span>
            </span>
            <ChevronRight size={18} aria-hidden className="shrink-0 text-text-muted" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

/*
  A sample reading, built from the same parts the tools use, so the promise
  ("words, never color alone") is shown rather than only stated.
*/
function AnswersExample() {
  return (
    <>
      <figure className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
        <figcaption className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          Example reading
        </figcaption>
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="h-12 w-12 shrink-0 rounded-xl border border-border"
            style={{ backgroundColor: "#5a3a1e" }}
          />
          <div>
            <p className="font-semibold text-text">Dark brown</p>
            <p className="text-sm text-text-muted">dark, muted</p>
          </div>
        </div>
        <div>
          <StatusBadge
            tone="uncertain"
            label="Not sure, try better lighting"
            icon={<span aria-hidden>?</span>}
          />
        </div>
      </figure>

      <ul className="flex flex-col gap-3">
        {[
          {
            Icon: Type,
            text: "Colors get plain names with brightness words, like “dark, muted”.",
          },
          {
            Icon: Check,
            text: "Verdicts pair a word with an icon, like Good match or They clash.",
          },
          {
            Icon: CircleHelp,
            text: "When a reading is shaky, we say so instead of guessing.",
          },
        ].map(({ Icon, text }) => (
          <li key={text} className="flex items-start gap-2.5 text-sm text-text">
            <Icon size={18} aria-hidden className="mt-0.5 shrink-0 text-accent" />
            {text}
          </li>
        ))}
      </ul>
    </>
  );
}
