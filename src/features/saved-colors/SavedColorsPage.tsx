import { useState } from "react";
import { Trash2, Bookmark, Copy, Pencil, Eye, Check, X } from "lucide-react";
import { toast } from "sonner";
import { hexToRgb, rgbToHsl } from "@/shared/color-engine";
import { useSavedColors } from "@/stores/saved-colors";
import type { SavedColor } from "@/stores/saved-colors";
import { Button } from "@/shared/ui/Button";
import { Reveal } from "@/shared/ui/Reveal";

/*
  Saved Colors. The collection of colors the user chose to remember, most recent
  first (from the shared, persisted store). Each row leads with the color's name
  and description; the swatch is decorative, so the list makes sense with no
  color perception. Per color you can view its exact values, rename it, copy the
  HEX, or delete it. New entries reveal in; deletes confirm with a toast.
*/
export function SavedColorsPage() {
  const colors = useSavedColors((s) => s.colors);
  const remove = useSavedColors((s) => s.remove);
  const clear = useSavedColors((s) => s.clear);

  if (colors.length === 0) {
    return (
      <div className="flex flex-col gap-5">
        <header>
          <h2 className="text-2xl font-bold text-text">Your saved colors.</h2>
          <p className="mt-1 text-text-muted">
            Colors you keep from any tool land here.
          </p>
        </header>
        <div className="flex flex-col items-start gap-3 rounded-card border border-dashed border-border p-8 text-text-muted">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-surface-raised text-accent">
            <Bookmark size={22} aria-hidden />
          </span>
          <p className="text-lg font-semibold text-text">
            No saved colors yet.
          </p>
          <p className="max-w-sm text-sm">
            Save a color from any tool and it will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-text">Your saved colors.</h2>
          <p className="mt-1 text-text-muted">
            {colors.length} {colors.length === 1 ? "color" : "colors"}, most
            recent first.
          </p>
        </div>
        <Button variant="ghost" onClick={clear}>
          Clear all
        </Button>
      </header>

      <ul className="grid gap-3 sm:grid-cols-2">
        {colors.map((c, i) => (
          <li key={c.hex}>
            <Reveal delay={Math.min(i * 0.04, 0.3)}>
              <SavedColorCard color={c} onRemove={() => remove(c.hex)} />
            </Reveal>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SavedColorCard({
  color,
  onRemove,
}: {
  color: SavedColor;
  onRemove: () => void;
}) {
  const rename = useSavedColors((s) => s.rename);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(color.name);
  const [expanded, setExpanded] = useState(false);

  const rgb = hexToRgb(color.hex);
  const hsl = rgb ? rgbToHsl(rgb) : null;

  const copyHex = async () => {
    try {
      await navigator.clipboard.writeText(color.hex.toUpperCase());
      toast.success(`Copied ${color.hex.toUpperCase()}`);
    } catch {
      toast.error("Couldn't copy. Your browser blocked clipboard access.");
    }
  };

  const commitRename = () => {
    rename(color.hex, draft);
    setEditing(false);
  };

  return (
    <div className="flex flex-col gap-3 rounded-card border border-border bg-surface-raised p-4">
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="h-14 w-14 shrink-0 rounded-2xl border border-border"
          style={{ backgroundColor: color.hex }}
        />
        <div className="min-w-0 flex-1">
          {editing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                commitRename();
              }}
              className="flex items-center gap-2"
            >
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                aria-label="Color name"
                className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-2 py-1 text-base font-semibold text-text"
              />
              <button
                type="submit"
                aria-label="Save name"
                className="grid h-8 w-8 place-items-center rounded-lg text-status-unripe hover:bg-surface"
              >
                <Check size={16} aria-hidden />
              </button>
              <button
                type="button"
                aria-label="Cancel"
                onClick={() => {
                  setDraft(color.name);
                  setEditing(false);
                }}
                className="grid h-8 w-8 place-items-center rounded-lg text-text-muted hover:bg-surface"
              >
                <X size={16} aria-hidden />
              </button>
            </form>
          ) : (
            <>
              <p className="truncate text-lg font-bold text-text">
                {color.name}
              </p>
              <p className="truncate text-sm text-text-muted">
                {color.description}
              </p>
            </>
          )}
        </div>
      </div>

      {expanded && rgb && hsl && (
        <dl className="grid grid-cols-3 gap-2 text-center text-xs">
          {[
            { k: "HEX", v: color.hex.toUpperCase() },
            { k: "RGB", v: `${rgb.r},${rgb.g},${rgb.b}` },
            { k: "HSL", v: `${hsl.h},${hsl.s},${hsl.l}` },
          ].map((row) => (
            <div key={row.k} className="rounded-lg border border-border bg-surface p-2">
              <dt className="font-semibold uppercase tracking-wide text-text-muted">
                {row.k}
              </dt>
              <dd className="mt-0.5 font-mono text-text">{row.v}</dd>
            </div>
          ))}
        </dl>
      )}

      {/* Actions row. Icon + label, real buttons, min touch target. */}
      <div className="flex flex-wrap items-center gap-1">
        <CardAction
          icon={<Eye size={15} aria-hidden />}
          label={expanded ? "Hide" : "View"}
          onClick={() => setExpanded((v) => !v)}
        />
        <CardAction
          icon={<Pencil size={15} aria-hidden />}
          label="Rename"
          onClick={() => setEditing(true)}
        />
        <CardAction
          icon={<Copy size={15} aria-hidden />}
          label="Copy HEX"
          onClick={copyHex}
        />
        <CardAction
          icon={<Trash2 size={15} aria-hidden />}
          label="Delete"
          onClick={onRemove}
          danger
        />
      </div>
    </div>
  );
}

function CardAction({
  icon,
  label,
  onClick,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium transition-colors",
        danger
          ? "text-text-muted hover:bg-status-danger/15 hover:text-status-danger"
          : "text-text-muted hover:bg-surface hover:text-text",
      ].join(" ")}
    >
      {icon}
      {label}
    </button>
  );
}
