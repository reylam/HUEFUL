import { useEffect } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

/*
  Accessibility preferences the user sets in Settings. These are real, applied
  preferences, not decorative toggles:
  - reducedMotion: an in-app override that forces motion off even if the OS
    setting is not set. Our components already check the OS media query; this
    adds a class hook so CSS can also hard-disable animation.
  - largerText: bumps the root font size, so rem-based type scales up app-wide.
  - higherContrast: strengthens borders and text against the dark surface.

  Applied by toggling data attributes / classes on <html> (see usePreferences),
  so the effect is global and survives navigation. Persisted to localStorage.
*/

interface PreferencesState {
  reducedMotion: boolean;
  largerText: boolean;
  higherContrast: boolean;
  toggle: (key: "reducedMotion" | "largerText" | "higherContrast") => void;
}

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      reducedMotion: false,
      largerText: false,
      higherContrast: false,
      toggle: (key) => set((state) => ({ [key]: !state[key] }) as Partial<PreferencesState>),
    }),
    { name: "hueful.preferences" },
  ),
);

/*
  Applies the current preferences to the document root. Mount once near the app
  root. Kept as a hook so the store stays framework-free and testable.
*/
export function useApplyPreferences() {
  const reducedMotion = usePreferences((s) => s.reducedMotion);
  const largerText = usePreferences((s) => s.largerText);
  const higherContrast = usePreferences((s) => s.higherContrast);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("pref-reduced-motion", reducedMotion);
    root.classList.toggle("pref-larger-text", largerText);
    root.classList.toggle("pref-high-contrast", higherContrast);
  }, [reducedMotion, largerText, higherContrast]);
}
