import { Link } from "react-router-dom";
import { Eye, Type, ShieldCheck, Sparkles } from "lucide-react";
import { Reveal } from "@/shared/ui/Reveal";
import { WavyBackground } from "@/shared/ui/WavyBackground";

/*
  Public "About" page. Explains why HUEFUL exists and what it stands for, in the
  same honest, plain voice as the landing. Interactivity comes from the shared
  Reveal building block, reduced-motion safe, so it feels alive without being
  noisy.
*/

const stats = [
  {
    value: "1 in 12",
    label: "men of Northern European descent have some red-green color vision deficiency.",
  },
  {
    value: "300M+",
    label: "people are commonly estimated to live with some form of CVD worldwide.",
  },
];

const principles = [
  {
    Icon: Type,
    title: "Words first",
    text: "Every answer is spelled out in plain language, not left to a swatch you have to trust.",
  },
  {
    Icon: Eye,
    title: "Tuned to your vision",
    text: "Set a vision profile once and explanations adapt to how you actually see color.",
  },
  {
    Icon: ShieldCheck,
    title: "Honest under doubt",
    text: "When a reading is unreliable, we say so instead of guessing and hoping.",
  },
  {
    Icon: Sparkles,
    title: "Calm, not flashy",
    text: "A quiet interface that stays readable. Motion is a nicety, never a requirement.",
  },
];

export function AboutPage() {
  return (
    <div className="relative mx-auto w-full max-w-5xl px-4 md:px-6">
      <WavyBackground />

      {/* Intro. */}
      <section className="py-16 text-center md:py-24">
        <Reveal
          as="p"
          className="text-sm font-semibold uppercase tracking-wide text-accent"
        >
          Our story
        </Reveal>
        <Reveal
          as="h1"
          delay={0.05}
          className="mx-auto mt-3 max-w-3xl text-4xl font-bold leading-tight text-text sm:text-5xl"
        >
          Color should never be the thing that trips you up.
        </Reveal>
        <Reveal
          as="p"
          delay={0.1}
          className="mx-auto mt-5 max-w-2xl text-lg text-text-muted"
        >
          HUEFUL started from a simple frustration: too many everyday decisions
          hinge on color alone, and that quietly shuts people out. We build tools
          that put the answer into words anyone can read.
        </Reveal>
      </section>

      {/* Why this matters, stated plainly. */}
      <section
        aria-label="Why this matters"
        className="grid gap-4 border-t border-border py-10 sm:grid-cols-2 md:py-14"
      >
        {stats.map((s, i) => (
          <Reveal
            key={s.value}
            delay={i * 0.08}
            className="rounded-card border border-border bg-surface-raised p-6"
          >
            <p className="text-4xl font-bold text-primary">{s.value}</p>
            <p className="mt-2 text-sm text-text-muted">{s.label}</p>
          </Reveal>
        ))}
        <p className="col-span-full text-xs text-text-muted">
          Commonly cited estimates for color vision deficiency prevalence; exact
          rates vary by population and study.
        </p>
      </section>

      {/* Mission. */}
      <section
        aria-labelledby="mission-heading"
        className="border-t border-border py-10 md:py-14"
      >
        <h2 id="mission-heading" className="text-2xl font-bold text-text">
          What we're building toward
        </h2>
        <Reveal as="p" className="mt-3 max-w-2xl text-lg text-text-muted">
          {`We want a world where a person can point their phone at anything and get a clear, honest answer about its color, where an app never says "it's red" to someone who cannot see red without also saying it in a way that lands. That is the whole idea.`}
        </Reveal>
      </section>

      {/* Principles. */}
      <section
        aria-labelledby="principles-heading"
        className="border-t border-border py-10 md:py-14"
      >
        <h2 id="principles-heading" className="text-2xl font-bold text-text">
          What we stand for
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {principles.map(({ Icon, title, text }, i) => (
            <Reveal
              key={title}
              delay={i * 0.06}
              className="h-full rounded-card border border-border bg-surface-raised p-5"
            >
              <Icon size={24} aria-hidden className="text-accent" />
              <h3 className="mt-3 text-lg font-semibold text-text">{title}</h3>
              <p className="mt-1 text-text-muted">{text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA. */}
      <section className="border-t border-border py-12 text-center md:py-16">
        <Reveal
          as="h2"
          className="text-2xl font-bold text-text md:text-3xl"
        >
          Want to see it in action?
        </Reveal>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/features"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-border px-7 text-base font-semibold text-text hover:bg-surface-raised"
          >
            Explore the features
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
