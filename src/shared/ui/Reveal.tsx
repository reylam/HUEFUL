import { useEffect, useRef } from "react";
import type { ElementType, ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface RevealProps {
  children: ReactNode;
  /** Element to render as. Defaults to a div. */
  as?: ElementType;
  className?: string;
  /** Delay before this element eases in, in seconds. */
  delay?: number;
  /** Direction the element rises from. */
  from?: "up" | "down" | "left" | "right";
  /** Distance travelled, in px. */
  distance?: number;
}

/*
  A drop-in scroll reveal for any element: it fades and slides into place the
  first time it enters the viewport. Same approach as the landing's
  useLandingReveal hook, packaged as a component so any page can wrap a piece of
  content without wiring up its own scope.

  Motion is GSAP + ScrollTrigger (the project's one animation stack). It is
  reduced-motion safe (those visitors get the final, visible state with no
  motion) and fails safe (on a GSAP error we clear inline styles so content is
  never left hidden). We animate with gsap.to from an explicit gsap.set hidden
  pose (not gsap.from) and use autoAlpha, so a torn-down trigger can never leave
  the element stuck invisible or focusable while transparent.
*/
export function Reveal({
  children,
  as,
  className,
  delay = 0,
  from = "up",
  distance = 24,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const Tag = (as ?? "div") as ElementType;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) return;

    const offset = { x: 0, y: 0 };
    if (from === "up") offset.y = distance;
    else if (from === "down") offset.y = -distance;
    else if (from === "left") offset.x = distance;
    else if (from === "right") offset.x = -distance;

    let ctx: gsap.Context | undefined;
    try {
      ctx = gsap.context(() => {
        gsap.set(el, { autoAlpha: 0, x: offset.x, y: offset.y });
        gsap.to(el, {
          autoAlpha: 1,
          x: 0,
          y: 0,
          duration: 0.6,
          delay,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        });
      }, el);
    } catch {
      el.removeAttribute("style");
    }

    return () => ctx?.revert();
  }, [delay, from, distance]);

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
