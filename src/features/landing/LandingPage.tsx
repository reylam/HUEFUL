import { Link } from "react-router-dom";
import { ScanLine, GitCompare, Shirt, Apple, Eye, Bookmark } from "lucide-react";
import mascot from "@/assets/images/mascot.png";

/*
  Public landing page ("/"). It explains the product to someone who has never
  seen it: what it is, the problem it solves, who it's for, how it works, what
  it does, and why it's accessible, then a single clear way in.

  Deliberately not an "AI SaaS template": no gradient hero, no floating blobs,
  no wall of identical cards. Structure comes from typography, spacing, and a
  short, honest read. Copy leads with meaning, not hype.
*/

const capabilities = [
  { Icon: ScanLine, name: "Color Scanner", text: "Name any color in plain words." },
  { Icon: GitCompare, name: "Color Compare", text: "See if two colors really differ." },
  { Icon: Shirt, name: "Outfit Matching", text: "Check if clothes go together." },
  { Icon: Apple, name: "Food Ripeness", text: "Tell ripe from unripe produce." },
  { Icon: Eye, name: "Vision Simulator", text: "Preview how a color looks with CVD." },
  { Icon: Bookmark, name: "Saved Colors", text: "Remember colors that matter." },
];

const steps = [
  {
    n: "1",
    title: "Point or pick",
    text: "Sample a color from your camera or choose one directly.",
  },
  {
    n: "2",
    title: "Read the answer",
    text: "Get a name and description in words, not just a swatch you have to trust.",
  },
  {
    n: "3",
    title: "Act with confidence",
    text: "Compare, match, or save it. When we're unsure, we say so.",
  },
];

export function LandingPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 md:px-6">
      {/* Hero: a plain promise, the mascot, and one clear action. */}
      <section className="flex flex-col items-center gap-6 py-12 text-center md:flex-row md:gap-10 md:py-20 md:text-left">
        <div className="md:flex-1">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">
            Color Assistant
          </p>
          <h1 className="mt-2 text-3xl font-bold leading-tight text-text sm:text-4xl md:text-5xl">
            Understand colors with confidence.
          </h1>
          <p className="mt-4 text-lg text-text-muted">
            all_eyes helps you recognize, compare, and use color in everyday
            life. It's built for people who can't rely on color alone.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start">
            <Link
              to="/register"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-primary px-6 text-base font-semibold text-primary-foreground hover:brightness-110"
            >
              Get started
            </Link>
            <Link
              to="/login"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-border px-6 text-base font-semibold text-text hover:bg-surface-raised"
            >
              I already have an account
            </Link>
          </div>
        </div>
        <img
          src={mascot}
          alt=""
          width={220}
          height={220}
          className="h-40 w-40 shrink-0 sm:h-52 sm:w-52 md:h-56 md:w-56"
        />
      </section>

      {/* The problem, stated plainly, no fear-mongering. */}
      <section aria-labelledby="problem-heading" className="border-t border-border py-10 md:py-14">
        <h2 id="problem-heading" className="text-2xl font-bold text-text">
          Color carries information we can't always see
        </h2>
        <p className="mt-3 max-w-2xl text-text-muted">
          Around 1 in 12 men and 1 in 200 women have some color vision
          deficiency. Everyday choices lean on color: is this fruit ripe, do
          these clothes match, which wire is which, has this indicator turned
          red? When color is the only clue, those answers get harder than they
          should be.
        </p>
      </section>

      {/* Who it's for. */}
      <section aria-labelledby="who-heading" className="border-t border-border py-10 md:py-14">
        <h2 id="who-heading" className="text-2xl font-bold text-text">
          Who it's for
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          <li className="text-text-muted">
            <span className="font-semibold text-text">People with CVD</span> who
            want a second opinion they can trust.
          </li>
          <li className="text-text-muted">
            <span className="font-semibold text-text">Parents and carers</span>{" "}
            helping someone navigate color day to day.
          </li>
          <li className="text-text-muted">
            <span className="font-semibold text-text">Designers</span> checking
            that their work reads for everyone.
          </li>
        </ul>
      </section>

      {/* How it works: three steps, not decorative cards. */}
      <section aria-labelledby="how-heading" className="border-t border-border py-10 md:py-14">
        <h2 id="how-heading" className="text-2xl font-bold text-text">
          How it works
        </h2>
        <ol className="mt-6 grid gap-6 sm:grid-cols-3">
          {steps.map((step) => (
            <li key={step.n} className="flex flex-col gap-2">
              <span
                aria-hidden
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-primary text-sm font-bold text-text"
              >
                {step.n}
              </span>
              <h3 className="text-lg font-semibold text-text">{step.title}</h3>
              <p className="text-text-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Capabilities. A compact list, icon + name + one line each. */}
      <section aria-labelledby="caps-heading" className="border-t border-border py-10 md:py-14">
        <h2 id="caps-heading" className="text-2xl font-bold text-text">
          What you can do
        </h2>
        <ul className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map(({ Icon, name, text }) => (
            <li key={name} className="flex items-start gap-3">
              <Icon
                size={22}
                aria-hidden
                className="mt-0.5 shrink-0 text-accent"
              />
              <span>
                <span className="block font-semibold text-text">{name}</span>
                <span className="block text-sm text-text-muted">{text}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Accessibility: the differentiator, told as promises we keep. */}
      <section aria-labelledby="a11y-heading" className="border-t border-border py-10 md:py-14">
        <h2 id="a11y-heading" className="text-2xl font-bold text-text">
          Built to be readable, not just usable
        </h2>
        <ul className="mt-4 flex max-w-2xl flex-col gap-3 text-text-muted">
          <li>
            <span className="font-semibold text-text">Never color alone.</span>{" "}
            Every answer comes with words and an icon, so it makes sense with no
            color perception at all.
          </li>
          <li>
            <span className="font-semibold text-text">Honest under doubt.</span>{" "}
            If a reading is unreliable, we tell you instead of guessing.
          </li>
          <li>
            <span className="font-semibold text-text">Yours to tune.</span> Set a
            vision profile once and explanations adapt to how you see.
          </li>
        </ul>
      </section>

      {/* Closing CTA: one action, repeated where a decision is natural. */}
      <section className="border-t border-border py-12 text-center md:py-16">
        <h2 className="text-2xl font-bold text-text md:text-3xl">
          Ready to see color with confidence?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-text-muted">
          Create a free account and open the tools. No color knowledge required.
        </p>
        <Link
          to="/register"
          className="mt-6 inline-flex min-h-12 items-center justify-center rounded-2xl bg-primary px-8 text-base font-semibold text-primary-foreground hover:brightness-110"
        >
          Get started
        </Link>
      </section>
    </div>
  );
}
