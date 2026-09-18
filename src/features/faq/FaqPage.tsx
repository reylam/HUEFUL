import { Link } from "react-router-dom";
import { Reveal } from "@/shared/ui/Reveal";
import { Accordion } from "@/shared/ui/Accordion";
import type { AccordionItem } from "@/shared/ui/Accordion";
import { WavyBackground } from "@/shared/ui/WavyBackground";

/*
  Public FAQ page. Answers the questions a first-time visitor actually has,
  using the shared animated Accordion. Honest and plain: it says what is a
  prototype, that there is no real account system yet, and how privacy works.
*/

const faqs: AccordionItem[] = [
  {
    id: "what",
    question: "What is HUEFUL?",
    answer:
      "A color assistant for people who can't rely on color alone. It names colors in plain words, checks whether two colors differ, judges ripeness, and more, always pairing color with text and icons.",
  },
  {
    id: "who",
    question: "Who is it for?",
    answer:
      "Anyone with color vision deficiency who wants a second opinion they can trust, the people helping them day to day, and designers checking that their work reads for everyone.",
  },
  {
    id: "cost",
    question: "Does it cost anything?",
    answer:
      "No. You can open the tools and explore without paying. Creating an account is free and only personalizes things like your vision profile and saved colors.",
  },
  {
    id: "account",
    question: "Do I need an account to try it?",
    answer:
      "No. Every tool is browsable without signing in. An account just remembers your preferences between visits. Note the current sign-in is a local prototype: no password is checked or stored.",
  },
  {
    id: "privacy",
    question: "What happens to my camera and photos?",
    answer:
      "Color sampling runs in your browser. The camera only starts when you ask it to, and images are read on your device to pick a color, not uploaded to a server.",
  },
  {
    id: "accuracy",
    question: "How accurate is it?",
    answer:
      "Lighting and camera quality affect any color reading. When a result is unreliable we tell you rather than guessing, so you can try again in better light.",
  },
];

export function FaqPage() {
  return (
    <div className="relative mx-auto w-full max-w-3xl px-4 md:px-6">
      <WavyBackground />

      <section className="py-16 text-center md:py-24">
        <Reveal
          as="p"
          className="text-sm font-semibold uppercase tracking-wide text-accent"
        >
          FAQ
        </Reveal>
        <Reveal
          as="h1"
          delay={0.05}
          className="mx-auto mt-3 max-w-2xl text-4xl font-bold leading-tight text-text sm:text-5xl"
        >
          Questions, answered plainly.
        </Reveal>
      </section>

      <section aria-label="Frequently asked questions" className="pb-6">
        <Reveal>
          <Accordion items={faqs} />
        </Reveal>
      </section>

      <section className="border-t border-border py-12 text-center md:py-16">
        <Reveal as="p" className="text-text-muted">
          Still curious? The best way to understand it is to try it.
        </Reveal>
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
