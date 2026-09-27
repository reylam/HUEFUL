import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { lenses } from "@/app/lenses";
import { useAuth } from "@/stores/auth";
import { useSavedColors } from "@/stores/saved-colors";
import { Reveal } from "@/shared/ui/Reveal";
import { BrandMark } from "@/shared/ui/BrandMark";
import { StateTag } from "@/shared/ui/StateTag";
import { QuickNamer } from "./components/QuickNamer";
import { ProfileQuickSet } from "./components/ProfileQuickSet";
import { RecentColors } from "./components/RecentColors";

/*
  The dashboard home ("/dashboard"). More than a menu: it does something useful
  right away. A working color namer, a one-tap vision profile, and your saved
  colors sit up top; the full set of tools follows as a grid. Each tool states
  its maturity honestly (ready / prototype / planned) so nobody expects a
  finished feature from a scaffold. The honesty is a product rule, not a
  disclaimer bolted on later.
*/

export function DashboardHome() {
  const user = useAuth((s) => s.user);
  const savedCount = useSavedColors((s) => s.colors.length);

  // Feature the scanner (the entry-point tool); the rest fall into a compact
  // grid so the toolset reads as a hierarchy, not a wall of identical cards.
  const featured = lenses.find((l) => l.path === "scan");
  const rest = lenses.filter((l) => l.path !== "scan");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-text-muted">
          {user ? `Hi ${user.name}. ` : ""}Here's your color workspace.
        </p>
        {savedCount > 0 && (
          <p className="mt-1 text-sm text-text-muted">
            You have {savedCount} saved{" "}
            {savedCount === 1 ? "color" : "colors"}.
          </p>
        )}
      </div>

      {/* Working namer up top so the app is useful on arrival. */}
      <Reveal>
        <QuickNamer />
      </Reveal>

      {/* Personalize + recall, side by side on wider screens. */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Reveal from="left">
          <ProfileQuickSet />
        </Reveal>
        <Reveal from="right">
          <RecentColors />
        </Reveal>
      </div>

      {/* Toolset with hierarchy: one featured tile, the rest compact. */}
      <section aria-labelledby="tools-heading" className="mt-2 flex flex-col gap-3">
        <h2 id="tools-heading" className="text-lg font-semibold text-text">
          All tools
        </h2>

        {featured && (
          <Reveal>
            <FeaturedTool lens={featured} />
          </Reveal>
        )}

        {/* Phones: a 2-up tile grid (icon + name) that scans at a glance.
            From sm up there's room for the state tag and summary too.
            Rows (not stacked tiles) so an odd last tile spanning the full
            width still looks deliberate. */}
        <ul className="fill-last-odd grid grid-cols-2 gap-3">
          {rest.map((lens, i) => {
            const Icon = lens.Icon;
            return (
              <li key={lens.path}>
                <Reveal delay={Math.min(i * 0.05, 0.25)}>
                  <Link
                    to={`/dashboard/${lens.path}`}
                    className="group flex h-full items-center gap-3 rounded-card border border-border bg-surface-raised p-3 shadow-card transition-colors hover:border-primary hover:bg-surface active:bg-surface-sunken sm:items-start sm:p-4"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-sunken text-primary sm:h-auto sm:w-auto sm:bg-transparent sm:text-text-muted sm:transition-colors sm:group-hover:text-primary">
                      <Icon size={20} aria-hidden className="sm:mt-0.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold leading-snug text-text sm:text-base">
                          {lens.label}
                        </span>
                        <span className="hidden sm:inline-flex">
                          <StateTag state={lens.state} />
                        </span>
                      </span>
                      <span className="mt-0.5 hidden text-sm text-text-muted sm:block">
                        {lens.summary}
                      </span>
                    </span>
                    <ArrowRight
                      size={16}
                      aria-hidden
                      className="mt-1 hidden shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5 sm:block"
                    />
                  </Link>
                </Reveal>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function FeaturedTool({ lens }: { lens: (typeof lenses)[number] }) {
  const Icon = lens.Icon;
  return (
    <Link
      to={`/dashboard/${lens.path}`}
      className="group flex items-center gap-4 rounded-card border border-border bg-surface-raised p-4 shadow-card transition-colors hover:border-primary active:bg-surface-sunken sm:gap-6 sm:p-6"
    >
      {/* Phones: a compact row (mark, text, chevron) that the whole card
          taps into. From sm up the mark grows and a labelled Open button shows. */}
      <BrandMark
        tone="primary"
        size="fluid"
        icon={<Icon size={26} aria-hidden />}
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-accent">
            Start here
          </span>
          <StateTag state={lens.state} />
        </span>
        <span className="mt-0.5 block text-lg font-bold text-text sm:mt-1 sm:text-xl">
          {lens.label}
        </span>
        <span className="mt-1 line-clamp-2 max-w-md text-sm text-text-muted sm:line-clamp-none sm:text-base">
          {lens.summary}
        </span>
      </span>
      <ArrowRight size={20} aria-hidden className="shrink-0 text-primary sm:hidden" />
      <span className="hidden items-center gap-1 rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform group-hover:translate-x-0.5 sm:inline-flex">
        Open
        <ArrowRight size={16} aria-hidden />
      </span>
    </Link>
  );
}
