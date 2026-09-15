import type { ReactNode } from "react";

/*
  StatusBadge is the concrete enforcement of the never-color-alone law: it
  refuses to render a status by color only. A caller MUST pass a label and an
  icon; the color swatch is decorative (aria-hidden) and additive.
*/

export type StatusTone =
  | "ripe"
  | "unripe"
  | "overripe"
  | "warning"
  | "danger"
  | "uncertain";

interface StatusBadgeProps {
  tone: StatusTone;
  label: string;
  /** A non-color cue: icon or shape. Required, because color is never the only signal. */
  icon: ReactNode;
}

const toneColor: Record<StatusTone, string> = {
  ripe: "bg-status-ripe",
  unripe: "bg-status-unripe",
  overripe: "bg-status-overripe",
  warning: "bg-status-warning",
  danger: "bg-status-danger",
  uncertain: "bg-status-uncertain",
};

export function StatusBadge({ tone, label, icon }: StatusBadgeProps) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-surface-raised px-3 py-1.5 text-sm font-medium text-text">
      <span aria-hidden className="text-text">
        {icon}
      </span>
      <span
        aria-hidden
        className={`h-2.5 w-2.5 rounded-full ${toneColor[tone]}`}
      />
      <span>{label}</span>
    </span>
  );
}
