import { DEFAULT_POINTS, PIECES } from "../outfit-engine";

/*
  Camera overlay for framing an outfit: a labeled zone for the top and one for
  the bottom. The body segmenter finds the clothes wherever they are, but each
  zone is centered on the spot the scan falls back to when it can't, so lining
  the clothes up with the zones means even that read lands on fabric. Labels
  are words, so the guide never depends on seeing color.
*/
export function OutfitGuide() {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0">
      {PIECES.map(({ id, label }) => (
        <span
          key={id}
          className="absolute left-1/2 h-[18%] w-[44%] -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 border-dashed border-white/90 shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
          style={{ top: `${DEFAULT_POINTS[id].y * 100}%` }}
        >
          <span className="absolute left-1.5 top-1.5 rounded-full bg-black/65 px-1.5 py-0.5 text-xs font-semibold text-white">
            {label}
          </span>
        </span>
      ))}
    </span>
  );
}
