import type { KeyboardEvent, MouseEvent } from "react";
import { PIECES } from "../outfit-engine";
import type { Piece, Point } from "../outfit-engine";

interface OutfitPhotoProps {
  url: string;
  points: Record<Piece, Point>;
  /** The piece whose marker a tap on the photo moves. */
  active: Piece;
  /** While true, a scan line sweeps the photo and markers are hidden. */
  scanning: boolean;
  onSelect: (piece: Piece) => void;
  onMove: (piece: Piece, point: Point) => void;
}

/** Arrow-key step, as a share of the photo. Shift moves four times as far. */
const NUDGE = 0.02;

const ARROWS: Record<string, [number, number] | undefined> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

/*
  The captured photo with a labeled marker on each spot that was read. The scan
  can land off the clothes (an arm, the background), so the user corrects it:
  tap the photo to move the active marker there, or focus a marker and nudge it
  with the arrow keys. The active marker has a dashed ring, a non-color cue.
*/
export function OutfitPhoto({
  url,
  points,
  active,
  scanning,
  onSelect,
  onMove,
}: OutfitPhotoProps) {
  const place = (event: MouseEvent<HTMLDivElement>) => {
    if (scanning) return;
    const rect = event.currentTarget.getBoundingClientRect();
    onMove(active, {
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
    });
  };

  const nudge = (piece: Piece) => (event: KeyboardEvent<HTMLButtonElement>) => {
    const arrow = ARROWS[event.key];
    if (!arrow) return;
    event.preventDefault();
    const step = event.shiftKey ? NUDGE * 4 : NUDGE;
    onSelect(piece);
    onMove(piece, {
      x: points[piece].x + arrow[0] * step,
      y: points[piece].y + arrow[1] * step,
    });
  };

  return (
    <div className="flex justify-center rounded-card border border-border bg-surface-sunken p-2">
      <div
        className={`relative inline-block ${scanning ? "" : "cursor-crosshair"}`}
        onClick={place}
      >
        <img
          src={url}
          alt="Your outfit photo"
          draggable={false}
          className="block max-h-[45vh] w-auto max-w-full select-none rounded-xl md:max-h-[70vh]"
        />

        {scanning ? (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl"
          >
            <span className="absolute inset-x-0 top-0 h-0.5 bg-accent shadow-[0_0_8px_2px] shadow-accent/50 motion-safe:animate-scan-line" />
          </span>
        ) : (
          PIECES.map(({ id, label }) => {
            const selected = active === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={selected}
                aria-label={`${label} marker. Use the arrow keys to move it.`}
                onClick={(event) => {
                  event.stopPropagation();
                  onSelect(id);
                }}
                onKeyDown={nudge(id)}
                className="absolute h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  left: `${points[id].x * 100}%`,
                  top: `${points[id].y * 100}%`,
                }}
              >
                <span
                  aria-hidden
                  className={[
                    "block h-full w-full rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(0,0,0,0.55)]",
                    selected ? "border-dashed" : "",
                  ].join(" ")}
                />
                <span
                  aria-hidden
                  className={[
                    "absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold",
                    selected
                      ? "bg-white text-black ring-2 ring-black/60"
                      : "bg-black/70 text-white",
                  ].join(" ")}
                >
                  {label}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
