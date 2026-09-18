import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import mascot from "@/assets/images/mascot.png";

/*
  Landing hero, centered. The mascot sits up top on a soft brand-tinted glow
  with a small speech bubble near its head, then a centered headline, a short
  honest subtext, and two CTAs beneath it.

  Animation is GSAP (already on the landing), not a new library. On load the
  copy staggers in, the mascot fades up, and the bubble pops a beat later so it
  reads as the mascot "speaking"; then the mascot keeps a slow float. All gated
  on prefers-reduced-motion: those visitors get the final static layout with
  everything visible and no motion. It also fails safe: if GSAP throws we clear
  inline styles so nothing is ever left hidden.
*/
export function HeroCentered() {
  const rootRef = useRef<HTMLElement>(null);
  const mascotRef = useRef<HTMLImageElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const mascotEl = mascotRef.current;
    const bubbleEl = bubbleRef.current;
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

        if (bubbleEl) {
          gsap.set(bubbleEl, { opacity: 0, scale: 0.8, y: 8 });
          gsap.to(bubbleEl, {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.5,
            ease: "back.out(1.7)",
            delay: 1.1,
          });
        }

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
      if (bubbleEl) bubbleEl.removeAttribute("style");
    }

    return () => ctx?.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      className="flex flex-col items-center gap-5 pb-12 pt-4 text-center sm:gap-6 md:pb-16 md:pt-6"
    >
      {/* Mascot on its stage, with a clean speech bubble near its head. */}
      <div
        data-hero
        className="relative flex w-full max-w-xs items-center justify-center"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute h-44 w-44 rounded-full bg-primary/20 blur-3xl sm:h-56 sm:w-56"
        />

        <img
          ref={mascotRef}
          src={mascot}
          alt=""
          width={288}
          height={288}
          className="relative h-36 w-36 sm:h-48 sm:w-48"
        />

        {/*
          Speech bubble near the mascot's head. Clean and simple: rounded card,
          hairline border, soft shadow, one line of friendly copy, and a single
          tail pointing down toward the mascot.
        */}
        <div
          ref={bubbleRef}
          role="note"
          className="absolute -right-10 -top-10 flex max-w-[11rem] items-center gap-2 rounded-2xl border border-border bg-surface-raised px-3.5 py-2.5 text-left text-sm font-medium leading-snug text-text shadow-lg sm:-right-16 sm:-top-12 sm:max-w-[12rem]"
        >
          <span
            aria-hidden
            className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/15 text-primary"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M12 3a9 9 0 1 0 9 9" />
              <path d="M12 7v5l3 2" />
            </svg>
          </span>
          <span>I can name any color you point me at.</span>
          {/* Tail: a small rotated square under the bubble's lower-left, pointing
              back down toward the mascot below it. */}
          <span
            aria-hidden
            className="absolute -bottom-1.5 left-6 h-3 w-3 rotate-45 rounded-[3px] border-b border-r border-border bg-surface-raised"
          />
        </div>
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
