import type { NamedColor } from "@/shared/color-engine";
import { StatusBadge } from "@/shared/ui/StatusBadge";

interface ColorResultCardProps {
  color: NamedColor;
}

/*
  Leads with the color's name and plain description, the answer a user who
  can't perceive hue actually needs. The hex is shown last, as a technical
  detail, never as the headline. The swatch is decorative (aria-hidden).
*/
export function ColorResultCard({ color }: ColorResultCardProps) {
  const lowConfidence = color.confidence < 0.6;

  return (
    <section
      aria-label="Color result"
      className="rounded-card border border-border bg-surface-raised p-5"
    >
      <div className="flex items-center gap-4">
        <span
          aria-hidden
          className="h-16 w-16 shrink-0 rounded-2xl border border-border"
          style={{ backgroundColor: color.hex }}
        />
        <div className="min-w-0">
          <p className="text-2xl font-bold text-text">{color.name}</p>
          <p className="text-text-muted">{color.description}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {lowConfidence && (
          <StatusBadge
            tone="uncertain"
            label="Not sure, try better lighting"
            icon={<span aria-hidden>?</span>}
          />
        )}
        <span className="text-xs text-text-muted">{color.hex}</span>
      </div>
    </section>
  );
}
