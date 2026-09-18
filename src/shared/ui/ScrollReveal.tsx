import { useEffect, useMemo, useRef } from "react";
import type { ElementType } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface ScrollRevealProps {
  /** The text to reveal, word by word. */
  children: string;
  /** Element to render as (h2, p, span, ...). Defaults to a paragraph. */
  as?: ElementType;
  className?: string;
  /** Opacity each word starts at before it reveals. */
  baseOpacity?: number;
  /** Whether words start blurred and sharpen as they reveal. */
  enableBlur?: boolean;
  /** Starting blur in px when enableBlur is on. */
  blurStrength?: number;
}

/*
  A scroll-linked, word-by-word text reveal, ported from lightswind's
  ScrollReveal to this project's stack. lightswind ships its components on
  Framer Motion and a shadcn CLI; this project runs one animation stack (GSAP)
  and a feature-based layout, so rather than pull in Framer Motion and reshape
  the project with the CLI, the same effect and prop surface (baseOpacity,
  enableBlur, blurStrength) is reproduced with GSAP + ScrollTrigger.

  As the block scrolls through the viewport, each word eases from baseOpacity
  (and an optional blur) to fully visible and sharp, scrubbed to scroll
  position, so the sentence "develops" as you read down.

  Reduced-motion safe: those visitors get the finished, fully readable text with
  no scrubbing. Fails safe: on a GSAP error we clear inline styles so the words
  are never left dim or blurred. The text is a single accessible string; the
  per-word spans are presentational.
*/
export function ScrollReveal({
  children,
  as,
  className,
  baseOpacity = 0.15,
  enableBlur = true,
  blurStrength = 6,
}: ScrollRevealProps) {
  const ref = useRef<HTMLElement>(null);
  const Tag = (as ?? "p") as ElementType;

  const words = useMemo(() => children.split(/(\s+)/), [children]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) return;

    let ctx: gsap.Context | undefined;
    try {
      ctx = gsap.context(() => {
        const wordEls = gsap.utils.toArray<HTMLElement>("[data-sr-word]");
        gsap.set(wordEls, {
          opacity: baseOpacity,
          ...(enableBlur ? { filter: `blur(${blurStrength}px)` } : {}),
        });
        gsap.to(wordEls, {
          opacity: 1,
          ...(enableBlur ? { filter: "blur(0px)" } : {}),
          ease: "none",
          stagger: 0.4,
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            end: "bottom 55%",
            scrub: true,
          },
        });
      }, el);
    } catch {
      // Motion is optional; never leave the words dim or blurred.
      el.querySelectorAll<HTMLElement>("[data-sr-word]").forEach((w) => {
        w.style.opacity = "1";
        w.style.filter = "none";
      });
    }

    return () => ctx?.revert();
  }, [baseOpacity, enableBlur, blurStrength]);

  return (
    <Tag ref={ref} className={className}>
      {words.map((word, i) =>
        /\s+/.test(word) ? (
          <span key={i}>{word}</span>
        ) : (
          <span key={i} data-sr-word className="inline-block will-change-[filter,opacity]">
            {word}
          </span>
        ),
      )}
    </Tag>
  );
}
