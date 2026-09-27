import { create } from "zustand";
import { persist } from "zustand/middleware";

/*
  Tutorials: the site-wide welcome tour plus any per-tool walkthroughs. Each
  shows once, on first visit, then gets out of the way; `done` remembers which
  ones the user finished or skipped, keyed by id so any lens can add its own.
  `replaying` is a tour the user asked to see again (from Settings); it is not
  persisted, so a reload never reopens it.
*/

/** Id of the site-wide welcome tour. */
export const WELCOME_TOUR = "welcome";

interface OnboardingState {
  done: Record<string, boolean>;
  replaying: string | null;
  finish: (id: string) => void;
  replay: (id: string) => void;
}

export const useOnboarding = create<OnboardingState>()(
  persist(
    (set) => ({
      done: {},
      replaying: null,
      finish: (id) =>
        set((state) => ({
          done: { ...state.done, [id]: true },
          replaying: state.replaying === id ? null : state.replaying,
        })),
      replay: (id) => set({ replaying: id }),
    }),
    {
      name: "hueful.onboarding",
      partialize: (state) => ({ done: state.done }),
    },
  ),
);
