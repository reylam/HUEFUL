import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import mascot from "@/assets/images/mascot.png";

/*
  First-load preloader: a full-screen HUEFUL intro with the mascot, a counting
  0-100% number, and a brand-blue progress bar, choreographed with GSAP so the
  motion feels alive rather than a flat linear bar. The mascot pops in with a
  soft overshoot and keeps a gentle bob, the number and bar are tweened with
  easing, and the whole panel scales down and wipes up to reveal the app.

  Shown once per session (navigating within the app doesn't replay it) and
  skipped entirely for prefers-reduced-motion, who get straight to the content.
  It sits above everything, is aria-hidden, and fails safe: any GSAP hiccup
  still removes the panel so the app is never covered.
*/

const SESSION_KEY = "hueful.preloaded";

function alreadyShown(): boolean {
  if (typeof sessionStorage === "undefined") return true;
  return sessionStorage.getItem(SESSION_KEY) === "1";
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function Preloader() {
  const [active, setActive] = useState(
    () => !alreadyShown() && !prefersReducedMotion(),
  );
  const [progress, setProgress] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const mascotRef = useRef<HTMLImageElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;
    sessionStorage.setItem(SESSION_KEY, "1");

    const root = rootRef.current;
    const mascotEl = mascotRef.current;
    const badge = badgeRef.current;
    const bar = barRef.current;
    if (!root || !mascotEl || !badge || !bar) {
      setActive(false);
      return;
    }

    const counter = { value: 0 };
    let ctx: gsap.Context | undefined;

    try {
      ctx = gsap.context(() => {
        // A single choreographed timeline: entrance, load, exit.
        const tl = gsap.timeline({
          defaults: { ease: "power3.out" },
          onComplete: () => setActive(false),
        });

        // Entrance: mascot pops in with an elastic overshoot, badge rises.
        tl.from(mascotEl, {
          scale: 0.4,
          autoAlpha: 0,
          duration: 0.7,
          ease: "back.out(1.7)",
        })
          .from(
            badge,
            { y: 18, autoAlpha: 0, duration: 0.5 },
            "-=0.35",
          );

        // A gentle, living bob + sway on the mascot for the whole load.
        const bob = gsap.to(mascotEl, {
          y: -12,
          rotation: 2.5,
          duration: 1.1,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        });

        // Load: count and bar move together on an eased curve, not a flat ramp.
        tl.to(
          counter,
          {
            value: 100,
            duration: 1.5,
            ease: "power2.inOut",
            onUpdate: () => setProgress(Math.round(counter.value)),
          },
          "<",
        ).to(bar, { width: "100%", duration: 1.5, ease: "power2.inOut" }, "<");

        // Exit: stop the bob, settle the mascot, then scale + fade + wipe up.
        tl.add(() => bob.kill())
          .to(mascotEl, { rotation: 0, y: 0, duration: 0.2 }, ">-0.1")
          .to(root, {
            yPercent: -100,
            scale: 0.96,
            autoAlpha: 0,
            duration: 0.7,
            ease: "power4.inOut",
          });
      }, root);
    } catch {
      setActive(false);
    }

    return () => ctx?.revert();
  }, [active]);

  if (!active) return null;

  return (
    <div
      ref={rootRef}
      aria-hidden
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-surface"
    >
      <img
        ref={mascotRef}
        src={mascot}
        alt=""
        width={160}
        height={160}
        className="h-32 w-auto select-none sm:h-40"
        draggable={false}
      />

      <div ref={badgeRef} className="flex flex-col items-center gap-3">
        <p className="text-5xl font-bold tabular-nums text-text sm:text-6xl">
          {progress}
          <span className="text-2xl text-text-muted sm:text-3xl">%</span>
        </p>

        <div className="h-1.5 w-48 overflow-hidden rounded-full bg-surface-sunken sm:w-56">
          <div ref={barRef} className="h-full w-0 rounded-full bg-primary" />
        </div>

        <p className="text-sm font-medium tracking-[0.2em] text-text-muted">
          HUEFUL
        </p>
      </div>
    </div>
  );
}
