import type { ComponentType } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ScanLine,
  GitCompare,
  Shirt,
  Apple,
  Eye,
  Bookmark,
} from "lucide-react";
import { lenses } from "@/app/lenses";
import type { LensState } from "@/app/lenses";
import { useAuth } from "@/stores/auth";
import { useSavedColors } from "@/stores/saved-colors";
import { Reveal } from "@/shared/ui/Reveal";
import { TiltCard } from "@/shared/ui/TiltCard";
import { QuickNamer } from "./components/QuickNamer";
import { ProfileQuickSet } from "./components/ProfileQuickSet";
import { RecentColors } from "./components/RecentColors";

type IconType = ComponentType<{ size?: number; "aria-hidden"?: boolean; className?: string }>;

const lensIcons: Record<string, IconType> = {
  scan: ScanLine,
  compare: GitCompare,
  outfit: Shirt,
  ripeness: Apple,
  simulate: Eye,
  saved: Bookmark,
};

/*
  The dashboard home ("/dashboard"). More than a menu: it does something useful
  right away. A working color namer, a one-tap vision profile, and your saved
  colors sit up top; the full set of tools follows as a grid. Each tool states
  its maturity honestly (ready / prototype / planned) so nobody expects a
  finished feature from a scaffold. The honesty is a product rule, not a
  disclaimer bolted on later.
*/

const stateCopy: Record<LensState, { label: string; hint: string }> = {
  ready: { label: "Ready", hint: "Works end to end." },
  prototype: { label: "Prototype", hint: "Works, with known gaps." },
  planned: { label: "Planned", hint: "Not built yet." },
};

function StateTag({ state }: { state: LensState }) {
  const { label, hint } = stateCopy[state];
  const ring =
    state === "ready"
      ? "border-status-unripe"
      : state === "prototype"
        ? "border-primary"
        : "border-border";
  return (
    <span
      className={`inline-flex items-center rounded-full border ${ring} bg-surface px-2.5 py-0.5 text-xs font-semibold text-text`}
      title={hint}
    >
      {label}
    </span>
  );
}

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

        <ul className="grid gap-3 sm:grid-cols-2">
          {rest.map((lens, i) => {
            const Icon = lensIcons[lens.path] ?? ScanLine;
            return (
              <li key={lens.path}>
                <Reveal delay={Math.min(i * 0.05, 0.25)}>
                  <TiltCard className="h-full">
                    <Link
                      to={`/dashboard/${lens.path}`}
                      className="group flex h-full items-start gap-3 rounded-card border border-border bg-surface-raised p-4 transition-colors hover:border-primary hover:bg-surface"
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface text-accent">
                        <Icon size={20} aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-text">
                            {lens.label}
                          </span>
                          <StateTag state={lens.state} />
                        </span>
                        <span className="mt-0.5 block text-sm text-text-muted">
                          {lens.summary}
                        </span>
                      </span>
                      <ArrowRight
                        size={16}
                        aria-hidden
                        className="mt-1 shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5"
                      />
                    </Link>
                  </TiltCard>
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
  const Icon = lensIcons[lens.path] ?? ScanLine;
  return (
    <TiltCard className="h-full" max={5}>
      <Link
        to={`/dashboard/${lens.path}`}
        className="group relative flex flex-col gap-4 overflow-hidden rounded-card border border-border bg-surface-raised p-6 transition-colors hover:border-primary sm:flex-row sm:items-center sm:gap-6"
      >
        {/* Soft brand wash, kept subtle (not a glow on everything). */}
        <span
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-2xl"
        />
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
          <Icon size={30} aria-hidden />
        </span>
        <span className="relative min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-accent">
              Start here
            </span>
            <StateTag state={lens.state} />
          </span>
          <span className="mt-1 block text-xl font-bold text-text">
            {lens.label}
          </span>
          <span className="mt-1 block max-w-md text-text-muted">
            {lens.summary}
          </span>
        </span>
        <span className="relative inline-flex items-center gap-1 self-start rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform group-hover:translate-x-0.5 sm:self-center">
          Open
          <ArrowRight size={16} aria-hidden />
        </span>
      </Link>
    </TiltCard>
  );
}
