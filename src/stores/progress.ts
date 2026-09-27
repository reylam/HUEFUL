import { create } from "zustand";
import { persist } from "zustand/middleware";

/*
  The player's progress. This is a real product feature, not decoration: XP is
  only ever granted for genuine actions (naming a color, saving one, running a
  ripeness check, winning the daily challenge), levels are derived from that XP,
  and achievements unlock from the same real counters. Everything persists to
  localStorage so a returning user keeps their streak and level.

  Kept framework-free in its own store so any lens can award XP without importing
  another feature. The UI layer (useAwardXp) handles the celebration; this store
  only owns the numbers and the honest unlock rules.
*/

/** One XP action. The label is shown in the reward toast. */
export type XpReason =
  | "Named a color"
  | "Saved a color"
  | "Ripeness checked"
  | "Outfit checked"
  | "Daily challenge"
  | "Color matched";

export interface Achievement {
  id: string;
  label: string;
  /** One plain line describing how it was earned. */
  hint: string;
}

/*
  Achievement definitions. Each rule reads the store's own counters, so an
  achievement can only unlock from actions that actually happened. Order is the
  display order.
*/
export const ACHIEVEMENTS: (Achievement & {
  earned: (s: ProgressCounters) => boolean;
})[] = [
  {
    id: "first-name",
    label: "First Color Named",
    hint: "Name your first color.",
    earned: (s) => s.namedCount >= 1,
  },
  {
    id: "collector",
    label: "Color Collector",
    hint: "Save 5 colors.",
    earned: (s) => s.savedCount >= 5,
  },
  {
    id: "fruit-detective",
    label: "Fruit Detective",
    hint: "Run 3 ripeness checks.",
    earned: (s) => s.ripenessCount >= 3,
  },
  {
    id: "challenger",
    label: "Sharp Eye",
    hint: "Win the daily challenge.",
    earned: (s) => s.challengeWins >= 1,
  },
  {
    id: "streak-3",
    label: "On a Roll",
    hint: "Keep a 3-day streak.",
    earned: (s) => s.streak >= 3,
  },
  {
    id: "explorer",
    label: "Color Explorer",
    hint: "Reach level 5.",
    earned: (s) => levelFromXp(s.xp).level >= 5,
  },
];

/** Raw counters the achievement rules read. */
interface ProgressCounters {
  xp: number;
  namedCount: number;
  savedCount: number;
  ripenessCount: number;
  outfitCount: number;
  challengeWins: number;
  streak: number;
}

/*
  Levels grow with a gentle curve: each level needs a bit more XP than the last,
  so early wins come fast and later ones feel earned. Returns the current level
  plus how far into it the user is, for the progress ring.
*/
export function levelFromXp(xp: number): {
  level: number;
  intoLevel: number;
  levelSpan: number;
} {
  let level = 1;
  let remaining = xp;
  let span = 100;
  while (remaining >= span) {
    remaining -= span;
    level += 1;
    span = 100 + (level - 1) * 50;
  }
  return { level, intoLevel: remaining, levelSpan: span };
}

const LEVEL_TITLES = [
  "Newcomer",
  "Color Curious",
  "Hue Spotter",
  "Shade Seeker",
  "Color Explorer",
  "Palette Pro",
  "Spectrum Master",
];

export function levelTitle(level: number): string {
  return LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];
}

/** Local calendar day as YYYY-MM-DD, for streak math that respects timezone. */
function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function isYesterday(dateKey: string): boolean {
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return `${y.getFullYear()}-${y.getMonth() + 1}-${y.getDate()}` === dateKey;
}

interface ProgressState extends ProgressCounters {
  /** The last calendar day XP was earned, for streak continuity. */
  lastActiveDay: string | null;
  /** Achievement ids the user has already been shown, to fire the unlock once. */
  seenAchievements: string[];
  /*
    Grant XP for a real action and advance streak/counters. Returns the newly
    unlocked achievements (if any) so the caller can celebrate them once.
  */
  award: (amount: number, reason: XpReason) => Achievement[];
  markAchievementsSeen: (ids: string[]) => void;
  reset: () => void;
}

/** Which counter a reason advances, so counts track genuine actions. */
function bumpFor(reason: XpReason, c: ProgressCounters): ProgressCounters {
  switch (reason) {
    case "Named a color":
      return { ...c, namedCount: c.namedCount + 1 };
    case "Saved a color":
      return { ...c, savedCount: c.savedCount + 1 };
    case "Ripeness checked":
      return { ...c, ripenessCount: c.ripenessCount + 1 };
    case "Outfit checked":
      return { ...c, outfitCount: c.outfitCount + 1 };
    case "Daily challenge":
    case "Color matched":
      return { ...c, challengeWins: c.challengeWins + 1 };
    default:
      return c;
  }
}

const INITIAL: ProgressCounters & {
  lastActiveDay: string | null;
  seenAchievements: string[];
} = {
  xp: 0,
  namedCount: 0,
  savedCount: 0,
  ripenessCount: 0,
  outfitCount: 0,
  challengeWins: 0,
  streak: 0,
  lastActiveDay: null,
  seenAchievements: [],
};

export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      ...INITIAL,

      award: (amount, reason) => {
        const prev = get();

        // Advance the streak: same day keeps it, yesterday continues it, a gap
        // resets it to a fresh day-one. A brand-new user starts at 1.
        const day = today();
        let streak = prev.streak;
        if (prev.lastActiveDay !== day) {
          streak =
            prev.lastActiveDay && isYesterday(prev.lastActiveDay)
              ? prev.streak + 1
              : 1;
        }

        const bumped = bumpFor(reason, {
          xp: prev.xp + amount,
          namedCount: prev.namedCount,
          savedCount: prev.savedCount,
          ripenessCount: prev.ripenessCount,
          outfitCount: prev.outfitCount,
          challengeWins: prev.challengeWins,
          streak,
        });

        // Recompute unlocks against the new counters; return only the ones not
        // yet seen so the celebration fires exactly once each.
        const unlocked = ACHIEVEMENTS.filter(
          (a) => a.earned(bumped) && !prev.seenAchievements.includes(a.id),
        ).map(toPublicAchievement);

        set({
          ...bumped,
          lastActiveDay: day,
          seenAchievements: [
            ...prev.seenAchievements,
            ...unlocked.map((a) => a.id),
          ],
        });

        return unlocked;
      },

      markAchievementsSeen: (ids) =>
        set((s) => ({
          seenAchievements: [...new Set([...s.seenAchievements, ...ids])],
        })),

      reset: () => set({ ...INITIAL }),
    }),
    { name: "hueful.progress" },
  ),
);

/** Drop the internal `earned` predicate, leaving the public Achievement shape. */
function toPublicAchievement(a: (typeof ACHIEVEMENTS)[number]): Achievement {
  return { id: a.id, label: a.label, hint: a.hint };
}

/** Read-only helper: the achievements earned so far, for the progress panel. */
export function earnedAchievements(s: ProgressCounters): Achievement[] {
  return ACHIEVEMENTS.filter((a) => a.earned(s)).map(toPublicAchievement);
}
