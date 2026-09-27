import { useId } from "react";
import {
  Footprints,
  Layers,
  Lightbulb,
  Repeat,
  Sparkles,
  SunMedium,
} from "lucide-react";
import type { Recommendation, RecommendationKind } from "../outfit-engine";

const ICONS: Record<RecommendationKind, typeof Repeat> = {
  "swap-bottom": Repeat,
  "swap-top": Repeat,
  contrast: SunMedium,
  layer: Layers,
  shoes: Footprints,
  accent: Sparkles,
};

/*
  What to do next, as short named suggestions. Every color is a chip carrying
  its name in words; the swatch is only a companion, since a color-blind user
  shops and dresses by name.
*/
export function OutfitRecommendations({ items }: { items: Recommendation[] }) {
  const headingId = useId();
  if (items.length === 0) return null;

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <h3
        id={headingId}
        className="flex items-center gap-2 text-lg font-bold text-text"
      >
        <Lightbulb size={18} aria-hidden className="text-accent" />
        Recommendations
      </h3>

      <ul className="grid gap-3 md:grid-cols-2">
        {items.map((rec) => {
          const Icon = ICONS[rec.kind];
          return (
            <li
              key={rec.kind}
              className="flex flex-col gap-3 rounded-card border border-border bg-surface-raised p-4 shadow-card"
            >
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-sunken text-accent">
                  <Icon size={18} aria-hidden />
                </span>
                <div>
                  <p className="font-semibold text-text">{rec.title}</p>
                  <p className="text-sm text-text-muted">{rec.detail}</p>
                </div>
              </div>

              <ul className="flex flex-wrap gap-2" aria-label={`${rec.title}: suggested colors`}>
                {rec.colors.map((c) => (
                  <li
                    key={c.name}
                    className="inline-flex min-h-9 items-center gap-2 rounded-full border border-border bg-surface px-3 text-sm font-medium text-text"
                  >
                    <span
                      aria-hidden
                      className="h-4 w-4 rounded-full border border-black/20"
                      style={{ backgroundColor: c.hex }}
                    />
                    {c.name}
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
