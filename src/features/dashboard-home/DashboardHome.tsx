import { useAuth } from "@/stores/auth";
import { levelFromXp, levelTitle, useProgress } from "@/stores/progress";
import { Reveal } from "@/shared/ui/Reveal";
import { ColorStudio } from "./components/ColorStudio";
import { DailyChallenge } from "./components/DailyChallenge";
import { ProgressPanel } from "./components/ProgressPanel";
import { ProfileQuickSet } from "./components/ProfileQuickSet";
import { RecentColors } from "./components/RecentColors";
import { ToolRail } from "./components/ToolRail";

/*
  The dashboard home ("/dashboard"). Built as a composition, not a menu: a live
  hero the user can play with the moment they land (Color Studio), then a row
  that pairs a quick game with their real progress, a one-tap vision profile,
  a horizontal rail that turns the toolset into a discovery loop, and finally
  the colors they've kept. Sections deliberately differ in shape and weight so
  the page reads with rhythm instead of as a wall of identical cards.

  Everything here is real: the studio names and saves actual colors, the
  challenge and saving grant XP through the shared progress store, and the
  progress panel reflects only what the user actually did. Nothing is a mock.
*/

export function DashboardHome() {
  const name = useAuth((s) => s.user?.name);
  const xp = useProgress((s) => s.xp);
  const level = levelFromXp(xp).level;

  return (
    <div className="flex flex-col gap-8">
      {/* Compact greeting: who, and where they are in the game. Text is kept
          short on purpose; the hero below does the talking. */}
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-text sm:text-3xl">
            {name ? `Hey ${name}.` : "See color differently."}
          </h1>
          <p className="mt-1 text-text-muted">
            Explore a color and HUEFUL answers in plain words.
          </p>
        </div>
        <span className="rounded-full border border-border bg-surface px-3 py-1 text-sm font-semibold text-text">
          Level {level} · {levelTitle(level)}
        </span>
      </header>

      {/* The hero: one strong, immediate interaction. */}
      <Reveal>
        <ColorStudio />
      </Reveal>

      {/* Play + progress, side by side on wider screens: a game and the real
          scoreboard it feeds. Different structure from the hero above. */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Reveal from="left">
          <DailyChallenge />
        </Reveal>
        <Reveal from="right">
          <ProgressPanel />
        </Reveal>
      </div>

      {/* One-tap personalization: small, quiet, full width. */}
      <Reveal>
        <ProfileQuickSet />
      </Reveal>

      {/* The discovery loop: a horizontal rail, not a card grid. */}
      <Reveal>
        <ToolRail />
      </Reveal>

      {/* What they've kept, closing the name-and-save loop from the hero. */}
      <Reveal>
        <RecentColors />
      </Reveal>
    </div>
  );
}
