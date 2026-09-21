import type { ComponentType } from "react";
import { Link } from "react-router-dom";
import { ScanLine, GitCompare, Shirt, Apple, Eye, Bookmark } from "lucide-react";
import { lenses } from "@/app/lenses";
import { Reveal } from "@/shared/ui/Reveal";
import { AnimatedTabs } from "@/shared/ui/AnimatedTabs";
import { StateTag } from "@/shared/ui/StateTag";
import { WavyBackground } from "@/shared/ui/WavyBackground";

/*
  Public "Features" page: a deeper tour of the six tools than the landing gives.
  It reuses the shared interactive building blocks (AnimatedTabs, Reveal) so it
  matches the rest of the site and stays reduced-motion safe. Copy is plain and
  honest about what each tool does today. Each item's maturity comes from the
  lens registry (StateTag reads it by path), not a hand-copied label here, so
  this page can never drift out of sync with what's actually built.
*/

type IconType = ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean }>;

interface Feature {
  /** Matches a lens path in `@/app/lenses`, used to look up its live state. */
  path: string;
  Icon: IconType;
  name: string;
  text: string;
}

const groups: { id: string; label: string; blurb: string; items: Feature[] }[] = [
  {
    id: "identify",
    label: "Identify",
    blurb: "Turn a color into words you can act on.",
    items: [
      {
        path: "scan",
        Icon: ScanLine,
        name: "Color Scanner",
        text: "Point your camera or pick a pixel and get the color named in plain language, with a CVD-aware breakdown.",
      },
      {
        path: "simulate",
        Icon: Eye,
        name: "Vision Simulator",
        text: "Preview how any color reads under different types of color vision deficiency, side by side.",
      },
    ],
  },
  {
    id: "match",
    label: "Match",
    blurb: "Decide whether two colors work together.",
    items: [
      {
        path: "compare",
        Icon: GitCompare,
        name: "Color Compare",
        text: "Check whether two colors are actually distinguishable, for you and across CVD types.",
      },
      {
        path: "outfit",
        Icon: Shirt,
        name: "Outfit Matching",
        text: "See whether two garments clash or go together, described in words, not just swatches.",
      },
    ],
  },
  {
    id: "everyday",
    label: "Everyday",
    blurb: "The small daily checks color makes harder.",
    items: [
      {
        path: "ripeness",
        Icon: Apple,
        name: "Food Ripeness",
        text: "Judge how ripe produce is from its color, with clear labels and icons, never color alone.",
      },
      {
        path: "saved",
        Icon: Bookmark,
        name: "Saved Colors",
        text: "Keep the colors that matter to you, named and organized, so you can recall them later.",
      },
    ],
  },
];

function FeatureGrid({ items }: { items: Feature[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map(({ path, Icon, name, text }, i) => {
        const state = lenses.find((l) => l.path === path)?.state ?? "planned";
        return (
          <Reveal
            key={name}
            delay={i * 0.06}
            className="flex h-full flex-col gap-2 rounded-card border border-border bg-surface-raised p-5"
          >
            <span className="flex items-center justify-between gap-2">
              <Icon size={24} aria-hidden className="text-accent" />
              <StateTag state={state} />
            </span>
            <h3 className="text-lg font-semibold text-text">{name}</h3>
            <p className="text-sm text-text-muted">{text}</p>
          </Reveal>
        );
      })}
    </div>
  );
}

export function FeaturesPage() {
  return (
    <div className="relative mx-auto w-full max-w-5xl px-4 md:px-6">
      <WavyBackground />

      <section className="py-16 text-center md:py-24">
        <Reveal
          as="p"
          className="text-sm font-semibold uppercase tracking-wide text-accent"
        >
          Features
        </Reveal>
        <Reveal
          as="h1"
          delay={0.05}
          className="mx-auto mt-3 max-w-3xl text-4xl font-bold leading-tight text-text sm:text-5xl"
        >
          Six ways to read color with confidence.
        </Reveal>
        <Reveal
          as="p"
          delay={0.1}
          className="mx-auto mt-5 max-w-2xl text-lg text-text-muted"
        >
          {`Each tool does one job well and says what it means in words. All six work end to end today; we still label each one so you always know what to expect.`}
        </Reveal>
      </section>

      <section
        aria-labelledby="tour-heading"
        className="border-t border-border py-10 md:py-14"
      >
        <h2 id="tour-heading" className="text-2xl font-bold text-text">
          Pick what you're trying to do
        </h2>
        <AnimatedTabs
          className="mt-6"
          label="Feature categories"
          items={groups.map((group) => ({
            id: group.id,
            label: group.label,
            content: (
              <div className="flex flex-col gap-4">
                <p className="text-text-muted">{group.blurb}</p>
                <FeatureGrid items={group.items} />
              </div>
            ),
          }))}
        />
      </section>

      <section className="border-t border-border py-12 text-center md:py-16">
        <Reveal as="h2" className="text-2xl font-bold text-text md:text-3xl">
          Ready to try it?
        </Reveal>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/faq"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-border px-7 text-base font-semibold text-text hover:bg-surface-raised"
          >
            Read the FAQ
          </Link>
          <Link
            to="/register"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-primary px-8 text-base font-semibold text-primary-foreground hover:brightness-110"
          >
            Get started
          </Link>
        </div>
      </section>
    </div>
  );
}
