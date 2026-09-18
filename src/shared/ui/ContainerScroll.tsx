import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface ContainerScrollProps {
  /** Heading area above the card. Translates up as the card flattens. */
  title: ReactNode;
  /** The "screen" content shown inside the tilting card. */
  children: ReactNode;
}

/*
  A port of the Aceternity / 21st.dev "Container Scroll Animation": as the tall
  container scrolls through the viewport, a title rises and a 3D card rotates
  from tilted-back to flat while scaling up, like a device lifting to face you.

  Ported to our stack rather than pulled verbatim:
  - Driven by GSAP ScrollTrigger, which the landing already ships, so it adds no
    new animation dependency (the original uses Framer Motion).
  - Styled with our design tokens (surface, border, radius), not the source's
    demo palette.
  - Respects prefers-reduced-motion: we skip the scroll animation and render the
    card flat and visible, since a scroll-scrubbed 3D rotate is exactly the kind
    of non-essential motion that setting asks us to drop.
  - Scales are smaller on phones (mobile-first), matching the original's intent
    without assuming a wide screen.
*/
export function ContainerScroll({ title, children }: ContainerScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const titleEl = titleRef.current;
    const cardEl = cardRef.current;
    if (!container || !titleEl || !cardEl) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) return;

    let ctx: gsap.Context | undefined;
    try {
      ctx = gsap.context(() => {
        const isMobile = window.innerWidth <= 768;
        const startScale = isMobile ? 0.7 : 1.05;

        // Set the tilted-back starting pose.
        gsap.set(cardEl, {
          rotateX: 20,
          scale: startScale,
          transformPerspective: 1000,
        });
        gsap.set(titleEl, { y: 0, opacity: 1 });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: container,
            start: "top 70%",
            end: "bottom bottom",
            scrub: true,
          },
        });

        tl.to(cardEl, { rotateX: 0, scale: 1, ease: "none" }, 0).to(
          titleEl,
          { y: -80, ease: "none" },
          0,
        );
      }, container);
    } catch {
      // Motion is optional. Ensure the card is left flat and visible on failure.
      gsap.set([cardEl, titleEl], { clearProps: "all" });
    }

    return () => ctx?.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center justify-start py-10 md:py-20"
      style={{ perspective: "1000px" }}
    >
      <div ref={titleRef} className="mx-auto max-w-4xl text-center">
        {title}
      </div>

      <div
        ref={cardRef}
        className="mt-8 w-full max-w-4xl rounded-[1.75rem] border border-border bg-surface-raised p-2 shadow-2xl md:mt-12"
        style={{ transformStyle: "preserve-3d" }}
      >
        <div className="h-full w-full overflow-hidden rounded-[1.35rem] border border-border bg-surface">
          {children}
        </div>
      </div>
    </div>
  );
}
