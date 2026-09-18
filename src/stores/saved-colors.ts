import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { NamedColor } from "@/shared/color-engine";

/*
  Colors the user has chosen to remember. This is a real product feature (the
  "Saved Colors" lens), so it persists to localStorage and is shared through its
  own store, letting the dashboard home, the scanner, and the saved lens all
  read and write the same list without importing each other.

  We store the named color plus when it was saved. Saving is idempotent by hex
  so tapping save twice on the same swatch does not create duplicates; instead
  it moves the color back to the top (most-recent-first).
*/

export interface SavedColor {
  hex: string;
  name: string;
  description: string;
  /** Epoch ms when it was saved. */
  savedAt: number;
}

interface SavedColorsState {
  colors: SavedColor[];
  save: (color: NamedColor) => void;
  remove: (hex: string) => void;
  rename: (hex: string, name: string) => void;
  clear: () => void;
  has: (hex: string) => boolean;
}

export const useSavedColors = create<SavedColorsState>()(
  persist(
    (set, get) => ({
      colors: [],
      save: (color) =>
        set((state) => {
          const without = state.colors.filter(
            (c) => c.hex.toLowerCase() !== color.hex.toLowerCase(),
          );
          const entry: SavedColor = {
            hex: color.hex,
            name: color.name,
            description: color.description,
            savedAt: Date.now(),
          };
          return { colors: [entry, ...without] };
        }),
      remove: (hex) =>
        set((state) => ({
          colors: state.colors.filter(
            (c) => c.hex.toLowerCase() !== hex.toLowerCase(),
          ),
        })),
      rename: (hex, name) =>
        set((state) => ({
          colors: state.colors.map((c) =>
            c.hex.toLowerCase() === hex.toLowerCase()
              ? { ...c, name: name.trim() || c.name }
              : c,
          ),
        })),
      clear: () => set({ colors: [] }),
      has: (hex) =>
        get().colors.some((c) => c.hex.toLowerCase() === hex.toLowerCase()),
    }),
    { name: "hueful.saved-colors" },
  ),
);
