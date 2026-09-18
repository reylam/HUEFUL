import { X, Bookmark } from "lucide-react";
import { useSavedColors } from "@/stores/saved-colors";

/*
  The colors the user has saved, most recent first. Reads the shared
  saved-colors store, so anything saved from the quick namer shows up here live.
  Each entry leads with its name and description (color is on the decorative
  swatch only) and can be removed. A friendly empty state explains what to do
  when nothing is saved yet.
*/
export function RecentColors() {
  const colors = useSavedColors((s) => s.colors);
  const remove = useSavedColors((s) => s.remove);

  return (
    <section
      aria-labelledby="recent-heading"
      className="rounded-card border border-border bg-surface-raised p-5"
    >
      <h2 id="recent-heading" className="text-lg font-semibold text-text">
        Your saved colors
      </h2>

      {colors.length === 0 ? (
        <div className="mt-3 flex items-center gap-3 rounded-2xl border border-dashed border-border px-4 py-5 text-text-muted">
          <Bookmark size={20} aria-hidden className="shrink-0 text-text-muted" />
          <p className="text-sm">
            Nothing saved yet. Name a color above and tap Save to keep it here.
          </p>
        </div>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {colors.slice(0, 6).map((c) => (
            <li
              key={c.hex}
              className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-3 py-2"
            >
              <span
                aria-hidden
                className="h-9 w-9 shrink-0 rounded-xl border border-border"
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
                onClick={() => remove(c.hex)}
                aria-label={`Remove ${c.name}`}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-text-muted hover:bg-surface-raised hover:text-text"
              >
                <X size={16} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
