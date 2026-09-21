import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import mascot from "@/assets/images/mascot.png";

/*
  Landing hero, centered. The mascot sits up top with a plain caption in its
  own voice underneath, then a centered headline, a short honest subtext, and
  two CTAs beneath it.

  Animation is GSAP (already on the landing), not a new library. On load the
  copy staggers in and the mascot fades up with it, then keeps a slow float.
  All gated on prefers-reduced-motion: those visitors get the final static
  layout with everything visible and no motion. It also fails safe: if GSAP
  throws we clear inline styles so nothing is ever left hidden.
*/
export function HeroCentered() {
  const rootRef = useRef<HTMLElement>(null);
  const mascotRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const mascotEl = mascotRef.current;
    if (!root) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) return;

    let ctx: gsap.Context | undefined;
    try {
      ctx = gsap.context(() => {
        const items = gsap.utils.toArray<HTMLElement>("[data-hero]");
        gsap.set(items, { opacity: 0, y: 24 });
        gsap.to(items, {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out",
          stagger: 0.12,
        });

        if (mascotEl) {
          gsap.to(mascotEl, {
            y: -12,
            duration: 2.4,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
            delay: 0.9,
          });
        }
      }, root);
    } catch {
      root
        .querySelectorAll<HTMLElement>("[data-hero]")
        .forEach((el) => el.removeAttribute("style"));
    }

    return () => ctx?.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      className="flex flex-col items-center gap-5 pb-12 pt-4 text-center sm:gap-6 md:pb-16 md:pt-6"
    >
      {/* Mascot, with a plain caption in its own voice underneath. */}
      <div data-hero className="flex flex-col items-center gap-3">
        <img
          ref={mascotRef}
          src={mascot}
          alt=""
          width={288}
          height={288}
          className="h-32 w-32 sm:h-40 sm:w-40"
        />
        <p className="max-w-[14rem] text-sm font-medium text-text-muted">
          "I can name any color you point me at."
        </p>
      </div>

      {/* The pitch, centered. */}
      <h1
        data-hero
        className="max-w-3xl text-3xl font-bold leading-tight text-text sm:text-4xl md:text-5xl"
      >
        Understand colors with confidence.
      </h1>

      <p data-hero className="max-w-xl text-lg text-text-muted">
        HUEFUL helps you recognize, compare, and use color in everyday life.
        It's built for people who can't rely on color alone.
      </p>

      <div data-hero className="flex flex-col gap-3 sm:flex-row">
        <Link
          to="/register"
          className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-primary px-7 text-base font-semibold text-primary-foreground hover:brightness-110"
        >
          Get started
        </Link>
        <Link
          to="/login"
          className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-border px-7 text-base font-semibold text-text hover:bg-surface-raised"
        >
          I already have an account
        </Link>
      </div>
    </section>
  );
}
