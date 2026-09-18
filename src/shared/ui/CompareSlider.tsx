import { useId, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";

interface CompareSliderProps {
  /** Left/base layer (e.g. the original image). */
  before: ReactNode;
  /** Right/overlay layer, revealed from the right (e.g. the simulation). */
  after: ReactNode;
  /** Small label for the before layer, shown as a corner chip. */
  beforeLabel?: string;
  /** Small label for the after layer. */
  afterLabel?: string;
  className?: string;
}

/*
  A draggable before/after comparison. The after layer is clipped to the right
  of a divider the user drags; drag the handle or, for keyboard users, focus it
  and use the arrow keys (it is a real slider with aria attributes). Pointer
  events are used so it works with mouse, touch, and pen alike.

  No animation library: the position is plain state driving inline widths, so it
  tracks the pointer at native speed and needs no reduced-motion handling (there
  is no incidental motion, only direct manipulation).
*/
export function CompareSlider({
  before,
  after,
  beforeLabel = "Original",
  afterLabel = "Simulation",
  className,
}: CompareSliderProps) {
  const labelId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(50); // percent from the left
  const dragging = useRef(false);

  const setFromClientX = (clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, pct)));
  };

  const onPointerDown = (e: ReactPointerEvent) => {
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setFromClientX(e.clientX);
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    if (!dragging.current) return;
    setFromClientX(e.clientX);
  };
  const onPointerUp = () => {
    dragging.current = false;
  };

  return (
    <div
      ref={containerRef}
      className={[
        "relative aspect-video w-full select-none overflow-hidden rounded-card border border-border bg-surface-sunken",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* Before layer fills the box. */}
      <div className="absolute inset-0">{before}</div>

      {/* Corner label for the before layer. */}
      <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-surface/80 px-2 py-0.5 text-xs font-semibold text-text backdrop-blur">
        {beforeLabel}
      </span>

      {/* After layer, clipped to the right of the divider. */}
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 0 0 ${pos}%)` }}
      >
        {after}
        <span className="pointer-events-none absolute right-2 top-2 rounded-full bg-surface/80 px-2 py-0.5 text-xs font-semibold text-text backdrop-blur">
          {afterLabel}
        </span>
      </div>

      {/* Divider + handle. The handle is a real slider for keyboard users. */}
      <div
        className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white/90"
        style={{ left: `${pos}%` }}
      >
        <span id={labelId} className="sr-only">
          Reveal amount, {beforeLabel} versus {afterLabel}
        </span>
        <div
          role="slider"
          tabIndex={0}
          aria-labelledby={labelId}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pos)}
          aria-valuetext={`${Math.round(pos)} percent`}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") setPos((p) => Math.max(0, p - 5));
            else if (e.key === "ArrowRight") setPos((p) => Math.min(100, p + 5));
            else if (e.key === "Home") setPos(0);
            else if (e.key === "End") setPos(100);
          }}
          className="absolute left-1/2 top-1/2 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize place-items-center rounded-full border border-border bg-surface-raised text-text shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus)]"
        >
          <span aria-hidden className="text-xs font-bold">
            ‹ ›
          </span>
        </div>
      </div>
    </div>
  );
}
