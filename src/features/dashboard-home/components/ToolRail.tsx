import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { lenses } from "@/app/lenses";
import { StateTag } from "@/shared/ui/StateTag";

/*
  Tool rail: the discovery loop, not a menu. Instead of a flat grid of identical
  cards, the tools live in a horizontal scroller where each card carries a
  "leads to" line that points at a natural next tool, so exploring one tool
  invites the next (scan a color, then check if it clashes, then try it on an
  outfit). The rail scrolls by touch/trackpad, and every card is a full link
  with a visible focus ring so keyboard users tab straight through.

  This reads as one continuous strip on phones (the primary device) and keeps
  its horizontal rhythm on wider screens rather than collapsing back into the
  card wall the redesign set out to remove.
*/

/** The natural next step for each tool, keyed by lens path. Drives the loop. */
const NEXT_STEP: Record<string, string> = {
  scan: "Then check it against another color",
  compare: "Then see it on an outfit",
  outfit: "Then judge produce the same way",
  ripeness: "Then see how colors shift for CVD",
  simulate: "Then keep the colors you name",
  saved: "Back to naming a fresh color",
};

export function ToolRail() {
  return (
    <section aria-labelledby="tools-heading" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="tools-heading" className="text-lg font-semibold text-text">
          Explore the tools
        </h2>
        <span className="text-sm text-text-muted">Swipe to see more</span>
      </div>

      {/* Horizontal scroller. Negative margin + padding lets cards bleed to the
          screen edge on phones so the strip reads as scrollable, not clipped. */}
      <ul
        className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {lenses.map((lens) => {
          const Icon = lens.Icon;
          return (
            <li
              key={lens.path}
              className="w-64 shrink-0 snap-start sm:w-72"
            >
              <Link
                to={`/dashboard/${lens.path}`}
                className="group flex h-full flex-col gap-3 rounded-card border border-border bg-surface-raised p-4 shadow-card transition-colors hover:border-primary active:bg-surface-sunken"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-surface-sunken text-primary">
                    <Icon size={22} aria-hidden />
                  </span>
                  <StateTag state={lens.state} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-text">{lens.label}</p>
                  <p className="mt-0.5 text-sm text-text-muted">{lens.summary}</p>
                </div>
                {NEXT_STEP[lens.path] && (
                  <p className="flex items-center gap-1.5 text-xs font-medium text-accent">
                    <ArrowRight size={14} aria-hidden className="shrink-0" />
                    {NEXT_STEP[lens.path]}
                  </p>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
