import type { LensState } from "@/app/lenses";

const stateCopy: Record<LensState, { label: string; hint: string }> = {
  ready: { label: "Ready", hint: "Works end to end." },
  prototype: { label: "Prototype", hint: "Works, with known gaps." },
  planned: { label: "Planned", hint: "Not built yet." },
};

/*
  The one place a lens's maturity gets rendered, so every page that lists the
  tools (dashboard home, the public features tour) shows the same label for
  the same state. Previously each page hand-rolled its own pill and its own
  copy of which lens was "planned" vs "ready", and the two drifted out of
  sync. The state itself still lives in `lenses.ts`; this only renders it.
*/
export function StateTag({ state }: { state: LensState }) {
  const { label, hint } = stateCopy[state];
  const ring =
    state === "ready"
      ? "border-status-unripe"
      : state === "prototype"
        ? "border-primary"
        : "border-border";
  return (
    <span
      className={`inline-flex items-center rounded-full border ${ring} bg-surface px-2.5 py-0.5 text-xs font-semibold text-text`}
      title={hint}
    >
      {label}
    </span>
  );
}
