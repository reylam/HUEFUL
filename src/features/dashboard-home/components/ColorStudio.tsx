import { useCallback, useId, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import { Bookmark, Check, Shuffle } from "lucide-react";
import { useSavedColors } from "@/stores/saved-colors";
import { useAwardXp } from "@/shared/progress/useAwardXp";
import { StatusBadge } from "@/shared/ui/StatusBadge";
import {
  SCHEMES,
  hexAtHue,
  hueOfHex,
  randomVividHex,
  studioFromHex,
} from "../studio";
import type { HarmonyScheme } from "@/shared/color-engine";
import type { StudioColor } from "../studio";

/*
  Color Studio: the dashboard's hero. Not a banner, an instrument. The user
  drags along a hue rail (or picks an exact color, or shuffles) and the studio
  answers live: the explored color is named in plain language and its related
  colors appear, each named too, with one sentence on why they belong. This is
  the whole product in one surface: color in, meaning out, never a bare swatch.

  Interaction is direct manipulation with a real slider underneath, so it works
  by drag, tap, and keyboard alike. The hue rail is the only moving part and it
  tracks the pointer with plain state (no animation lib, nothing to disable for
  reduced motion). Saving a color grants XP through the shared progress store,
  the same currency the rest of the app uses.
*/

const START_HEX = "#0aa2e6";

export function ColorStudio() {
  const railId = useId();
  const railRef = useRef<HTMLDivElement>(null);
  const [hex, setHex] = useState(START_HEX);
  const [scheme, setScheme] = useState<HarmonyScheme>("complementary");
  const dragging = useRef(false);

  const save = useSavedColors((s) => s.save);
  const savedColors = useSavedColors((s) => s.colors);
  const award = useAwardXp();

  const result = studioFromHex(hex, scheme);

  const setHueFromClientX = useCallback((clientX: number) => {
    const el = railRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    setHex((prev) => hexAtHue(prev, pct * 360));
  }, []);

  const onPointerDown = (e: ReactPointerEvent) => {
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setHueFromClientX(e.clientX);
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    if (dragging.current) setHueFromClientX(e.clientX);
  };
  const onPointerUp = () => {
    dragging.current = false;
  };

  const onRailKey = (e: KeyboardEvent) => {
    const hue = hueOfHex(hex);
    if (e.key === "ArrowLeft" || e.key === "ArrowDown")
      setHex(hexAtHue(hex, hue - 6));
    else if (e.key === "ArrowRight" || e.key === "ArrowUp")
      setHex(hexAtHue(hex, hue + 6));
    else return;
    e.preventDefault();
  };

  if (!result) return null;
  const { base, partners, reason } = result;
  const huePct = hueOfHex(hex) / 360;

  const isSaved = (c: StudioColor) =>
    savedColors.some((s) => s.hex.toLowerCase() === c.hex.toLowerCase());

  const onSave = (c: StudioColor) => {
    if (isSaved(c)) return;
    save(c);
    award(10, "Saved a color");
  };

  return (
    <section
      aria-labelledby="studio-heading"
      className="overflow-hidden rounded-card border border-border bg-surface-raised shadow-card"
    >
      {/* A big, quiet color field so the explored color itself is the hero, not
          a gradient we drew on top of it. The name sits on the field in a chip
          that stays legible on any background (never text straight on color). */}
      <div
        className="relative flex min-h-44 flex-col justify-end gap-3 p-5 sm:min-h-56"
        style={{ backgroundColor: base.hex }}
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="max-w-full rounded-2xl bg-surface/85 px-4 py-2.5 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              You are exploring
            </p>
            <p className="text-2xl font-bold leading-tight text-text">
              {base.name}
            </p>
            <p className="text-sm text-text-muted">
              {base.description} · <span className="font-mono">{base.hex}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-2xl bg-surface/85 px-3 text-sm font-medium text-text backdrop-blur">
              <input
                type="color"
                value={base.hex}
                onChange={(e) => setHex(e.target.value)}
                className="h-7 w-7 cursor-pointer rounded-md border-0 bg-transparent p-0"
                aria-label="Pick an exact color"
              />
              Pick
            </label>
            <button
              type="button"
              onClick={() => setHex(randomVividHex())}
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-surface/85 px-3 text-sm font-medium text-text backdrop-blur hover:bg-surface"
            >
              <Shuffle size={16} aria-hidden />
              Shuffle
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5 p-5">
        {/* Hue rail: drag, tap, or focus and use arrow keys. */}
        <div>
          <div className="flex items-center justify-between">
            <span id={`${railId}-label`} className="text-sm font-semibold text-text">
              Drag to explore hues
            </span>
            <span className="text-xs text-text-muted">or use arrow keys</span>
          </div>
          <div
            ref={railRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            className="relative mt-2 h-9 w-full cursor-ew-resize touch-none rounded-full border border-border"
            style={{
              background:
                "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
            }}
          >
            <div
              role="slider"
              tabIndex={0}
              aria-labelledby={`${railId}-label`}
              aria-valuemin={0}
              aria-valuemax={360}
              aria-valuenow={Math.round(hueOfHex(hex))}
              aria-valuetext={`Hue ${Math.round(hueOfHex(hex))} degrees, ${base.name}`}
              onKeyDown={onRailKey}
              className="absolute top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[var(--handle)] shadow-float focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
              style={
                {
                  left: `${huePct * 100}%`,
                  "--handle": base.hex,
                } as React.CSSProperties
              }
            />
          </div>
        </div>

        {/* Scheme switcher: changes what "related" means, live. */}
        <div>
          <div
            role="group"
            aria-label="Color relationship"
            className="inline-flex rounded-2xl border border-border bg-surface p-1"
          >
            {SCHEMES.map((s) => {
              const selected = s.id === scheme;
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setScheme(s.id)}
                  className={[
                    "min-h-9 rounded-xl px-3 text-sm font-medium transition-colors",
                    selected
                      ? "bg-primary text-primary-foreground"
                      : "text-text-muted hover:text-text",
                  ].join(" ")}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-sm text-text-muted">{reason}</p>
        </div>

        {/* Related colors: each named, each saveable. Never a bare swatch. */}
        <ul className="grid gap-2 sm:grid-cols-2">
          {partners.map((c) => (
            <li
              key={c.hex}
              className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-3 py-2"
            >
              <span
                aria-hidden
                className="h-11 w-11 shrink-0 rounded-xl border border-border"
                style={{ backgroundColor: c.hex }}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-text">
                  {c.name}
                </span>
                <span className="block truncate text-xs text-text-muted">
                  {c.description} · {c.hex}
                </span>
              </span>
              <button
                type="button"
                onClick={() => onSave(c)}
                disabled={isSaved(c)}
                aria-pressed={isSaved(c)}
                aria-label={isSaved(c) ? `${c.name} saved` : `Save ${c.name}`}
                className={[
                  "grid h-10 w-10 shrink-0 place-items-center rounded-full transition-colors",
                  isSaved(c)
                    ? "text-status-unripe-ink"
                    : "text-text-muted hover:bg-surface-sunken hover:text-text",
                ].join(" ")}
              >
                {isSaved(c) ? (
                  <Check size={18} aria-hidden />
                ) : (
                  <Bookmark size={18} aria-hidden />
                )}
              </button>
            </li>
          ))}
        </ul>

        {base.confidence < 0.6 && (
          <StatusBadge
            tone="uncertain"
            label="This hue sits between names, so the label is a best guess"
            icon={<span aria-hidden>?</span>}
          />
        )}
      </div>
    </section>
  );
}
