import { useId, useMemo, useState } from "react";
import { Check, Bookmark, Shuffle } from "lucide-react";
import { hexToRgb, nameColor } from "@/shared/color-engine";
import type { NamedColor } from "@/shared/color-engine";
import { StatusBadge } from "@/shared/ui/StatusBadge";
import { useSavedColors } from "@/stores/saved-colors";

/*
  A working color namer right on the dashboard home, so the app does something
  useful the moment you land, not just link out. Pick a color (or shuffle a
  random one) and it is named live via the color engine, led by name and plain
  description with the hex last, and can be saved to the shared saved-colors
  store. Never color alone: the swatch is decorative, the answer is words + a
  low-confidence badge with icon and text.
*/

function randomHex(): string {
  const n = Math.floor(Math.random() * 0xffffff);
  return `#${n.toString(16).padStart(6, "0")}`;
}

export function QuickNamer() {
  const inputId = useId();
  const [hex, setHex] = useState("#8a5a28");

  const save = useSavedColors((s) => s.save);
  const saved = useSavedColors((s) => s.colors);

  const color: NamedColor | null = useMemo(() => {
    const rgb = hexToRgb(hex);
    return rgb ? nameColor(rgb) : null;
  }, [hex]);

  const isSaved = color
    ? saved.some((c) => c.hex.toLowerCase() === color.hex.toLowerCase())
    : false;
  const lowConfidence = color ? color.confidence < 0.6 : false;

  return (
    <section
      aria-labelledby="quick-namer-heading"
      className="rounded-card border border-border bg-surface-raised p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="quick-namer-heading" className="text-lg font-semibold text-text">
          Name a color now
        </h2>
        <div className="flex items-center gap-2">
          <label
            htmlFor={inputId}
            className="flex min-h-11 cursor-pointer items-center gap-2 rounded-2xl border border-border bg-surface px-3 text-sm font-medium text-text"
          >
            <input
              id={inputId}
              type="color"
              value={hex}
              onChange={(e) => setHex(e.target.value)}
              className="h-7 w-7 cursor-pointer rounded-md border-0 bg-transparent p-0"
            />
            Pick
          </label>
          <button
            type="button"
            onClick={() => setHex(randomHex())}
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-border px-3 text-sm font-medium text-text hover:bg-surface"
          >
            <Shuffle size={16} aria-hidden />
            Shuffle
          </button>
        </div>
      </div>

      {color ? (
        <div className="mt-4 flex items-center gap-4">
          <span
            aria-hidden
            className="h-16 w-16 shrink-0 rounded-2xl border border-border"
            style={{ backgroundColor: color.hex }}
          />
          <div className="min-w-0 flex-1">
            <p className="text-2xl font-bold text-text">{color.name}</p>
            <p className="text-text-muted">{color.description}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {lowConfidence && (
                <StatusBadge
                  tone="uncertain"
                  label="Not sure, try better lighting"
                  icon={<span aria-hidden>?</span>}
                />
              )}
              <span className="text-xs text-text-muted">{color.hex}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => color && save(color)}
            disabled={isSaved}
            aria-pressed={isSaved}
            className={[
              "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-2xl px-4 text-sm font-semibold transition-colors",
              isSaved
                ? "border border-border text-text-muted"
                : "bg-primary text-primary-foreground hover:brightness-110",
            ].join(" ")}
          >
            {isSaved ? (
              <>
                <Check size={16} aria-hidden />
                Saved
              </>
            ) : (
              <>
                <Bookmark size={16} aria-hidden />
                Save
              </>
            )}
          </button>
        </div>
      ) : (
        <p role="alert" className="mt-4 text-status-danger">
          That doesn't look like a valid color. Try again.
        </p>
      )}
    </section>
  );
}
