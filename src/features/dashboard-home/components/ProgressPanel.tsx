import { Flame, Lock, Trophy } from "lucide-react";
import {
  ACHIEVEMENTS,
  earnedAchievements,
  levelFromXp,
  levelTitle,
  useProgress,
} from "@/stores/progress";

/*
  Progress panel: the honest scoreboard. It reads the real progress store, so
  the level ring, streak, and unlocked list only ever reflect actions the user
  actually took. Locked achievements are shown greyed with their hint, so the
  panel doubles as a to-do of things to discover, which is the point of the
  gamification here: reward exploration, don't decorate.

  Never color alone: the ring's progress is also stated as text (level + XP),
  the streak carries a number and a flame icon, and each achievement is a
  labelled row with a lock or trophy, not a colored dot.
*/

export function ProgressPanel() {
  // Select primitives one by one. Returning a fresh object from the selector
  // would hand useSyncExternalStore a new snapshot every render and loop.
  const xp = useProgress((s) => s.xp);
  const streak = useProgress((s) => s.streak);
  const namedCount = useProgress((s) => s.namedCount);
  const savedCount = useProgress((s) => s.savedCount);
  const ripenessCount = useProgress((s) => s.ripenessCount);
  const outfitCount = useProgress((s) => s.outfitCount);
  const challengeWins = useProgress((s) => s.challengeWins);

  const counters = {
    xp,
    namedCount,
    savedCount,
    ripenessCount,
    outfitCount,
    challengeWins,
    streak,
  };

  const { level, intoLevel, levelSpan } = levelFromXp(xp);
  const pct = Math.round((intoLevel / levelSpan) * 100);
  const earned = new Set(earnedAchievements(counters).map((a) => a.id));

  // Ring geometry: a simple conic-gradient fill, with the exact numbers stated
  // in the center so the ring is a nicety, not the only signal.
  const ringStyle = {
    background: `conic-gradient(var(--color-primary) ${pct * 3.6}deg, var(--color-surface-sunken) 0deg)`,
  };

  return (
    <section
      aria-labelledby="progress-heading"
      className="flex flex-col gap-4 rounded-card border border-border bg-surface-raised p-5 shadow-card"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="progress-heading" className="text-lg font-semibold text-text">
          Your progress
        </h2>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-sm font-semibold text-text">
          <Flame
            size={15}
            aria-hidden
            className={streak > 0 ? "text-accent" : "text-text-muted"}
          />
          {streak}-day streak
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div
          className="grid h-20 w-20 shrink-0 place-items-center rounded-full"
          style={ringStyle}
          role="img"
          aria-label={`Level ${level}, ${intoLevel} of ${levelSpan} XP to the next level`}
        >
          <span className="grid h-[3.75rem] w-[3.75rem] place-items-center rounded-full bg-surface-raised px-2 text-center">
            <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              Lvl
            </span>
            <span className="text-2xl font-bold leading-none text-text">
              {level}
            </span>
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-text">{levelTitle(level)}</p>
          <p className="text-sm text-text-muted">
            {intoLevel} / {levelSpan} XP to level {level + 1}
          </p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-sunken">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-text">Achievements</p>
        <ul className="flex flex-col gap-1.5">
          {ACHIEVEMENTS.map((a) => {
            const unlocked = earned.has(a.id);
            return (
              <li
                key={a.id}
                className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-3 py-2"
              >
                <span
                  className={[
                    "grid h-8 w-8 shrink-0 place-items-center rounded-full",
                    unlocked
                      ? "bg-accent/15 text-accent"
                      : "bg-surface-sunken text-text-muted",
                  ].join(" ")}
                >
                  {unlocked ? (
                    <Trophy size={16} aria-hidden />
                  ) : (
                    <Lock size={16} aria-hidden />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={[
                      "block text-sm font-semibold",
                      unlocked ? "text-text" : "text-text-muted",
                    ].join(" ")}
                  >
                    {a.label}
                  </span>
                  <span className="block truncate text-xs text-text-muted">
                    {unlocked ? "Unlocked" : a.hint}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
