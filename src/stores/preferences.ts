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
  - higherContrast: strengthens borders and muted text.
  - theme: light (the default), dark, or follow the OS ("system").

  Applied by toggling data attributes / classes on <html> (see usePreferences),
  so the effect is global and survives navigation. Persisted to localStorage.
  index.html reads the same key before first paint so a dark-theme user never
  sees a flash of the light UI.
*/

export type ThemePreference = "light" | "dark" | "system";

interface PreferencesState {
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
  reducedMotion: boolean;
  largerText: boolean;
  higherContrast: boolean;
  toggle: (key: "reducedMotion" | "largerText" | "higherContrast") => void;
}

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      theme: "light",
      setTheme: (theme) => set({ theme }),
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
const THEME_COLOR = { light: "#f6f8fb", dark: "#0b0f14" } as const;

function resolveTheme(theme: ThemePreference): "light" | "dark" {
  if (theme !== "system") return theme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function useApplyPreferences() {
  const theme = usePreferences((s) => s.theme);
  const reducedMotion = usePreferences((s) => s.reducedMotion);
  const largerText = usePreferences((s) => s.largerText);
  const higherContrast = usePreferences((s) => s.higherContrast);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("pref-reduced-motion", reducedMotion);
    root.classList.toggle("pref-larger-text", largerText);
    root.classList.toggle("pref-high-contrast", higherContrast);
  }, [reducedMotion, largerText, higherContrast]);

  useEffect(() => {
    const apply = () => {
      const resolved = resolveTheme(theme);
      document.documentElement.dataset.theme = resolved;
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute("content", THEME_COLOR[resolved]);
    };
    apply();
    if (theme !== "system") return;
    // Follow the OS live while "System" is chosen.
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [theme]);
}
